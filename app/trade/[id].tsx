// Trade detail placeholder. Stack-pushes from Feed AND is the deep-link
// target for push notifications via ctaapp://trade/{id}. Header is shown
// (configured at root Stack) so the back arrow appears automatically.
//
// Real content (member portrait, transaction summary, source link,
// methodology footer) lands in CTA-App-1-4.
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

export default function TradeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 p-6">
        <Text className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Trade detail
        </Text>
        <Text className="mb-1 text-sm text-gray-600 dark:text-gray-400">
          Trade id: {id ?? "(none)"}
        </Text>
        <Text className="mt-6 text-base text-gray-700 dark:text-gray-300">
          Member portrait, transaction summary, source link, methodology
          footer go here.
        </Text>
        <Text className="mt-6 text-xs uppercase text-gray-500 dark:text-gray-400">
          Real content -- CTA-App-1-4
        </Text>
      </View>
    </SafeAreaView>
  );
}
