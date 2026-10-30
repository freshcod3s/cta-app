// Saved -- the on-device workspace.
//
// Route path stays /(drawer)/watchlist so existing links keep resolving; the
// user-facing name everywhere is "Saved". This screen is the durable half of
// the product: the feed is what is happening, Saved is what you decided to
// keep.
//
// It is not a bookmark list. Per saved member it shows how much material is
// held, the period covered, that member's filing promptness, and whether the
// on-device copy is current -- and it is where a comparison gets assembled.
//
// Saved state is local and unauthenticated (Product Invariant #7). Nothing
// here promises alerts: per-entity push targeting has no backend in this
// build, so no copy on this screen mentions notifications.
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";

import { useSavedStore } from "@/features/saved/store";
import { useCompareStore, MIN_COMPARE } from "@/features/compare/store";
import { SavedMemberRow } from "@/features/saved/components/SavedMemberRow";
import { SavedTradeRow } from "@/features/saved/components/SavedTradeRow";
import { SuggestedMembers } from "@/features/watchlist/components/SuggestedMembers";
import type { SavedMember, SavedTrade } from "@/features/saved/types";
import { ctaColors } from "@/lib/theme/tokens";

type Tab = "members" | "records";

function EmptyState() {
  const router = useRouter();
  return (
    // Scrolls because the suggestion list can outgrow a short screen; the
    // flexGrow/justifyContent pair keeps the original centred layout when
    // suggestions are absent (offline, or the endpoint failed).
    <ScrollView
      className="px-8"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 24 }}
    >
      <View className="items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Star size={28} color={ctaColors.late} />
        </View>
        <Text className="text-center text-base font-semibold text-gray-900 dark:text-gray-100">
          Nothing saved yet
        </Text>
        <Text className="mt-1.5 text-center text-sm text-gray-600 dark:text-gray-400">
          Save a member or a filing to build a collection you can explore,
          compare, and open again without a connection.
        </Text>
        <Pressable
          onPress={() => router.push("/(drawer)")}
          accessibilityRole="button"
          className="mt-5 rounded-lg bg-cta-accent px-5 py-3"
        >
          <Text className="font-semibold text-white">Go to the Feed</Text>
        </Pressable>

        <SuggestedMembers />
      </View>
    </ScrollView>
  );
}

function SegTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      className={`min-h-11 flex-1 items-center justify-center rounded-lg px-3 py-2 ${
        active ? "bg-white shadow-sm dark:bg-gray-700" : ""
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          active
            ? "text-gray-900 dark:text-gray-100"
            : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Sticky action bar: appears as soon as anything is queued for comparison,
// so the path from "I saved some people" to "show me them side by side" is
// visible rather than remembered.
function CompareBar() {
  const router = useRouter();
  const selected = useCompareStore((s) => s.selected);
  const clear = useCompareStore((s) => s.clear);
  if (selected.length === 0) return null;

  const ready = selected.length >= MIN_COMPARE;

  return (
    <View className="flex-row items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
      <Text className="flex-1 text-xs text-gray-700 dark:text-gray-300">
        {selected.length} selected
        {ready ? "" : ` · pick ${MIN_COMPARE - selected.length} more to compare`}
      </Text>
      <Pressable
        onPress={clear}
        accessibilityRole="button"
        accessibilityLabel="Clear the compare selection"
        className="min-h-11 justify-center px-2"
      >
        <Text className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          Clear
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/(drawer)/compare")}
        disabled={!ready}
        accessibilityRole="button"
        accessibilityState={{ disabled: !ready }}
        accessibilityLabel={
          ready
            ? `Compare ${selected.length} members`
            : `Compare needs at least ${MIN_COMPARE} members`
        }
        className={`min-h-11 justify-center rounded-lg bg-cta-accent px-4 ${ready ? "" : "opacity-40"}`}
      >
        <Text className="text-sm font-semibold text-white">Compare</Text>
      </Pressable>
    </View>
  );
}

export default function SavedScreen() {
  const items = useSavedStore((s) => s.items);
  const [tab, setTab] = useState<Tab>("members");

  // Newest save first, and split once rather than filtering twice per render.
  const { members, records } = useMemo(() => {
    const m: SavedMember[] = [];
    const r: SavedTrade[] = [];
    for (const i of items) {
      if (i.entityType === "member") m.push(i);
      else r.push(i);
    }
    const bySavedAtDesc = <T extends { savedAt: string }>(a: T, b: T) =>
      (b.savedAt ?? "").localeCompare(a.savedAt ?? "");
    return { members: m.sort(bySavedAtDesc), records: r.sort(bySavedAtDesc) };
  }, [items]);

  if (items.length === 0) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50 dark:bg-gray-950">
        <EmptyState />
      </SafeAreaView>
    );
  }

  const showingMembers = tab === "members";

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="flex-row gap-1 rounded-xl bg-gray-100 p-1 mx-4 mt-3 dark:bg-gray-800">
        <SegTab
          label={`Members (${members.length})`}
          active={showingMembers}
          onPress={() => setTab("members")}
        />
        <SegTab
          label={`Filings (${records.length})`}
          active={!showingMembers}
          onPress={() => setTab("records")}
        />
      </View>

      {showingMembers ? <CompareBar /> : null}

      {showingMembers ? (
        <FlatList
          data={members}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <SavedMemberRow item={item} />}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{ padding: 16 }}
          // Virtualized: a heavy saver can hold hundreds of rows.
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <Text className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No saved members yet. Tap the star on any member to add one.
            </Text>
          }
        />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <SavedTradeRow item={item} />}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{ padding: 16 }}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <Text className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No saved filings yet. Open any filing and tap Save to keep a copy
              here, readable offline.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
