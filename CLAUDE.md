# cta-app - CLAUDE.md

Project-specific architecture lock for the Congress Trade Alerts mobile app
(iOS + Android day-one). Global rules in `~/.claude/CLAUDE.md` apply on top
of this file.

This is the LIVE mobile repo. Per global memory rule #30:
`Projects/congress-trade-mobile/` and `Projects/congress_trade_alerts_app/`
are abandoned scratch and are NOT to be referenced for active work. Only
`Projects/cta-app/` (this directory) and `freshcod3r/cta-app` on GitHub are
canonical going forward.

---

## Repo state (as of 2026-05-07, pre-scaffold)

- Local: `C:\Users\jcros\Projects\cta-app\` -- this directory, fresh
  `git init` on master branch, no commits yet.
- Remote: `freshcod3r/cta-app` on GitHub -- DOES NOT EXIST YET. CTA-App-1-1
  scaffold ticket is responsible for `gh repo create freshcod3r/cta-app`
  before first push.
- Status: pre-scaffold. The architecture lock below governs CTA-App-1-1.
  Everything else (Expo project init, EAS config, dependency install,
  first build) lands in CTA-App-1-1.

---

## Stack lock - 2026-05-07 (CTA-App-1)

Both platforms share an identical setup. Asymmetry is limited to (a) prod
push-notification provider (APNs vs FCM) and (b) build artifact format.

### Runtime + language

- Runtime:        Expo managed workflow + EAS Build cloud
- Language:       TypeScript strict
- Navigation:     Expo Router (file-based; iOS swipe-back + Android
                  hardware-back both auto-handled)
- Server state:   TanStack Query / React Query
- Client state:   Zustand (with persist middleware)
- UI:             NativeWind (same Tailwind classes both platforms)
- Theme:          system-following + manual override toggle
- Safe area:      react-native-safe-area-context (notch / Dynamic Island
                  iOS, edge-to-edge Android)
- Offline cache:  React Query + AsyncStorage persist
- Secure storage: expo-secure-store (Keychain iOS, Keystore Android,
                  unified API)
- Telemetry v1:   none (Sentry RN when first crash lands)
- Auth v1:        none (read-only + waitlist signup form)
- Tablet/iPad v1: phone-only; adaptive tablet layout = v2

### Push notifications (asymmetric prod, symmetric dev)

- Library:        expo-notifications + Expo Push service (unified API)
- iOS dev:        Expo Go provides dev tokens (no enrollment needed)
- iOS prod:       APNs key via Apple Developer Program (post-enrollment)
- Android dev:    Expo Go provides dev tokens (no enrollment needed)
- Android prod:   FCM via free Firebase project + Google Play Console
                  enrollment

### Build + distribution (Joe on Windows -- no Mac required)

- iOS build:      EAS Build cloud
- iOS dev test:   Expo Go on physical iPhone (no enrollment)
- iOS beta:       TestFlight (post-Apple Developer enrollment)
- iOS prod:       App Store (post-enrollment + APNs cert)
- Android build:  EAS Build cloud OR local (cloud is simpler; default to
                  cloud unless reason to switch)
- Android dev:    Expo Go on Joe's Android phone
- Android beta:   Internal testing track (post-Google Play Console
                  enrollment)
- Android prod:   Google Play Store (post-enrollment + signing keystore)

### Assets pipeline (single source, Expo derives per platform)

- App icon master:   `/assets/icon.png` at 1024x1024
- iOS sizes:         auto-derived by Expo from master
- Android adaptive:  foreground PNG 432x432 + background color/image
                     declared in `app.json`
- Splash:            Expo splash-screen with separate iOS launch screen +
                     Android splash config

### Permissions (declare at scaffold time, not retrofitted)

- iOS:     `app.json` -> `ios.infoPlist` with `NS*UsageDescription` strings
           REQUIRED for push: `NSUserNotificationsUsageDescription`
- Android: `app.json` -> `android.permissions` array
           REQUIRED for push: auto-included by `expo-notifications`

### Bundle identifiers (LOCKED at first build -- changing later = ID rotation pain)

- iOS:     `ios.bundleIdentifier = com.congresstradealerts.cta`
- Android: `android.package      = com.congresstradealerts.cta`
- Convention: identical reverse-DNS across both, suffix only on field name.

---

## Architectural rules (apply to ALL CTA-App-N work)

- React Query is server-state only; never UI state, never form drafts.
- Query keys are part of the API contract. Centralize in
  `/features/<feature>/api/keys.ts`. No inline ad-hoc keys at call sites.
- Route folders are API surfaces, not dumping grounds.
- Route-specific hooks co-locate; cross-route hooks promote to `/lib`.
- Shared UI never lives in `/app`.
- All screen-root components wrap with `SafeAreaView` (no bare `View` at
  root).
- All push code paths tested on BOTH platforms before merge -- no "ship
  Android, fix iOS later."

---

## Folder structure (single tree, both platforms use it)

```
/app/(auth)/...                  - auth routes (route group, unused v1)
/app/(main)/...                  - main routes (route group)
/app/_layout.tsx                 - root layout (wraps SafeAreaProvider)
/components/                     - shared dumb UI
/features/<feature>/api/         - query + mutation defs, query-key registry
/features/<feature>/hooks/       - ergonomic wrappers
/features/<feature>/components/  - feature-scoped UI
/lib/                            - shared hooks, utils, API client
/assets/                         - master icons, splash, fonts
                                   (Expo derives sizes)
