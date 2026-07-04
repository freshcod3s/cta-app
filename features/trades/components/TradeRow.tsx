// Trade row (feed + member profile) -- v1-credibility layout, web parity
// with congresstradealerts.com trade cards.
//
// Layout (feed):
//   |[avatar] [$TICKER  Company (muted)      ]  [BUY][LATE]   [star]
//   |         [Name  D-CA  (overlap chip)    ]  [amount, mid]
//   ^ 3px left border: green buy / red sell (web parity).
// Layout (member profile, hideMember): the avatar + member-name line are
// dropped (every row is the same member); line 2 becomes the trade date.
//
// Row body opens the trade detail (/trade/{id}); the member name drills
// into the member profile (/member/{name}), the ticker into the ticker
// page (/ticker/{symbol}), and a trailing star toggles the watchlist.
// Each nested press target captures its own taps; the rest of the row
// falls through to the Link.
//
// The committee-overlap chip reads the conflict INLINE off the served
// record (same accountability framing as ConflictChips: oversight
// overlap, not wrongdoing). Direct = red, adjacent = amber, matching the
// web constellation legend. Colors go through inline style, the
// established NativeWind dodge for brand colors on borders.
//
// initials() is duplicated from MemberHeader (and LeaderboardRow) --
// crosses the "extract at 3rd use" line; promote to /lib/util/initials.ts
// in a follow-up.
import { Image, Pressable, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { Landmark } from "lucide-react-native";
import {
  isBuy,
  isLateFiling,
  type TradeRecord,
} from "@/features/trades/api/types";
import { FollowButton } from "@/features/watchlist/components/FollowButton";
import { ctaColors } from "@/lib/theme/tokens";
import {
  cleanAssetName,
  displayName,
  formatMoneyShort,
  formatShortDate,
  midEstimate,
} from "@/lib/util/display";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = { trade: TradeRecord; hideMember?: boolean };

export function TradeRow({ trade, hideMember = false }: Props) {
  const buy = isBuy(trade.tx_type);
  const late = isLateFiling(trade.disclosure_lag_days);
  const pillBg = buy ? "bg-cta-buy" : "bg-cta-sell";
  const pillLabel = buy ? "BUY" : "SELL";

  const name = displayName(trade.politician);
  const asset = cleanAssetName(trade.asset_name);
  const mid = formatMoneyShort(
    midEstimate(trade.amount_low, trade.amount_high),
  );
  const conflict = trade.conflict ?? null;
  const conflictColor =
    conflict?.severity === "direct" ? ctaColors.sell : ctaColors.late;

  const partyChip =
    trade.party && trade.state ? `${trade.party}-${trade.state}` : null;
  const partyColor =
    trade.party === "D"
      ? ctaColors.dem
      : trade.party === "R"
        ? ctaColors.rep
        : "#9ca3af";

  const a11y =
    `${name}, ${pillLabel} ${trade.ticker || asset || "unlisted asset"},` +
    ` ${trade.amount_range}` +
    (late ? `, late by ${trade.disclosure_lag_days} days` : "") +
    (conflict
      ? `, ${conflict.severity} committee overlap: ${conflict.committee}`
      : "");

  return (
    <Link href={`/trade/${trade.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        className="min-h-[72px] flex-row items-center gap-3 py-2 pl-3 pr-4"
        style={{
          borderLeftWidth: 3,
          borderLeftColor: buy ? ctaColors.buy : ctaColors.sell,
        }}
      >
        {hideMember ? null : trade.photo_url ? (
          <Image
            source={{ uri: trade.photo_url }}
            className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"
          />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <Text className="text-xs font-bold text-gray-600 dark:text-gray-300">
              {initials(name)}
            </Text>
          </View>
        )}

        <View className="flex-1">
          {/* Line 1 -- ticker-first: $TICKER primary, company muted.
              Ticker tap opens /ticker/{symbol}; onPress on the nested
              Text fires for the ticker glyphs only. */}
          <Text numberOfLines={1}>
            {trade.ticker ? (
              <Text
                onPress={() =>
                  router.push(`/ticker/${trade.ticker.toUpperCase()}`)
                }
                suppressHighlighting
                accessibilityRole="link"
                accessibilityLabel={`View all Congress trades in ${trade.ticker}`}
                className="text-sm font-bold text-cta-accent"
              >
                {"$" + trade.ticker}
              </Text>
            ) : (
              <Text className="text-sm font-bold text-gray-500 dark:text-gray-400">
                (unlisted)
              </Text>
            )}
            {asset ? (
              <Text className="text-xs text-gray-600 dark:text-gray-400">
                {"  " + asset}
              </Text>
            ) : null}
          </Text>

          {/* Line 2 -- member identity (feed) or trade date (profile),
              plus the committee-overlap chip when the served record
              carries one. */}
          <View className="mt-1 flex-row items-center gap-1.5">
            {hideMember ? (
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {formatShortDate(trade.trade_date)}
              </Text>
            ) : (
              <>
                {/* Member-name tap drills into the politician profile;
                    encodeURIComponent so names with spaces round-trip.
                    Route param stays the LEGAL name; only the rendered
                    text goes through displayName(). */}
                <Link
                  href={`/member/${encodeURIComponent(trade.politician)}`}
                  asChild
                >
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`View ${name} profile`}
                    hitSlop={4}
                    className="shrink"
                  >
                    <Text
                      className="text-xs font-semibold text-gray-900 dark:text-gray-100"
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                  </Pressable>
                </Link>
                {partyChip ? (
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: partyColor }}
                  >
                    {partyChip}
                  </Text>
                ) : null}
              </>
            )}
            {conflict ? (
              <View
                className="flex-row items-center gap-0.5 rounded-full border px-1.5 py-px"
                style={{ borderColor: conflictColor }}
              >
                <Landmark size={9} color={conflictColor} />
                <Text
                  className="text-[9px] font-semibold"
                  style={{ color: conflictColor }}
                  numberOfLines={1}
                >
                  {conflict.severity === "direct"
                    ? "Direct overlap"
                    : "Overlap"}
                </Text>
              </View>
            ) : null}
          </View>
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
          {mid ? (
            <Text className="text-[10px] text-gray-500 dark:text-gray-400">
              mid {mid}
            </Text>
          ) : null}
        </View>

        <FollowButton politician={trade.politician} size="sm" />
      </Pressable>
    </Link>
  );
}
