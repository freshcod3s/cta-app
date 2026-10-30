// The three workspace actions on a member profile: Save, Compare, Explore.
//
// This is the hinge of the whole workflow -- the point where browsing a
// public record turns into keeping and manipulating it. Sits directly under
// the profile header so it is visible without scrolling.
//
// Saving here also captures the offline snapshot, because the profile has
// already loaded by the time this renders.
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChartLine } from "lucide-react-native";

import { SaveMemberButton } from "@/features/saved/components/SaveMemberButton";
import { CompareToggleButton } from "@/features/compare/components/CompareToggleButton";
import { useSnapshotSync } from "@/features/saved/useSnapshotSync";
import { useSavedStore } from "@/features/saved/store";
import { snapshotFreshness } from "@/features/saved/freshness";
import type { MemberProfile } from "@/features/members/api/types";
import { displayName } from "@/lib/util/display";
import { ctaColors } from "@/lib/theme/tokens";

export function MemberActionBar({
  name,
  profile,
}: {
  name: string;
  profile?: MemberProfile | null;
}) {
  const router = useRouter();
  // Visiting a saved member's profile tops up their offline copy.
  useSnapshotSync(profile);

  const savedItem = useSavedStore((s) =>
    s.items.find((i) => i.entityType === "member" && i.entityId === name),
  );
  const fresh = savedItem
    ? snapshotFreshness(savedItem.snapshotUpdatedAt)
    : null;

  if (!name) return null;

  return (
    <View className="px-4 pb-1 pt-3">
      <View className="flex-row gap-2">
        <SaveMemberButton name={name} profile={profile} />
        <CompareToggleButton name={name} />
        <Pressable
          onPress={() =>
            router.push({ pathname: "/explore/[name]", params: { name } })
          }
          accessibilityRole="button"
          accessibilityLabel={`Explore ${displayName(name)}'s filings on an interactive timeline`}
          className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 dark:border-gray-600 dark:bg-gray-800"
        >
          <ChartLine size={16} color={ctaColors.accent} />
          <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Explore
          </Text>
        </Pressable>
      </View>

      {fresh?.offlineReady ? (
        <Text className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
          {fresh.label}
        </Text>
      ) : null}
    </View>
  );
}
