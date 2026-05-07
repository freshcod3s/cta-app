// Settings placeholder. Push prefs + theme override + account land in
// CTA-App-1-7.
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 p-6">
        <Text className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </Text>
        <Text className="text-base text-gray-700 dark:text-gray-300">
          Push notification preferences, theme, account.
        </Text>
        <Text className="mt-6 text-xs uppercase text-gray-500 dark:text-gray-400">
          Real content -- CTA-App-1-7
        </Text>
      </View>
    </SafeAreaView>
  );
}
