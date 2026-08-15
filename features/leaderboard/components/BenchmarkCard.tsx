// Congress-vs-S&P benchmark summary card.
//
// Accountability framing: this answers "does Congress aggregate beat the
// broad market on disclosed trades?" as a transparency metric. It is NOT
// a buy signal and carries no copy-trade affordance. Copy stays neutral
// and explanatory.
//
// Has its own three-state branch (loading shimmer / error placeholder /
// data) -- mirrors StatsBanner so a slow or failed /api/stats never
// blocks the ranked lists below it on the screen.
import { Text, View } from "react-native";
import { useBenchmark } from "@/features/leaderboard/api/queries";

function Shimmer() {
  return (
    <View className="h-28 rounded-xl bg-gray-200 dark:bg-gray-700" />
  );
}

type StatProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

function Stat({ label, value, valueClassName }: StatProps) {
  return (
    <View className="flex-1">
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

function fmtPct(v: number | null): string {
  if (v == null) return "-";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

export function BenchmarkCard() {
  const benchmark = useBenchmark();

  if (benchmark.isLoading) {
    return (
      <View className="px-4 pt-4">
        <Shimmer />
      </View>
    );
  }

  // Error / no data -> reserved placeholder card, no error message. The
  // ranked lists are the primary content; this summary is supportive.
  const data = benchmark.isError || !benchmark.data ? null : benchmark.data;

  const delta = data?.deltaPct ?? null;
  const deltaTint =
    delta == null
      ? ""
      : delta > 0
        ? "text-cta-buy"
        : delta < 0
          ? "text-cta-sell"
          : "";

  return (
    <View className="px-4 pt-4">
      <View className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Congress vs S&amp;P 500
        </Text>
        <View className="mt-3 flex-row gap-3">
          <Stat
            label="Congress avg return"
            value={fmtPct(data?.congressAvgPct ?? null)}
          />
          <Stat
            label="S&amp;P 500 avg"
            value={fmtPct(data?.sp500AvgPct ?? null)}
          />
          <Stat
            label="Difference"
            value={fmtPct(delta)}
            valueClassName={deltaTint}
          />
        </View>
        <Text className="mt-3 text-xs leading-4 text-gray-500 dark:text-gray-400">
          Average price change on enriched disclosures versus the matched
          S&amp;P 500 move over the same periods. A transparency benchmark
          for public accountability -- not investment advice.
        </Text>
      </View>
    </View>
  );
}
