# Apple App Privacy questionnaire - transcription checklist

Joe enters these answers into App Store Connect at:
My Apps -> Congress Trade Alerts (com.congresstradealerts.cta) -> App Privacy.

Decided state basis (2026-07-11, branch feat/web-parity @ 0f209e6):
- No accounts / no auth of any kind in v1 (ASC review sign-in = No, no
  demo account).
- No purchase surface on any platform: SHOW_UPGRADE_CTA = false
  (lib/flags.ts:39). No IAP, no external purchase link, no pricing in-app.
- No analytics SDK, no crash reporter, no third-party native SDKs
  (grep of package.json for sentry/crashlytics/firebase/amplitude/
  posthog/mixpanel/segment/analytics: zero hits).
- expo-updates DISABLED (app.json updates.enabled = false), so the
  per-install EAS-Client-ID launch beacon to u.expo.dev does NOT fire
  on iOS builds.
- Push is opt-in only (Settings toggle; never requested on launch, per
  lib/push/register.ts header comment). Token + subscription_prefs are
  the ONLY data transmitted with any identifier attached.
- All transport HTTPS to congresstradealerts.com (lib/api/client.ts:3,
  API_BASE_URL).
- Deletion: Settings -> push toggle OFF sends DELETE /api/push/token
  (lib/push/api.ts:107-140) and clears the local secure-store copy
  (lib/push/register.ts:181-193). Server-side the DELETE cascades to
  child tables (worker-side, see congresstradealerts.com/delete).

Maps from the completed Play Data-safety reasoning in
docs/data-safety-form.md (rows 1-3 + zero-row table). Where Play and
Apple taxonomies diverge, the mapping rationale is stated inline.

---

## Top-level question

**"Do you or your third-party partners collect data from this app?"**
-> **YES.**

Two data types are collected (both anonymous, both opt-in, both only
after the user enables push):

1. The Expo push token.
2. The subscription preferences sent alongside it.

Everything else on Apple's list: not collected (see the zero-table
below).

---

## Data Used to Track You

**NONE.** Tracking = **NO** for every declared type.

No advertising SDK, no cross-app/cross-site identifier linkage, no
device-graph sharing, no IDFA (no expo-tracking-transparency dep, no
ATT prompt). Matches the standing decision: Apple Privacy Nutrition
Tracking = NO.

## Data Linked to You

