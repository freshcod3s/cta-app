// UpgradeButton -- opens the website's external Stripe Checkout flow in the
// system browser (Product Invariant #1: subscription billing is ALWAYS web
// Stripe Checkout via expo-web-browser -- never IAP, never in-WebView, never
// a custom in-app payment UI). The web flow (UPGRADE_URL -> ?upgrade=1 modal)
// collects email + tier and redirects to Stripe; the app only opens the URL.
//
// openBrowserAsync presents a system browser (SFSafariViewController on iOS,
// Custom Tab on Android) and resolves when the user dismisses it, so `busy`
// spans the presentation and clears on return. A failed open surfaces a
// non-fatal inline error rather than throwing.
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Sparkles } from "lucide-react-native";

import { UPGRADE_URL } from "@/lib/constants/links";

export function UpgradeButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPress = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await WebBrowser.openBrowserAsync(UPGRADE_URL);
    } catch {
      setError(
        "Couldn't open the upgrade page. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <Pressable
        onPress={onPress}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: busy, busy }}
        accessibilityLabel="Upgrade to Pro -- opens secure checkout in your browser"
        style={{ opacity: busy ? 0.6 : 1 }}
        className="flex-row items-center justify-center gap-2 rounded-xl bg-cta-accent px-4 py-3"
      >
        {busy ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Sparkles size={18} color="#ffffff" />
        )}
        <Text className="text-base font-semibold text-white">
          {busy ? "Opening..." : "Upgrade to Pro"}
        </Text>
      </Pressable>
      {error ? (
        <Text className="mt-2 text-xs text-cta-sell">{error}</Text>
      ) : null}
    </View>
  );
}
