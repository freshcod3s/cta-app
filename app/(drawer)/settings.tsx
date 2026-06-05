// Settings -- push notification preferences (CTA-App-1-6) + Upgrade-to-Pro
// affordance (billing slice). Theme override + account UI land in later
// tickets.
//
// The Switch drives both the store flag AND the registration side
// effects. Permission-denied (sticky) shows the "Open OS Settings"
// affordance instead of the toggle path.
//
// Subscription section: per Product Invariant #1, the Upgrade button opens
// the website's external Stripe Checkout in the system browser (see
// UpgradeButton). No in-app payment UI, no IAP.
import { useEffect, useState } from "react";
import { Linking, Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { useSettingsStore } from "@/features/settings/store";
import {
  getStoredPushToken,
  registerForPushNotifications,
  unregisterPushNotifications,
  type RegisterErrorCode,
} from "@/lib/push/register";
import { UpgradeButton } from "@/features/billing/components/UpgradeButton";
import * as Localization from "expo-localization";

// US App Store storefront gate for the Upgrade button. Apple's 3.1.1(a)
// external-purchase carveout (2025 US court order) permits the web Stripe
// Checkout link ONLY on the US storefront; EU + rest-of-world still require
// IAP, so we hide the whole Subscription section off-US. regionCode is a
// cross-platform proxy for the storefront -- production-accurate detection
// would need the native SKStorefront API, but the reviewer's device locale
// equals their storefront, so regionCode is sufficient for App Review safety.
// Default to HIDE on null/undefined/unknown (conservative).
const isUS = Localization.getLocales()[0]?.regionCode === "US";

const DEV = Constants.expoConfig?.extra?.eas?.projectId
  ? typeof __DEV__ !== "undefined" && __DEV__
  : false;

function errorMessage(code: RegisterErrorCode): string {
  switch (code) {
    case "unsupported_platform":
      return "Push notifications are only supported on iOS and Android.";
    case "not_a_device":
      return "Push notifications require a physical device (simulator unsupported).";
    case "no_project_id":
      return "Project not configured for push (eas init missing). Contact support.";
    case "rate_limited":
      return "Too many registration attempts. Try again in an hour.";
    case "invalid_token":
    case "invalid_platform":
      return "Registration rejected by server. Try again later.";
    case "network":
      return "Network error. Check your connection and try again.";
    default:
      return "Registration failed. Try again later.";
  }
}

export default function SettingsScreen() {
  const pushEnabled = useSettingsStore((s) => s.pushEnabled);
  const pushPermissionDenied = useSettingsStore(
    (s) => s.pushPermissionDenied,
  );
  const setPushEnabled = useSettingsStore((s) => s.setPushEnabled);
  const setPushPermissionDenied = useSettingsStore(
    (s) => s.setPushPermissionDenied,
  );

  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [storedTokenSuffix, setStoredTokenSuffix] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    getStoredPushToken().then((t) => {
      if (!active) return;
      setStoredTokenSuffix(t ? t.slice(-9, -1) : null);
    });
    return () => {
      active = false;
    };
  }, [pushEnabled]);

  const onToggle = async (next: boolean) => {
    if (busy) return;
    setErrorText(null);
    setBusy(true);
    try {
      if (next) {
        const r = await registerForPushNotifications();
        if (r.success) {
          setPushEnabled(true);
          setPushPermissionDenied(false);
        } else if (r.error === "permission_denied") {
          setPushPermissionDenied(true);
          setPushEnabled(false);
        } else {
          setErrorText(errorMessage(r.error));
          setPushEnabled(false);
        }
      } else {
        await unregisterPushNotifications();
        setPushEnabled(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const openSystemSettings = () => {
    Linking.openSettings().catch(() => {
      /* swallow -- some platforms refuse; user has to navigate manually. */
    });
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 p-6">
        <Text className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Notifications
        </Text>

        <View className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <View className="flex-1 pr-3">
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Push notifications
            </Text>
            <Text className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              Alerts when Congress files new stock trades or hits compliance milestones.
            </Text>
          </View>
          <Switch
            value={pushEnabled && !pushPermissionDenied}
            onValueChange={onToggle}
            disabled={busy || pushPermissionDenied}
          />
        </View>

        <View className="mt-3">
          {pushPermissionDenied ? (
            <Pressable
              onPress={openSystemSettings}
              accessibilityRole="button"
              className="flex-row items-center gap-2"
            >
              <View className="h-2 w-2 rounded-full bg-cta-sell" />
              <Text className="text-sm text-cta-sell underline">
                Permission denied -- open OS Settings
              </Text>
            </Pressable>
          ) : pushEnabled && storedTokenSuffix ? (
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-cta-buy" />
              <Text className="text-sm text-gray-700 dark:text-gray-300">
                Registered
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-gray-400" />
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Not registered
              </Text>
            </View>
          )}
        </View>

        {errorText ? (
          <Text className="mt-3 text-xs text-cta-sell">{errorText}</Text>
        ) : null}

        {DEV && storedTokenSuffix ? (
          <Text className="mt-6 text-[10px] text-gray-400">
            dev: token ...{storedTokenSuffix}
          </Text>
        ) : null}

        {isUS && (
          <>
            <Text className="mb-4 mt-8 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Subscription
            </Text>
            <View className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-700 dark:bg-gray-800">
              <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Congress Trade Alerts Pro
              </Text>
              <Text className="mb-3 mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                Real-time disclosures and Pro features. Secure checkout opens in
                your browser -- never in the app.
              </Text>
              <UpgradeButton />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
