// Sector Breakdown card (web parity: cg-sectors). Top 3 sectors by trade
// count, each a labeled percentage bar. Reads profile.trades[].sector
// (worker-populated, with a ticker->sector fallback); rows with no
// resolvable sector are excluded from the denominator.
//
// Scope-honest (web parity): profile.trades is the 500-cap one-shot array,
// so the caption reports "N of M loaded" rather than implying all-time.
//
// Returns null when there are no resolvable sectors (self-hides instead of
// an inert empty box).
import { Text, View } from "react-native";

import type { TradeRecord } from "@/features/trades/api/types";
import { ProfileCard } from "@/features/members/components/ProfileCard";
import { ctaColors } from "@/lib/theme/tokens";

type SectorRow = { sector: string; count: number; pct: number };

function topSectors(trades: TradeRecord[]): {
  rows: SectorRow[];
  resolved: number;
  loaded: number;
} {
  const counts = new Map<string, number>();
  let resolved = 0;
  for (const t of trades) {
    const s = (t.sector ?? "").trim();
    if (!s) continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
    resolved += 1;
  }
  const rows = Array.from(counts.entries())
    .map(([sector, count]) => ({
      sector,
      count,
      pct: resolved > 0 ? Math.round((count / resolved) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  return { rows, resolved, loaded: trades.length };
}

function Bar({ row }: { row: SectorRow }) {
  return (
    <View className="mb-2.5">
      <View className="mb-1 flex-row items-center justify-between">
        <Text
          className="flex-1 pr-3 text-sm text-gray-700 dark:text-gray-300"
          numberOfLines={1}
        >
          {row.sector}
        </Text>
        <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {row.pct}%
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <View
          className="h-2 rounded-full"
          style={{
            width: `${Math.max(3, row.pct)}%`,
            backgroundColor: ctaColors.accent,
          }}
        />
      </View>
    </View>
  );
}

export function SectorBreakdownCard({
  trades,
}: {
  trades?: TradeRecord[] | null;
}) {
  if (!trades || trades.length === 0) return null;
  const { rows, resolved, loaded } = topSectors(trades);
  if (rows.length === 0) return null;

  return (
    <ProfileCard title="Sector Breakdown" infoSlug="profile-sectors">
      {rows.map((row) => (
        <Bar key={row.sector} row={row} />
      ))}
      <Text className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
        {resolved.toLocaleString()} of {loaded.toLocaleString()} loaded trades
        have a sector
      </Text>
    </ProfileCard>
  );
}
