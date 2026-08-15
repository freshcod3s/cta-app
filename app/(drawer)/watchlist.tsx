// Watchlist -- the members the user follows for accountability tracking.
//
// "Followed members" is CLIENT state: it is the settings store's
// subscriptionPrefs.members[] set (Zustand + AsyncStorage persist, the
// SAME list the per-member Subscribe pill and the FollowButton write to).
// Per Product Invariant #7, this list is local and works for free / unauth
// users -- no auth gate, no server round-trip to read it. We deliberately
// do NOT use the worker's KV-backed /api/watchlist (it needs a uid and is
// off the v1 critical path); the local set is the source of truth.
//
// Screen FSM (the followed-members list is local + synchronous, so there
// is no screen-level loading / error branch):
//   empty   -> no followed members yet -> prompt to follow from the Feed.
//   success -> FlatList<string> of MemberCard, one card per followed name.
// Each MemberCard owns its OWN server-state FSM (loading / error / empty /
// success) for that member's recent disclosures via useMemberRecentTrades,
// so a single slow/failing member never blanks the whole screen.
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";

import { useSettingsStore } from "@/features/settings/store";
import { MemberCard } from "@/features/watchlist/components/MemberCard";
import { ctaColors } from "@/lib/theme/tokens";

function EmptyState() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Star size={28} color={ctaColors.late} />
      </View>
      <Text className="text-center text-base font-semibold text-gray-900 dark:text-gray-100">
        You aren&apos;t following anyone yet
      </Text>
      <Text className="mt-1.5 text-center text-sm text-gray-600 dark:text-gray-400">
        Tap the star on any member in the Feed to follow their disclosures and
        keep them on this list.
      </Text>
      <Pressable
        onPress={() => router.push("/(drawer)")}
        accessibilityRole="button"
        className="mt-5 rounded-lg bg-cta-accent px-5 py-3"
      >
        <Text className="font-semibold text-white">Go to the Feed</Text>
      </Pressable>
    </View>
  );
}

export default function WatchlistScreen() {
  // Subscribe to the array reference; toggling a member produces a new
  // array (store uses immutable updates), so the list re-renders on follow
  // / unfollow without a manual refresh.
  const members = useSettingsStore((s) => s.subscriptionPrefs.members);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50 dark:bg-gray-950">
      {members.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(name) => name}
          renderItem={({ item }) => <MemberCard politician={item} />}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <Text className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {members.length === 1
                ? "Following 1 member"
                : `Following ${members.length} members`}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
