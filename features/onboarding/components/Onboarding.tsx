// First-run civic-transparency disclaimer overlay. Shows ONCE before the user
// reaches the feed -- first-launch disclaimer placement for App Store review
// safety. After the v4 persist migration flips hasSeenOnboarding to false for
// everyone, it shows once per existing install on this app version too.
//
// Gate: rendered as a top sibling in app/_layout.tsx. Visible only when the
// settings store has finished hydrating from AsyncStorage AND hasSeenOnboarding
// is false. Gating on hydration prevents a flash for returning users -- their
// persisted hasSeenOnboarding=true isn't known until hydration completes.
//
// Full-screen opaque overlay (absolute View inside the existing
// SafeAreaProvider -- not a route, not an RN Modal, which has a safe-area
// quirk). Dismiss-only: the single "Got it" button flips hasSeenOnboarding=true
// (persisted), which unmounts it.
//
// Framing is civic-transparency / factual aggregation: no investment, advisory,
// or "opportunity"/"signal" copy. The disclaimer is the canonical verbatim
// text -- a standalone copy, matching the documented decision in about.tsx /
// methodology.tsx ("both screens stand alone ... no cross-reference").
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettingsStore } from "@/features/settings/store";

// Canonical civic-transparency disclaimer (verbatim, Lowe v. SEC-aligned).
// Standalone copy -- same text as about.tsx / methodology.tsx footers, per the
// documented "no cross-reference" decision.
const DISCLAIMER =
  "This app reports public STOCK Act disclosures and related public records " +
  "for civic transparency. It does not provide investment, legal, tax, or " +
  "financial advice; does not recommend buying, selling, or holding any " +
  "security; does not connect to brokerages or enable trading. Not affiliated " +
  "with or endorsed by Congress, the House, the Senate, the SEC, or any " +
  "government agency.";

export function Onboarding() {
  const hasSeen = useSettingsStore((s) => s.hasSeenOnboarding);
  const setHasSeen = useSettingsStore((s) => s.setHasSeenOnboarding);
  const insets = useSafeAreaInsets();

  // Gate on persist hydration so a returning user (persisted
  // hasSeenOnboarding=true) never sees a flash before the flag loads.
  const [hydrated, setHydrated] = useState(() =>
    useSettingsStore.persist.hasHydrated(),
  );
  useEffect(() => {
    if (useSettingsStore.persist.hasHydrated()) setHydrated(true);
    const unsub = useSettingsStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    return unsub;
  }, []);

  if (!hydrated || hasSeen) return null;

  return (
    <View
      accessibilityViewIsModal
      className="bg-white dark:bg-gray-900"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Congress Trade Alerts
        </Text>
        <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          A civic-transparency tool for public STOCK Act disclosures.
        </Text>

        <View className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <Text className="text-sm leading-5 text-gray-700 dark:text-gray-300">
            {DISCLAIMER}
          </Text>
        </View>

        <Text className="mt-4 text-xs leading-4 text-gray-500 dark:text-gray-400">
          Data from the U.S. House Clerk (PTR) and Senate Office of Public
          Records (EFD).
        </Text>

        <Pressable
          onPress={() => setHasSeen(true)}
          accessibilityRole="button"
          accessibilityLabel="Acknowledge and continue"
          className="mt-8 items-center rounded-xl bg-cta-accent px-5 py-3.5"
        >
          <Text className="text-base font-semibold text-white">Got it</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
