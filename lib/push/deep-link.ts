// Push-notification tap -> deep-link routing bridge.
//
// This is the SECOND-but-not-separate entry into expo-router's deep-link
// routing. A push notification carries the SAME fully-qualified apex URL a
// Universal Link / App Link carries:
//
//     data.url = "https://congresstradealerts.com/<path>"
//
// A tap feeds that URL into the SAME file-based route tree the OS uses for a
// real link tap. There is NO second route map: routing knowledge lives only
// in /app, and both a link tap and a notification tap converge on it. We never
// send data.screen / data.params (that would duplicate routing into the
// payload).
//
// Why a manual observer at all -- expo-router already auto-handles link taps
// and cold-start Universal Links via its own internal Linking subscription +
// Linking.getInitialURL(), but it does NOT observe notification responses.
// expo-notifications surfaces those through getLastNotificationResponseAsync()
// (cold launch) and addNotificationResponseReceivedListener() (background /
// foreground tap). This hook is the only thing wiring those two sources into
// expo-router. Pattern per the Expo SDK 54 expo-router + notifications guide.
//
// Why we strip to an internal path instead of router.push(fullHttpsUrl) --
// expo-router treats a fully-qualified http(s) href as an EXTERNAL web link
// and opens the browser (see expo-router router/advanced/native-intent).
// Stripping the trusted origin down to "/trade/123" forces an INTERNAL
// navigation that lands on the exact route the Universal Link resolves to.
// This is the prefix-strip that bare-RN linking.prefixes would do for us;
// expo-router owns its prefixes, so we do it explicitly. We do NOT wrap the
// URL in Linking.createURL -- it is already a full URL.
//
// SECURITY -- only the apex https origin or the app's own scheme are trusted.
// An exact-origin match (not a bare startsWith) rejects look-alikes such as
// "https://congresstradealerts.com.evil.com/...". Any other origin is ignored:
// we never navigate on an unexpected origin.

import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { router, type Href } from "expo-router";

const APEX_ORIGIN = "https://congresstradealerts.com";
const APP_SCHEME = "ctaapp://";

/**
 * Convert a notification / link URL into a trusted INTERNAL expo-router href,
 * or null when the origin is not one we control (caller must not navigate).
 *
 * Pure + exported so the security guard can be unit-tested in isolation.
 */
export function toInternalHref(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;

  // Apex https site -- the canonical Universal / App Link origin. Require the
  // bare origin OR an exact-origin prefix followed by "/", so a suffix
  // look-alike host cannot slip past a plain startsWith check. The remainder
  // (path + query + fragment) is preserved verbatim.
  if (raw === APEX_ORIGIN) return "/";
  if (raw.startsWith(APEX_ORIGIN + "/")) {
    return raw.slice(APEX_ORIGIN.length);
  }

  // The app's own custom scheme. The worker only ever sends https, so this
  // branch is defensive -- but the guard explicitly allows the app scheme.
  if (raw.startsWith(APP_SCHEME)) {
    const rest = raw.slice(APP_SCHEME.length).replace(/^\/+/, "");
    return rest.length ? `/${rest}` : "/";
  }

  return null; // untrusted origin -- ignore
}

/**
 * Root-layout observer: routes push-notification taps through expo-router.
 * Mount once, at the navigation root. Covers all three tap states:
 *   - app killed -> getLastNotificationResponseAsync() (cold launch)
 *   - background -> addNotificationResponseReceivedListener()
 *   - foreground -> addNotificationResponseReceivedListener() (visible only
 *                   because setNotificationHandler sets shouldShowBanner: true
 *                   in lib/push/register.ts -- the sole foreground-display path)
 *
 * Holds no reactive state, so it adds zero re-renders to the caller.
 */
export function useNotificationDeepLink(): void {
  useEffect(() => {
    let isMounted = true;

    const navigate = (
      response: Notifications.NotificationResponse | null,
    ): void => {
      const href = toInternalHref(
        response?.notification.request.content.data?.url,
      );
      if (!href) return;
      // Origin-validated, runtime-constructed path. typedRoutes cannot verify
      // a dynamic string statically, so the cast is the documented escape.
      router.push(href as Href);
    };

    // App-killed cold launch: did a notification tap start the app?
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (isMounted) navigate(response);
      })
      .catch(() => {
        /* no launch response available -- nothing to route */
      });

    // Background / foreground taps for the life of the session.
    // DEDUPE CONTINGENCY: if a real-device cold-launch tap is observed to
    // navigate TWICE (the launch response also arriving through this listener),
    // gate on response.notification.request.identifier. Not added pre-emptively
    // -- only wire it if the double actually appears on hardware.
    const sub = Notifications.addNotificationResponseReceivedListener(navigate);

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, []);
}
