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
// paginates. The caption labels the TRUE scope using the authoritative
// total (web's relabeling approach): "in the N most recent of M
// disclosures" -- we never fabricate a number the data doesn't support,
// and we never imply the loaded slice is the lifetime record.
//
// Committee chips reuse the CommitteeChips contract; the structured
// committee_tree is the primary source (the legacy committees CSV is NULL
// for most current members), so both are forwarded and CommitteeChips
// picks tree-first.
import { Text, View } from "react-native";

import { CommitteeChips } from "@/features/trades/components/CommitteeChips";
import type { CommitteeTreeNode } from "@/features/members/api/types";

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
  committeeTree?: CommitteeTreeNode[] | null;
};

export function MemberSummaryStrip({
  totalTrades,
  lateCount,
  loadedCount,
  committees,
  committeeTree,
}: Props) {
  const total = totalTrades ?? loadedCount;
  const tradeLabel = total === 1 ? "disclosed trade" : "disclosed trades";

  // True-scope caption: when more disclosures exist than are loaded,
  // say so explicitly instead of the bare "N loaded".
  const scope =
    total > loadedCount
      ? `the ${loadedCount.toLocaleString()} most recent of ${total.toLocaleString()}`
      : `all ${loadedCount.toLocaleString()}`;

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
            {lateCount.toLocaleString()} filed late ({">"}45 days) in {scope}{" "}
            disclosures
          </Text>
        ) : (
          <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            No late filings in {scope} disclosures
          </Text>
        )}
      </View>
      <CommitteeChips committees={committees} committeeTree={committeeTree} />
    </View>
  );
}
