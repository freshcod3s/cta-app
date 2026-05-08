// CTA-App-1-7: per-member subscribe pill on Trade detail.
//
// Two visual states (cta-accent token from CTA-App-1-4):
//   Subscribe   -> outlined: cta-accent border, transparent fill, indigo text
//   Subscribed  -> filled:    cta-accent fill, white text, Bell icon
//
// Push gate: when settings.pushEnabled is false, tap fires an Alert
// with an "Open Settings" path that routes the user to /settings.
// Discovery > friction; the Alert is the right level of redirect for
// a feature that requires a one-time toggle elsewhere.
//
// Optimistic state with rollback on failure: store flip first, POST
// in background; on PushApiError revert and surface inline error.
// Idempotency: unchanged when already in the desired state (covered
// by toggleMemberSubscription's array logic; not re-enforced here).
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Bell, BellPlus } from "lucide-react-native";

import type { TradeRecord } from "@/features/trades/api/types";
import { useSettingsStore } from "@/features/settings/store";
import { getCurrentPlatform, getStoredPushToken } from "@/lib/push/register";
import { syncSubscriptionPrefs, PushApiError } from "@/lib/push/api";
import { ctaColors } from "@/lib/theme/tokens";

type Props = { trade: TradeRecord };

function errorMessage(e: unknown): string {
  if (e instanceof PushApiError) {
    if (e.code === "rate_limited") return "Too many updates. Try again in an hour.";
    if (e.code === "network") return "Network error. Check your connection.";
  }
  return "Couldn't update subscription.";
}

export function SubscribeButton({ trade }: Props) {
  const router = useRouter();
  const pushEnabled = useSettingsStore((s) => s.pushEnabled);
  const isSubscribed = useSettingsStore((s) =>
    s.isSubscribedToMember(trade.politician),
  );
  const toggleMember = useSettingsStore((s) => s.toggleMemberSubscription);

  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [storedToken, setStoredToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getStoredPushToken().then((t) => {
      if (active) setStoredToken(t);
    });
    return () => {
      active = false;
    };
  }, [pushEnabled]);

  const promptEnable = () => {
    Alert.alert(
      "Notifications off",
      "Enable push notifications in Settings to subscribe to a member's trades.",
      [
        { text: "Open Settings", onPress: () => router.push("/settings") },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const onPress = async () => {
    if (busy) return;
    setErrorText(null);

    if (!pushEnabled) {
      promptEnable();
      return;
    }

    const platform = getCurrentPlatform();
    if (!platform || !storedToken) {
      // Store says pushEnabled=true but no local token -- this is the
      // "settings drift" branch. Force the user back to Settings to
      // re-register; the foreground sync would normally heal this but
      // we don't want a silent no-op on tap.
      promptEnable();
      return;
    }

    // Optimistic local toggle.
    toggleMember(trade.politician);
    const newState = !isSubscribed;

    setBusy(true);
    try {
      const prefs = useSettingsStore.getState().subscriptionPrefs;
      await syncSubscriptionPrefs(storedToken, platform, prefs);
    } catch (e) {
      // Rollback.
      toggleMember(trade.politician);
      setErrorText(errorMessage(e));
      void newState;
    } finally {
      setBusy(false);
    }
  };

  const filledClass = "bg-cta-accent border-cta-accent";
  const outlinedClass = "bg-transparent border-cta-accent";
  const containerClass = isSubscribed ? filledClass : outlinedClass;

  const labelClass = isSubscribed ? "text-white" : "text-cta-accent";
  const iconColor = isSubscribed ? "#ffffff" : ctaColors.accent;

  return (
    <View className="px-4 pt-1 pb-2">
      <Pressable
        onPress={onPress}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={
          isSubscribed
            ? `Unsubscribe from ${trade.politician}'s trades`
            : `Subscribe to ${trade.politician}'s trades`
        }
        accessibilityState={{ selected: isSubscribed, busy }}
        className={`min-h-[44px] flex-row items-center justify-center gap-2 rounded-full border px-4 py-2 ${containerClass} ${busy ? "opacity-60" : ""}`}
      >
        {isSubscribed ? (
          <Bell size={16} color={iconColor} />
        ) : (
          <BellPlus size={16} color={iconColor} />
        )}
        <Text className={`text-sm font-semibold ${labelClass}`}>
          {isSubscribed ? "Subscribed" : "Subscribe to alerts"}
        </Text>
      </Pressable>

      {errorText ? (
        <Text className="mt-1.5 text-center text-xs text-cta-sell">
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}
