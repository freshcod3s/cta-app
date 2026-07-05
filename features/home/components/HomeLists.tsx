// Highest Volume (members) + Most Traded (stocks) -- the web's two "More
// Insights" sidebar lists, stacked on mobile. Member rows deep-link to
// /member/[name], stock rows to /ticker/[symbol]. Each list header opens its
// explainer sheet. est_pnl / P&L stays hidden while returns are gated off.
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Info } from "lucide-react-native";

import {
  useTopEarners,
  useTopStocks,
  type TopEarner,
  type TopStock,
} from "@/features/home/api/queries";
import { useOpenInfo } from "@/features/info/store";
import { ctaColors } from "@/lib/theme/tokens";
import { displayName } from "@/lib/util/display";

function partyColor(p?: string | null): string {
  return p === "D" ? ctaColors.dem : p === "R" ? ctaColors.rep : "#9ca3af";
}

function SectionHeader({ title, slug }: { title: string; slug: string }) {
  const openInfo = useOpenInfo();
  return (
    <Pressable
      onPress={() => openInfo(slug)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. Tap for details.`}
      android_ripple={{ color: "rgba(99,102,241,0.08)" }}
      className="flex-row items-center gap-1.5 px-4 pb-1.5 pt-3"
    >
      <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </Text>
      <Info size={12} color={ctaColors.accent} />
    </Pressable>
  );
}

function EarnerRow({ earner, rank }: { earner: TopEarner; rank: number }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${displayName(earner.politician)}. Open profile.`}
      onPress={() =>
        router.push(`/member/${encodeURIComponent(earner.politician)}`)
      }
      android_ripple={{ color: "rgba(99,102,241,0.08)" }}
      className="flex-row items-center px-4 py-2"
    >
      <Text className="w-6 text-sm font-bold text-gray-400 dark:text-gray-500">
        {rank}
      </Text>
      <View
        className="mr-2 h-2 w-2 rounded-full"
        style={{ backgroundColor: partyColor(earner.party) }}
      />
      <Text
        className="flex-1 text-sm text-gray-900 dark:text-gray-100"
        numberOfLines={1}
      >
        {displayName(earner.politician)}
        {earner.is_current === false ? " *" : ""}
      </Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400">
        {(earner.trades ?? 0).toLocaleString()} trades
      </Text>
    </Pressable>
  );
}

function StockRow({ stock, rank }: { stock: TopStock; rank: number }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${stock.ticker}. Open ticker.`}
      onPress={() => router.push(`/ticker/${encodeURIComponent(stock.ticker)}`)}
      android_ripple={{ color: "rgba(99,102,241,0.08)" }}
      className="flex-row items-center px-4 py-2"
    >
      <Text className="w-6 text-sm font-bold text-gray-400 dark:text-gray-500">
        {rank}
      </Text>
      <Text className="w-20 text-sm font-bold text-cta-accent">
        ${stock.ticker}
      </Text>
      <Text
        className="flex-1 text-xs text-gray-600 dark:text-gray-300"
        numberOfLines={1}
      >
        {stock.asset_name ?? ""}
      </Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400">
        {(stock.trade_count ?? 0).toLocaleString()}
      </Text>
    </Pressable>
  );
}

function ListCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="mx-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 pb-2 dark:border-gray-700 dark:bg-gray-800">
      {children}
    </View>
  );
}

export function HomeLists() {
  const earners = useTopEarners();
  const stocks = useTopStocks();

  const hasEarners = earners.data && earners.data.length > 0;
  const hasStocks = stocks.data && stocks.data.length > 0;
  if (!hasEarners && !hasStocks) return null;

  return (
    <View className="mt-3 gap-3">
      {hasEarners ? (
        <ListCard>
          <SectionHeader title="Highest Volume (90D)" slug="home-highest-volume" />
          {earners.data!.slice(0, 5).map((e, i) => (
            <EarnerRow key={e.politician} earner={e} rank={i + 1} />
          ))}
        </ListCard>
      ) : null}
      {hasStocks ? (
        <ListCard>
          <SectionHeader title="Most Traded Stocks" slug="home-most-traded" />
          {stocks.data!.slice(0, 5).map((s, i) => (
            <StockRow key={s.ticker} stock={s} rank={i + 1} />
          ))}
        </ListCard>
      ) : null}
    </View>
  );
}
