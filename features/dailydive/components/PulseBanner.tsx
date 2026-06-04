// PulseBanner -- the 7-day "pulse" header for the Daily Dive: disclosure
// count (with week-over-week delta), active members, buy/sell split, and
// disclosed dollar volume. Framing is volume-of-disclosures, not signal.
import { Text, View } from "react-native";

import type { DailyDivePulse } from "@/features/dailydive/api/types";

function fmtVolume(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View className="min-w-[44%] flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
      {sub ? (
        <Text className="mt-0.5 text-[10px] text-gray-400">{sub}</Text>
      ) : null}
    </View>
  );
}

export function PulseBanner({ pulse }: { pulse: DailyDivePulse }) {
  const delta = pulse.trades_7d - pulse.trades_prior_7d;
  const deltaTxt =
    delta >= 0 ? `+${delta} vs prior week` : `${delta} vs prior week`;
  return (
    <View className="px-4 pt-4">
      <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Last 7 days
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        <Stat
          label="Disclosures"
          value={String(pulse.trades_7d)}
          sub={deltaTxt}
        />
        <Stat label="Active members" value={String(pulse.active_politicians)} />
        <Stat label="Buys / Sells" value={`${pulse.buys} / ${pulse.sells}`} />
        <Stat label="Disclosed volume" value={fmtVolume(pulse.volume)} />
      </View>
    </View>
  );
}
