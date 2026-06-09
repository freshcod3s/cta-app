// Row renderers for the Daily Dive lists. Stocks drill to the ticker page,
// members + flagged filings drill to the member profile (reusing the Track A
// routes). Framing throughout is disclosure-activity, never "buy this".
import { Image, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

import { ctaColors } from "@/lib/theme/tokens";
import type {
  DailyDiveBipartisan,
  DailyDiveFreshFace,
  DailyDiveMember,
  DailyDiveSector,
  DailyDiveStock,
  DailyDiveUnusual,
} from "@/features/dailydive/api/types";
import { fmtVolume } from "@/features/dailydive/components/PulseBanner";

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

// Sector aggregation row -- not tappable (no per-sector route exists);
// purely a disclosure-activity breakdown. Counts + disclosed volume only.
export function SectorRow({ s }: { s: DailyDiveSector }) {
  return (
    <View
      accessible
      accessibilityLabel={`${s.sector}, ${s.trade_count} disclosed trades`}
      className="flex-row items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800"
    >
      <View className="flex-1 pr-3">
        <Text
          className="text-sm font-semibold text-gray-900 dark:text-gray-100"
          numberOfLines={1}
        >
          {s.sector}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {s.buys} buys / {s.sells} sells
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {s.trade_count} trades
        </Text>
        {s.total_volume ? (
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {fmtVolume(s.total_volume)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// Securities disclosed as PURCHASED by members of both parties. The D/R
// split is the whole point; drills to the ticker page. No return shown.
export function BipartisanRow({ b }: { b: DailyDiveBipartisan }) {
  return (
    <Link href={`/ticker/${b.ticker.toUpperCase()}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${b.ticker}, purchased by ${b.dem_traders} Democratic and ${b.rep_traders} Republican members`}
        className="flex-row items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800"
      >
        <View className="flex-1 pr-3">
          <Text className="text-sm font-bold text-cta-accent">{b.ticker}</Text>
          <Text
            className="text-xs text-gray-600 dark:text-gray-400"
            numberOfLines={1}
          >
            {b.asset_name}
          </Text>
        </View>
        <View className="items-end">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-xs font-bold"
              style={{ color: ctaColors.dem }}
            >
              D {b.dem_traders}
            </Text>
            <Text
              className="text-xs font-bold"
              style={{ color: ctaColors.rep }}
            >
              R {b.rep_traders}
            </Text>
          </View>
          <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {b.trade_count} purchases
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

// Members whose first-ever disclosure was recent. Drills to the member
// page. No photo in this worker shape, so text-only.
export function FreshFaceRow({ f }: { f: DailyDiveFreshFace }) {
  const meta = [f.party, f.chamber, f.state].filter(Boolean).join(" - ");
  const sub = [meta, `${f.trades} trades`].filter(Boolean).join("  -  ");
  return (
    <Link href={`/member/${encodeURIComponent(f.politician)}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${f.politician}, first disclosed ${f.first_trade}`}
        className="flex-row items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800"
      >
        <View className="flex-1 pr-3">
          <Text
            className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            numberOfLines={1}
          >
            {f.politician}
          </Text>
          <Text
            className="text-xs text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {sub}
          </Text>
        </View>
        <View className="items-end pl-2">
          <Text className="text-[10px] uppercase tracking-wide text-gray-400">
            First filed
          </Text>
          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {f.first_trade}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
