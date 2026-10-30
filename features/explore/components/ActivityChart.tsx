// Filings per month -- the interactive entry point into Explore.
//
// Counts only. Bar height is the NUMBER OF FILINGS in that month, never a
// dollar figure: disclosed amounts are ranges, and a bar chart of ranges
// would imply a precision the source does not have.
//
// Built from React Native primitives rather than SVG. The chart needs one
// thing SVG makes awkward here -- a reliable, correctly sized touch target
// per bar with a real accessibility role -- and a stack of Views gives that
// for free. No new dependency (§6/§21).
//
// Accessibility: each bar is a button carrying its own month, count and
// selection state, so the chart is fully operable and fully legible with a
// screen reader. The summary line underneath is the chart's text equivalent
// (§14) -- the information is never colour-only or shape-only.
import { memo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import type { MonthBar } from "@/features/explore/derive";
import { ctaColors } from "@/lib/theme/tokens";

const CHART_HEIGHT = 104;
const BAR_WIDTH = 20;
const BAR_GAP = 5;
// A one-filing month must still be visibly a bar, not a hairline.
const MIN_BAR_HEIGHT = 3;

type Props = {
  series: MonthBar[];
  selectedMonth: string | null;
  onSelectMonth: (key: string | null) => void;
};

function ActivityChartImpl({ series, selectedMonth, onSelectMonth }: Props) {
  if (series.length === 0) return null;

  const peak = series.reduce((m, b) => Math.max(m, b.count), 0);
  const total = series.reduce((n, b) => n + b.count, 0);
  const busiest = series.reduce((a, b) => (b.count > a.count ? b : a), series[0]);

  return (
    <View>
      <View className="mb-1 flex-row items-baseline justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Filings per month
        </Text>
        {selectedMonth ? (
          <Pressable
            onPress={() => onSelectMonth(null)}
            accessibilityRole="button"
            accessibilityLabel="Clear the selected month and show all filings"
            hitSlop={8}
            className="min-h-11 justify-center"
          >
            <Text className="text-xs font-semibold text-cta-accent">
              Clear selection
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Newest months matter most; open at the right-hand edge.
        ref={(r) => r?.scrollToEnd({ animated: false })}
        contentContainerStyle={{ paddingVertical: 4, paddingRight: 4 }}
      >
        <View className="flex-row items-end" style={{ height: CHART_HEIGHT }}>
          {series.map((b) => {
            const selected = b.key === selectedMonth;
            const h =
              peak === 0
                ? MIN_BAR_HEIGHT
                : Math.max(MIN_BAR_HEIGHT, Math.round((b.count / peak) * (CHART_HEIGHT - 18)));
            return (
              <Pressable
                key={b.key}
                onPress={() => onSelectMonth(selected ? null : b.key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${b.label}, ${b.count} ${b.count === 1 ? "filing" : "filings"}`}
                accessibilityHint={
                  selected
                    ? "Double tap to clear this filter"
                    : "Double tap to show only this month's filings"
                }
                style={{ width: BAR_WIDTH, marginRight: BAR_GAP }}
                className="items-center justify-end"
              >
                {/* Count sits above the bar, so the value is readable
                    without relying on bar height or colour. */}
                {b.count > 0 ? (
                  <Text
                    className={`mb-0.5 text-[9px] ${
                      selected
                        ? "font-bold text-cta-accent"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {b.count}
                  </Text>
                ) : null}
                <View
                  style={{
                    height: h,
                    width: BAR_WIDTH - 4,
                    backgroundColor: selected ? ctaColors.accent : "#9ca3af",
                    opacity: selected || !selectedMonth ? 1 : 0.35,
                    borderRadius: 3,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Sparse axis: every bar labelled would be unreadable at this width. */}
      <View className="flex-row justify-between px-0.5">
        <Text className="text-[10px] text-gray-400 dark:text-gray-500">
          {series[0]?.label}
        </Text>
        <Text className="text-[10px] text-gray-400 dark:text-gray-500">
          {series[series.length - 1]?.label}
        </Text>
      </View>

      {/* Text equivalent of the chart (§14). */}
      <Text
        className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400"
        accessibilityLabel={`Chart summary: ${total} filings across ${series.length} months. Busiest month ${busiest.label} with ${busiest.count}.`}
      >
        {total.toLocaleString()} filings across {series.length} months · busiest{" "}
        {busiest.label} ({busiest.count})
      </Text>
    </View>
  );
}

export const ActivityChart = memo(ActivityChartImpl);
