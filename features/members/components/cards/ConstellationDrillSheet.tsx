// Constellation drill-down sheet -- the in-place detail card stack for the
// Trade Constellation (web parity: showTickerPanel / showCommitteeDetail /
// showCommitteeMembersPanel rendering into the shared pd-trade-panel slot,
// dashboard.html). A node tap opens this bottom sheet INSTEAD of navigating
// away; every indexed value inside a card is itself tappable and pushes a
// nested card onto a stack WITHIN the sheet:
//
//   ticker card  -> member rows (who else trades it), committee overlap row
//   member card  -> committee rows, top-ticker rows
//   committee card -> member rows, subcommittee rows (RECURSIVE, full depth
//                    like the web's showCommitteeMembersPanel -- a sub pushes
//                    the same card scoped to itself), recent activity links
//
// Back chevron / Android hardware back / a downward fling on the header all
// POP the stack (close at root); "Open full page" preserves the old
// router.push navigation for every card kind.
//
// Presentation mirrors InfoSheet (Modal + dimmed backdrop + rounded sheet);
// data comes from the existing feature hooks (useTickerInfo, useTickerTrades,
// useCommitteeMembers, useMemberProfile) so no new endpoints and no cache
// forks. All figures are disclosure-derived (no price/return display).
import { useMemo } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react-native";

import type { TradeRecord } from "@/features/trades/api/types";
import type { CNodeConflict } from "@/features/members/constellation";
import { useTickerInfo, useTickerTrades } from "@/features/ticker/api/queries";
import { useCommitteeMembers } from "@/features/committees/api/queries";
import { useMemberProfile } from "@/features/members/api/queries";
import { displayName, formatMoneyShort } from "@/lib/util/display";
import { ctaColors } from "@/lib/theme/tokens";

export type DrillEntry =
  | {
      kind: "ticker";
      symbol: string | null; // null = private fund / LP (no full page)
      label: string;
      memberName: string;
      memberTrades: TradeRecord[];
      conflict: CNodeConflict | null;
      sector: string | null;
    }
  | { kind: "committee"; name: string; parent?: string | null }
  | { kind: "member"; name: string };

type Props = {
  stack: DrillEntry[];
  onPush: (e: DrillEntry) => void;
  onPop: () => void;
  onClose: () => void;
};

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </Text>
  );
}

// Indexed row: label + value + chevron; tappable when onPress is given.
function Row({
  label,
  value,
  onPress,
  external,
}: {
  label: string;
  value?: string | null;
  onPress?: () => void;
  external?: boolean;
}) {
  const body = (
    <View className="flex-row items-center justify-between py-2.5">
      <Text
        className="flex-1 pr-3 text-sm text-gray-700 dark:text-gray-300"
        numberOfLines={2}
      >
        {label}
      </Text>
      <View className="flex-row items-center gap-1">
        {value ? (
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {value}
          </Text>
        ) : null}
        {onPress ? (
          external ? (
            <ExternalLink size={13} color={ctaColors.accent} />
          ) : (
            <ChevronRight size={15} color={ctaColors.accent} />
          )
        ) : null}
      </View>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={{ color: "rgba(99,102,241,0.12)" }}
    >
      {body}
    </Pressable>
  );
}

function RowGroup({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-xl border border-gray-200 px-3 dark:border-gray-700">
      {children}
    </View>
  );
}

function ShimmerRows({ n = 3 }: { n?: number }) {
  return (
    <View className="gap-2 py-2">
      {Array.from({ length: n }).map((_, i) => (
        <View
          key={i}
          className="h-9 rounded-lg bg-gray-200 dark:bg-gray-700"
        />
      ))}
    </View>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="items-start py-2">
      <Text className="text-sm text-gray-500 dark:text-gray-400">
        Couldn&apos;t load this card.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        className="mt-2 rounded-lg border border-gray-300 px-3 py-1.5 dark:border-gray-600"
      >
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Retry
        </Text>
      </Pressable>
    </View>
  );
}

function FullPageAction({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open full page"
      onPress={onPress}
      className="mt-4 flex-row items-center justify-center gap-1.5 rounded-xl border border-cta-accent/40 bg-cta-accent/5 py-2.5"
    >
      <Text className="text-sm font-semibold text-cta-accent">
        Open full page
      </Text>
      <ChevronRight size={15} color={ctaColors.accent} />
    </Pressable>
  );
}

const isBuyTx = (tx: string | null | undefined) =>
  /buy|purchase/i.test(tx ?? "");
const isSellTx = (tx: string | null | undefined) => /sell|sale/i.test(tx ?? "");

// --- ticker card ---------------------------------------------------------

