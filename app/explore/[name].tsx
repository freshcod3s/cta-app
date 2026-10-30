// Explore -- a member's filings as an interactive dataset.
//
// The 4.2 answer in one screen: instead of scrolling a rendered page, the
// user manipulates the record set. Tap a month in the chart and the timeline
// and every summary figure below recompute. Stack a year, a sector and a
// transaction type on top of it. Expand any month to reach the source
// records themselves.
//
// OFFLINE: if the profile request fails and this member is saved, the screen
// falls back to the stored snapshot and says so, with the retrieval date.
// A profile rehydrated from the persisted query cache that cannot be
// refreshed is labelled the same way (features/explore/savedCopy.ts).
// Cached material is never presented as current.
//
// Counts, dates and day-counts only. Disclosed amounts are ranges, so no
// total or average appears here (see features/explore/derive.ts).
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown, ChevronRight, WifiOff } from "lucide-react-native";

import { useMemberProfile } from "@/features/members/api/queries";
import { useSavedStore } from "@/features/saved/store";
import { toSavedTradeLite, type SavedMember } from "@/features/saved/types";
import {
  applyFilters,
  availableYears,
  groupByMonth,
  lagStats,
  monthlySeries,
  sectorCounts,
  txTypeCounts,
  type ExplorableTrade,
} from "@/features/explore/derive";
import { ActivityChart } from "@/features/explore/components/ActivityChart";
import {
  needsRefreshOnMount,
  savedCopyBanner,
  savedCopyState,
} from "@/features/explore/savedCopy";
import { PROCESS_START_MS } from "@/lib/query/client";
import { SaveMemberButton } from "@/features/saved/components/SaveMemberButton";
import { CompareToggleButton } from "@/features/compare/components/CompareToggleButton";
import { displayName, formatShortDate } from "@/lib/util/display";
import { isLateFiling } from "@/features/trades/api/types";
import { ctaColors } from "@/lib/theme/tokens";

