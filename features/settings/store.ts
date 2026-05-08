// Settings store -- Zustand with persist (AsyncStorage backend).
//
// Side-effect-free by design: setPushEnabled() only flips the flag;
// the Settings screen is responsible for orchestrating the
// register/unregister side effects on the toggle event. This keeps
// the store testable in isolation and avoids a circular dependency
// between the store and /lib/push.
//
// pushPermissionDenied is a sticky flag set when the OS permission
// prompt was denied with !canAskAgain. The Settings screen reads it
// to decide whether to show the "Open OS Settings" affordance instead
// of the regular toggle.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  pushEnabled: boolean;
  pushPermissionDenied: boolean;
  setPushEnabled: (enabled: boolean) => void;
  setPushPermissionDenied: (denied: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      pushEnabled: false,
      pushPermissionDenied: false,
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      setPushPermissionDenied: (pushPermissionDenied) =>
        set({ pushPermissionDenied }),
    }),
    {
      name: "cta.settings",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
