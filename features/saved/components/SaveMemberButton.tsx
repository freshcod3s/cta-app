// Save / Saved toggle for a member, with the offline consequence stated.
//
// Immediately reversible, visually unambiguous, and honest about what it
// does: when a profile has loaded it stores a snapshot, stamped with when
// that profile's data was fetched, so the label can promise offline access. When the host screen has no profile in hand
// (trade detail), the save takes effect at once and the profile is fetched
// behind it, so the snapshot lands moments later; if that fetch fails the
// save stands and the row says "open once while online".
//
// It never mentions alerts, although a save does target push: the saved
// store mirrors saved members into settings subscriptionPrefs.members, the
// app posts those prefs with its push token (lib/push/register.ts, on each
// foreground), and the Worker's selectTokensForTrade sends a member's trades
// only to tokens that saved them. That holds only once push is on and the
// next sync has run, so the button promises offline access and nothing more.
import { Pressable, Text, View } from "react-native";
import { Star } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";

import { useSavedStore } from "@/features/saved/store";
import {
  fetchMemberProfile,
  profileRetrievedAt,
} from "@/features/members/api/queries";
import type { MemberProfile } from "@/features/members/api/types";
import { displayName } from "@/lib/util/display";
import { ctaColors } from "@/lib/theme/tokens";

export function SaveMemberButton({
  name,
  profile,
}: {
  name: string;
  profile?: MemberProfile | null;
}) {
  const saved = useSavedStore((s) => s.isSaved("member", name));
  const toggle = useSavedStore((s) => s.toggleMember);
  const saveWithSnapshot = useSavedStore((s) => s.saveMemberWithSnapshot);
  const queryClient = useQueryClient();
  const label = displayName(name);

  const onPress = () => {
    // Removal, or a save from a screen that already holds the profile: the
    // snapshot is captured in the same gesture.
    if (saved || profile) {
      toggle(profile ?? name, profile ? profileRetrievedAt(queryClient, name) : null);
      return;
    }
    // Name only: save now, fetch through the shared profile cache, and let
    // the snapshot land when the profile arrives, stamped with its own
    // retrieval time.
    void saveWithSnapshot(name, () =>
      fetchMemberProfile(queryClient, name).then((p) => ({
        profile: p,
        retrievedAt: profileRetrievedAt(queryClient, name),
      })),
    );
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={
        saved ? `Remove ${label} from saved` : `Save ${label} for offline use`
      }
      className={`min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg px-4 ${
        saved
          ? "bg-cta-accent"
          : "border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
      }`}
    >
      <Star
        size={16}
        color={saved ? "#ffffff" : ctaColors.late}
        fill={saved ? "#ffffff" : "none"}
      />
      <View>
        <Text
          className={`text-sm font-semibold ${
            saved ? "text-white" : "text-gray-800 dark:text-gray-200"
          }`}
        >
          {saved ? "Saved" : "Save"}
        </Text>
      </View>
    </Pressable>
  );
}
