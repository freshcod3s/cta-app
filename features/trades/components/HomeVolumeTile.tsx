// $X in disclosed trade value -- the home "All Tracked Trades" band tile
// (web parity: the hd-volume / $3.9B tile). Filings disclose ranges, so the
// headline is the high-end total with a Low/Mid/High uncertainty band, then
// a Bought/Sold/Exchanged/Other split of the high-end dollars. Tapping the
// header opens the home-volume InfoSheet (Product Invariant #9 -- not inert).
import { Pressable, Text, View } from "react-native";
import { Info } from "lucide-react-native";

import { useStats } from "@/features/trades/api/queries";
import { useOpenInfo } from "@/features/info/store";
import { ctaColors } from "@/lib/theme/tokens";
import { formatMoneyShort } from "@/lib/util/display";

function BandCol({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </Text>
      <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {formatMoneyShort(value)}
      </Text>
    </View>
  );
}

function SplitRow({
  label,
  dollars,
  count,
  dot,
}: {
  label: string;
  dollars: number;
  count?: number;
  dot?: string;
}) {
  return (
    <View className="flex-row items-center py-1">
      <View className="flex-row items-center gap-1.5">
        {dot ? (
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: dot }}
          />
        ) : (
          <View className="h-2 w-2" />
        )}
        <Text className="text-sm text-gray-700 dark:text-gray-300">{label}</Text>
      </View>
      <View className="flex-1" />
      <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {formatMoneyShort(dollars)}
      </Text>
      {count != null ? (
        <Text className="ml-2 w-16 text-right text-[11px] text-gray-500 dark:text-gray-400">
          {count.toLocaleString()}
        </Text>
      ) : null}
    </View>
  );
}

export function HomeVolumeTile() {
  const stats = useStats();
  const openInfo = useOpenInfo();
  const b = stats.data?.data.trade_breakdown;

  const high = b?.total_volume;
  if (!b || high == null || high <= 0) return null;

  const low = b.total_volume_low ?? 0;
  const mid = (low + high) / 2;
  const bought = b.buy_volume_high ?? 0;
  const sold = b.sale_volume_high ?? 0;
  const exchanged = b.exchange_volume_high ?? 0;
  const other = Math.max(0, high - bought - sold - exchanged);

  return (
    <View className="mx-4 mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <Pressable
        onPress={() => openInfo("home-volume")}
        accessibilityRole="button"
        accessibilityLabel="All tracked trades. Tap for details."
        android_ripple={{ color: "rgba(99,102,241,0.08)" }}
        className="px-4 pb-2 pt-4"
      >
        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            All Tracked Trades
          </Text>
          <Info size={12} color={ctaColors.accent} />
        </View>
        <Text className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {formatMoneyShort(high)}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          in disclosed trade value
        </Text>
      </Pressable>

      {/* Low / Mid / High uncertainty band */}
      <View className="mx-4 flex-row rounded-lg border border-gray-200 bg-white py-2 dark:border-gray-700 dark:bg-gray-900">
        <BandCol label="Low" value={low} />
        <BandCol label="Mid" value={mid} />
        <BandCol label="High" value={high} />
      </View>

      {/* Bought / Sold / Exchanged / Other split */}
      <View className="px-4 pb-3 pt-2">
        <SplitRow
          label="Bought"
          dollars={bought}
          count={b.buy_count}
          dot={ctaColors.buy}
        />
        <SplitRow
          label="Sold"
          dollars={sold}
          count={b.sale_count}
          dot={ctaColors.sell}
        />
        <SplitRow
          label="Exchanged"
          dollars={exchanged}
          count={b.exchange_count}
          dot={ctaColors.late}
        />
        <SplitRow label="Other" dollars={other} />
      </View>
    </View>
  );
}
