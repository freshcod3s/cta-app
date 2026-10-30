// Timeline: trade date, disclosure date, lag in days, late-filing pill.
// Our over-45-day recorded-lag indicator sets the cta-late tint
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
  // Two ways a lag is not a fact, both rendered as an em dash, matching
  // ConstellationDrillSheet's treatment of the same trade:
  //   corrupt -> the ingest flagged date_quality='corrupt', so the lag is a
  //              five-digit day count from a mis-parsed filing date. The
  //              methodology copy says these rows are excluded; showing
  //              "18,234 days" here contradicted that in the one place a
  //              reader goes to check a specific filing.
  //   null    -> nullable in the D1 schema and guarded by the worker's own
  //              queries, though prod carries none today.
  // The LATE pill is suppressed in both cases: a lag we cannot state is not
  // a lag we can call late.
  const lagDays = trade.disclosure_lag_days;
  const lagUnknown = trade.date_quality === "corrupt" || lagDays == null;
  const late = !lagUnknown && isLateFiling(lagDays);

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
              {lagUnknown ? "—" : `${lagDays} day${lagDays === 1 ? "" : "s"}`}
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
            Recorded disclosure gap exceeds 45 days. This is our indicator,
            not an official violation finding.
          </Text>
        )}
      </View>
    </View>
  );
}
