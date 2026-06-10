# Play Data Safety Form

Per-data-type schema for the Play Console Data Safety form. Audit basis:
`lib/push/register.ts`, `lib/push/api.ts`, `app/_layout.tsx`,
`features/settings/store`, `features/trades/api/*`, plus the `CLAUDE.md`
product invariants (no client analytics SDK, watchlist local-only in v1,
auth v1 = read-only + waitlist).

**OPSEC posture:** field-path-only. Source-code citations by `file:line`.
Placeholders `<BRAND_DOMAIN>`, `<SUPPORT_EMAIL>` substitute at Play Console
upload time.

---

## Top-level Data Practices declarations

| Question | Answer | Source |
|---|---|---|
| Does your app collect or share any of the required user data types? | YES | Push token is transmitted to worker; see row 1 below. |
| Is all of the user data collected by your app encrypted in transit? | YES | All worker calls use HTTPS (`lib/api/client.ts` — `API_BASE_URL` is `https://<BRAND_DOMAIN>`). |
| Do you provide a way for users to request that their data be deleted? | YES | Push token row supports DELETE via `lib/push/api.ts:107-140` `deletePushToken` (triggered by Settings -> push off). Account-level deletion request via `<SUPPORT_EMAIL>` (CAN-SPAM contact path). |
| Have you committed to following the Play Families Policy? | NO | App targets 18+ (finance content); see `docs/play-console-metadata.md` target-audience section. |

---

## Per-data-type rows

### Row 1 — Device or other IDs

| Field | Value |
|---|---|
| Data type | Device or other IDs |
| Specific data | Expo push token (`ExponentPushToken[xxx]`) — Expo Push service routing identifier; not a hardware ID |
| Collected | YES |
| Shared with third parties | NO (transmitted to worker only; worker forwards through Expo Push API which is a processor, not a data recipient per Play guidance) |
| Linked to user | NO (anonymous broadcast in v1 per `lib/push/register.ts:15-16`; no user account in v1) |
| Used for tracking | NO (no cross-app/cross-site identifier linkage; no advertising IDs) |
| Purposes | App functionality |
| Collection required | NO (optional — user toggles push on in Settings; default off) |
| Source | `lib/push/register.ts:151-156` (Expo Push token issuance) + `lib/push/api.ts:67-105` (POST to worker `/api/push/token`) |
| Deletion mechanism | Settings -> push off triggers `lib/push/api.ts:107-140` DELETE; local copy cleared from `expo-secure-store` key `cta.push.token` at `lib/push/register.ts:74-80` |

### Row 2 — Other user-generated content

| Field | Value |
|---|---|
| Data type | Other user-generated content |
| Specific data | `subscription_prefs` — user-curated alert preferences: `members[]` (politicians), `tickers[]` (stocks), optional `min_amount` (dollar floor) |
| Collected | YES |
| Shared with third parties | NO |
| Linked to user | NO (linked only to the anonymous push-token row; no user account in v1) |
| Used for tracking | NO |
| Purposes | App functionality (filters which trade alerts the user receives) |
| Collection required | NO (optional — empty `members[]` + `tickers[]` is the default; `min_amount` absent = no floor) |
| Source | `lib/push/register.ts:162-170` POSTs `subscription_prefs` alongside token; current shape `{members: [], tickers: [], min_amount?: number}` per `features/settings/store` `subscriptionPrefs` selector |
| Deletion mechanism | Same as push token row — DELETE removes the row including `subscription_prefs` |

### Row 3 — App activity > Other actions

| Field | Value |
|---|---|
| Data type | App activity > Other actions |
| Specific data | Push engagement — `{trade_id}` POSTed when a push notification is tapped and the deep link opens |
| Collected | NO (endpoint exists worker-side at `POST /api/push/engagement`; mobile-side wire-up not yet implemented -- grep confirms zero call sites in cta-app) |
| Shared with third parties | NO |
| Linked to user | NO (aggregate-only per `CLAUDE.md` Decisions Log open follow-on — no user or token identifier in payload) |
| Used for tracking | NO |
| Purposes | Analytics (server-side aggregate engagement counts on the D1 events table per worker `CLAUDE.md`) |
| Collection required | NO (only fires on user-initiated push tap) |
| Source | Open follow-on per `CLAUDE.md` Decisions Log; endpoint shape `POST <BRAND_DOMAIN>/api/push/engagement {trade_id}`. Mobile-side wire-up is a separate cta-app ticket, not in this branch. |

