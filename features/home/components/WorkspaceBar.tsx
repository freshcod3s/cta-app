// Workspace bar -- Saved / Explore / Compare, one tap from launch.
//
// The app uses a drawer, so without this every interactive surface would sit
// behind the hamburger. That is the failure mode §12 names: a reviewer (or a
// new user) opens the app, sees a feed, and never discovers that the product
// is a workspace. Pinned above the feed list rather than inside its header,
// so it stays visible while filtering and scrolling.
//
// Saved shows a live count, which doubles as the signal that saving does
// something durable.
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChartLine, Columns3, Star } from "lucide-react-native";

import { useSavedStore } from "@/features/saved/store";
import { useCompareStore } from "@/features/compare/store";
import { ctaColors } from "@/lib/theme/tokens";

function Item({
  label,
  count,
  icon,
  onPress,
  a11y,
}: {
  label: string;
  count?: number;
  icon: React.ReactNode;
  onPress: () => void;
  a11y: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      className="min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-2 dark:border-gray-700 dark:bg-gray-800"
    >
      {icon}
      <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">
        {label}
      </Text>
      {count != null && count > 0 ? (
        <View
          className="min-w-5 items-center justify-center rounded-full px-1.5"
          style={{ backgroundColor: ctaColors.accent }}
        >
          <Text className="text-[10px] font-bold text-white">{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function WorkspaceBar() {
  const router = useRouter();
  const savedCount = useSavedStore((s) => s.items.length);
  const compareCount = useCompareStore((s) => s.selected.length);

  return (
    <View className="flex-row gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-950">
      <Item
        label="Saved"
        count={savedCount}
        a11y={
          savedCount > 0
            ? `Saved workspace, ${savedCount} items`
            : "Saved workspace, empty"
        }
        icon={<Star size={15} color={ctaColors.late} />}
        onPress={() => router.push("/(drawer)/watchlist")}
      />
      <Item
        label="Explore"
        a11y="Explore a member's filings"
        icon={<ChartLine size={15} color={ctaColors.accent} />}
        onPress={() => router.push("/(drawer)/explore")}
      />
      <Item
        label="Compare"
        count={compareCount}
        a11y={
          compareCount > 0
            ? `Compare, ${compareCount} members selected`
            : "Compare members side by side"
        }
        icon={<Columns3 size={15} color={ctaColors.accent} />}
        onPress={() => router.push("/(drawer)/compare")}
      />
    </View>
  );
}
