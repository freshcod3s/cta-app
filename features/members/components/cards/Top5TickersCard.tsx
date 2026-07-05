// Top 5 Tickers card (web parity: cg-top5). The member's five most-traded
// tickers in the trailing 12 months, by transaction count. Each row is a
// tappable indexed variable that deep-links to the ticker screen
// (/ticker/[symbol]) -- Product Invariant #9's "variables chain deeper".
//
// The row Pressables nest inside ProfileCard's own Pressable; the inner one
// takes press precedence, so tapping a ticker navigates while tapping the
// card elsewhere opens the InfoSheet explainer (web click-target parity).
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import type { TradeRecord } from "@/features/trades/api/types";
import { ProfileCard } from "@/features/members/components/ProfileCard";
import { topTickers, type TopTicker } from "@/features/members/profileDerive";
import { ctaColors } from "@/lib/theme/tokens";
import { formatShortDate } from "@/lib/util/display";

function TickerRow({ row }: { row: TopTicker }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.ticker}, ${row.count} trades. Open ticker.`}
      onPress={() => router.push(`/ticker/${encodeURIComponent(row.ticker)}`)}
      android_ripple={{ color: "rgba(99,102,241,0.12)" }}
      className="flex-row items-center justify-between py-2"
    >
      <Text className="text-sm font-bold text-cta-accent">${row.ticker}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {row.count}×{row.lastDate ? ` · ${formatShortDate(row.lastDate)}` : ""}
        </Text>
        <ChevronRight size={15} color={ctaColors.accent} />
      </View>
    </Pressable>
  );
}

export function Top5TickersCard({
  trades,
}: {
  trades?: TradeRecord[] | null;
}) {
  if (!trades || trades.length === 0) return null;
  const rows = topTickers(trades);
  if (rows.length === 0) return null;

  return (
    <ProfileCard title="Top 5 Tickers" infoSlug="profile-top5">
      {rows.map((row, i) => (
        <View
          key={row.ticker}
          className={
            i > 0 ? "border-t border-gray-100 dark:border-gray-800" : ""
          }
        >
          <TickerRow row={row} />
        </View>
      ))}
      <Text className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
        Last 12 months · by trade count
      </Text>
    </ProfileCard>
  );
}
