// Trade Constellation (web parity: the profile constellation view). The RN
// SVG port (Phase-0 decision b): each bubble is a ticker sized by disclosed
// volume; committees the member trades into are concentric rings; a
// conflicted bubble sits on its committee ring with a colored stroke/halo
// and a faint radial spoke. Bubbles deep-link to /ticker/[symbol], rings to
// /committee/[name] -- Product Invariant #9 (tappable, chains deeper).
//
// Fill is neutral (returns are gated OFF, so no gain/loss coloring, matching
// the web's returns-off state); conflict severity is carried entirely by the
// stroke + halo. Layout settles once in JS; pan/pinch is a reanimated
// transform; a deterministic starfield (generateStars) sits behind the disc
// with a small UI-thread twinkle subset (web parity: the canvas star loop).
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { MemberProfile } from "@/features/members/api/types";
import {
  computeConstellation,
  generateStars,
  RING_COLORS,
  tradesForKey,
  type CNode,
  type Star,
} from "@/features/members/constellation";
import {
  ConstellationDrillSheet,
  entryKey,
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

// Pinch-zoom bounds + the settle spring. The spring approximates the web
// canvas pan's stiffness 0.18 / damping 0.78 per-frame feel (dashboard.html
// _animatePanSpring) in reanimated's physical units -- tuned by hand, not a
// unit conversion.
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const SETTLE_SPRING = { damping: 18, stiffness: 160, mass: 1 };

// Label caps per zoom bucket: more labels as you zoom in (bucket 0 = 1x,
// 1 = past ~1.45x, 2 = past ~2.2x -> label everything visible).
const LABEL_CAPS = [10, 20, 99];

function strokeFor(n: CNode): { color: string; width: number } | null {
  if (!n.conflict) return null;
  return n.conflict.severity === "direct"
    ? { color: DIRECT, width: 2.2 }
    : { color: ADJACENT, width: 1.6 };
}

// Label fit (V6 clip fix). react-native-svg has no measureText, so width is
// approximated at ~0.62em average advance for the bold face. Long labels
// ellipsize to the bubble's neighborhood instead of spilling across the
// disc, and the anchor point clamps inside the canvas so an edge bubble
// can't ship half a label ("abet Inc") under the card's overflow-hidden.
const LABEL_CHAR_W = 0.62;
function fitLabel(
  n: CNode,
  width: number,
  height: number,
): { text: string; fs: number; x: number; y: number } {
  const fs = Math.max(8, Math.min(n.r * 0.72, 12));
  const maxW = Math.max(2 * n.r + 26, 64);
  let text = n.label;
  if (text.length * fs * LABEL_CHAR_W > maxW) {
    const keep = Math.max(3, Math.floor(maxW / (fs * LABEL_CHAR_W)) - 1);
    text = `${text.slice(0, keep).trimEnd()}…`;
  }
  const half = (text.length * fs * LABEL_CHAR_W) / 2 + 2;
  return {
    text,
    fs,
    x: Math.min(Math.max(n.x, half), width - half),
    y: Math.min(Math.max(n.y + 3, fs + 2), height - 3),
  };
}

// --- starfield -------------------------------------------------------------
// V6: the stars render in their OWN layer behind the disc's pan/zoom view
// and track the same shared values at STAR_PARALLAX (slow-sky depth cue;
// supersedes the old stars-inside-the-transform no-parallax port). Color is
// slate-500: darker than the light card (gray-50), lighter than the dark
// card (gray-800), so one hex reads as a faint speck on both backgrounds
// without a color-scheme branch.
const STAR_COLOR = "#64748b";
// How much of the disc's pan/zoom the star layer follows (1 = locked to the
// disc, 0 = fixed). 0.35 reads as a slow, distant sky.
const STAR_PARALLAX = 0.35;
// A background tap within this many px of a ring line opens that ring's
// card; rings sit ~17px apart at the 5-ring cap, so 12 keeps bands from
// bleeding into each other (nearest ring wins on overlap).
const RING_TAP_TOL = 12;
// The star canvas is oversized by this factor so parallax never exposes a
// bare edge inside the card.
const STAR_OVERSCAN = 1.4;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// One pulsing star. Opacity oscillates trough <-> peak entirely on the UI
// thread via animatedProps (no React re-render, zero JS work per frame).
// Duration + delay derive from the star index, echoing the web's per-star
// speed/phase (0.5-2.0 rad/s, random phase) without any Math.random. Peak
// is capped well below the node labels so the sky never competes.
function TwinkleStar({ star, index }: { star: Star; index: number }) {
  const period = 1600 + (index % 7) * 380; // half-cycle 1.6-3.9s (web-ish)
  const delay = (index % 11) * 260; // stagger so pulses never sync up
  const peak = Math.min(0.45, star.baseOpacity + 0.22);
  const trough = star.baseOpacity * 0.45;
  const opacity = useSharedValue(star.baseOpacity);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(peak, {
            duration: period,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(trough, {
            duration: period,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [opacity, delay, peak, trough, period]);

  const animatedProps = useAnimatedProps(() => ({
    fillOpacity: opacity.value,
  }));

  return (
    <AnimatedCircle
      cx={star.x}
      cy={star.y}
      r={star.r}
      fill={STAR_COLOR}
      animatedProps={animatedProps}
    />
  );
}

export function ConstellationCard({ profile }: { profile: MemberProfile }) {
  const openInfo = useOpenInfo();
  const [width, setWidth] = useState(0);
  const height = heightFor(width || 360);

  // In-place drill-down stack (web parity: pd-trade-panel). A node/ring tap
  // pushes a card onto this stack instead of navigating away. Pushing the
  // entry already on top is a no-op (stable IDs via entryKey), so a
  // double-tap can't dirty the back-stack with twin cards.
  const [stack, setStack] = useState<DrillEntry[]>([]);
  const pushEntry = (e: DrillEntry) =>
    setStack((s) => {
      const top = s[s.length - 1];
      if (top && entryKey(top) === entryKey(e)) return s;
      return [...s, e];
    });
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
      memberTrades: tradesForKey(profile.trades ?? [], n.key),
      conflict: n.conflict,
      sector: n.sector,
    });
  };

  // --- pan + pinch-zoom (canvas transform; scale from center, 1x-3x) ------
  // Pan is clamped to the scaled content bounds with rubber-band overflow;
  // release springs back inside (at 1x the bounds are 0,0, so it springs
  // to center exactly like the web canvas). Taps pass through: the pan
  // gesture only activates after ~8px of travel.
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // More labels when zoomed in: mirror the scale into a JS zoom bucket.
  const [zoomBucket, setZoomBucket] = useState(0);
  useAnimatedReaction(
    () => (scale.value >= 2.2 ? 2 : scale.value >= 1.45 ? 1 : 0),
    (bucket, prev) => {
      if (bucket !== prev) runOnJS(setZoomBucket)(bucket);
    },
  );
  const labelCap = LABEL_CAPS[zoomBucket];

  // Reset the viewport when the member (or canvas size) changes.
  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, width]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, savedScale.value * e.scale),
      );
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Re-clamp the pan to the new scale's bounds.
      const bx = ((scale.value - 1) * width) / 2;
      const by = ((scale.value - 1) * height) / 2;
      tx.value = withSpring(
        Math.min(bx, Math.max(-bx, tx.value)),
        SETTLE_SPRING,
      );
      ty.value = withSpring(
        Math.min(by, Math.max(-by, ty.value)),
        SETTLE_SPRING,
      );
      savedTx.value = Math.min(bx, Math.max(-bx, tx.value));
      savedTy.value = Math.min(by, Math.max(-by, ty.value));
    });

  const pan = Gesture.Pan()
    .minDistance(8)
    .onUpdate((e) => {
      const bx = ((scale.value - 1) * width) / 2;
      const by = ((scale.value - 1) * height) / 2;
      const rubber = (raw: number, bound: number) => {
        "worklet";
        if (raw > bound) return bound + (raw - bound) * 0.3;
        if (raw < -bound) return -bound + (raw + bound) * 0.3;
        return raw;
      };
      tx.value = rubber(savedTx.value + e.translationX, bx);
      ty.value = rubber(savedTy.value + e.translationY, by);
    })
    .onEnd(() => {
      const bx = ((scale.value - 1) * width) / 2;
      const by = ((scale.value - 1) * height) / 2;
      const cxv = Math.min(bx, Math.max(-bx, tx.value));
      const cyv = Math.min(by, Math.max(-by, ty.value));
      tx.value = withSpring(cxv, SETTLE_SPRING);
      ty.value = withSpring(cyv, SETTLE_SPRING);
      savedTx.value = cxv;
      savedTy.value = cyv;
    });

  const canvasGesture = Gesture.Simultaneous(pinch, pan);
  const canvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  // Starfield parallax (V6): the sky sits in its OWN layer behind the disc
  // and follows the same pan/zoom shared values at 0.35x, so dragging the
  // constellation slides the stars slower -- depth without any autonomous
  // motion (reduced-motion safe: it only moves when the user's finger does).
  // The layer is oversized 1.4x and the fractional scale term keeps its
  // edges covered at every reachable pan/zoom, so no starless strip appears.
  const starStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value * STAR_PARALLAX },
      { translateY: ty.value * STAR_PARALLAX },
      { scale: 1 + (scale.value - 1) * STAR_PARALLAX },
    ],
  }));

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

  // Starfield: regenerate only when the canvas size changes (web parity:
  // the _starW guard keeps the field persistent across re-renders). The
  // whole layer memoizes into one element tree, so isolate/zoom state
  // changes never reconcile the circles -- only the twinkle subset owns
  // animators, and those run purely on the UI thread. Reduced motion (OS
  // setting, via reanimated's hook) renders every star static instead.
  // The field spans STAR_OVERSCAN x the canvas (centered) for parallax
  // coverage; the star COUNT scales with that extra area so the visible
  // density stays at the tuned default.
  const reducedMotion = useReducedMotion();
  const starW = Math.round(width * STAR_OVERSCAN);
  const starH = Math.round(height * STAR_OVERSCAN);
  const stars = useMemo(
    () =>
      width > 0
        ? generateStars(
            starW,
            starH,
            Math.round(156 * STAR_OVERSCAN * STAR_OVERSCAN),
          )
        : [],
    [width, starW, starH],
  );
  const starLayer = useMemo(
    () =>
      stars.map((s, i) =>
        s.twinkles && !reducedMotion ? (
          <TwinkleStar key={`star-${i}`} star={s} index={i} />
        ) : (
          <Circle
            key={`star-${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={STAR_COLOR}
            fillOpacity={s.baseOpacity}
          />
        ),
      ),
    [stars, reducedMotion],
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

      {/* canvas (pan + pinch-zoom; the card's overflow-hidden clips) */}
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {data ? (
          <View style={{ width, height }}>
            {/* parallax sky (V6): its own non-interactive layer BEHIND the
                gesture view, oversized + centered, tracking pan/zoom at
                STAR_PARALLAX. Moving the stars out of the disc's Svg also
                retires the old hit-test footgun (bare Circles participate
                in react-native-svg hit-testing) -- pointerEvents="none"
                makes the whole sky tap-transparent. The clipping wrapper
                pins the oversized field to the canvas rect; without it the
                0.2x overhang paints over the card header and legends (RN
                overflow defaults to visible). */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width,
                height,
                overflow: "hidden",
              }}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: "absolute",
                    left: -(starW - width) / 2,
                    top: -(starH - height) / 2,
                    width: starW,
                    height: starH,
                  },
                  starStyle,
                ]}
              >
                <Svg width={starW} height={starH}>
                  {starLayer}
                </Svg>
              </Animated.View>
            </View>
            <GestureDetector gesture={canvasGesture}>
              <Animated.View style={canvasStyle}>
                <Svg width={width} height={height}>
            <Defs>
              <RadialGradient
                id="cta-center-glow"
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
              >
                <Stop
                  offset="0"
                  stopColor={ctaColors.accent}
                  stopOpacity="0.26"
                />
                <Stop
                  offset="0.55"
                  stopColor={ctaColors.accent}
                  stopOpacity="0.09"
                />
                <Stop offset="1" stopColor={ctaColors.accent} stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* faint radial glow behind the center node (V6). Painted below
                the tap-out Rect so it can never swallow a background tap. */}
            <Circle
              cx={cx}
              cy={cy}
              r={data.maxR * 0.6}
              fill="url(#cta-center-glow)"
            />

            {/* tap-out target AND ring selector. react-native-svg hit-tests
                a fill="none" Circle across its WHOLE interior disc (raw
                path region, topmost-first) -- an onPress on the outermost
                ring would swallow every background tap and shadow the
                inner rings. So the rings are inert (no onPress) and THIS
                Rect resolves each background tap by radius: within
                RING_TAP_TOL of a ring line -> that ring's card + isolate
                (nearest ring wins); anywhere else -> clear the isolate. */}
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="#000000"
              fillOpacity={0.01}
              onPress={(e) => {
                const { locationX, locationY } = e.nativeEvent;
                const d = Math.hypot(locationX - cx, locationY - cy);
                let best = -1;
                let bestDist = RING_TAP_TOL;
                data.rings.forEach((ring, i) => {
                  const dd = Math.abs(d - ring.radius);
                  if (dd <= bestDist) {
                    best = i;
                    bestDist = dd;
                  }
                });
                if (best < 0) {
                  setIsolate(null);
                  return;
                }
                const ring = data.rings[best];
                setIsolate({ nodeKey: null, ringIdx: best });
                if (ring.isOther) {
                  // The overflow ring is a bucket, not a committee -- it
                  // opens the list of committees folded into it (V6: no
                  // dead ring).
                  pushEntry({
                    kind: "committees",
                    title: "More committees",
                    items: data.otherCommittees,
                  });
                } else {
                  pushEntry({ kind: "committee", name: ring.name });
                }
              }}
            />

            {/* rings -- visual only; taps resolve through the Rect above
                (see its comment for the hit-test rationale) */}
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
                pointerEvents="none"
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
              const L = n.rank < labelCap ? fitLabel(n, width, height) : null;
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
                  {L ? (
                    <SvgText
                      x={L.x}
                      y={L.y}
                      fontSize={L.fs}
                      fontWeight="bold"
                      fill="#f8fafc"
                      textAnchor="middle"
                    >
                      {L.text}
                    </SvgText>
                  ) : null}
                </G>
              );
            })}

            {/* center member node -- tappable (V6): opens this member's own
                drill card, same in-place pattern as every bubble */}
            <G onPress={() => pushEntry({ kind: "member", name: profile.name })}>
              <Circle
                cx={cx}
                cy={cy}
                r={data.center.r}
                fill={ctaColors.accent}
              />
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
            </G>
                </Svg>
              </Animated.View>
            </GestureDetector>
          </View>
        ) : (
          <View style={{ height }} />
        )}
      </View>

      {/* ring legend -- every chip opens its committee's in-place card
          (V6: same drill the ring tap runs; the old chips navigated away,
          and the "Other" chip was dead) */}
      {data && data.rings.length > 0 ? (
        <View className="flex-row flex-wrap gap-x-3 gap-y-1 px-4 pt-1">
          {data.rings.map((ring, i) => (
            <Pressable
              key={`legend-${i}`}
              onPress={() => {
                setIsolate({ nodeKey: null, ringIdx: i });
                if (ring.isOther) {
                  pushEntry({
                    kind: "committees",
                    title: "More committees",
                    items: data.otherCommittees,
                  });
                } else {
                  pushEntry({ kind: "committee", name: ring.name });
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={
                ring.isOther
                  ? "View the committees in the Other ring"
                  : `View ${ring.name}`
              }
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

      {/* severity + size legend -- the explainer chips open the info sheet
          (what does Direct/Adjacent/size mean); "+N more" opens the
          overflow-holdings card (V6: no dead chips) */}
      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-3 pt-1.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="What does Direct mean?"
          onPress={() => openInfo("profile-constellation")}
          className="flex-row items-center gap-1.5"
        >
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: DIRECT }}
          />
          <Text className="text-[11px] text-gray-500 dark:text-gray-400">
            Direct
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="What does Adjacent mean?"
          onPress={() => openInfo("profile-constellation")}
          className="flex-row items-center gap-1.5"
        >
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: ADJACENT }}
          />
          <Text className="text-[11px] text-gray-500 dark:text-gray-400">
            Adjacent
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="How is bubble size computed?"
          onPress={() => openInfo("profile-constellation")}
        >
          <Text className="text-[11px] text-gray-500 dark:text-gray-400">
            Size = trade value
          </Text>
        </Pressable>
        {data && data.moreCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View the ${data.moreCount} holdings not shown on the map`}
            onPress={() =>
              pushEntry({
                kind: "holdings",
                title: `+${data.moreCount} more holdings`,
                items: data.overflow,
                memberName: profile.name,
                allTrades: profile.trades ?? [],
              })
            }
          >
            <Text className="text-[11px] font-medium text-cta-accent underline">
              +{data.moreCount} more
            </Text>
          </Pressable>
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