```

---

## Initial dependencies

```
expo
expo-router
expo-splash-screen
expo-notifications
expo-constants
expo-secure-store
react-native-safe-area-context
@tanstack/react-query
@tanstack/react-query-async-storage-persister
zustand
nativewind
tailwindcss
```

---

## Pre-scaffold parity checklist (CTA-App-1-1 acceptance criteria)

CTA-App-1-1 is COMPLETE when every box below is checked:

- [ ] `app.json` with both `ios.bundleIdentifier` AND `android.package` set
- [ ] `app.json` with `ios.infoPlist` usage strings for every permission
      used (incl. `NSUserNotificationsUsageDescription`)
- [ ] `app.json` with `android.adaptiveIcon` (foregroundImage +
      backgroundColor)
- [ ] `/assets/icon.png` 1024x1024 master committed
- [ ] `/assets/splash.png` + iOS launch screen + Android splash configured
- [ ] `expo-notifications` wired; APNs/FCM setup paths documented in
      README
- [ ] `SafeAreaProvider` in root `_layout.tsx`
- [ ] Android `BackHandler` verified on every custom modal/screen
- [ ] EAS Build profiles (development, preview, production) configured
      for BOTH platforms
- [ ] First EAS Build run produces both `.ipa` AND `.aab` artifacts

---

## Cross-references

- Global rules: `~/.claude/CLAUDE.md` (tone, ASCII, secrets, RULE #1
  Claude-Code-does-executable-work, OUTSOURCING POLICY tier rules)
- Anti-Planning-Loop / Iteration Safety / Definition of Complete --
  inherited from global CLAUDE.md
- Memory rule #30 -- abandoned-scratch projects (`congress-trade-mobile`,
  `congress_trade_alerts_app`) are NOT to be referenced for active work
- CTA Worker source-of-truth for trade-data contracts:
  `Projects/congress-trade-alerts/` (separate project, separate repo)

---

## Conventions specific to this repo

- ASCII only in code, configs, and prose (per global rule). The Lock
  document content above uses ASCII even where the original drop had
  Unicode dashes.
- Commits: structured, one ticket per commit, push to origin/master
  immediately after commit (no long-lived feature branches in v1).
- Verification: every CTA-App-N ticket ends with explicit pass/fail of the
  Pre-scaffold parity checklist (for CTA-App-1-1) or an analogous
  vertical-slice acceptance test (for later tickets).
- No real-device perception checks executed by Claude Code -- those are
  Joe-tasks per RULE #1 ("real-device pixel rendering"). Claude Code may
  drive simulator / Expo Go web-preview but final pass requires Joe on
  hardware.
