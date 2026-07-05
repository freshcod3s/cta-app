// Conflict Scorecard card (web parity: cg-scorecard). An SVG donut gauge
// of the member's conflicted-portfolio share -- the % of disclosed trading
// dollars (measured at range-HIGH) that falls in industries their
// committees oversee -- plus Direct / Adjacent legend rows.
//
// Framing (LOCKED, civic transparency): a committee-jurisdiction overlap
// is an oversight-transparency flag, NOT a claim of wrongdoing and NOT a
// trading signal.
//
// Color ramp (web parity): green < 15%, amber < 40%, red >= 40%. A clean
// record (0 direct + 0 adjacent) renders a green 0% gauge.
//
// Returns null when the worker omitted the scorecard (name-only fallback
// profile) so the card self-hides instead of rendering an inert box.
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import type { ConflictScorecard } from "@/features/conflict/api/types";
import { ProfileCard } from "@/features/members/components/ProfileCard";
import { ctaColors } from "@/lib/theme/tokens";
import { formatMoneyShort } from "@/lib/util/display";

function gaugeColor(pct: number): string {
  if (pct >= 40) return ctaColors.sell; // red
  if (pct >= 15) return ctaColors.late; // amber
  return ctaColors.buy; // green
}

const SIZE = 128;
const STROKE = 13;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

function Donut({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const arc = (clamped / 100) * C;
  const cx = SIZE / 2;
  return (
    <Svg width={SIZE} height={SIZE}>
      {/* track */}
      <Circle
        cx={cx}
        cy={cx}
        r={R}
        stroke={ctaColors.darkBorder}
        strokeWidth={STROKE}
        fill="none"
      />
      {/* value arc, starting at 12 o'clock */}
      <Circle
        cx={cx}
        cy={cx}
        r={R}
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${arc} ${C - arc}`}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
    </Svg>
  );
}

function LegendRow({
  label,
  count,
  dollars,
  dotColor,
}: {
  label: string;
  count: number;
  dollars: number;
  dotColor: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <View className="flex-row items-center gap-2">
        <View
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        <Text className="text-sm text-gray-700 dark:text-gray-300">{label}</Text>
      </View>
      <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {count.toLocaleString()}
        {dollars > 0 ? ` · ${formatMoneyShort(dollars)}` : ""}
      </Text>
    </View>
  );
}

export function ConflictScorecardCard({
  scorecard,
}: {
  scorecard?: ConflictScorecard | null;
}) {
  if (!scorecard) return null;

  const direct = scorecard.directConflictCount ?? 0;
  const adjacent = scorecard.adjacentConflictCount ?? 0;
  const pctRaw = scorecard.conflictedPortfolioPct ?? 0;
  const pct = Math.round(pctRaw); // gauge arc + color threshold
  const clean = direct === 0 && adjacent === 0;
  const color = clean ? ctaColors.buy : gaugeColor(pct);
  // Carry one decimal in the label when the payload provides it (35.6%),
  // but drop a trailing .0 (36%).
  const pctLabel = clean ? "0%" : `${(Math.round(pctRaw * 10) / 10).toString()}%`;

  return (
    <ProfileCard title="Conflict Scorecard" infoSlug="profile-scorecard">
      <View className="flex-row items-center gap-4">
        <View className="items-center justify-center">
          <View>
            <Donut pct={clean ? 0 : pct} color={color} />
          </View>
          <View className="absolute items-center">
            <Text
              className="text-2xl font-extrabold"
              style={{ color }}
            >
              {pctLabel}
            </Text>
            <Text className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              conflicted
            </Text>
          </View>
        </View>

        <View className="flex-1">
          {clean ? (
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              Clean record — no committee-jurisdiction overlap detected.
            </Text>
          ) : (
            <>
              <LegendRow
                label="Direct"
                count={direct}
                dollars={scorecard.directConflictDollars ?? 0}
                dotColor={ctaColors.sell}
              />
              <LegendRow
                label="Adjacent"
                count={adjacent}
                dollars={scorecard.adjacentConflictDollars ?? 0}
                dotColor={ctaColors.late}
              />
            </>
          )}
        </View>
      </View>
    </ProfileCard>
  );
}
