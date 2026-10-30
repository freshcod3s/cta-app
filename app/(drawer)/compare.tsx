// Compare -- two to four members side by side on the same public-record
// dimensions.
//
// Not a ranking and not a leaderboard. Columns sit in the order the user
// added them; nothing is sorted "best" first, no cell is coloured good or
// bad, and every dimension is a count, a year or a day-count taken straight
// from the filings. Disclosed amounts are ranges, so no dollar figure is
// compared anywhere here.
//
// Each cell that has underlying records is a drill-through into that
// member's Explore with the matching filter already applied, so a number is
// never a dead end.
//
// Offline: a column whose member is saved falls back to the stored snapshot
// and is labelled as a saved copy.
import { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Columns3, X } from "lucide-react-native";

import { membersKeys } from "@/features/members/api/keys";
import { profileQueryFn } from "@/features/members/api/queries";
import type {
  MemberProfile,
  MemberProfileEnvelope,
} from "@/features/members/api/types";
import { useCompareStore, MAX_COMPARE, MIN_COMPARE } from "@/features/compare/store";
import { buildCompareColumn, COMPARE_ROWS, type CompareSource } from "@/features/compare/derive";
import { useSavedStore } from "@/features/saved/store";
import { toSavedTradeLite, type SavedMember } from "@/features/saved/types";
import { snapshotFreshness } from "@/features/saved/freshness";
import { SuggestedMembers } from "@/features/watchlist/components/SuggestedMembers";
import { displayName } from "@/lib/util/display";
import { ctaColors } from "@/lib/theme/tokens";

const COL_WIDTH = 132;
const LABEL_WIDTH = 148;

function EmptyState() {
  const router = useRouter();
  return (
    <ScrollView
      className="px-8"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 24 }}
    >
      <View className="items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Columns3 size={28} color={ctaColors.accent} />
        </View>
        <Text className="text-center text-base font-semibold text-gray-900 dark:text-gray-100">
          Compare two members side by side
        </Text>
        <Text className="mt-1.5 text-center text-sm text-gray-600 dark:text-gray-400">
          Pick {MIN_COMPARE} to {MAX_COMPARE} members to line up their filing
          history, activity and filing promptness on the same rows.
        </Text>
        <Pressable
          onPress={() => router.push("/(drawer)/watchlist")}
          accessibilityRole="button"
          className="mt-5 min-h-11 justify-center rounded-lg bg-cta-accent px-5"
        >
          <Text className="font-semibold text-white">Choose from Saved</Text>
        </Pressable>

        {/* Same active-onboarding principle as the Saved empty state: a
            first-run user has nothing saved, so offer real members here
            rather than an instruction to go elsewhere. Saving one puts it
            straight into the Saved workspace, ready to select. */}
        <SuggestedMembers />
      </View>
    </ScrollView>
  );
}

