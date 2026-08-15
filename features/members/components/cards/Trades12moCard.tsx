// Trades - Last 12 Months card (web parity: cg-trades-12mo). Total disclosed
// transactions in the trailing 365 days, split into buys vs sells, with an
// estimated volume (midpoint) footer. Self-hides when there are none.
import { Text, View } from "react-native";

import type { TradeRecord } from "@/features/trades/api/types";
import { ProfileCard } from "@/features/members/components/ProfileCard";
import { trades12mo } from "@/features/members/profileDerive";
import { ctaColors } from "@/lib/theme/tokens";
import { formatMoneyShort } from "@/lib/util/display";

function SplitRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <View className="flex-row items-center gap-2">
        <View
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <Text className="text-sm text-gray-700 dark:text-gray-300">{label}</Text>
      </View>
      <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {count.toLocaleString()}
      </Text>
    </View>
  );
}

export function Trades12moCard({
  trades,
}: {
  trades?: TradeRecord[] | null;
}) {
  if (!trades || trades.length === 0) return null;
  const t = trades12mo(trades);
  if (t.total === 0) return null;

  const estVol = formatMoneyShort(t.estVolume);

  return (
    <ProfileCard
      title="Trades · Last 12 Months"
      infoSlug="profile-trades-12mo"
      accessory={
        <Text className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
          {t.total.toLocaleString()}
        </Text>
      }
    >
      <SplitRow label="Buys" count={t.buys} color={ctaColors.buy} />
      <SplitRow label="Sells" count={t.sells} color={ctaColors.sell} />
      {estVol ? (
        <Text className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
          Est. volume {estVol} (midpoint of disclosed ranges)
        </Text>
      ) : null}
    </ProfileCard>
  );
}
