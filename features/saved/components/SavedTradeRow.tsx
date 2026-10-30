// One saved source record in the workspace.
//
// A saved trade is fully self-contained at save time -- everything shown
// here comes from the stored snapshot, so this row renders identically with
// no network. The amount is the DISCLOSED RANGE string exactly as filed; it
// is never converted to a value.
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";

import { useSavedStore } from "@/features/saved/store";
import { snapshotFreshness } from "@/features/saved/freshness";
import type { SavedTrade } from "@/features/saved/types";
import { isLateFiling } from "@/features/trades/api/types";
import { displayName, formatShortDate } from "@/lib/util/display";
import { ctaColors } from "@/lib/theme/tokens";

export function SavedTradeRow({ item }: { item: SavedTrade }) {
  const router = useRouter();
  const remove = useSavedStore((s) => s.remove);
  const t = item.snapshot;

  // Same rule as TimelineSection: a lag we cannot state is not a lag we can
  // call late.
  const lagUnknown = t.date_quality === "corrupt" || t.disclosure_lag_days == null;
  const late = !lagUnknown && isLateFiling(t.disclosure_lag_days);
  const fresh = snapshotFreshness(item.snapshotUpdatedAt);
  const who = displayName(t.politician);

  return (
    <View className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <Pressable
        onPress={() => router.push(`/trade/${encodeURIComponent(item.entityId)}`)}
        accessibilityRole="button"
        accessibilityLabel={`${who}, ${t.tx_type} of ${t.ticker || t.asset_name}, ${t.amount_range}, reported ${formatShortDate(t.trade_date)}${late ? ", filed late" : ""}`}
      >
        <View className="flex-row items-center justify-between">
          <Text
            className="flex-1 pr-2 text-base font-semibold text-gray-900 dark:text-gray-100"
            numberOfLines={1}
          >
            {t.ticker || t.asset_name}
          </Text>
          {late ? (
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: ctaColors.late }}
            >
              <Text className="text-[10px] font-bold text-white">LATE</Text>
            </View>
          ) : null}
        </View>

        <Text className="mt-0.5 text-xs text-gray-600 dark:text-gray-400" numberOfLines={1}>
          {who} · {t.tx_type}
        </Text>
        <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
          {t.amount_range} · reported {formatShortDate(t.trade_date)} · disclosed{" "}
          {formatShortDate(t.disclosure_date)}
        </Text>
      </Pressable>

      <View className="mt-2.5 flex-row items-center justify-between border-t border-gray-100 pt-2.5 dark:border-gray-700">
        <Text className="flex-1 text-[11px] text-gray-500 dark:text-gray-400">
          {fresh.label}
        </Text>
        <Pressable
          onPress={() => remove(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`Remove this ${t.ticker || t.asset_name} record from saved`}
          hitSlop={6}
          className="min-h-11 min-w-11 items-center justify-center"
        >
          <Trash2 size={16} color="#9ca3af" />
        </Pressable>
      </View>
    </View>
  );
}
