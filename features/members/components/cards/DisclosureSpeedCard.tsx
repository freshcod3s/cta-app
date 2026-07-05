// Disclosure Speed card (web parity: cg-discspeed). How promptly the member
// files: median / fastest / slowest gap (days) between trade and disclosure.
// Requires >= 5 dated filings, else self-hides (web parity).
import { Text, View } from "react-native";

import type { TradeRecord } from "@/features/trades/api/types";
import { ProfileCard } from "@/features/members/components/ProfileCard";
import { disclosureSpeed } from "@/features/members/profileDerive";
import { ctaColors } from "@/lib/theme/tokens";

function StatRow({
  label,
  days,
  color,
}: {
  label: string;
  days: number;
  color: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm text-gray-700 dark:text-gray-300">{label}</Text>
      <Text className="text-base font-bold" style={{ color }}>
        {days}d
      </Text>
    </View>
  );
}

export function DisclosureSpeedCard({
  trades,
}: {
  trades?: TradeRecord[] | null;
}) {
  const speed = trades ? disclosureSpeed(trades) : null;
  if (!speed) return null;

  return (
    <ProfileCard title="Disclosure Speed" infoSlug="profile-discspeed">
      <StatRow label="Median" days={speed.median} color={ctaColors.accent} />
      <StatRow label="Fastest" days={speed.fastest} color={ctaColors.buy} />
      <StatRow label="Slowest" days={speed.slowest} color={ctaColors.sell} />
      <Text className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
        Across {speed.count.toLocaleString()} dated filings · STOCK Act deadline
        is 45 days
      </Text>
    </ProfileCard>
  );
}
