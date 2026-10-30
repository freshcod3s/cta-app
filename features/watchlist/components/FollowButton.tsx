// FollowButton -- reusable star toggle that follows / unfollows a member.
//
// Civic-transparency framing: "following" a member means tracking their
// disclosures for accountability, NOT building a copy-trade portfolio.
// Label/a11y copy stays in that register ("Follow", "Following") -- never
// "watch this trader for signal" or similar fintech language.
//
// Client state only: writes through the Saved workspace store (Zustand +
// AsyncStorage). That store is now the single write path for the saved
// member set and keeps settings.subscriptionPrefs.members[] -- the worker's
// push-targeting contract -- as a mirror. Starring a member here, saving one
// from a profile, and the per-member Subscribe pill all move the SAME
// collection; there is no second list.
//
// This is purely a local-list toggle: it does NOT touch push registration
// (that is the Subscribe pill's job on the detail screen, which also needs
// a push token + server sync). Following is the lightweight, unauth-safe
// action per Product Invariant #7 (local AsyncStorage watchlist).
//
// Two sizes:
//   "sm" -> 18pt icon, for inline use inside a TradeRow / list row.
//   "md" -> 22pt icon, for a screen header or a member card.
import { Pressable } from "react-native";
import { Star } from "lucide-react-native";

import { useSavedStore } from "@/features/saved/store";
import { ctaColors } from "@/lib/theme/tokens";

type Props = {
  // Member name as it appears in trade.politician -- the canonical key the
  // settings store de-dupes on. Caller passes the raw API string.
  politician: string;
  size?: "sm" | "md";
};

export function FollowButton({ politician, size = "sm" }: Props) {
  const following = useSavedStore((s) => s.isSaved("member", politician));
  const toggle = useSavedStore((s) => s.toggleMember);

  const iconSize = size === "md" ? 22 : 18;
  // Filled amber star when following; hollow gray when not. Amber reuses
  // the cta-late token hue so the "active" affordance reads as a single
  // brand accent rather than an arbitrary yellow.
  const color = following ? ctaColors.late : "#9ca3af"; // gray-400
  const fill = following ? ctaColors.late : "none";

  return (
    <Pressable
      onPress={() => toggle(politician)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: following }}
      accessibilityLabel={
        following ? `Unfollow ${politician}` : `Follow ${politician}`
      }
      className={`items-center justify-center ${size === "md" ? "h-11 w-11" : "h-8 w-8"}`}
    >
      <Star size={iconSize} color={color} fill={fill} />
    </Pressable>
  );
}
