# Android Internal Testing Track Runbook

Step-by-step click-path + CLI runbook for getting the first AAB onto the
Play Console internal testing track, then transitioning to closed testing
(20-tester / 14-day requirement) and eventually production.

Companion to `docs/android-launch-checklist.md` (overall launch posture),
`docs/play-console-metadata.md` (store listing + content rating), and
`docs/data-safety-form.md` (Data Safety form schema).

**OPSEC posture:** field-path-only. Placeholders `<SERVICE_ACCOUNT_EMAIL>`,
`<PLAY_CONSOLE_APP_ID>`, `<TESTER_EMAILS>`, `<CLOUD_PROJECT_ID>` substitute
for Joe-side literals at execution time. Brand-external URLs (Play policy,
Google Cloud docs) cited inline. Paths are relative to the cta-app repo
root.

---

## 0. Pre-flight prerequisites

These must be true before any step below works. Verify each before starting.

- [ ] Google Play Console developer account is provisioned on the
      `<LLC_NAME>` seller identity (Phase-0 blocker #3 from
      `docs/android-launch-checklist.md`).
- [ ] An app listing exists in Play Console with `applicationId` matching
      `app.json:android.package`. The Play Console app gets a numeric
      `<PLAY_CONSOLE_APP_ID>` visible in the URL bar after listing creation.
- [ ] EAS CLI installed and authenticated: `eas whoami` returns the
      `<DEV_HANDLE>` Expo account from `app.json:expo.owner`.
- [ ] Project's EAS project ID matches `app.json:expo.extra.eas.projectId`.
      Confirm via `eas project:info`.
- [ ] Production EAS profile already exercised at least once successfully
      (i.e., a finished AAB build exists). If not, build first per
      section 1.
- [ ] Phase-0 blocker #6 (keystore backup) completed -- run
      `eas credentials -p android` -> Keystore -> Download once before
      first submission. The EAS-managed keystore is the only signing
      identity that can ship Play updates; losing it = forced new listing.

---

## 1. AAB build pre-flight

### 1a. List recent Android builds

```
eas build:list --platform android --status finished --limit 10
```

Expected output (per row):

```
| ID                                   | Profile     | Channel     | Status   | Distribution | Version | Runtime | Completed             |
| <build-id>                           | production  | production  | finished | store        | 1.0.0   | exposdk:54.0.0 | 2026-05-26 23:14 UTC |
```

What to confirm:
- The most recent `production` profile row has `Status: finished` and
  `Distribution: store` (NOT `internal` -- internal is sideload APK from
  preview/development profiles).
- `Version` matches `app.json:expo.version`.
- `Runtime` matches the Expo SDK in `package.json` (`expo: ~54.0.33`).

### 1b. Trigger a new production AAB build (only if no finished build exists)

```
eas build --platform android --profile production
```

Expected interactive prompts:
1. `Would you like to log in to your Expo account?` -- skip if already
   logged in (verified via `eas whoami` in section 0).
2. `Generate a new Android Keystore?` -- should NOT appear if Phase-0
   blocker #6 is satisfied. If it does, ABORT -- the existing keystore
   is being shadowed. Run `eas credentials -p android` to inspect first.
3. `What would you like your Android application id to be?` -- should
   NOT prompt; value is locked at `app.json:android.package`. If
   prompted, abort and check that the package field is set.
4. Build queues; CLI prints a build URL. Track via the URL or
   `eas build:list --platform android --limit 1`.

Expected outputs:
- Final line: `Build finished` with the artifact URL ending in `.aab`.
- The build ID (UUID) -- save this; it's the `<build-id>` for `--id`
  targeting in step 2.

### 1c. Artifact targeting modes

For `eas submit` (next section), pick one:

| Mode | Flag | When |
|---|---|---|
| Latest | `--latest` | Most recent finished build for the profile. Recommended for routine releases. |
| Specific | `--id <build-id>` | A particular historical build (e.g., re-submitting a hotfix that already passed QA). |
| Local file | `--path <local-aab-path>` | Local build artifact (rare; cloud builds preferred per `CLAUDE.md` stack lock line 78). |
| Interactive | (no flag) | EAS prompts for selection. Useful first time to verify the list. |

### 1d. `--non-interactive` flag

```
eas submit --platform android --profile production --latest --non-interactive
```

What it does: skips all prompts; fails immediately on any missing
configuration instead of asking. Required for CI; risky for first-run
because misconfigurations silent-fail instead of prompting.

