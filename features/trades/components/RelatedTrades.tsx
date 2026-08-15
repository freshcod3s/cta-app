// RelatedTrades -- contextual broadening on the trade detail: other recent
// disclosures for the same ticker, or by the same member (brand-parity-gaps
// row #25). Factual aggregation only -- no "popular"/"trending"/"recommended"
// framing; just the same filtered feed the user can already reach.
//
// Reuses TradeRow: its outer Link targets /trade/{id}, so tapping a related row
// pushes that trade's detail (Back returns to the current one). The current
// trade is excluded CLIENT-SIDE -- the worker /api/trades has no exclude param
// and ignores `limit`, so we fetch page 1 (per_page 25) via useTradesList,
// drop the current id, and slice to RELATED_LIMIT.
//
// Mirrors NewsSection's subsection shape: a stable section (uppercase header,
// spinner while loading, a muted empty line on empty/error, else up to 5 rows)
// so the detail screen keeps a predictable layout.
import { ActivityIndicator, Text, View } from "react-native";

import { useTradesList } from "@/features/trades/api/queries";
import type { TradeFilters } from "@/features/trades/api/types";
import { TradeRow } from "@/features/trades/components/TradeRow";

const RELATED_LIMIT = 5;

export function RelatedTrades({
  title,
  emptyText,
  filters,
  currentId,
}: {
  title: string;
  emptyText: string;
  filters: TradeFilters;
  currentId: number;
}) {
  const { data, isLoading } = useTradesList(filters);
  const rows = (data?.flat ?? [])
    .filter((t) => t.id !== currentId)
    .slice(0, RELATED_LIMIT);

  return (
    <View>
      <Text className="px-4 pb-2 pt-5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </Text>
      {isLoading ? (
        <View className="px-4 py-4">
          <ActivityIndicator size="small" color="#6366f1" />
        </View>
      ) : rows.length === 0 ? (
        <Text className="px-4 pb-2 text-sm text-gray-500 dark:text-gray-400">
          {emptyText}
        </Text>
      ) : (
        rows.map((t) => <TradeRow key={t.id} trade={t} />)
      )}
    </View>
  );
}
