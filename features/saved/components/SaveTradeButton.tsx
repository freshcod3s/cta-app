// Save this filing to the workspace.
//
// A saved filing is fully self-contained -- everything the Saved screen and
// the offline view need is captured at save time -- so unlike a member, it
// is offline-ready the instant it is saved. The label says so.
import { Pressable, Text, View } from "react-native";
import { Bookmark } from "lucide-react-native";

import { useSavedStore } from "@/features/saved/store";
import type { TradeRecord } from "@/features/trades/api/types";
import { ctaColors } from "@/lib/theme/tokens";

export function SaveTradeButton({ trade }: { trade: TradeRecord }) {
  const saved = useSavedStore((s) => s.isSaved("trade", String(trade.id)));
  const toggle = useSavedStore((s) => s.toggleTrade);
  const what = trade.ticker || trade.asset_name;

  return (
    <View className="px-4 py-2">
      <Pressable
        onPress={() => toggle(trade)}
        accessibilityRole="button"
        accessibilityState={{ selected: saved }}
        accessibilityLabel={
          saved
            ? `Remove this ${what} filing from saved`
            : `Save this ${what} filing for offline use`
        }
        className={`min-h-11 flex-row items-center justify-center gap-2 rounded-lg px-4 py-3 ${
          saved
            ? "bg-cta-accent"
            : "border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
        }`}
      >
        <Bookmark
          size={16}
          color={saved ? "#ffffff" : ctaColors.accent}
          fill={saved ? "#ffffff" : "none"}
        />
        <Text
          className={`text-sm font-semibold ${
            saved ? "text-white" : "text-gray-800 dark:text-gray-200"
          }`}
        >
          {saved ? "Saved to your workspace" : "Save this filing"}
        </Text>
      </Pressable>
      {saved ? (
        <Text className="mt-1.5 text-center text-[11px] text-gray-500 dark:text-gray-400">
          Available in Saved, readable without a connection.
        </Text>
      ) : null}
    </View>
  );
}
