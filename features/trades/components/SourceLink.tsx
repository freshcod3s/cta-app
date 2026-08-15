// SourceLink -- pressable that opens the original disclosure URL via
// Linking.openURL. Uses the lucide ExternalLink icon for the affordance.
import { Linking, Pressable, Text, View } from "react-native";
import { ExternalLink } from "lucide-react-native";
import type { TradeRecord } from "@/features/trades/api/types";

type Props = { trade: TradeRecord };

export function SourceLink({ trade }: Props) {
  if (!trade.source_url) return null;

  const open = async () => {
    try {
      const can = await Linking.canOpenURL(trade.source_url);
      if (can) await Linking.openURL(trade.source_url);
    } catch {
      // Swallow -- failed link open is a non-fatal UI affordance miss;
      // surfacing an alert here adds noise without recovery action.
    }
  };

  return (
    <View className="px-4 py-2">
      <Pressable
        onPress={open}
        accessibilityRole="link"
        accessibilityLabel={`Open original disclosure on ${trade.source}`}
        className="flex-row items-center gap-2 rounded-xl border border-cta-accent/40 bg-cta-accent/5 px-4 py-3"
      >
        <ExternalLink size={18} color="#6366f1" />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-cta-accent">
            View original disclosure
          </Text>
          <Text className="text-xs text-gray-600 dark:text-gray-400">
            {trade.source}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
