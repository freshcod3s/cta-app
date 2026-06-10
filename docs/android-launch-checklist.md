# Android Launch Checklist

**Branch:** `android-hardening` (forked from `master` 2026-05-27).
**Scope:** Android-only. iOS pre-launch tracked separately on the iOS thread.
**Target:** AAB to Play Store via internal testing track -> closed testing (20-tester / 14-day requirement on new dev accounts) -> production.

**OPSEC posture:** field-path-only. Placeholders `<APP_PACKAGE>`, `<BRAND_DOMAIN>`, `<DEV_HANDLE>`, `<LLC_NAME>`, `<SUPPORT_EMAIL>` substitute for literals that live in source files (`app.json`, `eas.json`, `package.json`, `lib/push/api.ts`). Source-tree paths are not literals and are used directly.

---

## 1. Build target

| Aspect | Value | Source |
|---|---|---|
| Artifact format | AAB | `eas.json:build.production.android.buildType` = `"app-bundle"` |
| Version-code source | EAS remote | `eas.json:cli.appVersionSource` = `"remote"` + `eas.json:build.production.android.autoIncrement` = `"versionCode"` |
| Distribution | Play Store | `eas.json:build.production.distribution` = `"store"` |
| Update channel | production | `eas.json:build.production.channel` = `"production"` |
| Signing keystore | EAS-managed | Generated during the CTA-App-1-1 preview build. Only signing identity that can ship updates to the eventual Play listing. |

Pre-flight before `eas build -p android --profile production`:
- [ ] Keystore backup completed via `eas credentials -p android` -> Keystore -> Download (one-time, irreversible if lost).
- [ ] `eas build:version:get -p android` returns the expected next versionCode.
- [ ] No uncommitted changes on the build branch.
- [ ] Phase-0 blockers (section below) all cleared.

---

## 2. `app.json:android.*` audit

| Field path | Value | Status |
|---|---|---|
| `app.json:android.package` | `<APP_PACKAGE>` | OK -- locked at scaffold time per `CLAUDE.md` stack lock; reverse-DNS parity with `app.json:ios.bundleIdentifier`. |
| `app.json:android.versionCode` | absent | INTENTIONAL -- EAS owns the counter via remote source. Confirm via `eas build:version:get -p android` after first prod build. |
| `app.json:android.permissions` | `["POST_NOTIFICATIONS"]` | OK -- explicit per T1 commit `30e1b52`. SCHEDULE_EXACT_ALARM absent (no local notification scheduling in `lib/push/register.ts`). |
| `app.json:android.adaptiveIcon.foregroundImage` | `./assets/adaptive-icon.png` | OK at 432x432 ARGB. Recommend 1024x1024 upgrade as follow-on art task for crisper density derivation. |
| `app.json:android.adaptiveIcon.backgroundColor` | `#0b1220` | OK -- matches splash. |
| `app.json:android.adaptiveIcon.monochromeImage` | absent | DEFERRED -- Android 13+ themed icons. Real silhouette is design-side; placeholder PNGs forbidden per HALT 2026-05-27. Tracked as Phase-0 blocker below. |
| `app.json:android.edgeToEdgeEnabled` | `true` | OK -- `SafeAreaProvider` wraps root at `app/_layout.tsx:66`. |
| `app.json:android.predictiveBackGestureEnabled` | `false` | OK -- opt-out of Android 14+ predictive-back animation for v1. |
| `app.json:android.intentFilters[0]` | App Links for `<BRAND_DOMAIN>/trade` with `autoVerify: true` | OK -- parity with `app.json:ios.associatedDomains`. |
| `app.json:android.googleServicesFile` | absent | INTENTIONAL -- Expo Push handles APNs/FCM routing internally (verified per HALT 2026-05-27); direct FCM credentials not required. |
| `app.json:plugins[expo-notifications]` | bare string entry | DEFERRED -- config tuple with custom status-bar icon + color requires real art; deferred per HALT 2026-05-27. Default renders app icon as status-bar silhouette (acceptable for testing, ugly for public launch). |

