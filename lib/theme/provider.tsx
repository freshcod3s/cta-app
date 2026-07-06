// ThemeProvider -- Product Invariant #6: dark-only in v1. Locks BOTH the RN
// Appearance override and NativeWind's runtime scheme to dark, and re-asserts
// on every device Appearance change, so a cold-boot / deep-link (push-tap)
// re-init on a light-OS device can't leave the app following the system and
// rendering light. Appearance.setColorScheme is authoritative: it makes
// useColorScheme() report dark app-wide, so NativeWind's device-follow yields
// dark rather than reverting to the OS.
//
// The theme store's "system"/"light" modes are intentionally NOT honored while
// v1 is dark-only; restore the mode/device resolution here if that invariant
// is ever relaxed (and drop the module-load lock in app/_layout.tsx).
import { ReactNode, useEffect } from "react";
import { Appearance } from "react-native";
import { colorScheme } from "nativewind";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lockDark = () => {
      Appearance.setColorScheme("dark");
      colorScheme.set("dark");
    };
    lockDark();
    const sub = Appearance.addChangeListener(lockDark);
    return () => sub.remove();
  }, []);

  return <>{children}</>;
}
