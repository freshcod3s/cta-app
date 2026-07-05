// Trade Constellation (web parity: the profile constellation view). The RN
// SVG port (Phase-0 decision b): each bubble is a ticker sized by disclosed
// volume; committees the member trades into are concentric rings; a
// conflicted bubble sits on its committee ring with a colored stroke/halo
// and a faint radial spoke. Bubbles deep-link to /ticker/[symbol], rings to
// /committee/[name] -- Product Invariant #9 (tappable, chains deeper).
//
// Fill is neutral (returns are gated OFF, so no gain/loss coloring, matching
// the web's returns-off state); conflict severity is carried entirely by the
// stroke + halo. Static v1: no pan/pulse yet (layout settles once in JS).
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";

import type { MemberProfile } from "@/features/members/api/types";
import {
  computeConstellation,
  RING_COLORS,
  type CNode,
} from "@/features/members/constellation";
import { useOpenInfo } from "@/features/info/store";
import { ctaColors } from "@/lib/theme/tokens";
import { Info } from "lucide-react-native";

const HEIGHT = 320;
const DIRECT = ctaColors.sell; // red
const ADJACENT = ctaColors.late; // amber

function strokeFor(n: CNode): { color: string; width: number } | null {
  if (!n.conflict) return null;
  return n.conflict.severity === "direct"
    ? { color: DIRECT, width: 2.2 }
    : { color: ADJACENT, width: 1.6 };
}

export function ConstellationCard({ profile }: { profile: MemberProfile }) {
  const router = useRouter();
  const openInfo = useOpenInfo();
  const [width, setWidth] = useState(0);

  const data = useMemo(
    () =>
      width > 0
        ? computeConstellation(
            profile.trades ?? [],
            profile.committee_tree ?? [],
            profile.name,
            width,
            HEIGHT,
          )
        : null,
    [width, profile],
  );

  // Need trades to draw anything.
  if (!profile.trades || profile.trades.length === 0) return null;

  const cx = width / 2;
  const cy = HEIGHT / 2;

  return (
    <View className="mx-4 mb-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      {/* header: title + info affordance */}
      <Pressable
        onPress={() => openInfo("profile-constellation")}
        accessibilityRole="button"
        accessibilityLabel="Trade Constellation. Tap for details."
        android_ripple={{ color: "rgba(99,102,241,0.08)" }}
        className="flex-row items-center gap-1.5 px-4 pb-1 pt-4"
      >
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Trade Constellation
        </Text>
        <Info size={12} color={ctaColors.accent} />
      </Pressable>

      {/* canvas */}
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {data ? (
          <Svg width={width} height={HEIGHT}>
            {/* rings */}
            {data.rings.map((ring, i) => (
              <Circle
                key={`ring-${i}`}
                cx={cx}
                cy={cy}
                r={ring.radius}
                stroke={RING_COLORS[ring.colorIdx]}
                strokeOpacity={0.22}
                strokeWidth={1}
                fill="none"
                onPress={() =>
                  router.push(`/committee/${encodeURIComponent(ring.name)}`)
                }
              />
            ))}

            {/* radial spokes for conflicted bubbles */}
            {data.nodes.map((n) =>
              n.conflict ? (
                <Line
                  key={`spoke-${n.key}`}
                  x1={cx}
                  y1={cy}
                  x2={n.x}
                  y2={n.y}
                  stroke={n.conflict.severity === "direct" ? DIRECT : ADJACENT}
                  strokeOpacity={0.18}
                  strokeWidth={1}
                />
              ) : null,
            )}

            {/* bubbles -- onPress on the G so taps on the halo, circle, OR
                the label all navigate (react-native-svg hit-tests top-down,
                and a bare SvgText on top would otherwise swallow the tap). */}
            {data.nodes.map((n) => {
              const s = strokeFor(n);
              const tk = n.ticker;
              return (
                <G
                  key={`node-${n.key}`}
                  onPress={
                    tk
                      ? () => router.push(`/ticker/${encodeURIComponent(tk)}`)
                      : undefined
                  }
                >
                  {s ? (
                    <Circle
                      cx={n.x}
                      cy={n.y}
                      r={n.r + (n.conflict?.severity === "direct" ? 7 : 5)}
                      fill={s.color}
                      fillOpacity={0.14}
                    />
                  ) : null}
                  <Circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r}
                    fill="#334155"
                    fillOpacity={0.92}
                    stroke={s?.color}
                    strokeWidth={s?.width ?? 0}
                  />
                  {n.r >= 11 ? (
                    <SvgText
                      x={n.x}
                      y={n.y + 3}
                      fontSize={Math.min(n.r * 0.72, 12)}
                      fontWeight="bold"
                      fill="#f8fafc"
                      textAnchor="middle"
                    >
                      {n.label}
                    </SvgText>
                  ) : null}
                </G>
              );
            })}

            {/* center member node */}
            <Circle cx={cx} cy={cy} r={data.center.r} fill={ctaColors.accent} />
            <SvgText
              x={cx}
              y={cy + 4}
              fontSize={12}
              fontWeight="bold"
              fill="#ffffff"
              textAnchor="middle"
            >
              {data.center.label}
            </SvgText>
          </Svg>
        ) : (
          <View style={{ height: HEIGHT }} />
        )}
      </View>

      {/* ring legend (tappable committees) */}
      {data && data.rings.length > 0 ? (
        <View className="flex-row flex-wrap gap-x-3 gap-y-1 px-4 pt-1">
          {data.rings.map((ring, i) => (
            <Pressable
              key={`legend-${i}`}
              onPress={() =>
                router.push(`/committee/${encodeURIComponent(ring.name)}`)
              }
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 py-0.5"
            >
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: RING_COLORS[ring.colorIdx] }}
              />
              <Text
                className="text-[11px] text-gray-600 dark:text-gray-300"
                numberOfLines={1}
              >
                {ring.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* severity + size legend */}
      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-3 pt-1.5">
        <View className="flex-row items-center gap-1.5">
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: DIRECT }}
          />
          <Text className="text-[11px] text-gray-500 dark:text-gray-400">
            Direct
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: ADJACENT }}
          />
          <Text className="text-[11px] text-gray-500 dark:text-gray-400">
            Adjacent
          </Text>
        </View>
        <Text className="text-[11px] text-gray-500 dark:text-gray-400">
          Size = trade value
        </Text>
        {data && data.moreCount > 0 ? (
          <Text className="text-[11px] text-gray-500 dark:text-gray-500">
            +{data.moreCount} more
          </Text>
        ) : null}
      </View>
    </View>
  );
}
