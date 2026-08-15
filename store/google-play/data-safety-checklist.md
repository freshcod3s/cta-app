# Google Play Data Safety - transcription checklist

Joe enters these answers into Play Console at:
All apps -> (CTA) -> Policy -> App content -> Data safety.

App-side basis verified at CTA-App-1-10 commit time -- same evidence
as the iOS Privacy Nutrition Labels (see app-store/privacy-checklist.md).

## Top-level questions

- **Does your app collect or share any of the required user data
  types?** YES (anonymous push token only)
- **Is all user data collected by your app encrypted in transit?** YES
  (HTTPS-only to congresstradealerts.com)
- **Do you provide a way for users to request that their data is
  deleted?** YES (Settings -> push toggle OFF deletes the token from
  our backend; no other data is retained because no other data is
  collected)
- **Have you committed to follow the Google Play Families Policy?** N/A
  (app is NOT directed at children)

## Data types collected

### App activity

- [ ] App interactions -- NO
- [ ] In-app search history -- NO
- [ ] Installed apps -- NO
- [ ] Other user-generated content -- NO
- [ ] Other actions -- NO

### App info and performance

- [ ] Crash logs -- NO
- [ ] Diagnostics -- NO
- [ ] Other app performance data -- NO

### Device or other IDs

- [x] **Device or other IDs** -- the Expo push token
  - Collected? YES
  - Required or optional? **Optional** (user opts in via Settings ->
    Enable push notifications)
  - Purpose: **App functionality** (delivering push notifications)
  - Shared with third parties? **NO** (Expo Push is a service provider
    operating on our behalf, NOT a third party in Play's taxonomy)
  - Encrypted in transit? **YES**
  - Can users request deletion? **YES** (Settings -> push toggle OFF)

### Everything else - NONE

- [ ] Personal info -- NO (no name, email, address, phone, race/ethnicity,
  political/religious belief, sexual orientation, other identifiers)
- [ ] Financial info -- NO
- [ ] Health and fitness -- NO
- [ ] Messages -- NO
- [ ] Photos and videos -- NO
- [ ] Audio files -- NO
- [ ] Files and docs -- NO
- [ ] Calendar -- NO
- [ ] Contacts -- NO
- [ ] Location -- NO
- [ ] Web browsing -- NO

## Data sharing

NONE. No data shared with third parties.

(Expo Push is a service provider; Play's taxonomy distinguishes
processors-acting-on-your-behalf from third parties. The Expo
infrastructure receives the token only to deliver pushes, not to use
the data for its own purposes.)

## Data flow declaration (one-line summary for Play review notes)

"This app collects only an anonymous Expo push token plus subscription
preferences (which members the user has opted into alerts for). The
token is used solely to deliver push notifications. Disabling push in
Settings removes the token from our backend. No accounts, no
analytics, no third-party tracking, no data sharing."