---

## 3. Adaptive icon and splash assets

| Asset | Field path -> file | Spec | Status |
|---|---|---|---|
| App icon master | `app.json:expo.icon` -> `./assets/icon.png` | 1024x1024 RGB | OK |
| Adaptive foreground | `app.json:android.adaptiveIcon.foregroundImage` -> `./assets/adaptive-icon.png` | 432x432 ARGB; safe-zone 108dp center | OK (size acceptable; 1024x1024 preferred) |
| Adaptive background | `app.json:android.adaptiveIcon.backgroundColor` -> `#0b1220` | hex color, matches splash | OK |
| Adaptive monochrome | (deferred) | 432x432 ARGB, white silhouette on transparent | **PHASE-0 BLOCKER** -- Android 13+ themed icon support |
| Notification status-bar icon | (deferred) | 96x96 white silhouette on transparent | **PHASE-0 BLOCKER** -- default uses app icon (renders as solid white square in Android status bar) |
| Splash image | `app.json:plugins[expo-splash-screen].image` -> `./assets/splash.png` | 1024x1024 ARGB, `resizeMode=contain`, `imageWidth=200` | OK |
| Splash background | `app.json:plugins[expo-splash-screen].backgroundColor` -> `#0b1220` | hex color | OK |

---

## 4. POST_NOTIFICATIONS runtime permission flow (Android 13+)

Declared at `app.json:android.permissions` (T1 commit `30e1b52`).

Code path:
- Channel ensure: `lib/push/register.ts:89-95` (runs first, no permission needed).
- Permission gate: `lib/push/register.ts:97-103` calls `Notifications.getPermissionsAsync` then `requestPermissionsAsync` only if undecided.
- Trigger: NOT on app launch. Settings-screen toggle drives the request per the file-header doc at `lib/push/register.ts:9-12`. Auto-prompt on launch is a deliberate non-feature.

Test matrix on physical Android 13+ device (Joe-task per `CLAUDE.md` "Real-device perception checks executed by Joe" rule):
- [ ] Fresh install -> no permission prompt at launch.
- [ ] Settings -> toggle push on -> OS prompt appears -> Allow -> token registers (verify `lib/push/api.ts` POST returns `{ok:true, registered:true}`).
- [ ] Toggle push off -> token cleared from `expo-secure-store` (key `cta.push.token`).
- [ ] Toggle push on again with permission already granted -> no second prompt.
- [ ] Deny permission flow -> `registerForPushNotifications()` returns `{success:false, error:"permission_denied"}` -> UI surfaces "Open OS Settings" affordance.
- [ ] Re-grant via OS Settings -> next toggle-on succeeds.
- [ ] Android 12 device sanity check -> no POST_NOTIFICATIONS prompt (pre-13 behavior).

---

## 5. Channel `trades` importance

**Current state** (`lib/push/register.ts:89-95`):

```
Notifications.setNotificationChannelAsync("trades", {
  name: "trades",
  importance: Notifications.AndroidImportance.HIGH,
})
```

Channel importance is HIGH as of the CTA-App-1-7 push-subscription commit. Worker sends `priority: 'high'` at `congress-trade-alerts/src/alerts/push.ts:43,199`; channel importance matches.

**Migration constraint -- Android channel cache:** once a channel exists on a device, its importance can only be RAISED by the user in OS Settings, not by client code. `setNotificationChannelAsync` with a new importance value is a silent no-op against an existing channel. Channel ID rotation is forbidden per HALT 2026-05-27 (channel name remains `trades`).

Implications:
- New installs -> fresh `trades` channel created with HIGH importance.
- Existing test cohort (any device that toggled push on under the old DEFAULT) -> stuck on DEFAULT until uninstall+reinstall, OR until user manually opens OS Settings -> Apps -> CTA -> Notifications -> `trades` -> raises importance.
- Pre-public-launch this is acceptable; test cohort is internal-only and can reinstall.

