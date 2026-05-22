// Push-notification registration flow (CTA-App-1-6 -- replaces the
// CTA-App-1-1 stub).
//
// Token persistence: expo-secure-store key 'cta.push.token'.
// Platform support: iOS + Android only. Other Platform.OS values
// (web/macos/windows) return 'unsupported_platform' rather than fail.
//
// Permission UX: NEVER requested on app launch. Settings screen drives
// registerForPushNotifications() in response to the user toggling push
// on. If permission was previously denied, the OS will refuse to show
// the prompt again until the user opens system Settings -- the caller
// is responsible for surfacing the "Open OS Settings" affordance.
//
// Registration scope: anonymous broadcast in v1. subscription_prefs
// always omitted from POST body in this flow; targeted prefs ship in
// CTA-App-1-N.

import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

import { postPushToken, deletePushToken, PushApiError } from "./api";
import { useSettingsStore } from "@/features/settings/store";

const TOKEN_STORE_KEY = "cta.push.token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type RegisterErrorCode =
  | "unsupported_platform"
  | "not_a_device"
  | "permission_denied"
  | "no_project_id"
  | "rate_limited"
  | "invalid_token"
  | "invalid_platform"
  | "network"
  | "unknown";

export type RegisterResult =
  | { success: true }
  | { success: false; error: RegisterErrorCode };

export type UnregisterResult = { success: boolean };

export function getCurrentPlatform(): "ios" | "android" | null {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return null;
}

export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_STORE_KEY);
  } catch {
    return null;
  }
}

export async function storePushToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_STORE_KEY, token);
}

export async function clearStoredPushToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_STORE_KEY);
  } catch {
    // Already absent or simulator-only deletion error -- non-fatal.
  }
}

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("trades", {
    name: "trades",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function ensurePermissionGranted(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return true;
  if (!existing.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

function pushApiErrorToCode(e: PushApiError): RegisterErrorCode {
  switch (e.code) {
    case "rate_limited":
    case "invalid_token":
    case "invalid_platform":
    case "network":
      return e.code;
    default:
      return "unknown";
  }
}

/**
 * Full registration pipeline:
 *   1. Platform guard (iOS+Android only)
 *   2. Device guard (Expo Go simulator returns false from Device.isDevice
 *      on web; real iPhone simulator returns true on iOS sim, but Expo
 *      Push tokens are not issued for iOS simulator -- we still try and
 *      let getExpoPushTokenAsync surface that.)
 *   3. Permission grant (request only if not already decided)
 *   4. Get Expo Push token
 *   5. POST to backend
 *   6. Persist token in secure-store on success
 */
export async function registerForPushNotifications(): Promise<RegisterResult> {
  const platform = getCurrentPlatform();
  if (!platform) {
    return { success: false, error: "unsupported_platform" };
  }

  if (!Device.isDevice) {
    return { success: false, error: "not_a_device" };
  }

  await ensureAndroidChannel();

  const granted = await ensurePermissionGranted();
  if (!granted) {
    return { success: false, error: "permission_denied" };
  }

  const projectId = getProjectId();
  if (!projectId) {
    return { success: false, error: "no_project_id" };
  }

  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return { success: false, error: "unknown" };
  }

  // CTA-App-1-7: ship the current subscriptionPrefs alongside the
  // initial registration. New users hydrate to {members:[]}, but
  // users who previously subscribed and turned push off + on again
  // get their watched-member list re-applied transparently.
  const prefs = useSettingsStore.getState().subscriptionPrefs;
  try {
    await postPushToken(token, platform, prefs as unknown as Record<string, unknown>);
  } catch (e) {
    if (e instanceof PushApiError) {
      return { success: false, error: pushApiErrorToCode(e) };
    }
    return { success: false, error: "unknown" };
  }

  await storePushToken(token);
  return { success: true };
}

/**
 * Best-effort unregister. The backend DELETE result doesn't gate
 * success: even if the row was already gone, the client cleared its
 * stored token, which is what "off" means from the user's perspective.
 */
export async function unregisterPushNotifications(): Promise<UnregisterResult> {
  const stored = await getStoredPushToken();
  if (stored) {
    try {
      await deletePushToken(stored);
    } catch {
      // Network/server failures are non-fatal here; we still want to
      // clear local state so the toggle stays consistent.
    }
  }
  await clearStoredPushToken();
  return { success: true };
}

/**
 * Foreground re-sync. Called on app resume when settings.pushEnabled is
 * true. If a token is stored, re-POST it (backend updates last_seen).
 * If missing -- e.g. token rotated or store cleared -- run the full
 * register flow.
 *
 * Errors are swallowed: foreground re-sync is best-effort observability
 * and shouldn't surface user-facing errors.
 */
export async function syncPushRegistration(): Promise<void> {
  const platform = getCurrentPlatform();
  if (!platform) return;

  const stored = await getStoredPushToken();
  if (!stored) {
    await registerForPushNotifications();
    return;
  }

  // Read prefs at call time so a foreground re-sync immediately picks
  // up the latest subscription state -- avoids stale closure capture.
  const prefs = useSettingsStore.getState().subscriptionPrefs;
  try {
    await postPushToken(stored, platform, prefs as unknown as Record<string, unknown>);
  } catch {
    // Token may be rotated or invalidated server-side. Try a full
    // re-register; if it fails we'll catch on next sync.
    try {
      await registerForPushNotifications();
    } catch {
      /* best-effort */
    }
  }
}
