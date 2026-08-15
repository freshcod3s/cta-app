// MethodologyFooter -- small link to the Methodology drawer screen so the
// user has explicit context for what "late" + amount-range mean. Tapping
// navigates back through the drawer routing tree.
import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

export function MethodologyFooter() {
  return (
    <View className="px-4 py-6">
      <Link href="/methodology" asChild>
        <Pressable accessibilityRole="link" hitSlop={8}>
          <Text className="text-center text-xs text-gray-500 dark:text-gray-400">
            How is this data sourced and classified?{" "}
            <Text className="text-cta-accent underline">Methodology</Text>
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
