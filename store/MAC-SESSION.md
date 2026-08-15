# MAC-SESSION.md -- handoff for a fresh Claude Code session on the Mac

Scope: everything needed to take Congress Trade Alerts from this repo to an
iOS App Store submission, and nothing else. Written 2026-08-06 on the Windows
rig. Android is already live on Google Play and is out of scope here.

Read this first, top to bottom. Section 1 is a blocker, not a preamble.

---

## 1. STOP -- check whether the fixes are actually in the repo you cloned

As of 2026-08-06 a large amount of submission-readiness work was **staged but
NOT committed** on the Windows machine. **Staged changes do not travel with a
clone.** A clone taken before that work is committed and pushed gets the
PRE-FIX state:

- `store/app-store/screenshots/*.png` -- **RGBA (colour type 6)**. Apple
  rejects any screenshot carrying an alpha channel. Upload fails.
- `store/_generate_screenshots.py` -- still writes its iOS output **into the
  capture directory**, so one run overwrites a real capture with mock art.

Verify before doing anything else:

```
git log --oneline -3
for f in store/app-store/screenshots/*.png; do
  echo "$(basename "$f")  colortype=0x$(xxd -p -s 25 -l 1 "$f")"
done
```

- Every line reads `colortype=0x02` -> the fixes are in, continue to section 2.
- Any line reads `colortype=0x06` -> **STOP.** The clone predates the fix. Do
  not re-do the work here and do not strip them yourself; ask for the commit
  to be pushed, then re-pull. Redoing it invites a conflicting duplicate.

Also confirm the generator is the retargeted one:

```
grep -n 'render_set(1' store/_generate_screenshots.py
```

The iOS line must name `store/app-store/generated`. If it names
`store/app-store/screenshots`, the clone is stale -- same stop condition.

---

## 2. Toolchain

### Apple requirement (verified 2026-08-06 against Apple's developer news page)

> "Apps uploaded to App Store Connect must be built with **Xcode 26** or later
> using an SDK for **iOS 26** [...]"

In force since **2026-04-28**. This is a hard upload gate, not a warning.

**Where that requirement gets satisfied matters, and it is probably not on this
Mac.** This project builds with **EAS Build (cloud)**, so Apple's Xcode/SDK
floor is met by the EAS build image, not by a local Xcode install. `eas.json`
currently pins no `image` for iOS, so builds take the EAS default -- confirm at
build time that the default image ships Xcode 26 or later, and pin the image
explicitly if it does not.

Install Xcode locally only if you need one of these:
- capturing simulator screenshots (`xcrun simctl`), or
- a local (non-cloud) build.

Neither is required to submit. Do not spend an afternoon on a 40 GB download
before checking whether the cloud image already covers you.

### Versions this repo expects

| Tool | Expected | Notes |
|---|---|---|
| Expo SDK | **54.0.0** | resolved from `app.json`; `expo ~54.0.35` |
| React Native | 0.81.5 | |
| TypeScript | ~5.9.2 | dev dependency |
| eas-cli | **>= 16.0.0** | required by `eas.json` -> `cli.version` |
| Node | none declared | no `engines` field; verified working on **Node 24.15.0 / npm 11.16.0** |

**`eas-cli` is NOT a dependency of this repo and is NOT installed by
`npm install`.** Nothing in `package.json` references it. Install it separately:

```
npm install -g eas-cli
eas --version
```

Confirm the reported version is >= 16.0.0 or `eas build` will refuse the config.

---

## 3. First-run setup and verification

```
git clone <this repo>
cd cta-app
npm install
npx tsc --noEmit
npm run lint
```

Both checks pass clean on the current tree (verified 2026-08-06, exit 0 each).
There is no `postinstall` or `prepare` script -- `npm install` is the whole
install step. `package-lock.json` is committed; use `npm ci` if you want an
exact-lock install.

Confirm the app config resolves before touching EAS:

```
npx expo config --type public --json
```

Expected: name `Congress Trade Alerts`, version `1.0.0`, sdk `54.0.0`, and an
iOS bundle identifier of `com.congresstradealerts.cta`. `ios.buildNumber` is
deliberately absent -- `eas.json` sets `appVersionSource: remote` with
`autoIncrement: buildNumber`, so EAS owns the build number. Do not add one.

### Environment variables

**The application source reads no environment variables at all.** The only
`process.env` reads in the repo are in an untracked Google Play listing script,
none of which touch the iOS path.

Names the iOS path may involve, by NAME only -- never paste a value into chat,
a file, or a commit:

| Name | Used for |
|---|---|
| `EXPO_TOKEN` | non-interactive EAS auth (optional; interactive login also works) |
| `EXPO_APPLE_ID` | present in the local `.env.local` on the Windows rig; that file is gitignored and does NOT travel with the clone |

If any credential appears to be missing, stop and ask. Do not read, echo, or
grep `.env` / `.env.local`.

---

## 4. Uploading the App Store Connect API key

**Status 2026-08-07: the key exists.** Several ASC API keys are already in the
console, and one `.p8` is on the Windows rig in a restricted-ACL directory
outside every repo working tree. Nothing needs generating. Whether EAS already
holds a key is **UNVERIFIED** -- `eas credentials` could not be run because
eas-cli is not installed anywhere on that machine. Install it first, then run
the command below to find out before uploading anything.

Per `REVIEW-SUBMISSION.md:63-70`, the recommended path -- and the one that
avoids handling the key file on disk at all:

```
eas credentials --platform ios
```

Choose the App Store Connect API key option and upload the `.p8` when prompted.
**EAS stores the key server-side; no local copy persists**, so there is nothing
to move out of Downloads, nothing to chmod, and nothing to keep out of git.

