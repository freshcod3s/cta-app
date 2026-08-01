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
import Svg, { Circle, Line, Rect, Text as SvgText, G } from "react-native-svg";

import type { MemberProfile } from "@/features/members/api/types";
import {
  computeConstellation,
  RING_COLORS,
  type CNode,
} from "@/features/members/constellation";
import {
  ConstellationDrillSheet,
  type DrillEntry,
} from "@/features/members/components/cards/ConstellationDrillSheet";
import { useOpenInfo } from "@/features/info/store";
import { ctaColors } from "@/lib/theme/tokens";
import { Info } from "lucide-react-native";

// Canvas height derives from the measured width (web parity: _sizeCanvas
// narrow branch, H = clamp(360..520, W * 1.1)) so the disc radius scales
// with the device instead of freezing at the old fixed-320 floor.
const heightFor = (w: number) =>
  Math.max(360, Math.min(520, Math.round(w * 1.1)));
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
  const height = heightFor(width || 360);

  // In-place drill-down stack (web parity: pd-trade-panel). A node/ring tap
  // pushes a card onto this stack instead of navigating away.
  const [stack, setStack] = useState<DrillEntry[]>([]);
  const pushEntry = (e: DrillEntry) => setStack((s) => [...s, e]);
  const popEntry = () => setStack((s) => s.slice(0, -1));
  const closeSheet = () => setStack([]);

  // Tap-isolate (RN equivalent of the web's hover isolate :8122): selecting
  // a node dims everything not connected to it (its committee ring stays);
  // selecting a ring dims all other rings + off-ring nodes. Tap-out (the
  // canvas background) clears.
  const [isolate, setIsolate] = useState<{
    nodeKey: string | null;
    ringIdx: number | null;
  } | null>(null);

  const nodeDimmed = (n: CNode) =>
    isolate != null &&
    n.key !== isolate.nodeKey &&
    !(isolate.ringIdx != null && n.ringIdx === isolate.ringIdx);
  const ringDimmed = (i: number) =>
    isolate != null && isolate.ringIdx !== i;

  const openNode = (n: CNode) => {
    setIsolate({ nodeKey: n.key, ringIdx: n.ringIdx >= 0 ? n.ringIdx : null });
    pushEntry({
      kind: "ticker",
      symbol: n.ticker,
      label: n.label,
      memberName: profile.name,
      memberTrades: (profile.trades ?? []).filter((t) => {
        const k = (t.ticker ?? "").trim() || (t.asset_name ?? "").trim();
        return k === n.key;
      }),
      conflict: n.conflict,
      sector: n.sector,
    });
  };

  const data = useMemo(
    () =>
      width > 0
        ? computeConstellation(
            profile.trades ?? [],
            profile.committee_tree ?? [],
            profile.name,
            width,
            height,
          )
        : null,
    [width, height, profile],
  );

  // Need trades to draw anything.
  if (!profile.trades || profile.trades.length === 0) return null;

  const cx = width / 2;
  const cy = height / 2;

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
          <Svg width={width} height={height}>
            {/* tap-out target: a background tap clears the isolate */}
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="#000000"
              fillOpacity={0.01}
              onPress={() => setIsolate(null)}
            />

            {/* rings -- tap opens the committee card IN PLACE (web parity:
                highlightRing -> showCommitteeDetail) and isolates the ring.
                "Other" is an overflow bucket, not a committee -- no card. */}
            {data.rings.map((ring, i) => (
              <Circle
                key={`ring-${i}`}
                cx={cx}
                cy={cy}
                r={ring.radius}
                stroke={RING_COLORS[ring.colorIdx]}
                strokeOpacity={ringDimmed(i) ? 0.08 : 0.22}
                strokeWidth={1}
                fill="none"
                onPress={
                  ring.isOther
                    ? undefined
                    : () => {
                        setIsolate({ nodeKey: null, ringIdx: i });
                        pushEntry({ kind: "committee", name: ring.name });
                      }
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
                  strokeOpacity={nodeDimmed(n) ? 0.04 : 0.18}
                  strokeWidth={1}
                />
              ) : null,
            )}

            {/* bubbles -- onPress on the G so taps on the halo, circle, OR
                the label all open the in-place detail card (react-native-svg
                hit-tests top-down, and a bare SvgText on top would otherwise
                swallow the tap). Fund nodes (no ticker) open a card too --
                the card handles the no-full-page case. */}
            {data.nodes.map((n) => {
              const s = strokeFor(n);
              return (
                <G
                  key={`node-${n.key}`}
                  opacity={nodeDimmed(n) ? 0.15 : 1}
                  onPress={() => openNode(n)}
                >
                  {/* invisible hit target: keep tap area >= 24px diameter
                      even for tiny bubbles (r can be as low as 6px). */}
                  <Circle
                    cx={n.x}
                    cy={n.y}
                    r={Math.max(n.r, 12)}
                    fill="#334155"
                    fillOpacity={0.01}
                  />
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
                  {n.labeled ? (
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
          <View style={{ height }} />
        )}
      </View>

      {/* ring legend (tappable committees) */}
      {data && data.rings.length > 0 ? (
        <View className="flex-row flex-wrap gap-x-3 gap-y-1 px-4 pt-1">
          {data.rings.map((ring, i) => (
            <Pressable
              key={`legend-${i}`}
              disabled={!!ring.isOther}
              onPress={
                ring.isOther
                  ? undefined
                  : () =>
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

      {/* in-place drill-down card stack (node/ring taps push onto it) */}
      <ConstellationDrillSheet
        stack={stack}
        onPush={pushEntry}
        onPop={popEntry}
        onClose={closeSheet}
      />
    </View>
  );
}