Verification on a fresh Android 13+ device install:
- [ ] Install build, toggle push on, accept permission.
- [ ] Trigger test push from worker -> notification displays as heads-up overlay with sound + vibration.
- [ ] OS Settings -> Apps -> CTA -> Notifications -> `trades` shows importance = "Urgent" / "High".
- [ ] Lock screen displays notification body (lockscreenVisibility PUBLIC).

---

## 6. Push token round-trip (end-to-end)

| # | Step | Code | Expected |
|---|---|---|---|
| 1 | Channel ensure | `lib/push/register.ts:89-95` | `trades` channel exists with target importance (post-T4) |
| 2 | Permission grant | `lib/push/register.ts:97-103` | OS returns `granted` |
| 3 | Expo token issue | `lib/push/register.ts:151-156` via `getExpoPushTokenAsync({projectId})` | `ExponentPushToken[xxx]` string |
| 4 | Worker register | `lib/push/api.ts:67-105` POSTs `{token, platform:"android", subscription_prefs}` to `<BRAND_DOMAIN>/api/push/token` | `200 {ok:true, registered:true}` |
| 5 | Token persist | `lib/push/register.ts:71-72` writes to `expo-secure-store` key `cta.push.token` | Stored, survives app restart |
| 6 | Worker send | `congress-trade-alerts/src/alerts/push.ts:188-202` builds Expo Push payload with `channelId:'trades'`, `priority:'high'`, `sound:'default'` | POST to Expo Push API |
| 7 | Expo -> FCM -> device | (Expo service handles transport) | Device receives via FCM |
| 8 | Device display | `expo-notifications` consumes channel config | Heads-up notification per channel importance |
| 9 | Tap -> deep-link | `app.json:android.intentFilters` opens `<BRAND_DOMAIN>/trade/{id}` -> Expo Router resolves `app/trade/[id].tsx` | Trade detail screen renders |
| 10 | Engagement ping | (per `CLAUDE.md` Decisions Log open follow-on) | POST `<BRAND_DOMAIN>/api/push/engagement` `{trade_id}` |

End-to-end smoke on physical Android 13+ device:
- [ ] All 10 steps succeed for a single trade alert.
- [ ] Token survives app kill + relaunch (re-sync at `app/_layout.tsx:33-61` finds stored token, re-POSTs).
- [ ] Token rotation (e.g., FCM rotates) triggers full re-register via `lib/push/register.ts:204-228` `syncPushRegistration` fallback path.

---

## 7. Play Console checklist

Store-listing copy committed at `store/app-store/metadata.txt` (shared
source for both ASC and Play). Data Safety schema at
`docs/data-safety-form.md`. Play-specific metadata draft at
`docs/play-console-metadata.md`.

Pre-submission artifacts:
- [x] Data Safety form schema committed (`docs/data-safety-form.md`).
- [ ] Privacy policy URL live and accessible at `<BRAND_DOMAIN>/privacy`.
- [ ] Content rating questionnaire completed.
- [ ] Target audience declared (finance content -> likely 18+; confirm against Play Families policy).
- [ ] Store listing assets uploaded:
  - [ ] App icon 512x512 (Play Console asset; `store/google-play/icon-512.png`).
  - [ ] Feature graphic 1024x500.
  - [ ] Phone screenshots (minimum 2; recommend 4-8).
  - [ ] 7-inch tablet screenshots (optional but recommended).
  - [ ] 10-inch tablet screenshots (optional but recommended).
  - [ ] Foldable screenshots (optional).
  - [x] Short description (80 char max) -- see `store/app-store/metadata.txt:8`.
  - [x] Full description (4000 char max) -- see `store/app-store/metadata.txt:11-39`.
