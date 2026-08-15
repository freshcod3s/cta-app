# iOS Launch Checklist

Runbook for App Store Connect submission. References authoritative copy
in `store/app-store/metadata.txt` and privacy declarations in
`store/app-store/privacy-checklist.md`. Created on `ios-hardening`
branch; content stays stable post-merge.

URL values (privacy policy, support URL, marketing URL) are not
inlined here -- they live in `store/app-store/metadata.txt` section
"4. URLS" as the single source of truth. This doc references that
section so any URL change updates one file, not two.

## Pre-flight gates (blocking)

- [x] Apple Developer Program enrollment complete (2026-08-07):
      **ORGANIZATION -- Freshcod3s LLC, Team ID `LML7BRJ68Q`.** Free Apps
      Agreement ACTIVE 2026-08-05 to 2027-05-12, 175 territories. The
      individual entity is Deprecated with no agreements.
- [ ] App Store Connect app shell created with bundle id
      `com.congresstradealerts.cta`
- [ ] `eas.json` `submit.production.ios` placeholders substituted (or
      passed via CLI flags at submit time per
      `submission-instructions.md`)
- [ ] APNs key uploaded to Expo via `eas credentials`
- [x] `.p8` API key on disk (2026-08-07). It lives OUTSIDE every repo working
      tree in a restricted-ACL directory in the user profile, not in the repo
      -- so `.gitignore:16` (`*.p8`) is a backstop, not the thing protecting
      it. Verified: no `.p8` is tracked in any workspace repo, and none has
      ever been committed to cta-app's history.

## ASC App Information

Source: `store/app-store/metadata.txt` (restructured 2026-07-11 into
numbered sections; section refs below). Joe pastes each value into the
matching ASC field.

| ASC field | Source | metadata.txt section |
| --- | --- | --- |
| Name (30 chars) | `Congress Trade Alerts` | 1. CORE LISTING FIELDS |
| Subtitle (30) | `Capitol Hill Stock Disclosures` | 1. CORE LISTING FIELDS |
| Promotional Text (170) | per file | 1. CORE LISTING FIELDS |
| Description (4000) | per file | 1. CORE LISTING FIELDS |
| Keywords (100) | per file | 1. CORE LISTING FIELDS |
| Review Notes | APP_REVIEW_NOTES, paste verbatim | 2. APP REVIEW NOTES |
| Primary Category | Finance | 3. CATEGORY RECOMMENDATION |
| Secondary Category | Reference | 3. CATEGORY RECOMMENDATION |
| Support URL | per metadata.txt | 4. URLS |
| Marketing URL | per metadata.txt | 4. URLS |
| Privacy Policy URL | per metadata.txt | 4. URLS |
| Copyright | `(c) 2026 Freshcod3s LLC` | 5. COPYRIGHT + AGE RATING |

## App Privacy questionnaire

Source: `store/app-store/privacy-checklist.md`. Verbatim transcription
into ASC -> My Apps -> (CTA) -> App Privacy.

- Tracking: **NO**
- Data Linked to You: **NONE**
- Data Not Linked to You: **Device ID** (Expo push token) + **Other
  User Content** (watchlist alert preferences, sent only after push
  opt-in), both App Functionality only; not tracked across apps

### Device ID classification -- rationale

Apple's [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
defines Device ID as: *"Such as the device's advertising identifier,
or other device-level ID."* The "or other device-level ID" wording
is permissive enough to include an Expo push token (per-app-installation,
device-resident, used solely to route push notifications). This
classification:

- matches industry convention (OneSignal, Airship, expo-notifications
  guidance)
- aligns the `app.json` `privacyManifests` declaration with the
  questionnaire answer (consistency between manifest and ASC form is a
  review-flag risk if they disagree)
- is consistent with the declaration in
  `store/app-store/privacy-checklist.md` (Device ID row)

Disclosed as: Device ID, Not Linked to User, Not Used for Tracking,
Purpose: App Functionality.

### ASC review-notes box (paste verbatim)

Source: `store/app-store/privacy-checklist.md` (ASC review-notes
one-liner section).

> This app collects only an anonymous Expo push token plus subscription
> preferences. The token is used solely to deliver push notifications.
> Disabling push in Settings removes the token from our backend. No
> accounts, no analytics, no third-party tracking.

## Age Rating questionnaire

Source: `store/app-store/age-rating.md` (authoritative -- the current
2026 questionnaire answer set, incl. the Unrestricted Web Access
rationale). Expected computed outcome **4+**; accept whatever ASC
computes, never self-select higher. All content toggles = None/No.

## Export Compliance

**Answer: EXEMPT** -- HTTPS-only transport, no proprietary or custom
cryptography. `app.json` declares
`ios.config.usesNonExemptEncryption: false`, which auto-fills the
TestFlight / ASC export-compliance prompt on every upload (no per-build
prompt clicks). Verified against:

- Transport: `fetch` over HTTPS only (`lib/api/client.ts`,
  `lib/push/api.ts`)
- Storage: `expo-secure-store` (iOS Keychain wrapper -- exempt
  platform primitive)
- No `react-native-crypto`, no custom AES/RSA, no third-party crypto
  deps (verified against `package.json`)

