// Root layout: Stack with (drawer) + trade/[id]. Order outer -> inner:
//   GestureHandlerRootView -> SafeAreaProvider -> PersistQueryClientProvider
//   -> ThemeProvider -> Stack
//
// GestureHandlerRootView is required by @react-navigation/drawer (CTA-App-1-3).
// global.css import wires NativeWind's runtime stylesheet.
// trade/[id] is declared at the root Stack so it stack-pushes OVER the drawer
// when navigated to from inside a drawer screen, AND so the deep-link
// ctaapp://trade/{id} resolves cleanly without a drawer wrapper.
import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import "react-native-reanimated";

import { queryClient, queryPersister } from "@/lib/query/client";
import { ThemeProvider } from "@/lib/theme/provider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister }}
        >
          <ThemeProvider>
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
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
