// Live ticker tape -- a thin auto-scrolling marquee of the most recent
// disclosures (web parity: the homepage ticker tape). Ambient polish, not a
// primary surface. Reuses the unfiltered feed cache (useTradesList({})), so
// no extra network. Two identical sequences scroll left in a seamless loop
// (reanimated, UI thread -- doesn't block list scrolling). Each item taps to
// /ticker/[symbol].
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTradesList } from "@/features/trades/api/queries";
import { isBuy, type TradeRecord } from "@/features/trades/api/types";
import { ctaColors } from "@/lib/theme/tokens";

const SPEED = 45; // px per second

function surname(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? name;
}

function TapeItem({ trade }: { trade: TradeRecord }) {
  const router = useRouter();
  const buy = isBuy(trade.tx_type);
  return (
    <Pressable
      onPress={() =>
        trade.ticker
          ? router.push(`/ticker/${encodeURIComponent(trade.ticker)}`)
          : undefined
      }
      className="flex-row items-center gap-1.5 px-3"
    >
      <Text className="text-xs font-bold text-cta-accent">${trade.ticker}</Text>
      <Text
        className="text-xs font-bold"
        style={{ color: buy ? ctaColors.buy : ctaColors.sell }}
      >
        {buy ? "▲" : "▼"}
      </Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400">
        {surname(trade.politician)}
      </Text>
    </Pressable>
  );
}

function Sequence({
  rows,
  onWidth,
}: {
  rows: TradeRecord[];
  onWidth?: (w: number) => void;
}) {
  return (
    <View
      className="flex-row items-center py-1.5"
      onLayout={onWidth ? (e) => onWidth(e.nativeEvent.layout.width) : undefined}
    >
      {rows.map((t) => (
        <TapeItem key={String(t.id)} trade={t} />
      ))}
    </View>
  );
}

export function TickerTape() {
  const { data } = useTradesList({});
  const rows = (data?.flat ?? [])
    .filter((t) => t.ticker)
    .slice(0, 14);

  const [seqWidth, setSeqWidth] = useState(0);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (seqWidth <= 0) return;
    offset.value = 0;
    offset.value = withRepeat(
      withTiming(-seqWidth, {
        duration: (seqWidth / SPEED) * 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(offset);
  }, [seqWidth, offset]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  if (rows.length === 0) return null;

  return (
    <View className="overflow-hidden border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      <Animated.View className="flex-row" style={animStyle}>
        <Sequence rows={rows} onWidth={setSeqWidth} />
        <Sequence rows={rows} />
      </Animated.View>
    </View>
  );
}
