// MemberCard -- one followed member on the watchlist.
//
// Header: avatar (portrait from the member's most recent trade, else an
// initials placeholder) + name + an unfollow Star (FollowButton, "md").
// Body: a per-member FSM over useMemberRecentTrades(name):
//   loading -> two row shimmers
//   error   -> inline "Couldn't load" + Retry (member-scoped, not global)
//   empty   -> "No disclosures on file yet."
//   success -> up to 3 TradeRow previews + a "View all" link into the feed,
//              filtered to this member via the existing feed filter store.
//
// "View all" reuses the feed's drillToPolitician (Zustand client state) and
// routes to the feed tab, so the watchlist stays a glance surface and the
// feed remains the single full-list surface (no duplicate paginated list).
//
// Framing: this is accountability tracking of disclosures, not a portfolio
// or signal feed -- copy stays civic ("disclosures", "View all trades").
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { TradeRow } from "@/features/trades/components/TradeRow";
import { useTradeFiltersStore } from "@/features/trades/store";
import { useMemberRecentTrades } from "@/features/watchlist/hooks/useMemberRecentTrades";
import { FollowButton } from "@/features/watchlist/components/FollowButton";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function RowShimmer() {
  return (
    <View className="h-[72px] flex-row items-center gap-3 px-4">
      <View className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      <View className="flex-1 gap-2">
        <View className="h-4 w-2/3 rounded-md bg-gray-200 dark:bg-gray-700" />
        <View className="h-3 w-1/2 rounded-md bg-gray-200 dark:bg-gray-700" />
      </View>
    </View>
  );
}

type Props = { politician: string };

export function MemberCard({ politician }: Props) {
  const router = useRouter();
  const drillToPolitician = useTradeFiltersStore((s) => s.drillToPolitician);
  const { trades, total, isLoading, isError, refetch } =
    useMemberRecentTrades(politician);

  // Portrait comes from the member's data once trades load; until then (or
  // if none have a photo) we show initials. Derived from the first record.
  const photoUrl = trades.find((t) => t.photo_url)?.photo_url ?? null;

  const viewAll = () => {
    drillToPolitician(politician);
    router.push("/(drawer)");
  };

  return (
    <View className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Member header */}
      <View className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            className="h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-700"
          />
        ) : (
          <View className="h-11 w-11 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <Text className="text-sm font-bold text-gray-600 dark:text-gray-300">
              {initials(politician)}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text
            className="text-base font-semibold text-gray-900 dark:text-gray-100"
            numberOfLines={1}
          >
            {politician}
          </Text>
          {!isLoading && !isError ? (
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {total === 1 ? "1 disclosure" : `${total.toLocaleString()} disclosures`}
            </Text>
          ) : null}
        </View>
        <FollowButton politician={politician} size="md" />
      </View>

      {/* Per-member FSM body */}
      {isLoading ? (
        <View>
          <RowShimmer />
          <RowShimmer />
        </View>
      ) : isError ? (
        <View className="items-center px-4 py-6">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Couldn&apos;t load recent disclosures.
          </Text>
          <Pressable
            onPress={() => refetch()}
            accessibilityRole="button"
            className="mt-3 rounded-lg bg-cta-accent px-4 py-2"
          >
            <Text className="text-sm font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : trades.length === 0 ? (
        <View className="px-4 py-6">
          <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
            No disclosures on file yet.
          </Text>
        </View>
      ) : (
        <View>
          {trades.map((trade, i) => (
            <View key={String(trade.id)}>
              {i > 0 ? (
                <View className="ml-[68px] h-px bg-gray-100 dark:bg-gray-800" />
              ) : null}
              <TradeRow trade={trade} />
            </View>
          ))}
          <Pressable
            onPress={viewAll}
            accessibilityRole="button"
            accessibilityLabel={`View all disclosures from ${politician}`}
            className="border-t border-gray-100 px-4 py-3 dark:border-gray-800"
          >
            <Text className="text-center text-sm font-semibold text-cta-accent">
              View all trades
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
