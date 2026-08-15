# Runsheet -- vc7 consolidated submission (binary + tranche-1 listing)

CTA-ASO-2, written 2026-08-07. Ships the vc7 claim fixes AND the tranche-1
listing kit as ONE Play submission under managed publishing, so Google reviews
the corrected binary and the corrected listing together.

Supersedes `runsheet-tranche1.md` as the execution order. That file is NOT
retired -- its section 1 field values and section 2 asset list are still the
source of truth and are referenced by number below. What changed is that
tranche-1 was written as a listing-only session ("No release-track actions, no
new build, no versionCode change", runsheet-tranche1.md:66) and that is no
longer the right shape: the cadence audit found claim defects inside the
binary, and a listing edit cannot reach those.

> **Read first**
> - Two Google Play rejections on this app were Misleading Claims. Everything
>   below exists to make the binary and the listing tell the same true story in
>   one review cycle.
> - **Managed publishing must be ON before anything is staged.** Google may
>   approve the review without publishing; going live stays Joe's click.
> - Console writes are Joe's (`~/.claude/rules/common/authenticated-consoles.md`).
>   No standing agent exception exists for this app -- the 2026-07-26 one was
>   consumed and expired. Steps below are marked **[agent]** or **[Joe]**.
> - This is an **Android-only** submission. See section 6 for why iOS cannot
>   ride along.

---

## 0. Version facts (established 2026-08-07, do not re-derive from memory)

| Fact | Value | Evidence |
|---|---|---|
| Version name | `1.0.0` | `app.json:5` |
| versionCode in `app.json` | **absent, intentionally** | `docs/android-launch-checklist.md:34` |
| versionCode source | **EAS remote counter**, not a file | `eas.json:4` `cli.appVersionSource = "remote"` + `eas.json:38` `build.production.android.autoIncrement = "versionCode"` |
| `android/app/build.gradle:95` | `versionCode 1` -- **IGNORE THIS** | `android/` is untracked and gitignored (`.gitignore:56`); it is a local `expo prebuild` artifact, stale since before the first store build |
| Last versionCode issued by EAS | 6 (build finished 2026-08-03) | `docs/android-launch-checklist.md:188` |
| Currently on Play production | **versionCode 6** -- corrected 2026-08-09 | `androidpublisher` `tracks.get`; the "versionCode 4" reading was true only on 2026-07-31, before vc5/vc6 were promoted |
| Expected vc7 versionCode | **7** -- CONFIRMED 2026-08-09, EAS incremented 6 -> 7 at queue time | `eas build:version:get` returned 6; build `0afc3497` reports Version code 7 |

**The bump requires no file edit.** EAS increments the remote counter
server-side at build time. Do not hand-edit `build.gradle` -- it is regenerated
by prebuild and is not read by the EAS production profile. Edit `app.json:5`
ONLY if the version NAME should move off `1.0.0`; the claim fixes do not
require that, and holding the name steady keeps the Play release notes about
the fix rather than about a version number.

---

## 1. Preflight gate -- all must pass before anything else [agent]

Run from the repo root, on the branch carrying the claim fixes.

```bash
cd "$REPO_ROOT" && git log --oneline -4 && git status --porcelain
```

- [ ] The four claim-fix files are committed, not sitting dirty:
      `features/faq/data.ts`, `app/(drawer)/press.tsx`,
      `app/(drawer)/methodology.tsx`, `app/(drawer)/_layout.tsx`.
      Confirmed clean vs HEAD at commit `ef71e1d` on 2026-08-07.
- [ ] `app/(drawer)/settings.tsx` and
      `features/billing/components/UpgradeButton.tsx` are committed. As of
      2026-08-07 these were still UNCOMMITTED -- they carry the gated-code
      claim fixes and must be in the build.
- [ ] `features/members/components/FeaturedMembers.tsx` -- NOT part of this
      work. Decide whether it belongs in the build before cutting it. Do not
      sweep it in with `git add -A`.
- [ ] Cadence grep returns no user-facing survivor (section 2 below).
- [ ] Pro/billing grep returns no reachable user-facing survivor (section 2).

```bash
cd "$REPO_ROOT" && grep -rniE 'real-?[ -]?time|instant|immediately|as it happens|as they file|the moment|within minutes|as soon as|up to the minute|live feed' app/ features/ lib/ components/ hooks/
```

```bash
cd "$REPO_ROOT" && grep -rniE '\bpro\b|subscriber|stripe|billing|upgrade|checkout' app/ features/ lib/ components/ hooks/
```

---

## 2. Standing survivor ledger (re-check, do not re-adjudicate from scratch)

Every hit below was classified on 2026-08-07. A NEW hit not on this list is a
build blocker until adjudicated.

**Cadence grep -- 2 user-facing survivors, both negations, both cleared:**

| file:line | string | why it is not a claim |
|---|---|---|
| `features/faq/data.ts:13` | "None of this is instant" | negation; the sentence exists to defeat the instant reading |
| `features/info/registry.ts:134` | "Reflects disclosed filings, not live holdings." | negation disclaimer; "live holdings" is what the app does NOT show |

All other cadence hits are code comments or identifiers (`TickerTape.tsx:1`
header comment, `settings.tsx:250/260/261` and `UpgradeButton.tsx:14-24` which
quote the banned terms in order to ban them). `about.tsx:164` "data live on the
web" uses "live" as a verb (data resides there), not a cadence adjective.

**Pro/billing grep -- 5 user-visible strings, all unreachable, none blocking:**

`settings.tsx:270` ("Congress Trade Alerts Pro"), `settings.tsx:277`
("Secure checkout opens in your browser"), `UpgradeButton.tsx:44/58/68`
("Upgrade to Pro"). Every one sits inside the `SHOW_UPGRADE_CTA && isUS &&
Platform.OS !== "android"` block at `settings.tsx:263`. `SHOW_UPGRADE_CTA` is
`false` (`lib/flags.ts:39`), a build-time constant, so none of it renders in
this build. They remain in the bundle as strings and are disclosed to Apple in
`store/app-store/metadata.txt:112`.

**If `SHOW_UPGRADE_CTA` is ever flipped, this ledger is void** -- re-run both
greps and re-adjudicate all five before building.

---

## 3. Confirm the versionCode EAS will issue [agent]

```bash
cd "$REPO_ROOT" && npx eas build:version:get -p android
```

Read-only, no build, no spend. Expect the counter to report 6 (last issued), so
the next production build takes **7**.

- If it reports something other than 6: STOP. The counter has desynced from the
  build record. `eas build:version:sync -p android` realigns it against Play
  (`docs/android-internal-testing.md:153`) -- but confirm against the Console
  release list first, because a sync that moves the counter DOWN can collide
  with a versionCode Play has already seen.
- Requires an authenticated EAS session (`EXPO_TOKEN`). If auth fails, that is
  a credential step -- resolve it from the environment, do not route it to Joe.

---

## 4. Build the AAB [agent, spend gate]

**Cost check before running.** EAS build minutes are metered
(`~/.claude/rules/common/spend-discipline.md`). Confirm the current Expo plan
and remaining build allowance, state the projected cost in chat, and stop if it
exceeds $10. One Android production build on the free tier is $0 but consumes
one of the monthly build slots.

The spend-guard hook blocks `eas` invocations unless the cost has been
acknowledged:

```bash
cd "$REPO_ROOT" && CONFIRM_SPEND=1 npx eas build -p android --profile production
```

Profile `production` verified present and correct (`eas.json:30-42`):
`distribution: store`, `buildType: app-bundle`, `autoIncrement: versionCode`,
`channel: production`.

- [ ] Build finishes green.
- [ ] Reported versionCode is 7 (or whatever step 3 established as next).
- [ ] Record the AAB sha256 from the build page. The upload in step 7 is
      hash-gated against it -- a mismatch is a STOP.

---

## 5. Turn managed publishing ON, before staging anything [Joe]

Console -> **Publishing overview** -> Managed publishing: **ON**.

This is the whole safety property of a consolidated submission. With it on,
the AAB and the listing edits accumulate as one pending change set, Google
reviews them together, and approval does NOT push anything live. Without it,
an approved listing change can serve against the old binary -- which is exactly
the failure this runsheet exists to prevent.

- [ ] Managed publishing confirmed ACTIVE before step 6.
- If it is unavailable: STOP. Do not proceed to the listing edits.

---

## 6. Why iOS is not in this submission

`eas.json:47` sets `submit.production.ios.ascAppId` to the literal placeholder
`REPLACE_WITH_APP_STORE_CONNECT_APP_ID`. A placeholder token reaching an
executable step is a STOP-and-ask, never a substitute-and-proceed
(`~/.claude/rules/common/git-discipline.md`). `appleTeamId` IS real
(`LML7BRJ68Q`, matches the verified Organization enrollment), so the only
missing value is the ASC app id.

The iOS review notes in `store/app-store/metadata.txt` were corrected in the
same session as the vc7 fixes and are ready. iOS submission is a separate
ticket that starts by resolving that app id.

---

## 7. Stage the release and the listing together [Joe, Console]

Order matters. Do the binary first so the listing never sits approved ahead of
the build it describes.

**7a. Production release.** Release -> Production -> Create new release.
Upload the vc7 AAB.

- [ ] Uploaded versionCode matches step 4.
- [ ] sha256 matches the build record. Mismatch = STOP.
- [ ] Upload `mapping.txt` if EAS produced one.
- [ ] Release notes describe the claim corrections, not "bug fixes".
- [ ] Do NOT start rollout yet.

**7b. Main store listing -- text.** Grow users -> Store presence -> Main store
listing. Values come from `store/google-play/metadata.txt` at this branch's
HEAD -- copy from the file, never retype (runsheet-tranche1.md section 1).

> **App name row SUPERSEDED 2026-08-10 -- do not re-execute.** This runsheet
> was executed on 2026-08-09 and the app name WAS entered as `Congress Stock
> Trade Alerts` (27/30); it is recorded below unchanged because it is what the
> Console received and it is what is sitting in the pending change set today.
> The rename is now REJECTED. The locked name is `Congress Trade Alerts`
> (21/30). If any part of this runsheet is ever re-run, skip the app name row.
> `store/google-play/metadata.txt` carries the locked value.
>
> ~~which is also what the live listing still renders, since the pending set
> has never been published.~~ **CORRECTED 2026-08-10 -- the struck clause is
> false.** The pending set WAS published on 2026-08-10. The 27-character name
> is what play.google.com serves today; the locked name is not live. A
> corrective listing edit was saved in Console the same day and is sitting
> under "Changes not yet submitted for review" -- sending it is Joe's step.

| Field | Action | Expected counter |
|---|---|---|
| ~~App name~~ (superseded, see above) | ~~Replace with `Congress Stock Trade Alerts`~~ | ~~27/30~~ |
| Short description | Replace | 77/80 |
| Full description | Replace entire contents with the FULL_DESCRIPTION block, lines 29-61 (was 19-51 before the 2026-08-10 header note; the block's text and its 2516 count are unchanged) | **2516/4000** |

### STOP RULE -- the full-description counter

The Console counter must read **2516/4000**.

- **2516** is correct. Verified against the committed blob at `5c02f83`:
  lines 19-51, LF line endings, 0 non-ASCII.
- **2548** is the same content with CRLF line endings -- this repo has
  `autocrlf` on and Git warns that `metadata.txt` gets CRLF in the working
  copy. If the counter reads 2548, that is 32 carriage returns across 32 line
  breaks, NOT a content change. Acceptable; proceed.
- **Any other number is a STOP.** Screenshot it and report. Do not adjust the
  text to make the counter match -- the text is the audited artifact
  (`docs/aso/fact-audit-tranche1.md`), and editing it in Console breaks the
  chain of evidence back to the audit.

Also confirm before saving: the Privacy section is byte-identical to what is
live today (it is carried verbatim), and the final line is "Free. No ads. No
account required. Open source under the AGPL-3.0 license."

**7c. Main store listing -- graphics. THIS STEP IS NOT OPTIONAL.**

The description paste alone leaves the old screenshots serving. Screenshot 1
currently carries the headline **"Every congressional stock trade. Live."**
(`store/_generate_screenshots.py:638`) -- a live, public, unqualified cadence
claim on the exact surface a reviewer looks at first. Shipping the corrected
description while that frame still serves would leave the loudest overclaim in
the listing untouched.

| Asset | Action | File |
|---|---|---|
| Feature graphic | Replace | `store/google-play/aso/feature-graphic-1024x500.png` (1024x500) |
| Phone screenshots | Replace all six, in order | `store/google-play/aso/final/screenshot-01.png` ... `screenshot-06.png` (1080x1920 each) |

All seven assets exist, are tracked in git, and were built 2026-08-02. No
regeneration is needed. The replacement headline for frame 1 is
"Congress Stock Trades, In One Feed"
(`scripts/aso/composite_screenshots.py:32`) -- factual, no cadence claim.

Order is the narrative and must be preserved: 1 feed, 2 alerts, 3 follow,
4 committee-overlap flags, 5 official filing, 6 free/no-ads/no-account.

- [ ] Delete the old vc4-era screenshots after uploading. Console keeps them
      until removed, and a leftover frame 1 defeats the entire step.
- [ ] App icon is NOT in this tranche. Do not touch it.

**Only if a frame must be rebuilt** (it should not be):

```bash
cd "$REPO_ROOT" && python scripts/aso/composite_screenshots.py
```

Reads `store/google-play/aso/raw/raw-0*.png`, writes `final/screenshot-0*.png`.
No repo `.venv` exists, so the system interpreter is the intended one here;
the script needs Pillow. Regenerating changes tracked binaries -- commit them
deliberately and re-verify frame 1's headline before uploading.

---

## 8. Review the whole change set, then send [Joe]

Publishing overview should list, as ONE pending set: the Production release
(versionCode 7) plus the Main store listing changes (name, short description,
full description, feature graphic, six screenshots).

- [ ] Nothing unexpected appears in the set. Anything else = STOP, screenshot,
      report.
- [ ] Send for review.
- [ ] **STOP HERE.** With managed publishing on, approval does not publish. The
      go-live click is Joe's, at a time of his choosing.

---

## 9. After Joe publishes

- Re-fetch the public listing and confirm the new title renders, the six new
  screenshots appear in order, and frame 1 no longer says "Live."
- Confirm the production track serves versionCode 7
  (`androidpublisher tracks.get`, or the Console release list). A finished EAS
  build is not a Play release -- that distinction is already recorded at
  `docs/android-launch-checklist.md:191-194`.
- Update `CLAUDE.md`'s launch record with the vc7 versionCode and date.
- The serving listing is the proof. Console "saved" is not "live".

---

## 10. What is NOT in this submission

- No iOS build or App Store submission (section 6).
- No Data Safety edits -- the current declaration matches the carried Privacy
  text and nothing in vc7 changes data handling.
- No category change (stays Finance), no contact-details change, no icon
  change.
- No `SHOW_UPGRADE_CTA` flip. It stays `false`; flipping it is a separate
  release with its own claim review (section 2).
- `push-cta-listing.mjs` (untracked, repo root) must NOT be used. Listing edits
  are Console-only for this enforcement-flagged app.
