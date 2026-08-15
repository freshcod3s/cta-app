# REVIEW-SUBMISSION.md -- iOS release runbook (Definition of Done)

Every remaining step from the current state to "Submitted for Review" on the
App Store, in execution order. Each step is tagged:

- `[CC]`  -- Claude Code executes it (command or API/browser-drivable).
- `[JOE]` -- genuinely manual: GUI-only, 2FA, biometric, or Apple provides
  no API for it.

Companion docs: `docs/ios-launch-checklist.md` (field-by-field ASC values),
`store/README.md` (asset inventory), `submission-instructions.md`.

---

## 0. CURRENT STATE (verified 2026-07-11, branch feat/web-parity @ 0f209e6)

- Option (a) shipped: v1 has NO purchase surface on any platform.
  `SHOW_UPGRADE_CTA = false` in `lib/flags.ts` (commit 0f209e6). No IAP, no
  external purchase link, no in-app pricing. FAQ keeps descriptive
  Free-vs-Pro copy only (no CTA, no pricing, no links). Guideline 3.1.3(f)
  free stand-alone companion.
- App config ready in `app.json`: bundle id `com.congresstradealerts.cta`,
  `ios.config.usesNonExemptEncryption: false` (auto-answers export
  compliance at upload), `ios.privacyManifests` declared
  (NSPrivacyAccessedAPITypes empty by design -- see
  `docs/ios-launch-checklist.md` "Required-reason API declarations").
- `eas.json` `build.production.ios` has `autoIncrement: "buildNumber"`.
- NO auth/login in v1 -> ASC review sign-in = No, no demo account needed.
- Push is opt-in from Settings only; Expo push -> APNs; token POSTed to
  `congresstradealerts.com/api/push/token`. No analytics SDK, no tracking,
  no third-party native SDKs, expo-updates disabled (no launch beacon).
- Privacy posture: Apple Tracking = NO; Data Linked to User = NONE; Data
  Not Linked = Device ID (push token), App Functionality only.
- EAS CLI: **NOT installed on the Windows rig as of 2026-08-07** (absent from
  the Bash PATH, the PowerShell PATH, `npm ls -g`, `node_modules/.bin`, and
  `package.json`). The "18.13.0 installed and logged in" note here was true
  when written; it no longer describes this machine. `npm install -g eas-cli`
  (>= 16.0.0 per `eas.json`) is the first step of any EAS work.
- BLOCKERS:
  - `eas.json` `submit.production.ios` still has REPLACE_WITH placeholders
    for `ascAppId` and `appleTeamId`.
  - NO App Store Connect API key or Apple credential exists in the BWS
    vault (verified 2026-07-11). This is a statement about the BWS vault
    ONLY -- ASC API keys DO exist in the App Store Connect console, and one
    `.p8` is on this machine. See section 1.
  - The cta-app BWS project UUID in `.bws-project`
    (ac76651c-c42c-4f49-abd6-b468010fbdec) returns 404 -- stale. Needs
    recreation or re-grant in the web vault before `scripts/deploy.sh`
    can inject secrets. Until fixed, run plain `eas ...` on the existing
    interactive login instead of the wrapper (fallback noted per step).
- Positioning (mandatory in Review Notes): informational civic-transparency
  tool over public STOCK Act disclosure data. No trading, no financial
  advice, no copy-trading. NOT fintech.
- Company: Freshcod3s LLC. Support/marketing URL
  https://congresstradealerts.com (privacy: /privacy, terms: /terms, data
  deletion: /delete).

---

## 1. ASC API key -- ALREADY DONE, do not generate a new one

**Status corrected 2026-08-07.** ASC API keys already exist in the console
(several, three of them showing July 2026 last-use dates), and one `.p8` is on
this machine in a restricted-ACL directory outside every repo working tree.
**Do not generate another key.** Skip to step 4 below (hand the existing key to
EAS). Steps 1-3 are retained only as the procedure for a future key rotation.

The generation procedure, for reference / rotation only:

1. App Store Connect -> Users and Access -> Integrations ->
   App Store Connect API -> Team Keys -> Generate API Key.
2. Role: **App Manager** (Admin also works; App Manager is the minimum
   that can create apps and submit builds).
3. Download the `.p8` file ONCE (Apple never re-serves it). Note the
   Key ID and Issuer ID shown on the same page.
4. Hand the key to EAS -- **recommended path**: run

       eas credentials --platform ios

   interactively, choose "App Store Connect: Manage your API Key", and
   upload the .p8. EAS stores the key server-side; no local file persists,
   nothing to vault, nothing to gitignore-babysit. (Alternative: store the
   three parts in the BWS vault under names like `EXPO_ASC_API_KEY_ID`,
   `EXPO_ASC_API_KEY_ISSUER_ID`, plus the .p8 content -- but
   `EXPO_ASC_API_KEY_PATH` is file-based, so the vault route still requires
   materializing a file at run time. Prefer the EAS-stored key.)
