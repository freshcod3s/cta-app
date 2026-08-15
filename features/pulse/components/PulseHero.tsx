// PulseHero -- feed headline strip surfacing the Congress-vs-S&P benchmark
// (the site's homepage hook) as a tap-through to the full Leaderboard.
//
// Civic-transparency framing: this is a public-accountability metric --
// "does Congress aggregate beat the broad market on disclosed trades?" --
// NOT a trading signal. The visible copy carries no "alpha" / "signal" /
// buy / sell language; only a neutral label and the +/- delta.
//
// The +/- sign tint reuses the shared cta-buy (up = green) / cta-sell
// (down = red) color tokens PURELY to indicate the direction of the delta
// (same treatment as BenchmarkCard). It is not a buy/sell prompt -- there
// is no copy-trade affordance anywhere in this surface.
//
// Data: reuses useStats() (GET /api/stats) -- the SAME hook + React Query
// cache entry StatsBanner already populates on the feed, so this adds zero
// network. The 30d delta = congress_alpha.avg_stock - avg_spx, computed
// inline. Own loading/error branch so a slow or failed /api/stats never
// blocks the feed; on error it renders a reserved strip showing "--".
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { useStats } from "@/features/trades/api/queries";

function fmtDelta(v: number | null): string {
  if (v == null) return "--";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

export function PulseHero() {
  const stats = useStats();

  // 30d Congress-vs-S&P delta: avg_stock - avg_spx (same derivation the
  // StatsBanner used before this metric moved here). null when either side
  // is missing or the call failed -> renders as "--".
  let delta: number | null = null;
  const a = stats.data?.data.congress_alpha;
  if (typeof a?.avg_stock === "number" && typeof a?.avg_spx === "number") {
    delta = a.avg_stock - a.avg_spx;
  }

  // Direction tint only (shared color tokens); empty string = neutral.
  const tint =
    delta == null
      ? ""
      : delta > 0
        ? "text-cta-buy"
        : delta < 0
          ? "text-cta-sell"
          : "";

  if (stats.isLoading) {
    return (
      <View className="px-4 pt-4">
        <View className="h-16 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </View>
    );
  }

  return (
    <View className="px-4 pt-4">
      <Link href="/leaderboard" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Congress versus S and P 500, 30 day transparency benchmark. Opens the leaderboard."
          className="h-16 flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <View className="flex-1 pr-3">
            <Text
              className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              numberOfLines={1}
            >
              Congress vs S&amp;P 500 (30d)
            </Text>
            <Text
              className="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
              numberOfLines={1}
            >
              Transparency benchmark
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text
              className={`text-3xl font-bold ${tint || "text-gray-900 dark:text-gray-100"}`}
              numberOfLines={1}
            >
              {fmtDelta(delta)}
            </Text>
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </Pressable>
      </Link>
    </View>
  );
}
