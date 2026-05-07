// About placeholder. Real copy (mission, methodology summary, contact)
// lands in CTA-App-1-9.
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 p-6">
        <Text className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          About
        </Text>
        <Text className="text-base text-gray-700 dark:text-gray-300">
          Congress Trade Alerts -- a STOCK Act compliance tracker.
        </Text>
        <Text className="mt-6 text-xs uppercase text-gray-500 dark:text-gray-400">
          Real content -- CTA-App-1-9
        </Text>
      </View>
    </SafeAreaView>
  );
}