Per Apple's export-compliance flow this qualifies for the standard
HTTPS-only exemption (Annotation Note: ECCN 5D992.c, mass-market
software using only standard TLS).

## Content Rights

**Answer: NO third-party content.**

All trade data is derived from US Government public records
(House Clerk PTR + Senate EFD per `store/app-store/metadata.txt`
section 1, DATA SOURCES).
Government works are not subject to copyright (17 USC 105). No
user-generated content, no licensed third-party media, no embedded
fonts requiring license attribution beyond OSS licenses.

## Required-reason API declarations

`app.json` -> `ios.privacyManifests.NSPrivacyAccessedAPITypes` is
**empty by design**.

Apple's privacy-manifest model is federated: each native library that
uses a required-reason API ships its own `PrivacyInfo.xcprivacy`
declaring its own usage. At App Store upload time, Apple's toolchain
aggregates every manifest in the app bundle (the app's plus every
dependency's) into a single privacy report.

The cta-app's own JS/TS code does not directly call any required-reason
native API. All access flows through wrapped Expo / RN libraries that
ship their own manifests. There is therefore nothing for the app-level
manifest to declare beyond `NSPrivacyTracking: false`,
`NSPrivacyTrackingDomains: []`, and the Device ID collected-data type.

### Dependency manifest inventory (audited 2026-05-27)

The following packages in `node_modules` ship `PrivacyInfo.xcprivacy`
and cover their own required-reason API usage:

| Package | Categories declared |
| --- | --- |
| `expo-application` | FileTimestamp [C617.1] |
| `expo-constants` | UserDefaults [CA92.1] |
| `expo-device` | SystemBootTime [35F9.1] |
| `expo-file-system` | FileTimestamp [0A2A.1, 3B52.1], DiskSpace [E174.1, 85F4.1] |
| `expo-notifications` | UserDefaults [CA92.1] |
| `expo-system-ui` | UserDefaults [CA92.1] |
| `@react-native-async-storage/async-storage` | FileTimestamp [C617.1] |
| `node_modules/react-native/React/Resources` | UserDefaults [CA92.1], FileTimestamp [C617.1] |
| `node_modules/react-native/ReactCommon/cxxreact` | FileTimestamp [C617.1] |
| `node_modules/react-native/third-party-podspecs/boost` | FileTimestamp [C617.1], SystemBootTime [35F9.1] |
| `node_modules/react-native/third-party-podspecs/glog` | FileTimestamp [C617.1] |
| `node_modules/react-native/third-party-podspecs/RCT-Folly` | FileTimestamp [C617.1] |
| `expo-secure-store` (15.0.8) | No manifest -- Keychain access is exempt from required-reason API rules |

Re-run the inventory after any `expo install` or major SDK bump:

```
# from repo root, list every shipped PrivacyInfo in node_modules
ls node_modules/**/PrivacyInfo.xcprivacy 2>$null
```

If a new dep with required-reason API usage is added but ships NO
manifest, the app-level manifest must declare its categories +
reasons -- failure to do so is a hard reject at App Review.

## TestFlight setup (post-Apple-enrollment)

### Internal tester group

- ASC -> Users and Access -> Add Testers (up to 100 internal Apple IDs)
- Group name: `Internal`
- Default tester: Joe (per global memory)
- Build distribution: automatic on every new build upload (no per-build
  manual assignment)

### EAS Submit dry-run plan (DO NOT EXECUTE without explicit go-ahead)

```
# 1. Build (Apple Developer enrollment required for credentials)
eas build --platform ios --profile production

# 2. Submit (substitute real ASC API key at invocation time;
#    .p8 file gitignored per .gitignore:16)
eas submit --platform ios --profile production \
  --asc-api-key-id <KEY_ID> \
  --asc-api-key-issuer-id <ISSUER_ID> \
  --asc-api-key-path ./AuthKey_<KEY_ID>.p8
```

`eas submit` pushes the .ipa to ASC, which routes to Beta App Review
(~24-48h). Once Beta Review passes, internal testers can install via
the TestFlight app immediately. External (Public Link) testing
requires a separate Beta App Review per build.

### Post-submit verification

- [ ] Build appears in ASC -> TestFlight -> Builds
      (status: Processing -> Ready to Test)
- [ ] Internal tester (Joe) receives TestFlight invite email
- [ ] Install via TestFlight on physical iPhone
- [ ] Smoke test (real-device, per CLAUDE.md Process Kernel 8.4):
  - [ ] Cold launch, splash renders on `#0b1220`
  - [ ] Settings -> Push toggle ON -> permission prompt appears
  - [ ] Receive a real push (worker dispatches a test trade)
  - [ ] Tap push -> deep link opens Trade Detail (`/trade/<id>`)
  - [ ] Universal link: open a production `/trade/<id>` URL (host per
        `store/app-store/metadata.txt` section 4, URLS) from Mail or
        Messages ->
        opens in-app (validates `associatedDomains` entitlement)
  - [ ] Toggle push OFF -> token removed from backend (verify via
        worker D1 query)

## Stop conditions

This document is a runbook. Claude Code does NOT execute on the user's
behalf:

- `eas submit` (real upload)
- Any ASC web login or credential paste
- Any paid action
- Any irreversible publish