---

## Data types NOT collected (explicit zero-row declarations)

These categories appear on the Play form and require an explicit "No" to avoid rejection. Each is justified against the codebase audit:

| Category | Why "No" | Audit reference |
|---|---|---|
| Personal info > Name | No name collection in v1 (no auth, no profile). | grep `lib/` `app/` `features/` for name fields -> none |
| Personal info > Email address | No in-app email collection (Beehiiv signup form is web-side per `CLAUDE.md`). | `expo-secure-store` keys: only `cta.push.token` |
| Personal info > User IDs | No user account in v1 (anonymous broadcast). | `CLAUDE.md` stack lock: "Auth v1: none" |
| Personal info > Address / Phone / Race or ethnicity / Sexual orientation / Religious or political beliefs / Other personal info | None collected. | No corresponding fields in any feature module |
| Financial info > User payment info / Purchase history / Credit score / Other financial info | Stripe Checkout handled web-side per product invariant #1; app never sees payment data. | `expo-web-browser` opens external Stripe URL; no IAP per product invariant |
| Health and fitness > * | App is finance/civic, not health. | No HealthKit equivalents wired |
| Messages > * | No messaging features. | No conversation/message data types in any feature |
| Photos and videos > * | No camera/photo permission. | `app.json:android.permissions` = `["POST_NOTIFICATIONS"]` only |
| Audio files > * | No audio capture/playback features. | No audio modules in deps |
| Files and docs > * | No file picker/upload. | No `expo-file-system` user-facing flow |
| Calendar > * | No calendar integration. | No calendar deps in `package.json` |
| Contacts > * | No contacts permission. | Not in permissions array |
| App activity > App interactions / In-app search history / Installed apps / Other user-generated content (beyond row 2) / Other actions (beyond row 3) | Beyond rows 2 and 3, no app-activity collection (no client analytics SDK per product invariant). | `package.json` deps audit: no analytics/telemetry SDK |
| App info and performance > Crash logs / Diagnostics / Other app performance data | Sentry deferred per `CLAUDE.md` stack lock ("Telemetry v1: none"). | No `@sentry/*` in `package.json` |
| Device or other IDs (beyond push token row 1) | No advertising ID, no IDFA equivalent, no hardware ID collection. | No `expo-tracking-transparency` or equivalent |
| Web browsing > Web browsing history | `expo-web-browser` opens external URLs but no logging/processing of browsing. | `expo-web-browser` usage limited to opening Stripe Checkout and source-document URLs per product invariants #1 and #5 |
| Location > Approximate / Precise | No location permission. | `app.json:android.permissions` audit |

---

## Encryption + security practices (Data Safety security section)

| Practice | Declared | Source |
|---|---|---|
| Data encrypted in transit | YES | All worker calls via HTTPS; `lib/api/client.ts` `API_BASE_URL` enforces `https://` |
| Data encrypted at rest | YES | Push token in `expo-secure-store` (Keystore/EncryptedSharedPreferences on Android per product invariant #3); React Query cache + watchlist in AsyncStorage (NOT encrypted — only contains public trade data fetched from the worker; no PII/credentials) |
| User can request data deletion | YES | Push token + `subscription_prefs` deletion via Settings -> push off (`lib/push/api.ts:107-140`). Account-level deletion via `<SUPPORT_EMAIL>` (no user accounts in v1, so no profile to delete; future-state covered when auth lands) |
| Independent security review | NO (no third-party audit completed) | n/a |

---

## Re-audit triggers

This form must be re-audited if any of the following change:
- Auth lands (will add user ID / API key rows + change "Linked to user" answers).
- Client analytics SDK is added (Sentry, etc.).
- Worker contract starts collecting fields not enumerated here (e.g., adds `user_id` to engagement payload).
- New permissions are added to `app.json:android.permissions`.
- A new third-party SDK is added to `package.json` that transmits data.

Last audit: 2026-05-27 against branch `android-hardening`.