The `.p8` is served by App Store Connect exactly once at creation. If it was
never downloaded or has been lost, it cannot be re-fetched -- revoke that key
and generate a new one, which is free and carries no penalty.

Do not put the key, its identifier, the issuer identifier, or any file path to
it into `eas.json`. **`eas.json` is committed to a PUBLIC repo.**

---

## 5. Already done -- do not redo

- **Screenshots are submission-ready.** 7 captures in
  `store/app-store/screenshots/`, all exactly **1320x2868** (an accepted 6.9"
  portrait size), all alpha-stripped to RGB. 6.9" is the only required set;
  supplying it discharges 6.5", smaller sizes auto-scale, and iPad does not
  apply because `ios.supportsTablet` is false. Count 7 is inside Apple's 1-10.
- **App icon is compliant.** `assets/icon.png` is 1024x1024 RGB with no alpha
  channel and never had one. Nothing to flatten.
- **Splash, notification icon, and Android adaptive icon keep their alpha
  deliberately** -- all three carry real transparency and are correct as-is.
  The notification icon in particular is a silhouette; flattening it would
  produce a solid square.
- **The screenshot generator is retargeted and guarded.** Its iOS output goes
  to `store/app-store/generated/` (marketing mockups, captioned) and it refuses
  to write into the capture directory. A `REFUSED` message from it is the guard
  working, not a bug to route around.
- **Contact addresses are shipped and single-sourced.** `app/(drawer)/about.tsx`
  exports `PRESS_EMAIL` and is the only in-app definition; two other screens
  import it.
- **Export compliance is pre-answered** -- `ios.config.usesNonExemptEncryption`
  is false in `app.json`, so the upload prompt should not appear.
- **Privacy manifest is declared** in `app.json` under `ios.privacyManifests`.

## 6. NOT done -- the actual remaining work

- **No App Store Connect app record exists** for the bundle identifier.
- **`eas.json` carries ONE remaining placeholder** (corrected 2026-08-07):
  `submit.production.ios.ascAppId`, which cannot be filled until the app
  record above exists. The other four are resolved -- `appleTeamId` is
  `LML7BRJ68Q`, and the unusable `submit.preview.ios` block plus the dangling
  `preview` Android service-account path were deleted.
- ~~Apple Developer enrollment type is unsettled.~~ **SETTLED (2026-08-07):
  ORGANIZATION -- Freshcod3s LLC, Team ID `LML7BRJ68Q`.** The ASC Business
  page lists the LLC as a legal entity with the Free Apps Agreement ACTIVE
  2026-08-05 to 2027-05-12 across 175 territories; the individual entity is
  Deprecated with no agreements. `eas.json` now carries the Team ID. Do not
  re-open this question.
- **No iOS build has ever run.** No distribution certificate, no provisioning
  profile, no TestFlight build.

---

## 7. Hard rule -- contact addresses

**No `@gmail.com` address goes in any release field.** Not the support URL
contact, not the App Review contact, not the marketing contact, not the privacy
contact, not the listing.

Use the per-app `freshcod3s.com` mailboxes only:

- `press@freshcod3s.com` -- press and in-app contact
- `hello@freshcod3s.com` -- general support

The former personal-Gmail press inbox is **DEAD** and must not be
reinstated anywhere. `press@congresstradealerts.com` was never wired and is
published nowhere -- do not use it either.

One deliberate exception, already in the repo: the TestFlight *tester* identity
in `REVIEW-SUBMISSION.md` is an Apple-account-bound login, not a published
contact field. Leave it as it is.

---

## 8. Blocking order -- the checklist

Ordered by dependency. Each step is marked **CONSOLE** (a human, in a vendor
web console) or **REPO** (doable from a Claude Code session).

| # | Step | Who |
|---|---|---|
| 1 | Commit and push the staged submission-readiness work, then re-clone or pull. Section 1 explains why nothing else can be trusted until this is true. | **REPO** |
| 2 | ~~Settle Apple Developer enrollment type.~~ **DONE (2026-08-07)** -- ORGANIZATION, Freshcod3s LLC, Team ID `LML7BRJ68Q`, Free Apps Agreement active. | **DONE** |
| 3 | ~~Generate an App Store Connect API key.~~ **DONE (corrected 2026-08-07)** -- keys already exist in the console and one `.p8` is on the Windows rig outside every repo tree. Do NOT generate another. Confirm the on-disk key's role is **App Manager** or Admin. | **DONE** |
| 4 | `npm install -g eas-cli` (>= 16.0.0), then authenticate. | **REPO** |
| 5 | `eas credentials --platform ios` -- upload the `.p8`. EAS keeps it server-side. | **REPO** |
| 6 | Create the App Store Connect app record for the bundle identifier, under the **Freshcod3s LLC** entity. This is what mints the ASC app id. The bundle id is permanent once created. | **CONSOLE** |
| 7 | Fill the single remaining `ascAppId` in `eas.json`. `appleTeamId` is already set to `LML7BRJ68Q`; the `submit.preview.ios` block was deleted (it could never be used -- `build.preview` is `distribution: internal`, and only a `store` build reaches TestFlight). No key material, key path, or issuer identifier goes in this file -- it is public. | **REPO** |
| 8 | `eas build --platform ios --profile production`. Confirm the build image supplies Xcode 26 / iOS 26 SDK. | **REPO** |
| 9 | `eas submit --platform ios --profile production`, then upload metadata and the 7 screenshots. | **REPO** + **CONSOLE** |

Steps 1, 4, 5, 7, and 8 need no console access at all. Steps 2, 3, and 6 are
the only genuine console gates, and 3 is the one that blocks the most.
