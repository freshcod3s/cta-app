// Ticker detail header card.
//
// Identity + context for one ticker, assembled from two sources:
//   * TickerInfo (GET /api/ticker-info/{symbol}) -- company name, industry,
//     one-sentence description, 90d disclosure count, optional logo.
//   * priceTrade -- the most recent TradeRecord that carries enrichment
//     price fields, used for the "latest disclosed price" snapshot. The
//     ticker-info endpoint does NOT carry price, so we derive it from the
//     trade list the screen already loaded (no extra request).
//
// Framing (civic-transparency, NOT fintech): the price + vs-S&P line is
// labeled explicitly as the price at the most recent disclosure and the
// stock's move vs the S&P over that same window. It is accountability
// context, never a signal -- no "alpha", no buy/sell prompt.
//
// This component owns its own loading shimmer for the info portion so it
// renders the ticker symbol + price immediately (both known without the
// info request) and fills name/industry/description in when info resolves,
// instead of blocking the whole header.
import { Image, Text, View } from "react-native";
import type { TradeRecord } from "@/features/trades/api/types";
import type { TickerInfo } from "@/features/ticker/api/types";
import { FollowTickerButton } from "@/features/watchlist/components/FollowTickerButton";

type Props = {
  symbol: string;
  info: TickerInfo | undefined;
  infoLoading: boolean;
  // First/most-recent trade in the list; used to derive a display name +
  // sector when ticker-info is empty, and to source the price snapshot.
  priceTrade: TradeRecord | undefined;
  // Total disclosed trades on this ticker (from the list meta) -- the
  // headline accountability number for the screen.
  totalTrades: number;
};

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <View className={`rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />
  );
}

function formatPrice(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function TickerHeader({
  symbol,
  info,
  infoLoading,
  priceTrade,
  totalTrades,
}: Props) {
  // Display name + sector: prefer the enriched ticker-info profile, then
  // fall back to whatever the most recent trade carried, then to nothing.
  const companyName =
    info?.company_name ?? priceTrade?.asset_name ?? null;
  const sector = info?.industry ?? priceTrade?.sector ?? null;
  const derivedName = !info?.company_name && !!priceTrade?.asset_name;

  // Price snapshot from the most recent trade that has price enrichment.
  const price =
    typeof priceTrade?.current_price === "number"
      ? priceTrade.current_price
      : null;
  const stockPct =
    typeof priceTrade?.price_change_pct === "number"
      ? priceTrade.price_change_pct
      : null;
  const spxPct =
    typeof priceTrade?.sp500_change_pct === "number"
      ? priceTrade.sp500_change_pct
      : null;

  const stockTint =
    stockPct == null
      ? "text-gray-700 dark:text-gray-300"
      : stockPct > 0
        ? "text-cta-buy"
        : stockPct < 0
          ? "text-cta-sell"
          : "text-gray-700 dark:text-gray-300";

  return (
    <View className="border-b border-gray-200 px-4 pb-4 pt-3 dark:border-gray-800">
      <View className="flex-row items-center gap-3">
        {info?.logo_url ? (
          <Image
            source={{ uri: info.logo_url }}
            className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700"
            accessibilityLabel={`${symbol} logo`}
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
            <Text className="text-sm font-bold text-gray-600 dark:text-gray-300">
              {symbol.slice(0, 4)}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text
            className="text-2xl font-bold text-gray-900 dark:text-gray-100"
            numberOfLines={1}
          >
            {symbol}
          </Text>
          {infoLoading && !companyName ? (
            <ShimmerBlock className="mt-1 h-4 w-2/3" />
          ) : companyName ? (
            <Text
              className="mt-0.5 text-sm text-gray-600 dark:text-gray-400"
              numberOfLines={2}
            >
              {companyName}
            </Text>
          ) : (
            <Text className="mt-0.5 text-sm text-gray-500 dark:text-gray-500">
              Company profile unavailable
            </Text>
          )}
        </View>
        <FollowTickerButton symbol={symbol} size="md" />
      </View>

      {/* Sector chip. */}
      {sector ? (
        <View className="mt-3 flex-row">
          <View className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
            <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {sector}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Price snapshot -- only when the latest trade carried enrichment. */}
      {price != null ? (
        <View className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(price)}
            </Text>
            {stockPct != null ? (
              <Text className={`text-base font-semibold ${stockTint}`}>
                {formatPct(stockPct)}
              </Text>
            ) : null}
          </View>
          <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {spxPct != null && stockPct != null
              ? `Price at most recent disclosure. Stock ${formatPct(
                  stockPct,
                )} vs S&P ${formatPct(spxPct)} over that window.`
              : "Price at most recent disclosure."}
          </Text>
        </View>
      ) : null}

      {/* One-sentence description when ticker-info supplied one. */}
      {info?.description ? (
        <Text className="mt-3 text-sm leading-5 text-gray-600 dark:text-gray-400">
          {info.description}
        </Text>
      ) : null}

      {/* Headline accountability number: disclosed congressional trades. */}
      <Text className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {totalTrades.toLocaleString()} disclosed congressional{" "}
        {totalTrades === 1 ? "trade" : "trades"}
      </Text>

      {derivedName ? (
        <Text className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          Name and sector derived from the most recent disclosure.
        </Text>
      ) : null}
    </View>
  );
}
