// Settings store -- Zustand with persist (AsyncStorage backend).
//
// Side-effect-free by design: setters only flip flags and arrays;
// the Settings screen + SubscribeButton orchestrate register /
// unregister / syncSubscriptionPrefs side effects on store changes.
// Avoids a circular dependency between the store and /lib/push.
//
// pushPermissionDenied is a sticky flag set when the OS permission
// prompt was denied with !canAskAgain. The Settings screen reads it
// to decide whether to show the "Open OS Settings" affordance.
//
// CTA-App-1-7 adds subscriptionPrefs.members[] with idempotent
// toggle semantics. The shape is the cross-repo contract from
// /features/settings/types.ts; the backend (CTA-N) reads the same
// JSON shape from push_tokens.subscription_prefs.
//
// Persist version 1 introduces subscriptionPrefs. The migrate hook
// preserves pre-existing pushEnabled / pushPermissionDenied state
// from v0 (no-version) blobs so users on older app versions don't
// lose their notification opt-in when the schema grows.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SubscriptionPrefs } from "./types";

interface SettingsState {
  pushEnabled: boolean;
  pushPermissionDenied: boolean;
  subscriptionPrefs: SubscriptionPrefs;
  setPushEnabled: (enabled: boolean) => void;
  setPushPermissionDenied: (denied: boolean) => void;
  toggleMemberSubscription: (politician: string) => void;
  isSubscribedToMember: (politician: string) => boolean;
}

const DEFAULT_PREFS: SubscriptionPrefs = { members: [] };

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      pushEnabled: false,
      pushPermissionDenied: false,
      subscriptionPrefs: DEFAULT_PREFS,
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      setPushPermissionDenied: (pushPermissionDenied) =>
        set({ pushPermissionDenied }),
      toggleMemberSubscription: (politician) => {
        if (!politician) return;
        const cur = get().subscriptionPrefs;
        const members = cur.members.includes(politician)
          ? cur.members.filter((m) => m !== politician)
          : [...cur.members, politician];
        set({ subscriptionPrefs: { ...cur, members } });
      },
      isSubscribedToMember: (politician) =>
        get().subscriptionPrefs.members.includes(politician),
    }),
    {
      name: "cta.settings",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState, fromVersion) => {
        // v0 -> v1: backfill subscriptionPrefs without touching push flags.
        const s = (persistedState ?? {}) as Partial<SettingsState>;
        if (fromVersion < 1 || !s.subscriptionPrefs) {
          s.subscriptionPrefs = DEFAULT_PREFS;
        }
        // Defensive: if a persisted blob ever arrives with members
        // missing (manually-edited storage, etc.), repair to default.
        if (!Array.isArray(s.subscriptionPrefs?.members)) {
          s.subscriptionPrefs = {
            ...(s.subscriptionPrefs ?? DEFAULT_PREFS),
            members: [],
          };
        }
        return s as SettingsState;
      },
    },
  ),
);