- [ ] News-app declaration (civic-data tool is likely NOT a Play "news" app; confirm against Play news-app policy definition).
- [ ] Financial-features declaration (likely YES -- surfaces securities trades).
- [ ] Ads declaration: NO (per `CLAUDE.md` product invariant -- no ads, no client analytics SDK).
- [ ] Government-app declaration: NO.

Testing track sequencing:
- [ ] Internal testing track: tester list uploaded (`<DEV_HANDLE>` Play Console -> Internal testing -> Testers). Up to 100 testers, no review.
- [ ] Closed testing track: 20 active testers minimum, 14 consecutive days minimum opt-in (new dev account requirement since Nov 2023). Track via Play Console -> Closed testing -> Tester count + days-in-test counter.
- [ ] Production track: enabled only after closed-testing requirement satisfied AND first review approval.

---

## 7a. Companion docs (T6 deliverable)

Store-listing copy, content rating questionnaire, and target-audience declaration: see [docs/play-console-metadata.md](./play-console-metadata.md).

Data Safety form per-data-type schema (Play Console Data Safety section): see [docs/data-safety-form.md](./data-safety-form.md).

Both companions follow the same field-path-only OPSEC posture as this checklist; literal copy stays Joe-side at Play Console upload time.

---

## 8. Org developer account upgrade status

| Step | Status | Blocker |
|---|---|---|
| D-U-N-S submission | IN-FLIGHT (case 10436878, submitted 2026-05-20) | iPostal1 address change in `docs/launch/canonical_address.md`; typical 7-10 business day turnaround |
| Apple Individual -> Org migration | BLOCKED | Awaits D-U-N-S clearance |
| Google Play Console enrollment on `<LLC_NAME>` seller identity | BLOCKED | Awaits D-U-N-S clearance + Apple migration sequencing (per `CLAUDE.md` Decisions Log) |
| Google Play service-account JSON for EAS Submit | BLOCKED | Awaits Play Console enrollment; will land at `cta-app/store/google-play/service-account-key.json` per `eas.json:submit.production.android.serviceAccountKeyPath` |

Until the org account is provisioned, production-track submission is blocked. Internal/closed testing under the existing `<DEV_HANDLE>` is technically possible but should be deferred -- the closed-testing day counter resets on account transfer.

---

## Phase-0 blockers (must clear before first production AAB)

| # | Blocker | Owner | Note |
|---|---|---|---|
| 1 | Real monochrome adaptive icon at `assets/adaptive-icon-monochrome.png` + wire to `app.json:android.adaptiveIcon.monochromeImage` | Design | Android 13+ themed icons; placeholder PNGs forbidden per HALT 2026-05-27 |
| 2 | Real notification status-bar icon at `assets/notification-icon.png` + wire to `app.json:plugins[expo-notifications].icon` (config-tuple form) | Design | White silhouette on transparent; current default renders app icon as solid white square in status bar |
| 3 | Google Play Console developer account on `<LLC_NAME>` seller identity | Joe | Blocks production-track submission |
| 4 | Google Play service-account JSON at `cta-app/store/google-play/service-account-key.json` | Joe | Required for `eas submit -p android --profile production` |
| 5 | T4 channel-importance bump (DEFAULT -> HIGH + sound + vibration + lockscreenVisibility) at `lib/push/register.ts:89-95` | Awaiting Joe's T4 ruling | Worker contract priority='high' silently downgraded today |
| 6 | EAS-managed keystore backup via `eas credentials -p android` -> Keystore -> Download | Joe | Backup-confirmed 2026-05-27. One-time, irreversible if lost (only signing identity that can ship Play updates). |
| 7 | Privacy policy live at `<BRAND_DOMAIN>/privacy` with the field-set required by Play Data Safety form (collection, sharing, encryption-in-transit, encryption-at-rest, deletion mechanism) | Joe | Play submission rejects without a reachable privacy URL |