**Do NOT use `--non-interactive` on the first submission.** Use it
only after the full interactive flow has succeeded at least once.

---

## 2. `eas submit` invocation walkthrough

### 2a. First-run interactive invocation

```
eas submit --platform android --profile production
```

Expected prompt sequence:

1. **Build selection.** EAS lists recent finished Android builds for the
   `production` profile. Select the build to submit. With `--latest`,
   this prompt is skipped.

2. **Google Service Account JSON.** EAS reads
   `eas.json:submit.production.android.serviceAccountKeyPath` ->
   `./store/google-play/service-account-key.json`. If the file exists,
   no prompt. If missing, EAS prompts for an upload or path -- ABORT and
   provision the file per section 3.

3. **Track confirmation.** EAS reads
   `eas.json:submit.production.android.track` -> `"internal"`. CLI
   prints the target track and continues without prompting.

4. **Submission.** CLI uploads the AAB to Play Console via the Play
   Developer API. Progress bar.

Expected outputs:
- `Submission successful` with a Play Console URL pointing at the
  internal testing track release page.
- Submission ID (UUID) -- track via `eas submit:list`.

### 2b. Common first-run failures + fixes

| Symptom | Cause | Fix |
|---|---|---|
| `Service account JSON not found` | `store/google-play/service-account-key.json` missing or wrong path | Run section 3; verify path matches `eas.json:submit.production.android.serviceAccountKeyPath` |
| `Package not found on Play Console` | Listing doesn't exist or `applicationId` mismatch | Create the listing in Play Console first; verify `app.json:android.package` matches the Play listing's package name (locked at listing creation, irreversible) |
| `Service account lacks permission` | Service account not granted in Play Console -> API access | Run section 3d (grant access in Play Console) |
| `versionCode <N> already exists` | EAS remote versionCode counter desynced from Play Console | Run `eas build:version:sync -p android` to align, then re-build |
| `App not eligible for production track` | Closed-testing 20-tester / 14-day requirement not satisfied | Submit to internal track first; expand to closed testing; see section 5 |

### 2c. Verifying submission landed

After `eas submit` reports success:

1. Visit the Play Console URL it printed (or navigate manually:
   Play Console -> Internal testing -> Releases).
2. Confirm a new release exists with the expected versionCode +
   release name.
3. Confirm the release status is `Draft` or `Available to testers`
   (depending on whether Play auto-publishes internal testing
   releases -- by default, yes).
4. Testers on the email list (section 4) receive the opt-in link
   via email and via the opt-in URL surfaced on the release page.

---

## 3. Service-account provisioning click-path

Inline runbook for setting up the Google Cloud service account + JSON
that `eas submit` uses for Play Console API access.

### 3a. Google Cloud project setup

1. Visit `https://console.cloud.google.com`.
2. Top-left project selector -> `New Project`.
3. Project name: any (e.g., `cta-app-eas`). Cloud auto-generates a
   `<CLOUD_PROJECT_ID>` (lowercase, hyphenated).
4. Click `Create`. Wait for the project to be ready; selector switches
   to the new project.

### 3b. Enable the Play Developer API

1. Navigation menu (hamburger) -> APIs & Services -> Library.
2. Search bar: `Google Play Android Developer API`.
3. Click the result -> `Enable`.
4. Wait for `API enabled` confirmation.

### 3c. Create the service account + JSON key

1. Navigation menu -> IAM & Admin -> Service accounts.
2. Click `Create service account` at the top.
3. **Service account details:**
   - Name: `eas-submit-bot` (or any; not OPSEC-sensitive)
   - ID: auto-fills from name; note the auto-generated
     `<SERVICE_ACCOUNT_EMAIL>` (format:
     `eas-submit-bot@<CLOUD_PROJECT_ID>.iam.gserviceaccount.com`).
   - Description: optional
   - Click `Create and continue`.
4. **Grant access (optional in Cloud Console -- SKIP).** Click
   `Continue` without granting roles. Permissions are granted in Play
   Console in step 3d, not here.
5. Click `Done`.
6. From the service-accounts list, click the new account's
   `<SERVICE_ACCOUNT_EMAIL>`.
7. Top tabs -> `Keys` -> `Add key` -> `Create new key`.
8. Key type: **JSON**. Click `Create`.
9. JSON downloads as `<CLOUD_PROJECT_ID>-<hash>.json`. **This is the
   only copy** -- Cloud does not retain the private key.

### 3d. Link service account to Play Console

