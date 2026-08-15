// Timeline: trade date, disclosure date, lag in days, late-filing pill.
// The 45-day STOCK Act deadline is the threshold for the cta-late tint
// (see types.ts isLateFiling). Dates rendered in YYYY-MM-DD as the API
// returns them; mobile-friendly typographic alignment via vertical stack.
import { Text, View } from "react-native";
import { isLateFiling, type TradeRecord } from "@/features/trades/api/types";

type Props = { trade: TradeRecord };

function fmtDate(s: string) {
  // API gives YYYY-MM-DD or YYYY-MM-DD HH:MM:SS; trim to date.
  return s.slice(0, 10);
}

export function TimelineSection({ trade }: Props) {
  const late = isLateFiling(trade.disclosure_lag_days);

  return (
    <View className="px-4 py-2">
      <Text className="text-xs uppercase text-gray-500 dark:text-gray-400">
        Timeline
      </Text>

      <View className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Trade date
          </Text>
          <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {fmtDate(trade.trade_date)}
          </Text>
        </View>
        <View className="mt-2 flex-row justify-between">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Disclosure date
          </Text>
          <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {fmtDate(trade.disclosure_date)}
          </Text>
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Disclosure lag
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {trade.disclosure_lag_days} day
              {trade.disclosure_lag_days === 1 ? "" : "s"}
            </Text>
            {late && (
              <View className="rounded-full bg-cta-late px-2 py-0.5">
                <Text className="text-xs font-bold text-white">LATE</Text>
              </View>
            )}
          </View>
        </View>
        {late && (
          <Text className="mt-3 text-xs italic text-gray-500 dark:text-gray-400">
            Filed past the 45-day STOCK Act deadline.
          </Text>
        )}
      </View>
    </View>
  );
}
