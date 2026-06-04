// Row renderers for the Daily Dive lists. Stocks drill to the ticker page,
// members + flagged filings drill to the member profile (reusing the Track A
// routes). Framing throughout is disclosure-activity, never "buy this".
import { Image, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

import { ctaColors } from "@/lib/theme/tokens";
import type {
  DailyDiveMember,
  DailyDiveStock,
  DailyDiveUnusual,
} from "@/features/dailydive/api/types";

export function StockRow({ s }: { s: DailyDiveStock }) {
  return (
    <Link href={`/ticker/${s.ticker.toUpperCase()}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${s.ticker}, ${s.trade_count} disclosed trades`}
        className="flex-row items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800"
      >
        <View className="flex-1 pr-3">
          <Text className="text-sm font-bold text-cta-accent">{s.ticker}</Text>
          <Text
            className="text-xs text-gray-600 dark:text-gray-400"
            numberOfLines={1}
          >
            {s.asset_name}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {s.trade_count} trades
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {s.trader_count} members
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

export function MemberRow({ m }: { m: DailyDiveMember }) {
  const meta = [m.party, m.chamber, m.state].filter(Boolean).join(" - ");
  return (
    <Link href={`/member/${encodeURIComponent(m.politician)}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${m.politician}, ${m.trade_count} disclosures`}
        className="flex-row items-center gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800"
      >
        {m.photo_url ? (
          <Image
            source={{ uri: m.photo_url }}
            className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700"
          />
        ) : (
          <View className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700" />
        )}
        <View className="flex-1">
          <Text
            className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            numberOfLines={1}
          >
            {m.politician}
          </Text>
          {meta ? (
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {meta}
            </Text>
          ) : null}
        </View>
        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {m.trade_count}
        </Text>
      </Pressable>
    </Link>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View
      className="rounded-full px-2 py-0.5"
      style={{ backgroundColor: ctaColors.late }}
    >
      <Text className="text-[10px] font-bold text-white">{label}</Text>
    </View>
  );
}

export function UnusualRow({ u }: { u: DailyDiveUnusual }) {
  const late = u.disclosure_lag_days > 45;
  const big = u.amount_high >= 250000;
  return (
    <Link href={`/member/${encodeURIComponent(u.politician)}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${u.politician}, ${u.ticker || u.asset_name}, ${u.amount_range}`}
        className="border-t border-gray-100 px-4 py-3 dark:border-gray-800"
      >
        <View className="flex-row items-center justify-between">
          <Text
            className="flex-1 pr-2 text-sm font-semibold text-gray-900 dark:text-gray-100"
            numberOfLines={1}
          >
            {u.politician}
          </Text>
          <View className="flex-row gap-1.5">
            {big ? <Tag label="LARGE" /> : null}
            {late ? <Tag label="LATE" /> : null}
          </View>
        </View>
        <Text
          className="mt-0.5 text-xs text-gray-600 dark:text-gray-400"
          numberOfLines={1}
        >
          <Text className="font-bold">{u.ticker || u.asset_name}</Text>
          {`   ${u.amount_range}`}
          {late ? `   ${u.disclosure_lag_days}d lag` : ""}
        </Text>
      </Pressable>
    </Link>
  );
}
