// Root layout: Stack with (drawer) + trade/[id]. Order outer -> inner:
//   GestureHandlerRootView -> SafeAreaProvider -> PersistQueryClientProvider
//   -> ThemeProvider -> Stack
//
// GestureHandlerRootView is required by @react-navigation/drawer (CTA-App-1-3).
// global.css import wires NativeWind's runtime stylesheet.
// trade/[id] is declared at the root Stack so it stack-pushes OVER the drawer
// when navigated to from inside a drawer screen, AND so the deep-link
// ctaapp://trade/{id} resolves cleanly without a drawer wrapper.
//
// CTA-App-1-6: foreground push re-sync. On mount + every transition to
// 'active' AppState, if pushEnabled is set, re-POST the stored token so
// the backend last_seen tracks active devices. Debounced to one sync
// per 5 minutes per app session -- aggressive resyncs would chew the
// per-token rate limit (10/hr from CTA-31) and add no value.
import "../global.css";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import "react-native-reanimated";

import { queryClient, queryPersister } from "@/lib/query/client";
import { ThemeProvider } from "@/lib/theme/provider";
import { useSettingsStore } from "@/features/settings/store";
import { syncPushRegistration } from "@/lib/push/register";

const SYNC_DEBOUNCE_MS = 5 * 60 * 1000;

function PushSyncBridge() {
  const pushEnabled = useSettingsStore((s) => s.pushEnabled);
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    const maybeSync = (reason: string) => {
      if (!pushEnabled) return;
      const now = Date.now();
      if (now - lastSyncRef.current < SYNC_DEBOUNCE_MS) return;
      lastSyncRef.current = now;
      void syncPushRegistration().catch(() => {
        /* best-effort -- syncPushRegistration already swallows internally */
      });
      void reason;
    };

    maybeSync("mount");

    const sub = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") maybeSync("foreground");
      },
    );
    return () => sub.remove();
  }, [pushEnabled]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister }}
        >
          <ThemeProvider>
            <PushSyncBridge />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(drawer)" />
              <Stack.Screen
                name="trade/[id]"
                options={{
                  headerShown: true,
                  title: "Trade detail",
                  headerBackTitle: "Back",
                }}
              />
              <Stack.Screen
                name="member/[name]"
                options={{
                  headerShown: true,
                  title: "Member",
                  headerBackTitle: "Back",
                }}
              />
              <Stack.Screen
                name="ticker/[symbol]"
                options={{
                  headerShown: true,
                  title: "Ticker",
                  headerBackTitle: "Back",
                }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