5. The Apple Team ID auto-resolves from the API key once it is on EAS
   servers -- no separate developer-portal lookup needed.

Verify: `eas credentials --platform ios` shows an App Store Connect API
Key on the production profile. The `.p8` is deleted from Downloads (or
never left the EAS upload prompt).

Also [JOE], same sitting (unblocks the deploy.sh wrapper, ~2 min): in the
Bitwarden web vault, recreate the cta-app Secrets Manager project or
re-grant the machine account, then update `.bws-project` with the new UUID
(CC can edit the file once the UUID exists). Not on the critical path if
the plain-`eas` fallback is used throughout.

---

## 2. [CC] EAS iOS credentials (distribution cert + profile + APNs)

    eas credentials --platform ios

- Let EAS generate and manage the Apple Distribution Certificate and the
  App Store provisioning profile for `com.congresstradealerts.cta`.
- APNs key: EAS auto-manages a Push Notifications key for
  expo-notifications -- accept the managed option.

Verify: credentials summary lists Distribution Certificate, Provisioning
Profile (App Store), and Push Key, all "managed by EAS", for the
production profile.

Retry: if Apple auth fails here, the ASC API key from step 1 is missing or
role-insufficient -- re-check step 1 before anything else.

## 3. [CC] Fill eas.json submit.production.ios

- `appleTeamId`: known once the API key exists (step 1); EAS prints it, or
  read it from the credentials summary.
- `ascAppId`: this is the numeric Apple ID of the ASC app record. The
  record does not exist yet -- EAS AUTO-CREATES it on the first
  `eas submit` run with the API key (it prompts "create a new app?" ->
  yes, bundle id `com.congresstradealerts.cta`, name Congress Trade
  Alerts). So either:
  (a) leave `ascAppId` placeholder, run step 5 once, let EAS create the
      record and prompt, then backfill the id it reports into `eas.json`; or
  (b) if the app record already exists in ASC, copy the Apple ID from
      ASC -> App Information -> General and fill it now.
- `appleId`: REMOVED 2026-08-06 -- it exists only to support Apple ID +
  app-specific-password auth. Under ASC API key auth, supply the key via
  `EXPO_ASC_API_KEY_PATH` / `EXPO_ASC_KEY_ID` / `EXPO_ASC_ISSUER_ID` (preferred
  in a PUBLIC repo) and keep `ascAppId` + `appleTeamId` -- both auth-independent.

Verify: `git diff eas.json` shows only the two ids changed; JSON parses
(`node -e "require('./eas.json')"`). Commit the change (ids are
non-secret).

## 4. [CC] Production build

Preferred (once the BWS project is re-granted):

    scripts/deploy.sh build --platform ios --profile production

Fallback while `.bws-project` is stale (bws will 404):

    eas build --platform ios --profile production

Notes:
- `autoIncrement: "buildNumber"` bumps the iOS build number remotely --
  never hand-edit it.
- Cloud build takes ~15-30 min of build time; the FREE-TIER QUEUE can add
  significant wait ahead of that. Do not assume a hang -- check the queue
  position on the build page first.

Verify: build status `finished` on the EAS build page (the CLI prints the
URL; also `eas build:list --platform ios --limit 5`). Artifact is an .ipa.

Build FAILS -> `eas build:list --platform ios --limit 5` to get the build
id, open the build page logs (or `eas build:view <id>`), fix, re-run.
Common first-build failures: credentials not yet on the production profile
(redo step 2), native prebuild errors (reproduce locally with
`npx expo prebuild --clean` and read the error).

## 5. [CC] Submit to TestFlight

Preferred:

    scripts/deploy.sh submit --platform ios --profile production

Fallback while the vault is stale:

    eas submit --platform ios --profile production

- Uses the EAS-stored ASC API key; picks the latest finished production
  build (or pass `--id <build-id>`).
- First run: EAS offers to auto-create the ASC app record -- accept, then
  backfill `ascAppId` per step 3(a).
- Export compliance is auto-answered: `usesNonExemptEncryption: false`
  landed `ITSAppUsesNonExemptEncryption=false` in Info.plist at prebuild,
  so no per-build compliance prompt appears in ASC.

Verify: `eas submit` exits 0 and prints the ASC upload confirmation.

Submit FAILS -> check, in order: (1) `ascAppId` is the numeric Apple ID,
not the bundle id; (2) the ASC API key exists on EAS and has App
Manager/Admin role (a Developer-role key cannot create apps or submit);
(3) `appleTeamId` matches the team the key belongs to. Re-running submit
is safe -- ASC rejects duplicate build numbers, and autoIncrement prevents
collisions on fresh builds.

