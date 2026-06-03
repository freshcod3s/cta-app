// Ticker detail -- every disclosed congressional trade in one ticker.
// Route: /ticker/{symbol} (declared at the root Stack in app/_layout, so it
// stack-pushes OVER the drawer when reached from a feed row's ticker tap).
// Param is the uppercase ticker symbol.
//
// Mirrors the feed (app/(drawer)/index.tsx) FSM exactly. The trade LIST is
// the primary state machine; the header card (ticker-info) loads
// independently and renders its own shimmer so it never blocks the list:
//   isLoading (list)       -> TickerDetailSkeleton (header + 8 row shimmers)
//   isError + empty (list) -> ErrorState with Retry (refetches both)
//   data                   -> FlatList: TickerHeader + TradeRow rows
//                             + RefreshControl + onEndReached pagination
//
// SafeAreaView edges={["bottom"]} only -- the root Stack header handles the
// top inset (back arrow + title).
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";

import type { TradeRecord } from "@/features/trades/api/types";
import { TradeRow } from "@/features/trades/components/TradeRow";
import {
  normalizeSymbol,
  useTickerInfo,
  useTickerTrades,
} from "@/features/ticker/api/queries";
import { TickerHeader } from "@/features/ticker/components/TickerHeader";

function Divider() {
  return <View className="ml-[68px] h-px bg-gray-200 dark:bg-gray-800" />;
}

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <View className={`rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />
  );
}

function TickerDetailSkeleton() {
  return (
    <View className="pb-8">
      <View className="border-b border-gray-200 px-4 pb-4 pt-3 dark:border-gray-800">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <View className="flex-1 gap-2">
            <ShimmerBlock className="h-6 w-1/3" />
            <ShimmerBlock className="h-4 w-2/3" />
          </View>
        </View>
        <ShimmerBlock className="mt-4 h-16 w-full" />
      </View>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} className="h-[72px] flex-row items-center gap-3 px-4">
          <View className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <View className="flex-1 gap-2">
            <ShimmerBlock className="h-4 w-1/2" />
            <ShimmerBlock className="h-3 w-3/4" />
          </View>
        </View>
      ))}
    </View>
  );
}

function ErrorState({
  symbol,
  onRetry,
}: {
  symbol: string;
  onRetry: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
        Couldn&apos;t load this ticker
      </Text>
      <Text className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">
        {symbol ? `Ticker: ${symbol}` : "No ticker provided"}
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

function EmptyState({ symbol }: { symbol: string }) {
  return (
    <View className="items-center justify-center p-12">
      <Text className="text-center text-base text-gray-500 dark:text-gray-400">
        No disclosed congressional trades in {symbol} yet.
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

export default function TickerDetailScreen() {
  const params = useLocalSearchParams<{ symbol: string }>();
  const symbol = normalizeSymbol(params.symbol);

  const info = useTickerInfo(symbol);
  const list = useTickerTrades(symbol);

  const trades: TradeRecord[] = list.data?.flat ?? [];
  const total = list.data?.total ?? 0;

  const retry = () => {
    void info.refetch();
    void list.refetch();
  };

  const header = (
    <TickerHeader
      symbol={symbol}
      info={info.data}
      infoLoading={info.isLoading}
      priceTrade={trades[0]}
      totalTrades={total}
    />
  );

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <Stack.Screen options={{ title: symbol || "Ticker" }} />
      {list.isLoading ? (
        <TickerDetailSkeleton />
      ) : list.isError && trades.length === 0 ? (
        <ErrorState symbol={symbol} onRetry={retry} />
      ) : (
        <FlatList
          data={trades}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item }) => <TradeRow trade={item} />}
          ItemSeparatorComponent={Divider}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState symbol={symbol} />}
          ListFooterComponent={
            <ListFooter loading={list.isFetchingNextPage} />
          }
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) {
              list.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isFetchingNextPage}
              onRefresh={retry}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
