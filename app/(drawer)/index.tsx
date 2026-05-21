// Feed -- primary surface (CTA-App-1-5: real content).
// FlatList<TradeRecord> with StatsBanner as ListHeaderComponent so the
// banner scrolls with the list (no fixed splitter eating phone height).
// Three-state branch:
//   isLoading -> FeedSkeleton (banner shimmer + 8 row shimmers)
//   isError    -> inline ErrorState with Retry
//   data       -> FlatList + RefreshControl + onEndReached pagination
// Search FAB stub from CTA-App-1-3 stays bottom-right; account button +
// hamburger come from the drawer's screenOptions header.
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";

import { useTradesList } from "@/features/trades/api/queries";
import type { TradeRecord } from "@/features/trades/api/types";
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

function EmptyState() {
  return (
    <View className="items-center justify-center p-12">
      <Text className="text-base text-gray-500 dark:text-gray-400">
        No trades yet.
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

export default function FeedScreen() {
  const query = useTradesList();
  const trades: TradeRecord[] = query.data?.flat ?? [];

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
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
          ListHeaderComponent={<StatsBanner />}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={
            <ListFooter loading={query.isFetchingNextPage} />
          }
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search"
        onPress={() => Alert.alert("Search", "Search ships in CTA-App-1-N")}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-cta-accent shadow-lg"
        style={{ elevation: 6 }}
      >
        <Search size={26} color="#ffffff" />
      </Pressable>
    </SafeAreaView>
  );
}