## 6. [CC] Verify ASC processing

- Build appears in ASC -> My Apps -> Congress Trade Alerts -> TestFlight
  tab, status Processing -> Ready to Test (processing usually 5-30 min).
- Watch for ITMS-91053 (missing required-reason API declarations) --
  surfaces here and via email to the account holder after processing.
  Remediation if it fires: add the flagged categories to `app.json` ->
  `ios.privacyManifests.NSPrivacyAccessedAPITypes` (category + reason
  codes; the dependency inventory in `docs/ios-launch-checklist.md`
  "Required-reason API declarations" maps packages to categories), then
  rebuild (step 4) and resubmit (step 5).

Verify: build row shows "Ready to Test" (internal testing needs no Beta
App Review for internal-group testers) and no ITMS warnings arrived.

## 7. [JOE] TestFlight internal tester (GUI/2FA)

- ASC -> Users and Access / TestFlight -> Internal Testing group
  `Internal` -> add the owner's personal Apple-ID email as tester (value in the records binder, not in this repo).
- Accept the TestFlight invite email, install the TestFlight app, install
  the build on a physical iPhone.
- Smoke test per `docs/ios-launch-checklist.md` "Post-submit verification"
  (cold launch, push toggle -> permission prompt, receive a real push,
  deep link to Trade Detail, universal link, push OFF -> token removed).

Verify: app cold-launches from TestFlight; the smoke checklist passes.

## 8. [CC] Complete the ASC record (drivable via ASC API / Chrome MCP)

Sources are authoritative -- transcribe, do not improvise:

- Listing fields (name, subtitle, promo text, description, keywords,
  categories, URLs, copyright): `store/app-store/metadata.txt` (field ->
  line map in `docs/ios-launch-checklist.md` "ASC App Information").
- App Privacy questionnaire: `store/app-store/privacy-checklist.md`
  (Tracking NO; Linked NONE; Not Linked = Device ID + Other User Content,
  both App Functionality only).
- Age rating questionnaire: `store/app-store/age-rating.md` (2026
  questionnaire, all content toggles None/No, expected computed outcome
  4+ -- accept whatever ASC computes, never self-select higher).
- Review information: sign-in required = **No** (no auth in v1), no demo
  account. Contact info = Joe / hello@freshcod3s.com. Review Notes:
  transcribe the APP_REVIEW_NOTES block from
  `store/app-store/metadata.txt` (leads with: informational tool over
  public STOCK Act disclosure data, no trading, no advice).
- Screenshots -- KNOWN-OPEN ITEM: 5 existing 1320x2868 (6.9-inch) PNGs at
  `store/app-store/screenshots/`, but 3 of 5 (01-feed, 02-trade-detail,
  05-ticker) show price-derived UI that RETURNS_DISPLAY=false hides in
  the shipping build (guideline 2.3.3 mismatch) -- re-capture per
  `store/app-store/screenshot-spec.md` before upload; 03-daily-dive and
  04-committee are reusable as-is.

Verify: ASC version page shows no missing-field warnings; "Add for
Review" / "Submit for Review" button becomes enabled.

## 9. [JOE] STOP -- Submit for Review is Joe's gate

CC NEVER clicks Submit for Review (or Add for Review -> Submit). This is
an explicit stop condition, consistent with
`docs/ios-launch-checklist.md` "Stop conditions". When steps 1-8 are all
verified, CC reports "ready for review submission" and halts. Joe presses
the button in ASC.

Post-submit (informational): status Waiting for Review -> In Review ->
typically 24-48h. If rejected, the Resolution Center message drives the
next ticket -- do not re-submit without a fix.

---

## Quick failure-mode index

| Failure | First command / check | Fix |
| --- | --- | --- |
| `scripts/deploy.sh` errors from bws (404/project) | `.bws-project` UUID stale | [JOE] re-grant vault project, or use plain `eas` fallback |
| Build fails | `eas build:list --platform ios --limit 5` -> build page logs | fix per log; credentials issues -> redo step 2 |
| Submit fails | error text; `eas credentials -p ios` | verify ascAppId numeric, API key role App Manager+, team id matches key |
| ITMS-91053 email/warning | ASC TestFlight tab + account email | add NSPrivacyAccessedAPITypes entries in app.json, rebuild + resubmit |
| Build stuck "in queue" | EAS build page queue position | free-tier queue -- wait; not a hang |
| Export-compliance prompt appears | Info.plist missing key | confirm app.json ios.config.usesNonExemptEncryption=false survived prebuild |
