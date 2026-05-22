# cta-app

Congress Trade Alerts mobile app (iOS + Android, Expo + EAS).

Companion to the [Congress Trade Alerts](https://congresstradealerts.com)
web tool. Read-only v1: live STOCK Act compliance stats + push notifications
for new disclosures. Source-of-truth API is the CTA Worker at
`https://congresstradealerts.com`.

## Stack

See [`CLAUDE.md`](./CLAUDE.md) for the canonical architecture lock. Highlights:

- Expo managed workflow + EAS Build cloud, TypeScript strict.
- Expo Router (file-based, `/app/(main)/...`).
- TanStack Query (server state) + Zustand (client state) + AsyncStorage persist.
- NativeWind v4 for styling.
- expo-notifications via Expo Push (APNs prod / FCM prod, Expo Go for both dev paths).
- Bundle IDs locked: `com.congresstradealerts.cta` on both platforms.

## Local dev

```bash
git clone https://github.com/freshcod3s/cta-app.git
cd cta-app
npm install
npx expo start --tunnel
```

Scan the QR code from **Expo Go** on iOS or Android. The home screen
exercises the live API, push-notification registration smoke test, and
the Android BackHandler modal.

## Push notifications setup (per platform, post-enrollment)

Expo Push routes to APNs (iOS) and FCM (Android) in production. Dev
builds via Expo Go use Expo's dev tokens and need no further setup.

### iOS prod (post Apple Developer enrollment)

1. Enroll in the Apple Developer Program ($99/year, ~3-5 day approval).
2. In the Expo dashboard for `cta-app`, go to Credentials.
3. Generate or upload an APNs key (.p8) tied to your Apple team.
4. EAS picks it up automatically on the next `eas build --platform ios`.

### Android prod (post Google Play Console enrollment)

1. Pay the one-time $25 Google Play Console fee.
2. Create a Firebase project named `cta-app` at
   <https://console.firebase.google.com>.
3. Add an Android app with package `com.congresstradealerts.cta`.
4. Download `google-services.json`, place it at the repo root.
5. In `app.json`, add `"android.googleServicesFile": "./google-services.json"`.
6. EAS picks it up on the next `eas build --platform android` for the
   production profile.

## Builds

EAS profiles are defined in `eas.json` (created by `eas init`):

- `development` -- developmentClient: true, internal distribution.
- `preview` -- internal distribution; what we use for both-platform smoke.
- `production` -- public stores; Android `app-bundle` (.aab).

```bash
# Android preview (.aab)
eas build --platform android --profile preview

# iOS preview (.ipa) -- BLOCKED until Apple Developer enrollment lands.
# Tracked in CTA-App-1-2.
```

## iOS .ipa parity status: PENDING

CTA-App-1-1 ships day-one parity for everything **except** the iOS .ipa
build artifact. The blocker is Apple Developer Program enrollment, which
is a Joe-task per RULE #1 (third-party identity verification flow). Once
enrollment lands, **CTA-App-1-2** drives:

1. EAS credential setup for iOS (`eas credentials` or auto on next build).
2. First iOS .ipa preview build via `eas build --platform ios --profile preview`.
3. Real-device install via Expo Orbit or TestFlight Internal Testing.
4. Updates this README's parity status to "iOS .ipa parity status: ACTIVE".

In the meantime, iOS dev work proceeds via **Expo Go** on a physical
iPhone -- no enrollment needed, no .ipa build required, full code parity
with Android dev path.

## Folder structure

Per `CLAUDE.md`:

```
/app/(auth)/...                  - auth routes (route group, unused v1)
/app/(main)/...                  - main routes (route group)
/app/_layout.tsx                 - root layout (SafeAreaProvider + RQ + theme)
/components/                     - shared dumb UI
/features/<feature>/api/         - query + mutation defs, query-key registry
/features/<feature>/hooks/       - ergonomic wrappers
/features/<feature>/components/  - feature-scoped UI
/lib/                            - shared hooks, utils, API client
/assets/                         - master icons, splash, fonts
```

## Trade-data API

`API_BASE_URL = "https://congresstradealerts.com"` -- live custom domain
on the CTA Worker. Hardcoded in `/lib/api/client.ts`. No auth in v1.

The workers.dev URL (`congress-trade-alerts.congresstrades.workers.dev`)
is staging/canonical-infra; do NOT use it from the mobile client.
