// Conflicts -- the native accountability view (mobile replacement for the web
// constellation). Ranks disclosures on the signal that is CORRECT: documented
// late filings (45-day STOCK Act) first, then trade size. Committee overlap is
// a labeled secondary chip, never the ranking driver (it is current-roster, not
// time-aware) -- see features/conflicts/ranking.ts for the locked rationale.
//
// Pure assembly: one /api/trades feed (useTradesList). The Worker now serves
// the per-trade committee overlap INLINE on each row (trade.conflict, with a
// basis stamp), so the chips read it directly -- no per-row fetch, no fan-out,
// ranking + chips cover the full loaded set with zero gaps.
//
// FSM (explicit branches, mirrors index.tsx -- no boolean soup):
//   loading            -> FeedSkeleton
//   error && empty      -> ErrorState with Retry
//   success && empty    -> EmptyState
//   success             -> ranked FlatList + RefreshControl + pagination
import { useMemo } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTradesList } from "@/features/trades/api/queries";
import { FeedSkeleton } from "@/features/trades/components/FeedSkeleton";
import { ConflictListRow } from "@/features/conflicts/components/ConflictListRow";
import { ConflictsLegend } from "@/features/conflicts/components/ConflictsLegend";
import { rankConflicts, type ConflictTrade } from "@/features/conflicts/ranking";

function Divider() {
  return <View className="ml-[68px] h-px bg-gray-200 dark:bg-gray-800" />;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
        Couldn&apos;t load conflicts
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
      <Text className="text-center text-base text-gray-500 dark:text-gray-400">
        No disclosures to rank yet.
      </Text>
    </View>
  );
}

function ListFooter({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <View className="py-6">
      <Text className="text-center text-xs text-gray-500 dark:text-gray-400">
        Loading more...
      </Text>
    </View>
  );
}

export default function ConflictsScreen() {
  // Unfiltered feed; the conflicts ordering is applied client-side over the
  // loaded pages. (A future Worker `sort=lag` param would make the ranking
  // global rather than within-loaded; until then infinite scroll widens it.)
  const query = useTradesList();
  const flat = query.data?.flat;
  const ranked = useMemo(
    () => rankConflicts((flat ?? []) as ConflictTrade[]),
    [flat],
  );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      {query.isLoading ? (
        <FeedSkeleton />
      ) : query.isError && ranked.length === 0 ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={ranked}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item }) => <ConflictListRow trade={item} />}
          ItemSeparatorComponent={Divider}
          ListHeaderComponent={<ConflictsLegend />}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={
            <ListFooter loading={query.isFetchingNextPage} />
          }
          // Bound how many rows mount at once: each row may resolve a per-
          // politician conflict profile (deduped + cached), so a tight window
          // keeps concurrent fetches reasonable without hurting scroll feel.
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => query.refetch()}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