export default function CompareScreen() {
  const router = useRouter();
  const selected = useCompareStore((s) => s.selected);
  const removeSel = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const savedItems = useSavedStore((s) => s.items);

  // One query per selected member. Same key + fetcher as useMemberProfile,
  // so a profile already in the cache is reused rather than refetched, and
  // a fetch bypasses the iOS URL cache the same way (profileQueryFn sets
  // cache: "no-cache"), so an offline column cannot pass off a URL-cached
  // response as current.
  const results = useQueries({
    queries: selected.map((name) => ({
      queryKey: membersKeys.profile(name),
      queryFn: profileQueryFn(name),
      staleTime: 1000 * 60 * 5,
      select: (env: MemberProfileEnvelope) => env.data as MemberProfile,
    })),
  });

  const columns = useMemo(() => {
    return selected.map((name, i) => {
      const profile = results[i]?.data as MemberProfile | undefined;
      const saved = savedItems.find(
        (it) => it.entityType === "member" && it.entityId === name,
      ) as SavedMember | undefined;

      let src: CompareSource;
      if (profile?.trades?.length) {
        src = {
          name,
          party: profile.party ?? null,
          chamber: profile.chamber ?? null,
          state: profile.state ?? null,
          photoUrl: profile.photo_url ?? null,
          totalTrades: profile.stats?.total_trades ?? null,
          firstTrade: profile.stats?.first_trade ?? null,
          lastTrade: profile.stats?.last_trade ?? null,
          trades: profile.trades.map(toSavedTradeLite),
          fromSnapshot: false,
          snapshotUpdatedAt: null,
        };
      } else if (saved?.snapshot) {
        const s = saved.snapshot;
        src = {
          name,
          party: s.party,
          chamber: s.chamber,
          state: s.state,
          photoUrl: s.photo_url,
          totalTrades: s.total_trades,
          firstTrade: s.first_trade,
          lastTrade: s.last_trade,
          trades: s.trades,
          fromSnapshot: true,
          snapshotUpdatedAt: saved.snapshotUpdatedAt,
        };
      } else {
        src = {
          name,
          party: null, chamber: null, state: null, photoUrl: null,
          totalTrades: null, firstTrade: null, lastTrade: null,
          trades: [],
          fromSnapshot: false,
          snapshotUpdatedAt: null,
        };
      }
      return {
        col: buildCompareColumn(src),
        loading: results[i]?.isLoading ?? false,
        failed: (results[i]?.isError ?? false) && !saved?.snapshot,
      };
    });
  }, [selected, results, savedItems]);

  if (selected.length === 0) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50 dark:bg-gray-950">
        <EmptyState />
      </SafeAreaView>
    );
  }

  const anySampled = columns.some((c) => c.col.sampled);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-700">
        <Text className="text-xs text-gray-600 dark:text-gray-400">
          {selected.length} of {MAX_COMPARE} selected
          {selected.length < MIN_COMPARE ? " · add one more to compare" : ""}
        </Text>
        <Pressable
          onPress={clear}
          accessibilityRole="button"
          accessibilityLabel="Clear the whole comparison"
          className="min-h-11 justify-center px-2"
        >
          <Text className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Clear all
          </Text>
        </Pressable>
      </View>

      <ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Column headers */}
            <View className="flex-row border-b border-gray-200 dark:border-gray-700">
              <View style={{ width: LABEL_WIDTH }} className="px-4 py-3" />
              {columns.map(({ col }) => (
                <View key={col.name} style={{ width: COL_WIDTH }} className="items-center px-2 py-3">
                  <Pressable
                    onPress={() => removeSel(col.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${displayName(col.name)} from the comparison`}
                    hitSlop={8}
                    className="absolute right-1 top-1 h-8 w-8 items-center justify-center"
                  >
                    <X size={14} color="#9ca3af" />
                  </Pressable>

                  {col.photoUrl ? (
                    <Image
                      source={{ uri: col.photoUrl }}
                      className="h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-700"
                    />
                  ) : (
                    <View className="h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-700" />
                  )}
                  <Text
                    className="mt-1.5 text-center text-xs font-bold text-gray-900 dark:text-gray-100"
                    numberOfLines={2}
                  >
                    {displayName(col.name)}
                  </Text>
                  <Text className="text-[10px] text-gray-500 dark:text-gray-400" numberOfLines={1}>
                    {[col.party, col.chamber, col.state].filter(Boolean).join(" · ")}
                  </Text>
                  {col.fromSnapshot ? (
                    <Text className="mt-0.5 text-center text-[9px] text-amber-600 dark:text-amber-500">
                      {snapshotFreshness(col.snapshotUpdatedAt).label}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Dimension rows */}
            {COMPARE_ROWS.map((row, rowIdx) => (
              <View
                key={row.key}
                className={`flex-row items-stretch border-b border-gray-100 dark:border-gray-800 ${
                  rowIdx % 2 === 1 ? "bg-white dark:bg-gray-900" : ""
                }`}
              >
                <View style={{ width: LABEL_WIDTH }} className="justify-center px-4 py-3">
                  <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {row.label}
                  </Text>
                </View>

                {columns.map(({ col, loading, failed }) => {
                  const drill = row.drill?.(col) ?? null;
                  const value = failed ? "—" : loading && col.loadedCount === 0 ? "…" : row.value(col);
                  const body = (
                    <Text className="text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {value}
                    </Text>
                  );
                  if (!drill || failed) {
                    return (
                      <View
                        key={col.name + row.key}
                        style={{ width: COL_WIDTH }}
                        className="justify-center px-2 py-3"
                        accessible
                        accessibilityLabel={`${displayName(col.name)}, ${failed ? `${row.label} unavailable` : row.a11y(col)}`}
                      >
                        {body}
                      </View>
                    );
                  }
                  return (
                    <Pressable
                      key={col.name + row.key}
                      onPress={() =>
                        router.push({
                          pathname: "/explore/[name]",
                          params: { name: col.name, ...drill },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${displayName(col.name)}, ${row.a11y(col)}. Double tap to open these filings.`}
                      style={{ width: COL_WIDTH }}
                      className="min-h-11 justify-center px-2 py-3"
                    >
                      {body}
                      <Text className="mt-0.5 text-center text-[9px] text-cta-accent">
                        View filings
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        <View className="px-4 py-4">
          {anySampled ? (
            <Text className="text-[11px] leading-4 text-gray-500 dark:text-gray-400">
              Breakdowns (purchases, sales, recent activity, sector, filings past
              45 days) are computed from each member&apos;s most recent filings
              held on this device, not the full archive. &quot;Filings on
              record&quot; and &quot;Years covered&quot; are whole-archive
              figures.
            </Text>
          ) : null}
          <Text className="mt-2 text-[11px] leading-4 text-gray-500 dark:text-gray-400">
            Figures are counts and dates taken from filings members reported
            under the STOCK Act. Disclosed amounts are ranges rather than exact
            values, so no dollar totals are compared. This is a side-by-side of
            public records, not a ranking.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