**NONE.** There is no account system, so there is no user identity to
link anything to. The push token row is keyed on the token itself,
which Apple treats as linked only if it is associated with the user's
identity - it is not (lib/push/register.ts:14-16, "anonymous broadcast
in v1"). Both declared types go under **Data Not Linked to You**.

---

## Data Not Linked to You - declared types

### 1. Identifiers > Device ID -- the Expo push token

- ASC picker path: **Identifiers -> Device ID**
- Collected: YES (only after the user toggles push on in Settings)
- Linked to identity: **NO** (no accounts; token is an anonymous
  routing identifier)
- Used for tracking: **NO**
- Purposes: **App Functionality** (delivering push notifications)

Mapping rationale (Device ID vs "Other Data Types"): the Expo push
token (`ExponentPushToken[xxx]`) is a device-scoped, per-install
routing identifier issued via APNs - it identifies a device
installation, not a user. Apple's Device ID definition ("the device's
advertising identifier, or other device-level ID") covers
device-level IDs generally, and a push token is exactly that. Three
things confirm Device ID over Other Data Types:
  1. Play declared it under "Device or other IDs"
     (docs/data-safety-form.md row 1) - the direct Apple analog is
     Identifiers > Device ID.
  2. app.json's iOS privacy manifest already declares
     `NSPrivacyCollectedDataTypeDeviceID` (app.json:25) - the
     questionnaire must agree with the manifest, and Device ID is the
     manifest type we shipped.
  3. "Other Data Types" is a last-resort bucket; using it when a
     specific category fits invites a metadata rejection.

Exact data sent (lib/push/api.ts:67-105, POST /api/push/token):
`{ token, platform ("ios"|"android"), subscription_prefs? }`. The
platform string is not an identifier; it rides the same declaration.

- Collection is optional: default off, Settings toggle drives
  registerForPushNotifications() (lib/push/register.ts:129-174).
- Deletion: toggle off -> DELETE /api/push/token + local secure-store
  clear (lib/push/api.ts:107-140, lib/push/register.ts:181-193).

### 2. User Content > Other User Content -- subscription_prefs

- ASC picker path: **User Content -> Other User Content**
- Collected: YES (transmitted only alongside the push token, i.e. only
  after push opt-in; a watchlist with push off stays on-device)
- Linked to identity: **NO** (attached only to the anonymous token row)
- Used for tracking: **NO**
- Purposes: **App Functionality** (filters which trade alerts reach
  the device)

Exact data sent (features/settings/types.ts:17-19; POSTed at
lib/push/register.ts:162-164 on registration, lib/push/api.ts:151-157
syncSubscriptionPrefs on later edits, e.g. the Subscribe pill in
features/trades/components/SubscribeButton.tsx:96-97):
`{ members: string[], tickers?: string[], min_amount?: number }` -
politician names, ticker symbols, and an optional dollar floor the
user picked. No free text, no PII.

Mapping rationale (User Content vs "Usage Data > Other Usage Data"):
subscription_prefs is a deliberately user-curated list - the user
builds it by tapping Subscribe on members/tickers. It is content the
user creates, not passively observed behavior. Apple's Usage Data
category ("Product Interaction, Advertising Data, Other Usage Data")
describes behavioral telemetry - taps, views, session data - which
this is not (and declaring Usage Data would contradict the "no
analytics" posture everywhere else). This mirrors the Play decision
exactly: Play declared it as "Other user-generated content" (a
subtype of Play's App activity category - docs/data-safety-form.md
row 2), and Apple's analog of user-generated content is User Content >
Other User Content.

- Collection is optional: empty members[]/tickers[] is the default;
  min_amount absent = no floor.
- Deletion: same DELETE as the token - the server row including
  subscription_prefs is removed; disabling push deletes both.

---

## Everything else: NOT collected

Each category Apple lists, with the one-line reason:

- **Contact Info (name, email, phone, address, other)** - NO. No auth,
  no profile, no in-app forms; the only secure-store key is
  `cta.push.token` (lib/push/register.ts:27). Newsletter signup is
  web-only, never in-app.
- **Health & Fitness** - NO. Finance/civic app; no HealthKit, no
  health data surface.
- **Financial Info (payment info, credit info, other)** - NO. The app
  reports on politicians' PUBLIC STOCK Act filings; it collects no
  user financial data. No IAP and no purchase surface at all in v1
  (SHOW_UPGRADE_CTA = false, lib/flags.ts:39).
- **Location (precise, coarse)** - NO. No location permission, no
  NSLocation* usage-description keys in app.json; requests carry no
  location beyond what any HTTPS connection inherently exposes
  (IP, not collected/retained as location).
- **Sensitive Info** - NO. Nothing in any feature module.
- **Contacts** - NO. No contacts permission or picker.
- **User Content beyond subscription_prefs** - NO. No posts, comments,
  uploads, photos, audio, or customer-support threads in-app.
- **Browsing History** - NO. expo-web-browser only opens external
  source-document URLs; nothing is logged or transmitted about it.
- **Search History** - NO. In-app filter/search parameters ride
  anonymous GETs (lib/api/client.ts - no identifier, no cookie, no
  auth header attached) and are used only to serve the request, not
  retained tied to a user or device - which is outside Apple's
  definition of "collected." Mirrors the Play decision to not declare
  search history (mobile GET filter params are ephemeral server-side;
  the durable /api/track filter-value capture is WEB-only and the
  mobile app has zero /api/track call sites - grep confirms).
- **Identifiers > User ID** - NO. No account system in v1.
- **Purchases** - NO. No IAP, no purchase history access.
- **Usage Data (product interaction, advertising, other)** - NO. No
  analytics SDK in package.json; no /api/track and no
  /api/push/engagement call sites in the app (the engagement endpoint
  exists worker-side only; mobile wire-up is an un-started ticket).
- **Diagnostics (crash data, performance, other)** - NO. No Sentry, no
  Crashlytics, no Bugsnag - grep of package.json: zero hits.
- **Surroundings (environment scanning)** - NO. No AR/camera.
- **Body (hands, head)** - NO. Not applicable.
- **Other Data Types** - NO. Nothing outside the two declared types.

---

## Consistency checks (questionnaire vs manifest vs web policy vs Play)

### app.json privacyManifests (app.json:20-34)

Declares: NSPrivacyTracking = false, NSPrivacyTrackingDomains = [],
one collected type `NSPrivacyCollectedDataTypeDeviceID` with
Linked = false, Tracking = false, Purposes = [AppFunctionality],
NSPrivacyAccessedAPITypes = [].

- Device ID row: **AGREES** with questionnaire type 1 (not linked, not
  tracking, App Functionality).
- Tracking = false: **AGREES** with "Data Used to Track You: NONE."
- **MISMATCH FOUND:** the manifest declares ONLY DeviceID. This
  checklist declares a second type (User Content > Other User Content
  for subscription_prefs), for which the manifest analog
  `NSPrivacyCollectedDataTypeOtherUserContent` is ABSENT from
  app.json. The prefs are unambiguously transmitted off-device
  (lib/push/register.ts:162-164), so the manifest under-declares
  relative to both this questionnaire and the Play form. Fix: add a
  second NSPrivacyCollectedDataTypes entry
  (`NSPrivacyCollectedDataTypeOtherUserContent`, Linked = false,
  Tracking = false, Purposes = [AppFunctionality]) to app.json before
  the submission build. app.json is outside this file's ownership -
  flagged here, not fixed here.
- NSPrivacyAccessedAPITypes = [] at the app level is acceptable:
  React Native / Expo SDK 54 modules ship their own
  PrivacyInfo.xcprivacy bundles with required-reason declarations
  (UserDefaults, file timestamps, etc.); the app's own code adds no
  required-reason API use. No action.

### Web privacy policy (congresstradealerts.com/privacy)

**AGREES.** The policy's "Mobile app" section describes exactly the
two declared types: the Expo push token ("device-scoped routing
identifier, not a hardware ID", revocable via Settings, deleted from
device and server) and subscription preferences ("stored alongside
your push token", "deleted when you disable push notifications"), plus
"no analytics SDK ... no usage data is collected from the app." No
mismatch. Data-deletion page live at congresstradealerts.com/delete.

### Play Data-safety form (docs/data-safety-form.md)

**AGREES**, with the taxonomy translation stated above:
- Play row 1 "Device or other IDs" (push token) -> Apple Identifiers >
  Device ID. Same answers: collected yes, shared no, linked no,
  tracking no, purpose app functionality, optional, deletable.
- Play row 2 "Other user-generated content" (subscription_prefs) ->
  Apple User Content > Other User Content. Same answers.
- Play row 3 (push engagement) declared NOT collected on Play; here it
  simply does not appear, since Apple only lists collected types. Same
  underlying fact: zero mobile call sites.

### Superseded prior version of this checklist

The pre-2026-07-11 version of this file folded subscription_prefs into
the Device ID bullet and marked User Content "NO". That bundling was
wrong by Apple's taxonomy (preferences are not a device identifier)
and inconsistent with the Play form's separate row 2. This version
splits them into the two types above. When transcribing into ASC,
declare BOTH types.

### Export compliance (adjacent, one line)

app.json ios.config.usesNonExemptEncryption = false (app.json:17-19;
standard HTTPS only). ITSAppUsesNonExemptEncryption lands in
Info.plist at prebuild. Consistent with "no proprietary encryption."

---

## Conditional triggers - re-audit before answers change

Any of these flips answers above; re-run this checklist and update ASC
(and the app.json manifest) in the same release:

1. **Sentry / crash reporting** - if a SENTRY_DSN is ever set and
   @sentry/react-native lands in package.json, Diagnostics (Crash
   Data, likely Performance Data) becomes collected. Currently
   dormant: zero sentry hits in package.json.
2. **Mobile fires /api/track or /api/push/engagement** - Usage Data >
   Product Interaction (Apple) / App activity > Other actions (Play)
   becomes collected. The engagement endpoint exists worker-side;
   wiring the deep-link tap POST `{ trade_id }` is a separate cta-app
   ticket. The payload is aggregate-only (no token, no user id), but
   it is still an off-device transmission triggered by user
   interaction - declare it when wired.
3. **expo-updates re-enabled** - flipping app.json updates.enabled to
   true resumes the per-install EAS-Client-ID beacon to u.expo.dev on
   every launch: a Device ID collected by Expo as a third-party
   partner, on launch rather than opt-in. That changes "collection is
   optional" and adds a partner disclosure. (This is exactly what the
   Play form had to declare before the beacon was turned off.)
4. **Auth lands** - any account system flips "Linked to You" for both
   declared types and adds Identifiers > User ID.
5. **SHOW_UPGRADE_CTA flipped true** - restores the Settings
   Subscription card (external Stripe link-out). Does not by itself
   change data collection (checkout is web-side), but re-check
   Purchases and update the review notes before that release.

---

## Data flow declaration (one-liner for ASC review notes)

"Congress Trade Alerts is an informational, civic-transparency tool
over public STOCK Act disclosure data - no trading, no financial
advice. The app has no accounts and no sign-in. It collects only an
anonymous Expo push token plus the user's alert preferences (which
members, tickers, and minimum trade size to be notified about), both
transmitted only after the user opts into push in Settings, and used
solely to deliver push notifications. Disabling push deletes the token
and preferences from the device and our server. No analytics, no
crash reporting, no third-party tracking."
