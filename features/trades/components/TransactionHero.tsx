// TransactionHero -- the visually-locked component that proves the
// brand-color tokens propagate. BUY/SELL pill uses cta-buy / cta-sell;
// any non-"Purchase" tx_type is rendered as SELL.
//
// Layout:
//   [PILL]
//   TICKER (very large)
//   asset name (muted)
//   ┌──────────────────────────┐
//   │ amount range card        │
//   │  $1,001 - $15,000        │
//   │  trade price • current   │
//   └──────────────────────────┘
import { Text, View } from "react-native";
import { isBuy, type TradeRecord } from "@/features/trades/api/types";
import { RETURNS_DISPLAY } from "@/lib/flags";

type Props = { trade: TradeRecord };

function fmtPrice(p: number | null) {
  if (p == null) return "-";
  return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtPct(p: number | null) {
  if (p == null) return "-";
  const sign = p >= 0 ? "+" : "";
  return `${sign}${p.toFixed(2)}%`;
}

export function TransactionHero({ trade }: Props) {
  const buy = isBuy(trade.tx_type);
  const pillBg = buy ? "bg-cta-buy" : "bg-cta-sell";
  const pillLabel = buy ? "BUY" : "SELL";

  return (
    <View className="px-4 pt-2 pb-4">
      <View className={`self-start rounded-full px-3 py-1 ${pillBg}`}>
        <Text className="text-xs font-bold tracking-wider text-white">
          {pillLabel}
        </Text>
      </View>

      <Text className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
        {trade.ticker || "(unlisted)"}
      </Text>
      <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {trade.asset_name}
        {trade.sector ? ` - ${trade.sector}` : ""}
      </Text>

      <View className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <Text className="text-xs uppercase text-gray-500 dark:text-gray-400">
          Amount range
        </Text>
        <Text className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {trade.amount_range}
        </Text>

        {RETURNS_DISPLAY && (trade.trade_price != null || trade.current_price != null) && (
          <View className="mt-3 flex-row gap-6">
            <View>
              <Text className="text-xs uppercase text-gray-500 dark:text-gray-400">
                At trade
              </Text>
              <Text className="mt-1 text-base text-gray-900 dark:text-gray-100">
                {fmtPrice(trade.trade_price)}
              </Text>
            </View>
            <View>
              <Text className="text-xs uppercase text-gray-500 dark:text-gray-400">
                Current
              </Text>
              <Text className="mt-1 text-base text-gray-900 dark:text-gray-100">
                {fmtPrice(trade.current_price)}
              </Text>
            </View>
            {trade.price_change_pct != null && (
              <View>
                <Text className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Change
                </Text>
                <Text
                  className={`mt-1 text-base font-semibold ${
                    trade.price_change_pct >= 0
                      ? "text-cta-buy"
                      : "text-cta-sell"
                  }`}
                >
                  {fmtPct(trade.price_change_pct)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
