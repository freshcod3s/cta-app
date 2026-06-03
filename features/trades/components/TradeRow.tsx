// Feed row -- 72pt fixed height. Row body opens the trade detail
// (/trade/{id}); the member name drills into the member profile
// (/member/{name}), the ticker into the ticker page (/ticker/{symbol}),
// and a trailing star toggles the watchlist. Each nested press target
// captures its own taps; the rest of the row falls through to the Link.
//
// Layout: [avatar] [name / TICKER asset] [BUY-SELL pill / amount] [star]
//
// initials() is duplicated from MemberHeader (and now LeaderboardRow) --
// crosses the "extract at 3rd use" line; promote to /lib/util/initials.ts
// in a follow-up.
import { Image, Pressable, Text, View } from "react-native";
import { Link, router } from "expo-router";
import {
  isBuy,
  isLateFiling,
  type TradeRecord,
} from "@/features/trades/api/types";
import { FollowButton } from "@/features/watchlist/components/FollowButton";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = { trade: TradeRecord };

export function TradeRow({ trade }: Props) {
  const buy = isBuy(trade.tx_type);
  const late = isLateFiling(trade.disclosure_lag_days);
  const pillBg = buy ? "bg-cta-buy" : "bg-cta-sell";
  const pillLabel = buy ? "BUY" : "SELL";

  const a11y =
    `${trade.politician}, ${pillLabel} ${trade.ticker || trade.asset_name},` +
    ` ${trade.amount_range}` +
    (late ? `, late by ${trade.disclosure_lag_days} days` : "");

  return (
    <Link href={`/trade/${trade.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        className="h-[72px] flex-row items-center gap-3 px-4"
      >
        {trade.photo_url ? (
          <Image
            source={{ uri: trade.photo_url }}
            className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"
          />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <Text className="text-xs font-bold text-gray-600 dark:text-gray-300">
              {initials(trade.politician)}
            </Text>
          </View>
        )}

        <View className="flex-1">
          {/* Member-name tap drills into the politician profile; the rest of
              the row still opens the trade detail via the outer Link.
              encodeURIComponent so names with spaces round-trip. */}
          <Link
            href={`/member/${encodeURIComponent(trade.politician)}`}
            asChild
          >
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`View ${trade.politician} profile`}
              hitSlop={4}
            >
              <Text
                className="text-sm font-semibold text-gray-900 dark:text-gray-100"
                numberOfLines={1}
              >
                {trade.politician}
              </Text>
            </Pressable>
          </Link>
          <Text
            className="text-xs text-gray-600 dark:text-gray-400"
            numberOfLines={1}
          >
            {trade.ticker ? (
              // Ticker tap opens the ticker detail (/ticker/{symbol}); onPress
              // on the nested Text fires for the ticker glyphs only.
              <Text
                onPress={() =>
                  router.push(`/ticker/${trade.ticker.toUpperCase()}`)
                }
                suppressHighlighting
                accessibilityRole="link"
                accessibilityLabel={`View all Congress trades in ${trade.ticker}`}
                className="font-bold text-cta-accent"
              >
                {trade.ticker}
              </Text>
            ) : (
              <Text className="font-bold">(unlisted)</Text>
            )}
            {trade.asset_name ? `  ${trade.asset_name}` : ""}
          </Text>
        </View>

        <View className="items-end">
          <View className="flex-row items-center gap-1.5">
            <View className={`rounded-full px-2 py-0.5 ${pillBg}`}>
              <Text className="text-[10px] font-bold tracking-wider text-white">
                {pillLabel}
              </Text>
            </View>
            {late && (
              <View className="rounded-full bg-cta-late px-2 py-0.5">
                <Text className="text-[10px] font-bold text-white">LATE</Text>
              </View>
            )}
          </View>
          <Text
            className="mt-1 text-xs text-gray-700 dark:text-gray-300"
            numberOfLines={1}
          >
            {trade.amount_range}
          </Text>
        </View>

        <FollowButton politician={trade.politician} size="sm" />
      </Pressable>
    </Link>
  );
}
