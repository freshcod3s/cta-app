# Apple Privacy Nutrition Labels - transcription checklist

Joe enters these answers into App Store Connect at:
My Apps -> (CTA) -> App Privacy.

App-side basis verified at CTA-App-1-10 commit time:
- No accounts (Auth v1 = none per Lock).
- No analytics, no Sentry, no Firebase/Amplitude/PostHog/Mixpanel/Segment
  (verified via grep on package.json + package-lock.json -- zero hits).
- Push tokens: anonymous Expo push token + platform string +
  subscription preferences (members[], tickers[], optional min_amount).
  No PII, no email, no name, no IDFA, no IDFV collection.
- All transport over HTTPS to congresstradealerts.com (verified in
  lib/api/client.ts).
- Token deletion: Settings -> push toggle OFF removes token from
  backend (CTA-31).

## Data Used to Track You

NONE.

Tracking? **NO.**

(No advertising network calls, no cross-app/website tracking, no
shared device-graph identifier.)

## Data Linked to You

NONE.

(No accounts means no identity to link data to. Anonymous push token
is NOT linked to a user identity.)

## Data Not Linked to You

### Identifiers

- [x] **Device ID** -- the Expo push token
  - Used for: **App Functionality** (delivering push notifications)
  - Tracked across apps/websites? NO
  - Linked to user identity? NO

### Other (none of the following apply)

- [ ] Contact Info -- NO
- [ ] Health & Fitness -- NO
- [ ] Financial Info -- NO (we report on others' public financial
  filings; we do not collect any user financial data)
- [ ] Location -- NO
- [ ] Sensitive Info -- NO
- [ ] Contacts -- NO
- [ ] User Content -- NO (no user posts, comments, or uploads)
- [ ] Browsing History -- NO
- [ ] Search History -- NO
- [ ] Purchases -- NO
- [ ] Usage Data -- NO (no analytics)
- [ ] Diagnostics -- NO (no Sentry, no Firebase Crashlytics, no Bugsnag)
- [ ] Surroundings -- NO
- [ ] Body & Health -- NO

## Data flow declaration (one-line summary for ASC review notes)

"This app collects only an anonymous Expo push token plus subscription
preferences (which members, tickers, and minimum trade sizes the user
selects for push alerts). The token is used solely to deliver push
notifications. Disabling push in Settings removes the token and
preferences from our backend. No accounts, no analytics, no
third-party tracking."
