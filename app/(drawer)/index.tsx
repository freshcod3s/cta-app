// Feed -- primary surface (CTA-App-1-3 IA pivot from tabs to single-feed).
// Header bar (hamburger + title + account) is provided by the drawer's
// screenOptions in (drawer)/_layout.tsx. This screen renders the body
// only -- stats banner placeholder, feed list placeholder, debug
// stack-push to /trade/test, and the bottom-right Search FAB.
//
// Real implementations land in CTA-App-1-5 (stats + feed) and CTA-App-1-N
// (search). FAB stub here exists so the bottom-right surface area is
// claimed by the right control before real search lands.
import { Pressable, Text, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Search } from "lucide-react-native";

export default function FeedScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 p-4">
        <View className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <Text className="mb-1 text-xs uppercase text-gray-500 dark:text-gray-400">
            Stats banner placeholder
          </Text>
          <Text className="text-base text-gray-700 dark:text-gray-300">
            4-panel accountability data -- CTA-App-1-5
          </Text>
        </View>

        <View className="mb-4 flex-1 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <Text className="mb-1 text-xs uppercase text-gray-500 dark:text-gray-400">
            Feed list placeholder
          </Text>
          <Text className="mb-3 text-base text-gray-700 dark:text-gray-300">
            Chronological trades -- CTA-App-1-5
          </Text>

          <Link href="/trade/test" asChild>
            <Pressable className="rounded-lg bg-indigo-500 px-4 py-2">
              <Text className="text-center font-semibold text-white">
                Debug: Open trade detail (/trade/test)
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search"
        onPress={() =>
          Alert.alert("Search", "Search ships in CTA-App-1-N")
        }
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-indigo-500 shadow-lg"
        style={{ elevation: 6 }}
      >
        <Search size={26} color="#ffffff" />
      </Pressable>
    </SafeAreaView>
  );
}