1. Visit `https://play.google.com/console`.
2. Settings (gear icon, bottom-left) -> Developer account -> API access.
3. Scroll to `Service accounts` section. The new
   `<SERVICE_ACCOUNT_EMAIL>` should auto-appear (Cloud projects under
   the same Google identity surface here).
4. If it does not appear, click `Link existing Google Cloud project`
   and pick `<CLOUD_PROJECT_ID>`.
5. Next to the service account row, click `Grant access`.
6. **App permissions** tab:
   - Click `Add app`.
   - Select the cta-app listing (`<PLAY_CONSOLE_APP_ID>`).
   - Permissions: set the following to YES:
     - `Release to production, exclude devices, and use Play App Signing`
     - `Release apps to testing tracks`
     - `Manage testing tracks and edit tester lists`
     - `View app information and download bulk reports`
   - Leave others at default (NO).
7. **Account permissions** tab: leave at default (no account-level
   permissions needed for `eas submit`).
8. Click `Invite user`. Confirm.

### 3e. Place JSON in repo (locally only, NOT committed)

All paths in this section are relative to the cta-app repo root.

1. Verify directory exists:
   ```
   Test-Path store/google-play
   ```
   Should return `True`.
2. Rename the downloaded JSON to `service-account-key.json` (drop the
   project-id and hash prefix).
3. Place at `store/google-play/service-account-key.json` (same path
   `eas.json` references).
4. Verify the path that `eas.json` expects:
   ```
   Select-String -Path eas.json -Pattern serviceAccountKeyPath
   ```
   Should print
   `"serviceAccountKeyPath": "./store/google-play/service-account-key.json"`.

### 3f. Verify the JSON is NOT tracked by git

Critical: the service-account JSON is a Google credential. It must never
land in git history.

1. Check `.gitignore`:
   ```
   Select-String -Path .gitignore -Pattern store
   ```
   Expected: a line containing `store/` or
   `store/google-play/service-account-key.json` or `**/*.json`
   (the last is too broad; prefer the explicit path).

2. If absent, add the line to `.gitignore` in a SEPARATE commit (not
   in this T7 work; scope-locked):
   ```
   store/google-play/service-account-key.json
   ```

3. Verify git does NOT see the file:
   ```
   git status --ignored | Select-String service-account
   ```
   Should match under `Ignored files:`, NOT under `Untracked files:`.

4. If git already tracks it (i.e., it was accidentally committed in
   a previous turn), STOP and rotate the key in Cloud Console
   immediately, then purge from git history with
   `git filter-repo` (out of scope for this T7 work; flag as a
   security incident).

---

## 4. Tester list mechanism

**Recommended path: inline email list.**

Inline lists are managed in Play Console UI. Best when the tester roster
is small (under ~50) and stable.

### 4a. Create the inline list

1. Play Console -> Testing -> Internal testing.
2. `Testers` tab.
3. `Create email list` (or `Add email list` if one exists).
4. List name: e.g., `CTA Internal Testers`.
5. Paste `<TESTER_EMAILS>` (comma-, semicolon-, or newline-separated).
6. Click `Save changes`.
7. The list now appears under the Internal testing track.

### 4b. Tester opt-in flow

1. Each tester receives an opt-in link via email (sent by Play
   automatically after list creation IF the track is rolled out to
   them).
2. Alternative: copy the `Opt-in URL` shown on the Internal testing
   track page and share manually.
3. Tester clicks link -> redirected to Play Store listing with
   `Internal tester` badge -> installs via Play Store.
4. Updates auto-deliver via Play Store like any other app.

### 4c. Removing testers

1. Same list page -> click the email row -> remove.
2. Removed tester loses access on next Play Store sync (typically
   minutes).

### 4d. Scale-up path: Google Group

When the tester roster grows past ~50 or churns frequently, replace
the inline list with a Google Group: create a public-or-restricted
group at `https://groups.google.com`, then in Play Console `Testers`
tab swap `Add email list` for `Add Google Group` and enter the group
email. Group membership becomes the source of truth and changes flow
through Google Groups admin instead of Play Console. Single trade-off:
group admin is a separate surface to maintain. Defer until inline list
hits operational pain.

---

## 5. Closed-testing 20-tester / 14-day requirement

### 5a. Policy summary

Google requires that new developer accounts (created on or after
November 13, 2023) complete closed testing with at least 20 active
testers for 14 consecutive days before being eligible to publish to
the production track. Policy URL:
`https://support.google.com/googleplay/android-developer/answer/14151465`.

