// 3-panel stats banner. Single row; reuses useStats(). Has its own three-
// state branch (loading shimmer per panel, error -> empty placeholders,
// data -> values) so it never blocks the feed below. The Congress-vs-S&P
// benchmark moved to PulseHero (feed ListHeader) so it lives in exactly one
// place; this banner is the supporting 3-cell grid.
//
// Brand-color rules:
//   * Overdue members  -> cta-late tint when value > 0
//   * Disclosures 7d    -> neutral
//   * Committee overlap -> neutral
import { Text, View } from "react-native";
import { useStats } from "@/features/trades/api/queries";

function ShimmerCell() {
  return (
    <View className="h-20 flex-1 rounded-lg bg-gray-200 dark:bg-gray-700" />
  );
}

type CellProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

function Cell({ label, value, valueClassName }: CellProps) {
  return (
    <View className="h-20 flex-1 justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 dark:border-gray-700 dark:bg-gray-800">
      <Text
        className={`text-2xl font-bold text-gray-900 dark:text-gray-100 ${valueClassName ?? ""}`}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        className="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

export function StatsBanner() {
  const stats = useStats();

  if (stats.isLoading) {
    return (
      <View className="px-4 py-3">
        <View className="flex-row gap-3">
          <ShimmerCell />
          <ShimmerCell />
          <ShimmerCell />
        </View>
      </View>
    );
  }

  if (stats.isError || !stats.data) {
    // Empty placeholders -- keep layout reserved so the feed below
    // doesn't jump when stats recover. No error message; the feed is
    // the primary surface and this banner is supportive context.
    return (
      <View className="px-4 py-3">
        <View className="flex-row gap-3">
          <Cell label="Overdue (119th)" value="-" />
          <Cell label="Disclosures last 7d" value="-" />
          <Cell label="Committee overlap 7d" value="-" />
        </View>
      </View>
    );
  }

  const d = stats.data.data;
  const overdue = d.overdue_members_119th ?? 0;
  const disclosures = d.disclosures_last_7d ?? 0;
  const overlap = d.committee_overlap_trades_7d ?? 0;

  const overdueTint = overdue > 0 ? "text-cta-late" : "";

  return (
    <View className="px-4 py-3">
      <View className="flex-row gap-3">
        <Cell
          label="Overdue (119th)"
          value={overdue.toLocaleString()}
          valueClassName={overdueTint}
        />
        <Cell label="Disclosures last 7d" value={disclosures.toLocaleString()} />
        <Cell label="Committee overlap 7d" value={overlap.toLocaleString()} />
      </View>
    </View>
  );
}
