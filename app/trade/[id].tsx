// Trade detail (CTA-App-1-4 -- replaces CTA-App-1-3 placeholder).
// Push-deep-link target: ctaapp://trade/{id}.
//
// State branches:
//   loading -> TradeDetailSkeleton (same vertical structure, shimmer blocks)
//   error   -> ErrorState with retry (calls query.refetch())
//   data    -> full layout via the 6 components from /features/trades/components
//
// SafeAreaView edges={["bottom"]} only -- the Stack header from /app/_layout
// handles the top inset (back arrow + title).
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import { useTradeDetail } from "@/features/trades/api/queries";
import { MemberHeader } from "@/features/trades/components/MemberHeader";
import { SubscribeButton } from "@/features/trades/components/SubscribeButton";
import { CommitteeChips } from "@/features/trades/components/CommitteeChips";
import { TransactionHero } from "@/features/trades/components/TransactionHero";
import { TimelineSection } from "@/features/trades/components/TimelineSection";
import { SourceLink } from "@/features/trades/components/SourceLink";
import { MethodologyFooter } from "@/features/trades/components/MethodologyFooter";

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <View
      className={`rounded-md bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

function TradeDetailSkeleton() {
  return (
    <View className="pb-8">
      <View className="flex-row items-center gap-4 p-4">
        <View className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
        <View className="flex-1 gap-2">
          <ShimmerBlock className="h-5 w-3/4" />
          <ShimmerBlock className="h-4 w-1/3" />
        </View>
      </View>
      <View className="px-4 pb-2">
        <ShimmerBlock className="h-4 w-1/2" />
      </View>
      <View className="px-4 py-4">
        <ShimmerBlock className="h-6 w-12" />
        <ShimmerBlock className="mt-3 h-10 w-1/2" />
        <ShimmerBlock className="mt-1 h-4 w-3/4" />
        <ShimmerBlock className="mt-4 h-24 w-full" />
      </View>
      <View className="px-4 py-2">
        <ShimmerBlock className="h-4 w-1/3" />
        <ShimmerBlock className="mt-2 h-32 w-full" />
      </View>
      <View className="px-4 py-2">
        <ShimmerBlock className="h-12 w-full" />
      </View>
    </View>
  );
}

function ErrorState({ id, onRetry }: { id?: string; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
        Couldn&apos;t load this trade
      </Text>
      <Text className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">
        {id ? `Trade id: ${id}` : "No trade id provided"}
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

export default function TradeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useTradeDetail(id);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      {query.isLoading ? (
        <ScrollView>
          <TradeDetailSkeleton />
        </ScrollView>
      ) : query.isError || !query.data ? (
        <ErrorState id={id} onRetry={() => query.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
          <MemberHeader trade={query.data} />
          <SubscribeButton trade={query.data} />
          <CommitteeChips />
          <TransactionHero trade={query.data} />
          <TimelineSection trade={query.data} />
          <SourceLink trade={query.data} />
          <MethodologyFooter />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
