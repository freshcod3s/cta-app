// Member profile stats row -- web-parity tiles (TRADES / EST. VOLUME /
// CONFLICTS / MEDIAN DELAY) from fields the profile endpoint already
// returns: stats.total_trades, stats.volume_high, scorecard counts, and
// disclosureLag.median.
//
// Framing (locked, civic transparency): "conflicts" = committee-
// jurisdiction overlap counts from the worker scorecard -- an oversight-
// overlap signal, NOT a claim of wrongdoing and NOT a trading signal.
//
// Color rules (web parity): conflicts render red when > 0; median delay
// renders green within the 45-day STOCK Act window, amber past it.
// Brand colors via inline style (the NativeWind non-palette dodge used
// by ConflictScore/ConflictChips).
import { Text, View } from "react-native";

import type { MemberProfile } from "@/features/members/api/types";
import { ctaColors } from "@/lib/theme/tokens";
import { formatMoneyShort } from "@/lib/util/display";

type CellProps = {
  label: string;
  value: string;
  valueColor?: string;
  a11y?: string;
};

function Cell({ label, value, valueColor, a11y }: CellProps) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={a11y ?? `${label}: ${value}`}
      className="min-h-[64px] flex-1 justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
    >
      <Text
        className="text-lg font-bold text-gray-900 dark:text-gray-100"
        style={valueColor ? { color: valueColor } : undefined}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        className="mt-0.5 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400"
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export function MemberStatsRow({ profile }: { profile: MemberProfile }) {
  const stats = profile.stats ?? null;
  const scorecard = profile.scorecard ?? null;
  const lag = profile.disclosureLag ?? null;

  // Nothing computable (name-only fallback profile) -> render nothing.
  if (!stats && !scorecard && !lag) return null;

  const trades = stats ? stats.total_trades.toLocaleString() : "-";
  const volume = formatMoneyShort(stats?.volume_high) ?? "-";
  const conflictCount = scorecard
    ? scorecard.directConflictCount + scorecard.adjacentConflictCount
    : null;
  const delay = lag ? `${Math.round(lag.median)}d` : "-";

  return (
    <View className="px-4 pb-3">
      <View className="flex-row gap-2">
        <Cell label="Trades" value={trades} />
        <Cell label="Est. volume" value={volume} />
        <Cell
          label="Conflicts"
          value={conflictCount != null ? conflictCount.toLocaleString() : "-"}
          valueColor={
            conflictCount != null && conflictCount > 0
              ? ctaColors.sell
              : undefined
          }
          a11y={
            conflictCount != null
              ? `Conflicts: ${conflictCount} committee-jurisdiction overlaps`
              : "Conflicts: unavailable"
          }
        />
        <Cell
          label="Median delay"
          value={delay}
          valueColor={
            lag ? (lag.median > 45 ? ctaColors.late : ctaColors.buy) : undefined
          }
          a11y={
            lag
              ? `Median filing delay: ${Math.round(lag.median)} days`
              : "Median filing delay: unavailable"
          }
        />
      </View>
    </View>
  );
}
