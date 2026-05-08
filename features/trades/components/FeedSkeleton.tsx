// Feed loading skeleton: banner shimmer + 8 row shimmers matching the
// final layout's structure (portrait | name+ticker | pill+amount).
// Same shape as TradeRow at 72pt so the post-load layout doesn't shift.
import { View } from "react-native";

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <View
      className={`rounded-md bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

function RowSkeleton() {
  return (
    <View className="h-[72px] flex-row items-center gap-3 px-4">
      <View className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      <View className="flex-1 gap-2">
        <ShimmerBlock className="h-4 w-2/3" />
        <ShimmerBlock className="h-3 w-1/2" />
      </View>
      <View className="items-end gap-2">
        <ShimmerBlock className="h-4 w-12" />
        <ShimmerBlock className="h-3 w-20" />
      </View>
    </View>
  );
}

function BannerSkeletonCell() {
  return (
    <View className="h-20 flex-1 rounded-lg bg-gray-200 dark:bg-gray-700" />
  );
}

export function FeedSkeleton() {
  return (
    <View>
      <View className="px-4 py-3">
        <View className="flex-row gap-3">
          <BannerSkeletonCell />
          <BannerSkeletonCell />
        </View>
        <View className="mt-3 flex-row gap-3">
          <BannerSkeletonCell />
          <BannerSkeletonCell />
        </View>
      </View>
      {Array.from({ length: 8 }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </View>
  );
}
