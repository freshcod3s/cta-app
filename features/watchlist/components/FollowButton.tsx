// FollowButton -- reusable star toggle that follows / unfollows a member.
//
// Civic-transparency framing: "following" a member means tracking their
// disclosures for accountability, NOT building a copy-trade portfolio.
// Label/a11y copy stays in that register ("Follow", "Following") -- never
// "watch this trader for signal" or similar fintech language.
//
// Client state only: wraps the settings store's existing
// toggleMemberSubscription / isSubscribedToMember (Zustand + AsyncStorage,
// CTA-App-1-7). It is the SAME persisted set the per-member Subscribe pill
// uses, so a member followed here shows as subscribed there and vice
// versa -- one canonical "followed members" list, no duplicate store.
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

import { useSettingsStore } from "@/features/settings/store";
import { ctaColors } from "@/lib/theme/tokens";

type Props = {
  // Member name as it appears in trade.politician -- the canonical key the
  // settings store de-dupes on. Caller passes the raw API string.
  politician: string;
  size?: "sm" | "md";
};

export function FollowButton({ politician, size = "sm" }: Props) {
  const following = useSettingsStore((s) => s.isSubscribedToMember(politician));
  const toggle = useSettingsStore((s) => s.toggleMemberSubscription);

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
