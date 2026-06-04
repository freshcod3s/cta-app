// Theme store -- Zustand with persist (expo-secure-store backend NOT used here;
// theme override is non-sensitive UI prefs, AsyncStorage is fine).
//
// "system" -> follow device userInterfaceStyle (Lock default)
// "light" / "dark" -> manual override
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "system" | "light" | "dark";

type ThemeState = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "dark",
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "cta.theme",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
