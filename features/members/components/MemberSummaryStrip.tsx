// Profile summary strip: a one-line disclosure summary + (optional)
// committee-assignment chips. Sits between the identity header and the
// member's trade feed.
//
// Disclosure summary framing (civic transparency, NOT fintech):
//   "{total} disclosed trades * {late} filed late"
// `total` is the member's lifetime disclosed-trade count from the worker
// profile stats (authoritative). `late` is derived by the screen from the
// trades currently LOADED into the feed using isLateFiling (>45 days, the
// STOCK Act line), so it is a "late so far" count that grows as the user
// paginates. The label says "late in loaded trades" to avoid implying it
// is the lifetime late total -- we never fabricate a number the data
// doesn't support.
//
// Committee chips reuse the existing CommitteeChips presentation contract
// (committees: string[]); the worker profile endpoint DOES expose
// committees, so unlike the trade-detail screen this list is usually
// populated.
import { Text, View } from "react-native";

import { CommitteeChips } from "@/features/trades/components/CommitteeChips";

type Props = {
  // Lifetime disclosed-trade count from the worker (stats.total_trades).
  // null when the worker has no stats row; falls back to loadedCount.
  totalTrades: number | null;
  // Count of LOADED feed rows flagged late by isLateFiling (>45 days).
  lateCount: number;
  // How many trades are currently loaded into the feed (for the late
  // caption's honesty -- "N of M loaded").
  loadedCount: number;
  committees: string[];
};

export function MemberSummaryStrip({
  totalTrades,
  lateCount,
  loadedCount,
  committees,
}: Props) {
  const total = totalTrades ?? loadedCount;
  const tradeLabel = total === 1 ? "disclosed trade" : "disclosed trades";

  return (
    <View>
      <View className="px-4 pt-1 pb-3">
        <Text className="text-sm text-gray-700 dark:text-gray-300">
          <Text className="font-semibold text-gray-900 dark:text-gray-100">
            {total.toLocaleString()}
          </Text>{" "}
          {tradeLabel}
        </Text>
        {lateCount > 0 ? (
          <Text className="mt-0.5 text-xs text-cta-late">
            {lateCount.toLocaleString()} filed late ({">"}45 days) in{" "}
            {loadedCount.toLocaleString()} loaded
          </Text>
        ) : (
          <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            No late filings in {loadedCount.toLocaleString()} loaded
          </Text>
        )}
      </View>
      <CommitteeChips committees={committees} />
    </View>
  );
}
