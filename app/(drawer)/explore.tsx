// Explore entry point -- choose whose filings to explore.
//
// Explore itself is member-scoped (/explore/[name]); this is the one-tap
// doorway to it from launch, so the interactive surface is not buried behind
// having to search for someone first (§12/§26).
//
// Saved members come first because that is the user's own collection. Below
// them, currently active filers from the live feed give a first-run user
// something real to open immediately -- no seeded placeholder data.
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChartLine, ChevronRight } from "lucide-react-native";

import { useSavedStore } from "@/features/saved/store";
import { useFeaturedMembers } from "@/features/members/api/featured";
import { displayName } from "@/lib/util/display";
import { ctaColors } from "@/lib/theme/tokens";

type Row = {
  name: string;
  subtitle: string;
  photoUrl: string | null;
  saved: boolean;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ExplorePickerScreen() {
  const router = useRouter();
  const items = useSavedStore((s) => s.items);
  const { data: featured, isLoading, isError } = useFeaturedMembers();

  const savedRows: Row[] = items
    .filter((i) => i.entityType === "member")
    .map((i) => ({
      name: i.entityId,
      subtitle: i.subtitle ?? "Saved",
      photoUrl: i.entityType === "member" ? (i.snapshot?.photo_url ?? null) : null,
      saved: true,
    }));

  const savedNames = new Set(savedRows.map((r) => r.name));
  const featuredRows: Row[] = (featured ?? [])
    .filter((m) => !savedNames.has(m.name))
    .map((m) => ({
      name: m.name,
      subtitle: [m.party, m.chamber, m.state].filter(Boolean).join(" · "),
      photoUrl: m.photo_url ?? null,
      saved: false,
    }));

  const rows = [...savedRows, ...featuredRows];

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <FlatList
        data={rows}
        keyExtractor={(r) => r.name}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListHeaderComponent={
          <View className="mb-3">
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Explore a member&apos;s filings
            </Text>
            <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Open an interactive timeline of what a member has reported: filter
              by year, sector or transaction type, and tap a month to narrow the
              records.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {isLoading
              ? "Loading members…"
              : isError
                ? "Couldn't load members right now. Save a member while online and they'll appear here."
                : "No members available yet."}
          </Text>
        }
        renderItem={({ item, index }) => (
          <View>
            {index === 0 && item.saved ? (
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Saved
              </Text>
            ) : null}
            {index === savedRows.length && !item.saved && savedRows.length > 0 ? (
              <Text className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Active filers
              </Text>
            ) : null}

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/explore/[name]",
                  params: { name: item.name },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Explore ${displayName(item.name)}'s filings`}
              className="min-h-11 flex-row items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              {item.photoUrl ? (
                <Image
                  source={{ uri: item.photoUrl }}
                  className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"
                />
              ) : (
                <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                  <Text className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    {initials(item.name)}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <Text
                  className="text-sm font-semibold text-gray-900 dark:text-gray-100"
                  numberOfLines={1}
                >
                  {displayName(item.name)}
                </Text>
                {item.subtitle ? (
                  <Text
                    className="text-xs text-gray-500 dark:text-gray-400"
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
              <ChartLine size={16} color={ctaColors.accent} />
              <ChevronRight size={16} color="#9ca3af" />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