function Chip({
  label,
  active,
  onPress,
  a11y,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  a11y?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={a11y ?? label}
      className={`mr-2 min-h-11 justify-center rounded-full px-3.5 ${
        active
          ? "bg-cta-accent"
          : "border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          active ? "text-white" : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
        {value}
      </Text>
      <Text className="text-[11px] text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}

function RecordRow({ t }: { t: ExplorableTrade }) {
  const router = useRouter();
  const lagUnknown = t.date_quality === "corrupt" || t.disclosure_lag_days == null;
  const late = !lagUnknown && isLateFiling(t.disclosure_lag_days);

  return (
    <Pressable
      onPress={() => router.push(`/trade/${t.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${t.tx_type} of ${t.ticker || t.asset_name}, ${t.amount_range}, reported ${formatShortDate(t.trade_date)}${late ? ", filed late" : ""}`}
      className="min-h-11 flex-row items-center justify-between border-t border-gray-100 px-4 py-2.5 dark:border-gray-800"
    >
      <View className="flex-1 pr-2">
        <Text
          className="text-sm font-semibold text-gray-900 dark:text-gray-100"
          numberOfLines={1}
        >
          {t.ticker || t.asset_name}
        </Text>
        <Text className="text-[11px] text-gray-500 dark:text-gray-400" numberOfLines={1}>
          {t.tx_type} · {t.amount_range} · {formatShortDate(t.trade_date)}
        </Text>
      </View>
      {late ? (
        <View
          className="rounded-full px-2 py-0.5"
          style={{ backgroundColor: ctaColors.late }}
        >
          <Text className="text-[10px] font-bold text-white">LATE</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function ExploreScreen() {
  // sector / txType arrive when the user drills in from a Compare cell, so
  // the screen opens with that filter already applied rather than making
  // them re-find it.
  const { name, sector: sectorParam, txType: txTypeParam } =
    useLocalSearchParams<{ name: string; sector?: string; txType?: string }>();
  const memberName = typeof name === "string" ? name : "";

  const { data: profile, isLoading, isError, refetch, dataUpdatedAt } =
    useMemberProfile(memberName);
  const savedItem = useSavedStore((s) =>
    s.items.find((i) => i.entityType === "member" && i.entityId === memberName),
  ) as SavedMember | undefined;

  // A profile rehydrated from the persisted cache is stale for this screen
  // no matter the query's staleTime: refresh it once per mount, so that
  // online the copy is replaced and its label clears. cancelRefetch false
  // leaves any refetch the query already started alone.
  const rehydrated = needsRefreshOnMount(!!profile, dataUpdatedAt, PROCESS_START_MS);
  useEffect(() => {
    if (rehydrated) void refetch({ cancelRefetch: false });
  }, [rehydrated, memberName, refetch]);

  const [year, setYear] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(
    typeof sectorParam === "string" && sectorParam ? sectorParam : null,
  );
  const [txType, setTxType] = useState<"buy" | "sell" | null>(
    txTypeParam === "buy" || txTypeParam === "sell" ? txTypeParam : null,
  );
  const [month, setMonth] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Live data when we have it; the saved snapshot when we do not. The
  // snapshot is a genuine fallback, not a placeholder -- it is the same
  // shape, so every derivation below works identically on either. Whether
  // what is on screen is current or a copy is decided in one place.
  const copy = savedCopyState({
    hasProfile: !!profile,
    dataUpdatedAt,
    processStartMs: PROCESS_START_MS,
    hasSnapshot: !!savedItem?.snapshot,
    snapshotUpdatedAt: savedItem?.snapshotUpdatedAt ?? null,
  });
  const bannerText = savedCopyBanner(copy, !!savedItem);
  const trades: ExplorableTrade[] = useMemo(() => {
    if (profile?.trades?.length) return profile.trades.map(toSavedTradeLite);
    if (savedItem?.snapshot?.trades?.length) return savedItem.snapshot.trades;
    return [];
  }, [profile, savedItem]);

  // One filtered pass feeds the chart, the timeline and every stat, so the
  // numbers can never disagree with the list beneath them.
  const filtered = useMemo(
    () => applyFilters(trades, { year, sector, txType, month }),
    [trades, year, sector, txType, month],
  );
  // The chart shows the year/sector/type context but NOT the month filter --
  // otherwise selecting a bar would erase every other bar and you could not
  // select a different one.
  const chartSeries = useMemo(
    () => monthlySeries(applyFilters(trades, { year, sector, txType })),
    [trades, year, sector, txType],
  );
  const years = useMemo(() => availableYears(trades), [trades]);
  const sectors = useMemo(() => sectorCounts(trades).slice(0, 8), [trades]);
  const tx = useMemo(() => txTypeCounts(filtered), [filtered]);
  const lag = useMemo(() => lagStats(filtered), [filtered]);
  const groups = useMemo(() => groupByMonth(filtered), [filtered]);

  const sections = useMemo(
    () =>
      groups.map((g) => ({
        key: g.key,
        label: g.label,
        count: g.count,
        // Collapsed months contribute no rows, so a long archive stays cheap.
        data: expanded[g.key] ? g.trades : [],
      })),
    [groups, expanded],
  );

  // Sample vs total, same honesty rule as Compare. The profile endpoint caps
  // its trades array (500 live, 120 in a snapshot), so the loaded set can be
  // smaller than the member's true archive. Showing the loaded count as
  // "Filings" would understate a prolific filer.
  const archiveTotal =
    profile?.stats?.total_trades ?? savedItem?.snapshot?.total_trades ?? null;
  const sampled = archiveTotal != null && trades.length < archiveTotal;

  const filtersActive = !!(year || sector || txType || month);
  const clearAll = () => {
    setYear(null); setSector(null); setTxType(null); setMonth(null);
  };

  const title = displayName(memberName);

  if (isLoading && trades.length === 0) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Stack.Screen options={{ title: "Explore" }} />
        <ActivityIndicator color={ctaColors.accent} />
      </SafeAreaView>
    );
  }

  if (trades.length === 0) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 items-center justify-center bg-gray-50 px-8 dark:bg-gray-950">
        <Stack.Screen options={{ title: "Explore" }} />
        <Text className="text-center text-base font-semibold text-gray-900 dark:text-gray-100">
          {isError ? "Couldn't load filings" : "No filings on file"}
        </Text>
        <Text className="mt-1.5 text-center text-sm text-gray-600 dark:text-gray-400">
          {isError
            ? "We couldn't reach the source right now. Save this member while online to keep a copy you can explore offline."
            : `${title} has no disclosed transactions in the dataset yet.`}
        </Text>
        {isError ? (
          <Pressable
            onPress={() => refetch()}
            accessibilityRole="button"
            className="mt-5 min-h-11 justify-center rounded-lg bg-cta-accent px-5"
          >
            <Text className="font-semibold text-white">Try again</Text>
          </Pressable>
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Stack.Screen options={{ title: `Explore · ${title}` }} />

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            {bannerText ? (
              <View className="m-4 mb-0 flex-row items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950">
                <WifiOff size={16} color={ctaColors.late} />
                <Text className="flex-1 text-[11px] text-amber-800 dark:text-amber-300">
                  {bannerText}
                </Text>
              </View>
            ) : null}

            <View className="flex-row gap-2 px-4 pt-4">
              <SaveMemberButton name={memberName} profile={profile} />
              <CompareToggleButton name={memberName} />
            </View>

            <View className="m-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <View className="flex-row">
                <Stat
                  label={filtersActive ? "In view" : "Filings on record"}
                  value={(filtersActive
                    ? filtered.length
                    : (archiveTotal ?? filtered.length)
                  ).toLocaleString()}
                />
                <Stat label="Purchases" value={tx.buys.toLocaleString()} />
                <Stat label="Sales" value={tx.sells.toLocaleString()} />
                <Stat
                  label="Median lag"
                  value={lag.median == null ? "—" : `${Math.round(lag.median)}d`}
                />
              </View>
              {lag.late > 0 ? (
                <Text className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                  {lag.late} of {lag.counted} filed more than 45 days after the
                  reported transaction date.
                </Text>
              ) : null}
              {sampled ? (
                <Text className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Timeline and breakdowns cover the {trades.length.toLocaleString()}{" "}
                  most recent of {archiveTotal?.toLocaleString()} filings held on
                  this device.
                </Text>
              ) : null}
            </View>

            <View className="mx-4 mb-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <ActivityChart
                series={chartSeries}
                selectedMonth={month}
                onSelectMonth={setMonth}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}
            >
              <Chip label="All years" active={!year} onPress={() => setYear(null)} />
              {years.map((y) => (
                <Chip key={y} label={y} active={year === y} onPress={() => setYear(year === y ? null : y)} />
              ))}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}
            >
              <Chip
                label="Purchases"
                active={txType === "buy"}
                onPress={() => setTxType(txType === "buy" ? null : "buy")}
              />
              <Chip
                label="Sales"
                active={txType === "sell"}
                onPress={() => setTxType(txType === "sell" ? null : "sell")}
              />
              {sectors.map((s) => (
                <Chip
                  key={s.sector}
                  label={`${s.sector} (${s.count})`}
                  active={sector === s.sector}
                  a11y={`${s.sector}, ${s.count} filings`}
                  onPress={() => setSector(sector === s.sector ? null : s.sector)}
                />
              ))}
            </ScrollView>

            {filtersActive ? (
              <View className="flex-row items-center justify-between px-4 py-2">
                <Text className="text-xs text-gray-600 dark:text-gray-400">
                  {filtered.length.toLocaleString()} of {trades.length.toLocaleString()} filings
                </Text>
                <Pressable
                  onPress={clearAll}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all filters"
                  className="min-h-11 justify-center"
                >
                  <Text className="text-xs font-semibold text-cta-accent">
                    Clear filters
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <Text className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Timeline
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const open = !!expanded[section.key];
          return (
            <Pressable
              onPress={() =>
                setExpanded((e) => ({ ...e, [section.key]: !e[section.key] }))
              }
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              accessibilityLabel={`${section.label}, ${section.count} ${section.count === 1 ? "filing" : "filings"}`}
              accessibilityHint={open ? "Double tap to collapse" : "Double tap to show these filings"}
              className="min-h-11 flex-row items-center gap-2 bg-gray-50 px-4 py-3 dark:bg-gray-950"
            >
              {open ? (
                <ChevronDown size={16} color={ctaColors.accent} />
              ) : (
                <ChevronRight size={16} color="#9ca3af" />
              )}
              <View
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: ctaColors.accent }}
              />
              <Text className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {section.label}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {section.count} {section.count === 1 ? "filing" : "filings"}
              </Text>
            </Pressable>
          );
        }}
        renderItem={({ item }) => <RecordRow t={item} />}
        ListEmptyComponent={
          <View className="items-center px-8 py-10">
            <Text className="text-center text-sm text-gray-600 dark:text-gray-400">
              No filings match these filters.
            </Text>
            <Pressable
              onPress={clearAll}
              accessibilityRole="button"
              className="mt-4 min-h-11 justify-center rounded-lg bg-cta-accent px-5"
            >
              <Text className="font-semibold text-white">Clear filters</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}
