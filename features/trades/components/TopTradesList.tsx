// Top Trades -- the 5 largest single disclosures by midpoint dollar value,
// cascading 7 -> 14 -> 30 days until a window has rows (web parity). Each row
// deep-links to /ticker/[symbol]; header opens the explainer sheet. The
// window that hit is labeled honestly ("last 14 days").
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Info } from "lucide-react-native";

import { useTopTrades } from "@/features/trades/api/queries";
import type { TradeRecord } from "@/features/trades/api/types";
import { useOpenInfo } from "@/features/info/store";
import { ctaColors } from "@/lib/theme/tokens";
import {
  displayName,
  formatMoneyShort,
  midEstimate,
} from "@/lib/util/display";

function Row({ trade }: { trade: TradeRecord }) {
  const router = useRouter();
  const mid = formatMoneyShort(midEstimate(trade.amount_low, trade.amount_high));
  const partyColor =
    trade.party === "D"
      ? ctaColors.dem
      : trade.party === "R"
        ? ctaColors.rep
        : "#9ca3af";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${trade.ticker ?? "trade"} by ${displayName(trade.politician)}. Open ticker.`}
      onPress={() =>
        trade.ticker
          ? router.push(`/ticker/${encodeURIComponent(trade.ticker)}`)
          : undefined
      }
      android_ripple={{ color: "rgba(99,102,241,0.08)" }}
      className="flex-row items-center px-4 py-2.5"
    >
      <View className="flex-1 pr-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-cta-accent">
            ${trade.ticker ?? "—"}
          </Text>
          {trade.party ? (
            <Text
              className="text-[11px] font-semibold"
              style={{ color: partyColor }}
            >
              {trade.party}
              {trade.chamber ? ` · ${trade.chamber}` : ""}
            </Text>
          ) : null}
        </View>
        <Text
          className="text-xs text-gray-600 dark:text-gray-300"
          numberOfLines={1}
        >
          {displayName(trade.politician)}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-xs text-gray-700 dark:text-gray-200">
          {trade.amount_range}
        </Text>
        {mid ? (
          <Text className="text-[11px] text-gray-500 dark:text-gray-400">
            mid {mid}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function TopTradesList() {
  const openInfo = useOpenInfo();
  const { data } = useTopTrades();

  if (!data || data.rows.length === 0) return null;

  return (
    <View className="mx-4 mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <Pressable
        onPress={() => openInfo("home-top-trades")}
        accessibilityRole="button"
        accessibilityLabel="Top trades. Tap for details."
        android_ripple={{ color: "rgba(99,102,241,0.08)" }}
        className="flex-row items-center gap-1.5 px-4 pb-1.5 pt-3"
      >
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Top Trades
        </Text>
        <Text className="text-[11px] text-gray-400 dark:text-gray-500">
          last {data.days}d
        </Text>
        <Info size={12} color={ctaColors.accent} />
      </Pressable>
      {data.rows.slice(0, 5).map((t, i) => (
        <View
          key={String(t.id)}
          className={i > 0 ? "border-t border-gray-100 dark:border-gray-800" : ""}
        >
          <Row trade={t} />
        </View>
      ))}
    </View>
  );
}
