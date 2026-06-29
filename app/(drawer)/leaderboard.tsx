// Leaderboard / benchmark -- accountability surface (NOT "alpha to copy").
//
// Framing (Strategic positioning lock): CTA is a civic-transparency tool.
// These rankings make disclosure behavior visible -- who trades the most,
// who files the latest -- and benchmark Congress aggregate returns against
// the broad market so the public can judge "do members beat the market?"
// for themselves. No copy-trade affordance, no signal language anywhere.
//
// Layout: a single FlatList<LeaderboardMember> whose ListHeaderComponent
// stacks the benchmark card + section title + board toggle, so the whole
// thing scrolls as one unit (same pattern as the feed's StatsBanner header
// -- no fixed splitter eating phone height).
//
// FSM states (explicit branches, mirrors index.tsx -- no boolean soup):
//   loading -> LeaderboardSkeleton in the list body
//   error   -> inline ErrorState with Retry (only when no rows are shown)
//   empty   -> EmptyState
//   success -> ranked LeaderboardRow list
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLeaderboard } from "@/features/leaderboard/api/queries";
import type {
  LeaderboardMember,
  LeaderboardSort,
} from "@/features/leaderboard/api/types";
import { BenchmarkCard } from "@/features/leaderboard/components/BenchmarkCard";
import { BoardToggle } from "@/features/leaderboard/components/BoardToggle";
import { LeaderboardRow } from "@/features/leaderboard/components/LeaderboardRow";
import { LeaderboardSkeleton } from "@/features/leaderboard/components/LeaderboardSkeleton";
import { RETURNS_DISPLAY } from "@/lib/flags";

function Divider() {
  return <View className="ml-[76px] h-px bg-gray-200 dark:bg-gray-800" />;
}

function BoardCaption({ sort }: { sort: LeaderboardSort }) {
  const text =
    sort === "late_filer"
      ? "Sitting members ranked by average disclosure lag. An OVERDUE flag marks an average past the 45-day STOCK Act window."
      : "Sitting members ranked by number of disclosed trades.";
  return (
    <Text className="px-4 pb-1 pt-3 text-xs leading-4 text-gray-500 dark:text-gray-400">
      {text}
    </Text>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="items-center justify-center p-12">
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
        Couldn&apos;t load the leaderboard
      </Text>
      <Text className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">
        Pull to retry, or tap below.
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        className="mt-4 rounded-lg bg-cta-accent px-5 py-3"
      >
        <Text className="font-semibold text-white">Retry</Text>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="items-center justify-center p-12">
      <Text className="text-base text-gray-500 dark:text-gray-400">
        No members to rank yet.
      </Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  // Ephemeral, screen-local view state -- which board is showing. Not
  // persisted, not shared across routes, so useState (not Zustand). The
  // value doubles as the React Query sort key, so switching boards swaps
  // to that board's independently-cached data.
  const [sort, setSort] = useState<LeaderboardSort>("trade_count");
  const query = useLeaderboard(sort);
  const members: LeaderboardMember[] = query.data ?? [];

  const Header = (
    <View>
      {RETURNS_DISPLAY ? <BenchmarkCard /> : null}
      <Text className="px-4 pt-5 text-base font-bold text-gray-900 dark:text-gray-100">
        Member accountability
      </Text>
      <BoardToggle value={sort} onChange={setSort} />
      <BoardCaption sort={sort} />
    </View>
  );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <FlatList
        data={query.isLoading ? [] : members}
        keyExtractor={(m) => m.name}
        renderItem={({ item, index }) => (
          <LeaderboardRow member={item} rank={index + 1} metric={sort} />
        )}
        ItemSeparatorComponent={Divider}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          query.isLoading ? (
            <LeaderboardSkeleton />
          ) : query.isError ? (
            <ErrorState onRetry={() => query.refetch()} />
          ) : (
            <EmptyState />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}
