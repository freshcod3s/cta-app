// Feed -- primary surface (CTA-App-1-5: real content; filters slice adds
// server-side filtering + row drill-in).
// FlatList<TradeRecord> with a pinned FilterBar on top. StatsBanner is the
// ListHeaderComponent (scrolls with the list) but is hidden once any
// filter is active so a filtered view stays focused on results.
// State branch:
//   isLoading            -> FeedSkeleton
//   isError && empty     -> ErrorState with Retry
//   data, empty, filtered-> "No trades match these filters" + Clear
//   data                 -> FlatList + RefreshControl + pagination
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTradesList } from "@/features/trades/api/queries";
import { activeFilterCount, type TradeRecord } from "@/features/trades/api/types";
import { useTradeFiltersStore } from "@/features/trades/store";
import { FilterBar } from "@/features/trades/components/FilterBar";
import { StatsBanner } from "@/features/trades/components/StatsBanner";
import { TradeRow } from "@/features/trades/components/TradeRow";
import { FeedSkeleton } from "@/features/trades/components/FeedSkeleton";

function Divider() {
  return <View className="ml-[68px] h-px bg-gray-200 dark:bg-gray-800" />;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
        Couldn&apos;t load the feed
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

function EmptyState({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <View className="items-center justify-center p-12">
      <Text className="text-center text-base text-gray-500 dark:text-gray-400">
        {filtered ? "No trades match these filters." : "No trades yet."}
      </Text>
      {filtered ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          className="mt-3 rounded-lg bg-cta-accent px-4 py-2"
        >
          <Text className="text-sm font-semibold text-white">Clear filters</Text>
        </Pressable>
      ) : null}
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

export default function FeedScreen() {
  const filters = useTradeFiltersStore((s) => s.filters);
  const clear = useTradeFiltersStore((s) => s.clear);
  const query = useTradesList(filters);
  const trades: TradeRecord[] = query.data?.flat ?? [];
  const filtered = activeFilterCount(filters) > 0;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <FilterBar />

      {query.isLoading ? (
        <FeedSkeleton />
      ) : query.isError && trades.length === 0 ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={trades}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item }) => <TradeRow trade={item} />}
          ItemSeparatorComponent={Divider}
          ListHeaderComponent={filtered ? null : <StatsBanner />}
          ListEmptyComponent={<EmptyState filtered={filtered} onClear={clear} />}
          ListFooterComponent={<ListFooter loading={query.isFetchingNextPage} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
