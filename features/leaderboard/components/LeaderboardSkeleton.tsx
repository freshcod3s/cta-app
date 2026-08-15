// Ranked-list loading skeleton: N row shimmers matching LeaderboardRow's
// 72pt layout (rank | avatar | name+party | metric) so the post-load
// list doesn't shift. Mirrors the trades-feature FeedSkeleton approach.
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
      <View className="w-6 items-center">
        <ShimmerBlock className="h-4 w-4" />
      </View>
      <View className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      <View className="flex-1 gap-2">
        <ShimmerBlock className="h-4 w-2/3" />
        <ShimmerBlock className="h-3 w-1/3" />
      </View>
      <View className="items-end gap-2">
        <ShimmerBlock className="h-4 w-12" />
        <ShimmerBlock className="h-3 w-16" />
      </View>
    </View>
  );
}

export function LeaderboardSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <View className="pt-2">
      {Array.from({ length: rows }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </View>
  );
}