Definitions per Google:
- **Active tester:** a user who has opted into the closed testing
  track AND has the app installed.
- **14 consecutive days:** the active-tester count must be at or
  above 20 for 14 days in a row. If it drops below 20 mid-window,
  the counter resets to 0.

### 5b. Track progress

Play Console -> Testing -> Closed testing -> Overview tab.

Two numbers to watch:
- **Active testers.** Live count; updates within hours of opt-in /
  uninstall events.
- **Days at or above 20 active testers.** Resets to 0 if the count
  drops below 20.

### 5c. Promotion to production

When both gates pass (active testers >= 20 for >= 14 consecutive days)
AND the app has cleared first review:

1. Play Console -> Production -> Create new release.
2. Either promote the closed-testing build directly (recommended) or
   upload a new AAB.
3. Set release notes (per locale).
4. Submit for review.

First production submission triggers a Play review which historically
takes 2-7 days. Subsequent updates review faster.

### 5d. Workflow sequence for CTA pre-launch

1. Submit first AAB to internal testing (section 2). No tester count
   requirement; immediate.
2. Smoke-test on Joe's Android device + 1-2 internal testers' devices.
3. Promote internal -> closed testing in Play Console (or submit a
   new AAB to the closed track via `eas submit` with the track
   override).
4. Onboard 20+ testers (section 4) via inline list.
5. Watch the days-at-or-above-20 counter. Hold for 14 consecutive days.
6. Once counter >= 14 AND review approval is in hand, promote to
   production (section 5c).

---

## 6. `store/google-play/service-account-key.json` provisioning checklist

Final pre-submission verification. Run these checks in order before
the first `eas submit`. All paths relative to the cta-app repo root.

- [ ] Directory exists: `Test-Path store/google-play` returns `True`.
- [ ] Key file present at exact path:
      `Test-Path store/google-play/service-account-key.json` returns `True`.
- [ ] Key file is valid JSON:
      `Get-Content store/google-play/service-account-key.json | ConvertFrom-Json` succeeds without error.
- [ ] Key file contains expected fields: the JSON includes
      `client_email`, `private_key`, `project_id`, `type` =
      `service_account`. `Select-String -Path store/google-play/service-account-key.json -Pattern client_email` returns one match.
- [ ] `eas.json:submit.production.android.serviceAccountKeyPath` matches:
      `Select-String -Path eas.json -Pattern serviceAccountKeyPath` prints
      `"./store/google-play/service-account-key.json"`.
- [ ] `.gitignore` covers the key file:
      `Select-String -Path .gitignore -Pattern service-account-key.json`
      returns at least one match (or
      `Select-String -Path .gitignore -Pattern store/` if covered by a
      directory rule).
- [ ] Git does NOT track the key:
      `git status --ignored --short` shows
      `!! store/google-play/service-account-key.json` (the `!!` prefix
      indicates ignored).
- [ ] Service account has Play Console permissions (section 3d
      completed): in Play Console -> Settings -> API access, the
      `<SERVICE_ACCOUNT_EMAIL>` row shows the cta-app listing under
      `Apps` with the four permissions enabled.

When every box above is checked, proceed to section 2a (first-run
interactive `eas submit`).

---

## 7. Rollback / unsubmit

If a submission lands but the build is broken:

1. Play Console -> Internal testing -> Releases -> the broken release.
2. `Halt rollout` if still in progress, OR
3. Create a new release with the prior known-good AAB (pick by
   `<build-id>` from `eas build:list`).
4. EAS submit:
   ```
   eas submit --platform android --profile production --id <prior-good-build-id>
   ```
5. The new release replaces the broken one on the internal track.

Note: production releases cannot be fully unpublished once live;
halting rollout is the closest thing. Plan internal -> closed ->
production carefully -- a broken production release lives in history
even if rolled back.

---

## 8. Re-run conditions

This runbook must be re-validated if any of the following change:
- EAS CLI major version bump (currently `>= 16.0.0` per
  `eas.json:cli.version`).
- Play Console UI restructure (Google has restructured `API access`
  and `Testers` paths multiple times; verify click-paths still match).
- Service-account key rotation (rotate every ~12 months per Google
  best practices; regenerate per section 3c step 7-9).
- Closed-testing requirement policy change (check the policy URL in
  section 5a).
- New EAS submit flags or behavior changes (check `eas submit --help`
  diff against this doc when bumping EAS CLI).

Last validated: 2026-05-27 against branch `android-hardening`.
