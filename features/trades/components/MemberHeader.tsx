// Member identity row: portrait + name (large) + party badge + state/chamber.
// Portrait pulls from the API's `photo_url`; null falls back to an initial-
// letter placeholder. Party badge uses cta-dem (D), cta-rep (R), or neutral
// gray (anything else / Independent).
import { Image, Text, View } from "react-native";
import type { TradeRecord } from "@/features/trades/api/types";
import { displayName } from "@/lib/util/display";

type Props = { trade: TradeRecord };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function MemberHeader({ trade }: Props) {
  // Render-only alias (legal filing name -> public name).
  const name = displayName(trade.politician);
  const partyClass =
    trade.party === "D"
      ? "bg-cta-dem"
      : trade.party === "R"
        ? "bg-cta-rep"
        : "bg-gray-500";

  const districtSuffix =
    trade.chamber === "House" && trade.district != null
      ? `-${trade.district}`
      : "";

  return (
    <View className="flex-row items-center gap-4 p-4">
      {trade.photo_url ? (
        <Image
          source={{ uri: trade.photo_url }}
          className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700"
          accessibilityLabel={`${name} portrait`}
        />
      ) : (
        <View className="h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <Text className="text-2xl font-bold text-gray-600 dark:text-gray-300">
            {initials(name)}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {name}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <View className={`rounded-full px-2 py-0.5 ${partyClass}`}>
            <Text className="text-xs font-semibold text-white">
              {trade.party}
            </Text>
          </View>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {trade.chamber} - {trade.state}
            {districtSuffix}
          </Text>
        </View>
      </View>
    </View>
  );
}
