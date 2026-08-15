// FollowTickerButton -- reusable star toggle that follows / unfollows a ticker.
//
// Civic-transparency framing: "following" a ticker means tracking disclosed
// congressional trades in that security for accountability, NOT building a
// copy-trade portfolio. Label/a11y copy stays in that register ("Follow",
// "Following") -- never "watch this for a signal" or similar fintech language.
//
// Client state only: wraps the settings store's toggleTickerSubscription /
// isSubscribedToTicker (Zustand + AsyncStorage). The store uppercases symbols,
// so the followed set matches the worker's uppercase trade.ticker in the
// targeted-push filter (subscription_prefs.tickers[]). It is the SAME persisted
// set the push dispatcher reads -- one canonical "followed tickers" list.
//
// Mirrors features/watchlist/components/FollowButton (the member version);
// kept separate per repo precedent (distinct domain key, no abstraction until
// a 3rd follow-type appears) rather than generalized at two consumers.
//
// Two sizes:
//   "sm" -> 18pt icon, for inline use inside a list row.
//   "md" -> 22pt icon, for a screen header (e.g. the ticker detail header).
import { Pressable } from "react-native";
import { Star } from "lucide-react-native";

import { useSettingsStore } from "@/features/settings/store";
import { ctaColors } from "@/lib/theme/tokens";

type Props = {
  // Ticker symbol; the store uppercases it as the de-dupe key.
  symbol: string;
  size?: "sm" | "md";
};

export function FollowTickerButton({ symbol, size = "sm" }: Props) {
  const following = useSettingsStore((s) => s.isSubscribedToTicker(symbol));
  const toggle = useSettingsStore((s) => s.toggleTickerSubscription);

  const iconSize = size === "md" ? 22 : 18;
  // Filled amber star when following; hollow gray when not. Amber reuses the
  // cta-late token hue so "active" reads as one brand accent (matches the
  // member FollowButton).
  const color = following ? ctaColors.late : "#9ca3af"; // gray-400
  const fill = following ? ctaColors.late : "none";

  return (
    <Pressable
      onPress={() => toggle(symbol)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: following }}
      accessibilityLabel={following ? `Unfollow ${symbol}` : `Follow ${symbol}`}
      className={`items-center justify-center ${size === "md" ? "h-11 w-11" : "h-8 w-8"}`}
    >
      <Star size={iconSize} color={color} fill={fill} />
    </Pressable>
  );
}
