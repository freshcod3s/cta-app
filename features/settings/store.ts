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
// CTA-App-1-7 adds subscriptionPrefs.members[] with idempotent toggle
// semantics; the 2026-06-04 ticker-watchlist slice adds
// subscriptionPrefs.tickers[] with the same toggle semantics. The shape is
// the cross-repo contract from /features/settings/types.ts; the worker reads
// the same JSON from push_tokens.subscription_prefs and targets push on
// members[] OR tickers[], then applies the optional min_amount floor
// (2026-06-05 threshold slice).
//
// Persist version 3: v1 introduced subscriptionPrefs.members[]; v2 added
// tickers[]; v3 adds the optional min_amount dollar floor. The migrate hook
// backfills missing arrays and preserves pre-existing pushEnabled /
// pushPermissionDenied state from older blobs so users don't lose their
// notification opt-in when the schema grows (min_amount needs no backfill --
// absent simply means no floor).
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
  toggleTickerSubscription: (ticker: string) => void;
  isSubscribedToTicker: (ticker: string) => boolean;
  setMinAmount: (amount: number | undefined) => void;
}

const DEFAULT_PREFS: SubscriptionPrefs = { members: [], tickers: [] };

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
      toggleTickerSubscription: (ticker) => {
        const sym = ticker.trim().toUpperCase();
        if (!sym) return;
        const cur = get().subscriptionPrefs;
        const tickers = cur.tickers ?? [];
        const next = tickers.includes(sym)
          ? tickers.filter((t) => t !== sym)
          : [...tickers, sym];
        set({ subscriptionPrefs: { ...cur, tickers: next } });
      },
      isSubscribedToTicker: (ticker) =>
        (get().subscriptionPrefs.tickers ?? []).includes(
          ticker.trim().toUpperCase(),
        ),
      setMinAmount: (amount) => {
        const cur = get().subscriptionPrefs;
        const next = { ...cur };
        // "Any" (undefined / non-positive) clears the floor entirely.
        if (amount && amount > 0) next.min_amount = amount;
        else delete next.min_amount;
        set({ subscriptionPrefs: next });
      },
    }),
    {
      name: "cta.settings",
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persistedState, fromVersion) => {
        // v0 -> v1: backfill subscriptionPrefs. v1 -> v2: backfill tickers[].
        // v2 -> v3: adds optional min_amount (no backfill -- absent = no floor).
        // Never touches push flags.
        const s = (persistedState ?? {}) as Partial<SettingsState>;
        if (fromVersion < 1 || !s.subscriptionPrefs) {
          s.subscriptionPrefs = DEFAULT_PREFS;
        }
        // Defensive: repair members[] / tickers[] if a persisted blob arrives
        // with either missing (older version, manually-edited storage, etc.).
        if (!Array.isArray(s.subscriptionPrefs?.members)) {
          s.subscriptionPrefs = {
            ...(s.subscriptionPrefs ?? DEFAULT_PREFS),
            members: [],
          };
        }
        if (!Array.isArray(s.subscriptionPrefs?.tickers)) {
          s.subscriptionPrefs = {
            ...(s.subscriptionPrefs ?? DEFAULT_PREFS),
            tickers: [],
          };
        }
        return s as SettingsState;
      },
    },
  ),
);