function TickerDrill({
  entry,
  onPush,
  onNavigate,
}: {
  entry: Extract<DrillEntry, { kind: "ticker" }>;
  onPush: (e: DrillEntry) => void;
  onNavigate: (route: string) => void;
}) {
  const info = useTickerInfo(entry.symbol ?? "");
  const congress = useTickerTrades(entry.symbol ?? "");

  // This member's stats on the node (from the profile trades already loaded
  // -- web parity: showTickerPanel derives from node.trades).
  const mine = entry.memberTrades;
  const buys = mine.filter((t) => isBuyTx(t.tx_type)).length;
  const sells = mine.filter((t) => isSellTx(t.tx_type)).length;
  const volumeHi = mine.reduce(
    (s, t) => s + (t.amount_high && t.amount_high > 0 ? t.amount_high : 0),
    0,
  );
  const latest = mine
    .map((t) => t.trade_date)
    .filter(Boolean)
    .sort()
    .pop();

  // Who else in Congress trades it: aggregate the loaded disclosure rows by
  // politician, sized + sorted by row count. Honesty: the list is derived
  // from the most recent disclosures loaded, and says so.
  const traders = useMemo(() => {
    const rows = congress.data?.flat ?? [];
    const byPol = new Map<string, { count: number; party: string | null }>();
    for (const t of rows) {
      const cur = byPol.get(t.politician) ?? { count: 0, party: t.party };
      cur.count += 1;
      byPol.set(t.politician, cur);
    }
    return Array.from(byPol.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [congress.data?.flat]);
  const loadedCount = congress.data?.flat.length ?? 0;
  const totalCount = congress.data?.total ?? 0;

  return (
    <View>
      {info.data?.company_name ? (
        <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {info.data.company_name}
          {info.data.industry ? ` · ${info.data.industry}` : ""}
        </Text>
      ) : null}
      {!entry.symbol ? (
        <Text className="mt-1 text-xs uppercase tracking-wide text-cta-late">
          Private fund / LP · no public ticker
        </Text>
      ) : null}

      <SectionLabel>{`${displayName(entry.memberName)}'s disclosures`}</SectionLabel>
      <RowGroup>
        <Row label="Disclosed trades" value={String(mine.length)} />
        <View className="border-t border-gray-100 dark:border-gray-800">
          <Row label="Buys / sells" value={`${buys} / ${sells}`} />
        </View>
        <View className="border-t border-gray-100 dark:border-gray-800">
          <Row
            label="Est. volume (range high)"
            value={formatMoneyShort(volumeHi) ?? "—"}
          />
        </View>
        {latest ? (
          <View className="border-t border-gray-100 dark:border-gray-800">
            <Row label="Latest trade" value={latest} />
          </View>
        ) : null}
      </RowGroup>

      {entry.conflict ? (
        <>
          <SectionLabel>Committee overlap</SectionLabel>
          <RowGroup>
            <Row
              label={`${entry.conflict.severity === "direct" ? "Direct" : "Adjacent"}: ${entry.conflict.committee}${entry.sector ? ` → ${entry.sector}` : ""}`}
              onPress={() =>
                onPush({ kind: "committee", name: entry.conflict!.committee })
              }
            />
          </RowGroup>
        </>
      ) : null}

      {entry.symbol ? (
        <>
          <SectionLabel>Traded by</SectionLabel>
          {congress.isLoading ? (
            <ShimmerRows />
          ) : congress.isError ? (
            <LoadError onRetry={() => congress.refetch()} />
          ) : traders.length ? (
            <>
              <RowGroup>
                {traders.slice(0, 12).map((p, i) => (
                  <View
                    key={p.name}
                    className={
                      i > 0
                        ? "border-t border-gray-100 dark:border-gray-800"
                        : ""
                    }
                  >
                    <Row
                      label={`${displayName(p.name)}${p.party ? ` (${p.party})` : ""}`}
                      value={`${p.count}`}
                      onPress={() => onPush({ kind: "member", name: p.name })}
                    />
                  </View>
                ))}
              </RowGroup>
              <Text className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-500">
                From the {loadedCount} most recent of {totalCount} disclosures
                on {entry.symbol}.
              </Text>
            </>
          ) : (
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              No other disclosures on file.
            </Text>
          )}
        </>
      ) : null}

      {entry.symbol ? (
        <FullPageAction
          onPress={() =>
            onNavigate(`/ticker/${encodeURIComponent(entry.symbol!)}`)
          }
        />
      ) : null}
    </View>
  );
}

// --- member card ---------------------------------------------------------

function MemberDrill({
  entry,
  onPush,
  onNavigate,
}: {
  entry: Extract<DrillEntry, { kind: "member" }>;
  onPush: (e: DrillEntry) => void;
  onNavigate: (route: string) => void;
}) {
  const q = useMemberProfile(entry.name);
  const p = q.data;

  // Committee names: tree-first (the maintained store), legacy CSV fallback
  // -- same sourcing rule as CommitteeChips.
  const committees = useMemo(() => {
    const tree = (p?.committee_tree ?? [])
      .map((n) => n.committee)
      .filter(Boolean);
    return tree.length ? tree : (p?.committees ?? []);
  }, [p]);

  // Top tickers by disclosed range-high volume from the profile's one-shot
  // trades array (same aggregation keying as the constellation nodes).
  const topHoldings = useMemo(() => {
    const byKey = new Map<
      string,
      { ticker: string | null; label: string; count: number; totalHi: number }
    >();
    for (const t of p?.trades ?? []) {
      const ticker = (t.ticker ?? "").trim() || null;
      const key = ticker ?? (t.asset_name ?? "").trim();
      if (!key) continue;
      const cur = byKey.get(key) ?? {
        ticker,
        label: ticker ?? (t.asset_name ?? "").slice(0, 18),
        count: 0,
        totalHi: 0,
      };
      cur.count += 1;
      cur.totalHi += t.amount_high && t.amount_high > 0 ? t.amount_high : 0;
      byKey.set(key, cur);
    }
    return Array.from(byKey.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.totalHi - a.totalHi)
      .slice(0, 8);
  }, [p]);

  if (q.isLoading) return <ShimmerRows n={5} />;
  if (q.isError || !p) return <LoadError onRetry={() => q.refetch()} />;

  const meta = [p.party, p.chamber, p.state].filter(Boolean).join(" · ");

  return (
    <View>
      {meta ? (
        <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {meta}
        </Text>
      ) : null}

      <SectionLabel>Disclosures</SectionLabel>
      <RowGroup>
        <Row
          label="Disclosed trades"
          value={
            p.stats?.total_trades != null
              ? p.stats.total_trades.toLocaleString()
              : String(p.trades?.length ?? 0)
          }
        />
        {p.stats?.last_trade ? (
          <View className="border-t border-gray-100 dark:border-gray-800">
            <Row label="Most recent trade" value={p.stats.last_trade} />
          </View>
        ) : null}
      </RowGroup>

      {committees.length ? (
        <>
          <SectionLabel>Committees</SectionLabel>
          <RowGroup>
            {committees.slice(0, 8).map((c, i) => (
              <View
                key={c}
                className={
                  i > 0 ? "border-t border-gray-100 dark:border-gray-800" : ""
                }
              >
                <Row
                  label={c}
                  onPress={() => onPush({ kind: "committee", name: c })}
                />
              </View>
            ))}
          </RowGroup>
        </>
      ) : null}

      {topHoldings.length ? (
        <>
          <SectionLabel>Top tickers by est. volume</SectionLabel>
          <RowGroup>
            {topHoldings.map((h, i) => (
              <View
                key={h.key}
                className={
                  i > 0 ? "border-t border-gray-100 dark:border-gray-800" : ""
                }
              >
                <Row
                  label={h.label}
                  value={`${h.count} · ${formatMoneyShort(h.totalHi) ?? "—"}`}
                  onPress={() =>
                    onPush({
                      kind: "ticker",
                      symbol: h.ticker,
                      label: h.label,
                      memberName: p.name,
                      memberTrades: (p.trades ?? []).filter((t) => {
                        const k =
                          (t.ticker ?? "").trim() ||
                          (t.asset_name ?? "").trim();
                        return k === h.key;
                      }),
                      conflict: null,
                      sector: null,
                    })
                  }
                />
              </View>
            ))}
          </RowGroup>
        </>
      ) : null}

      <FullPageAction
        onPress={() => onNavigate(`/member/${encodeURIComponent(entry.name)}`)}
      />
    </View>
  );
}

// --- committee card (recursive) ------------------------------------------

function CommitteeDrill({
  entry,
  onPush,
  onNavigate,
}: {
  entry: Extract<DrillEntry, { kind: "committee" }>;
  onPush: (e: DrillEntry) => void;
  onNavigate: (route: string) => void;
}) {
  const q = useCommitteeMembers(entry.name, entry.parent ?? undefined);
  const d = q.data;

  if (q.isLoading) return <ShimmerRows n={5} />;
  if (q.isError || !d) return <LoadError onRetry={() => q.refetch()} />;

  return (
    <View>
      <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {[
          d.is_subcommittee && d.parent_committee
            ? `Subcommittee of ${d.parent_committee}`
            : null,
          d.chamber,
          `${d.member_count} member${d.member_count === 1 ? "" : "s"}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>

      {d.members.length ? (
        <>
          <SectionLabel>Members</SectionLabel>
          <RowGroup>
            {d.members.slice(0, 16).map((m, i) => (
              <View
                key={`${m.name}-${i}`}
                className={
                  i > 0 ? "border-t border-gray-100 dark:border-gray-800" : ""
                }
              >
                <Row
                  label={`${displayName(m.name)}${m.party ? ` (${m.party}${m.state ? `-${m.state}` : ""})` : ""}`}
                  value={m.role !== "Member" ? m.role : undefined}
                  onPress={() => onPush({ kind: "member", name: m.name })}
                />
              </View>
            ))}
          </RowGroup>
          {d.members.length > 16 ? (
            <Text className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-500">
              +{d.members.length - 16} more on the full page.
            </Text>
          ) : null}
        </>
      ) : null}

      {d.subcommittees.length ? (
        <>
          <SectionLabel>Subcommittees</SectionLabel>
          <RowGroup>
            {d.subcommittees.map((s, i) => (
              <View
                key={s.name}
                className={
                  i > 0 ? "border-t border-gray-100 dark:border-gray-800" : ""
                }
              >
                <Row
                  label={s.name}
                  value={`${s.member_count}`}
                  onPress={() =>
                    onPush({
                      kind: "committee",
                      name: s.name,
                      parent: d.committee,
                    })
                  }
                />
              </View>
            ))}
          </RowGroup>
        </>
      ) : null}

      {d.recent_activity.length ? (
        <>
          <SectionLabel>Working on now</SectionLabel>
          <RowGroup>
            {d.recent_activity.slice(0, 6).map((e, i) => (
              <View
                key={e.id}
                className={
                  i > 0 ? "border-t border-gray-100 dark:border-gray-800" : ""
                }
              >
                <Row
                  label={`${e.event_type.toUpperCase()}: ${e.title}`}
                  onPress={
                    e.url
                      ? () =>
                          void openBrowserAsync(e.url).catch(() => {
                            /* best-effort */
                          })
                      : undefined
                  }
                  external
                />
              </View>
            ))}
          </RowGroup>
        </>
      ) : null}

      <FullPageAction
        onPress={() =>
          onNavigate(`/committee/${encodeURIComponent(entry.name)}`)
        }
      />
    </View>
  );
}

// --- sheet shell ----------------------------------------------------------

function titleFor(e: DrillEntry): string {
  switch (e.kind) {
    case "ticker":
      return e.label;
    case "committee":
      return e.name;
    case "member":
      return displayName(e.name);
  }
}

export function ConstellationDrillSheet({
  stack,
  onPush,
  onPop,
  onClose,
}: Props) {
  const router = useRouter();
  const top = stack[stack.length - 1];
  const visible = top != null;

  // "Open full page" preserves the old navigation: close the sheet, then
  // push the real route.
  const navigate = (route: string) => {
    onClose();
    router.push(route as never);
  };

  // Downward fling on the header pops one level (closes at the root) --
  // the sheet-native back-swipe.
  const fling = Gesture.Fling()
    .direction(Directions.DOWN)
    .runOnJS(true)
    .onEnd(() => onPop());

  if (!top) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onPop}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Close"
          className="absolute inset-0 bg-black/60"
          onPress={onClose}
        />
        <View className="max-h-[82%] rounded-t-3xl bg-white dark:bg-gray-900">
          <GestureDetector gesture={fling}>
            <View>
              {/* grab handle */}
              <View className="items-center pt-2.5">
                <View className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
              </View>

              {/* header: back (when stacked) + title + close */}
              <View className="flex-row items-center justify-between px-4 pt-3">
                <View className="flex-1 flex-row items-center gap-1 pr-3">
                  {stack.length > 1 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Back"
                      onPress={onPop}
                      hitSlop={10}
                      className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-800"
                    >
                      <ChevronLeft size={18} color="#6b7280" />
                    </Pressable>
                  ) : null}
                  <Text
                    className="flex-1 text-xl font-bold text-gray-900 dark:text-gray-100"
                    numberOfLines={1}
                  >
                    {titleFor(top)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={onClose}
                  hitSlop={10}
                  className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-800"
                >
                  <X size={18} color="#6b7280" />
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            className="px-5"
            contentContainerClassName="pb-8"
            showsVerticalScrollIndicator={false}
          >
            {top.kind === "ticker" ? (
              <TickerDrill entry={top} onPush={onPush} onNavigate={navigate} />
            ) : top.kind === "member" ? (
              <MemberDrill entry={top} onPush={onPush} onNavigate={navigate} />
            ) : (
              <CommitteeDrill
                entry={top}
                onPush={onPush}
                onNavigate={navigate}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
