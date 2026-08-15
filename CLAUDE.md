> **REPO VISIBILITY: PUBLIC — deliberate.** This repo is a source release with
> export-only history: public history begins at the "Public source release"
> commit. Development history is archived in a private repo. Do not push the
> private archive's history here, and do not add remotes pointing at it.

# cta-app - CLAUDE.md

Project architecture lock for the Congress Trade Alerts mobile app (Expo /
React Native, iOS + Android day-one). Global rules in `~/.claude/CLAUDE.md`
and `~/.claude/rules/` apply on top; this file holds only cta-app-specific
config. Operates under Universal Priorities v2.2.0+.

## PUBLIC REPO -- OPSEC guard (read first)

`freshcod3s/cta-app` is a PUBLIC GitHub repo and this file is committed to it.
Keep non-public material OUT of this file: launch / press / business / financial
planning and any other pre-launch operational detail belong in the PRIVATE
Worker repo `congress-trade-alerts/CLAUDE.md`, not here. Identity that is
necessarily public in a shipped app (GitHub handle, EAS owner field, bundle IDs,
EAS project ID, the public contact email) is allowed here. Credential VALUES are
never committed anywhere -- see SECRETS POLICY.

This is the LIVE mobile repo. `Projects/congress-trade-mobile/` and
`Projects/congress_trade_alerts_app/` are abandoned scratch (global memory
rule #30) -- never reference them for active work. Canonical going forward:
this directory + `freshcod3s/cta-app`.

---

## Product positioning (governs code decisions)

CTA is a civic-transparency tool, not a fintech tool -- privacy / no-tracking
is the differentiator. If a product decision drifts toward fintech (copy-trade
buttons, broker integrations, "actionable signal" framing), reverse it. (Full
strategic rationale is in the private Worker repo; the directive above is
mirrored at the top of `congress-trade-alerts/CLAUDE.md` -- edit both if
revised.)

---

## Stack lock (CTA-App-1, 2026-05-07)

Both platforms share an identical setup. Asymmetry is limited to (a) prod
push provider (APNs vs FCM) and (b) build artifact format.

### Runtime + language
- Runtime:        Expo managed workflow + EAS Build cloud
- Language:       TypeScript strict
- Navigation:     Expo Router (file-based; iOS swipe-back + Android
                  hardware-back auto-handled)
- Server state:   TanStack Query / React Query
- Client state:   Zustand (persist middleware)
- UI:             NativeWind (same Tailwind classes both platforms)
- Theme:          system-following + manual override toggle
- Safe area:      react-native-safe-area-context
- Offline cache:  React Query + AsyncStorage persist
- Secure storage: expo-secure-store (Keychain iOS, Keystore Android)
- Telemetry v1:   none (Sentry RN when first crash lands)
- Auth v1:        none (read-only + waitlist signup form)
- Tablet/iPad v1: phone-only; adaptive tablet layout = v2

### Push notifications (asymmetric prod, symmetric dev)
- Library:      expo-notifications + Expo Push service (unified API)
- iOS dev:      Expo Go no longer delivers iOS push tokens (deprecated SDK
                53+). Validate via a development build
                (`eas build --profile development --platform ios`) or
                TestFlight. Android dev push via Expo Go is unaffected.
- iOS prod:     APNs key via Apple Developer Program (post-enrollment)
- Android dev:  Expo Go dev tokens (no enrollment needed)
- Android prod: FCM via free Firebase project + Google Play Console enrollment

### Build + distribution (Joe on Windows -- no Mac required)
- iOS build:    EAS Build cloud
- iOS dev test: Expo Go on physical iPhone (no enrollment)
- iOS beta:     TestFlight (post-Apple Developer enrollment)
- iOS prod:     App Store (post-enrollment + APNs cert)
- Android build: EAS Build cloud (default) OR local
- Android dev:  Expo Go on Joe's Android phone
- Android beta: Internal testing track (post-Play Console enrollment)
- Android prod: Google Play Store (post-enrollment + signing keystore)

### Assets (single source, Expo derives per platform)
- App icon master:  `/assets/icon.png` at 1024x1024 (iOS sizes auto-derived)
- Android adaptive: foreground PNG 432x432 + background color/image in `app.json`
- Splash:           expo-splash-screen plugin (iOS launch screen + Android splash)

### Permissions (declared at scaffold, not retrofitted)
- iOS:     `expo-notifications` auto-injects `NSUserNotificationsUsageDescription`
           at EAS prebuild; no explicit `ios.infoPlist` needed.
- Android: `android.permissions` array; push perms auto-included by
           `expo-notifications`.

### Bundle identifiers (LOCKED at first build -- changing later = ID rotation pain)
- iOS:     `ios.bundleIdentifier = com.congresstradealerts.cta`
- Android: `android.package      = com.congresstradealerts.cta`
- Identical reverse-DNS across both; suffix differs only on field name.

---

## Architectural rules (apply to ALL CTA-App-N work)

- React Query is server-state only; never UI state, never form drafts.
- Query keys are part of the API contract. Centralize in
  `/features/<feature>/api/keys.ts`. No inline ad-hoc keys at call sites.
- Route folders are API surfaces, not dumping grounds.
- Route-specific hooks co-locate; cross-route hooks promote to `/lib`.
- Shared UI never lives in `/app`.
- All screen-root components wrap with `SafeAreaView` (no bare root `View`).
- All push code paths tested on BOTH platforms before merge -- no "ship
  Android, fix iOS later."

---

## Folder structure (single tree, both platforms)

```
/app/(auth)/...                  - auth routes (route group, unused v1)
/app/(main)/...                  - main routes (route group)
/app/_layout.tsx                 - root layout (wraps SafeAreaProvider)
/components/                     - shared dumb UI
/features/<feature>/api/         - query + mutation defs, query-key registry
/features/<feature>/hooks/       - ergonomic wrappers
/features/<feature>/components/  - feature-scoped UI
/lib/                            - shared hooks, utils, API client
/assets/                         - master icons, splash, fonts
```

## Initial dependencies (v1 core stack)

```
expo  expo-router  expo-splash-screen  expo-notifications  expo-constants
expo-secure-store  react-native-safe-area-context  @tanstack/react-query
@tanstack/react-query-async-storage-persister  zustand  nativewind  tailwindcss
```

---

## Build facts (CTA-App-1-1, shipped)

- Expo SDK 54.0.34 + React 19.1 + RN 0.81.5.
- EAS project ID: `9174d3a2-1b14-4c57-adaa-9fdadfff21a6`, owner `freshcod3r`.
  The Expo/EAS build layer stays on the `freshcod3r` handle; `freshcod3s` is
  the LLC-era App Store / Play Store seller identity, NOT the build layer.
- Android `.aab`: preview build shipped via EAS managed keystore.
- Apple Developer: **ORGANIZATION -- Freshcod3s LLC, Team ID `LML7BRJ68Q`**
  (settled 2026-08-07; Free Apps Agreement active 2026-08-05 to 2027-05-12,
  175 territories; the individual entity is Deprecated). Enrollment is NOT a
  blocker and is not "individual vs organization" -- do not re-open it.
- iOS build + credential state: **owned by the STATE table in
  `<home>/Projects/research/cross-cutting/2026-08-cta-ios-readiness.md`**
  (local research tree, not this repo). Read it there; do not restate build
  UUIDs, buildNumbers, submission IDs, certificate/profile expiries, or APNs
  key state here.

  This bullet previously asserted, as of 2026-08-07, that
  `eas build:list --platform ios` was EMPTY and that no distribution
  certificate or provisioning profile existed. **That was already false when
  read and cost a later session a false start:** iOS builds have run since,
  and the signing credentials exist. It is replaced by a pointer rather than
  by fresher numbers on purpose -- a second copy of a fast-moving fact is how
  this went stale in the first place. One document owns each fact.

---

## Cross-references

- Global rules + behavior: `~/.claude/CLAUDE.md`, `~/.claude/rules/`
  (tone, ASCII, secrets, RULE #1, OUTSOURCING POLICY, git discipline,
  Anti-Planning-Loop / Iteration Safety / Definition of Complete).
- Trade-data contracts source-of-truth: Worker repo `congress-trade-alerts/`
  (mirror client API types from its `src/types.ts`).

---

## Repo conventions (project-specific only)

ASCII-only, git discipline, and handoff-as-chat-text rules are global -- not
repeated here. cta-app-specific:

- Real-device perception checks are Joe-tasks (RULE #1). CC may drive
  simulator / Expo Go web-preview, but the final pass is on hardware.
- Contact email rule: `app/(drawer)/about.tsx` exports `PRESS_EMAIL` and is the
  ONLY in-app definition. `press.tsx` and `methodology.tsx` both import it --
  never add a local literal to another screen, which is exactly how this drifted
  onto a dead inbox before. Cross-repo, the same address is mirrored in Worker
  `privacy.html` + Worker `press.ts`; changing it means changing all three
  definitions. Locked on `press@freshcod3s.com` (2026-08-06); routing verified
  by API 2026-08-04. The former personal-Gmail press inbox is DEAD, and `press@congresstradealerts.com` was never wired and is published
  nowhere -- do not reinstate either.

## Gotchas

- JSX TS1382 (literal angle brackets in text): `<` and `>` inside JSX text
  trip `tsc` with `error TS1382: Unexpected token`. Fix: escape as `&lt;` /
  `&gt;`. Easy to miss in copy-heavy diffs (descriptions, methodology, About
  paragraphs). Hit during CTA-App-1-8.

---

## Architecture kernel (distilled from Process Kernel v2.1.1)

Philosophy: vertical slices > layers; explicit > implicit; deterministic >
reactive magic; delete > add; state machines > booleans; contracts > conventions.

- Vertical slices: each feature owns UI + state machine + domain + data +
  tests. No horizontal "services" spanning unrelated features.
- Dependency DAG (strict): UI -> State Machine -> Domain -> Data Adapter.
  Forbidden: UI calling API/DB directly; Domain importing UI. Inject all
  external deps (network, storage, clock, analytics, flags) -- no hidden
  singletons.
- FSM per feature: idle / loading / success / empty / error / offline. No
  boolean-driven UI flow. UI is a pure projection (render + dispatch intents
  only; no side effects, API calls, or mutations in UI).
- Mutations declare idempotency key + retry policy + merge strategy. State
  transitions emit structured events (feature_id, from->to, key, ts) from the
  domain/state layer -- never from UI.
- Schema-first: Schema -> API contract -> Domain -> FSM -> UI. Local storage is
  versioned (schemaVersion + migration path + maxAge/maxSize); every schema
  change ships a forward migration + backward-compat test.
- Errors: exactly one of validation / network / auth / permission / conflict /
  timeout / unknown. No raw string errors; UI never interprets raw backend
  errors. Propagate Domain -> FSM -> UI.
- Perf budget per slice: <=60ms first render, <=200MB peak, <=16ms main-thread
  block, <=0.5%/hr background battery. Background tasks declare throttle + max
  runtime + retry + cancellation. Budget violation = merge rejection.
- Parity: each feature declares strict (auth/payments/data) / tolerant
  (layout/animation) / divergent (platform UX). Same state -> identical UI
  across platforms. Platform logic only in adapters / token overrides / input
  layer.
- Design: fully token-driven (no hard-coded spacing/colors/fonts).
- Tests: every screen covers loading/empty/success/error/offline; >=1
  cross-domain integration test; iOS sim + Android emulator in CI; real-device
  smoke test (gestures, haptics, Dynamic Island, dynamic colors, a11y tree,
  offline) required for "done"; a11y + RTL validation mandatory.
- Abstractions: must exist in >=2 use cases before adding; max 3 layers
  UI->Domain; 0-consumer abstractions are deleted. Logs in domain/state only --
  UI never logs.
- Anti-pattern bans: magic observers, implicit event systems, hidden global
  listeners, auto-refresh side effects, service locators.
- Release gate (no merge unless): tests pass (unit + integration + sim parity);
  real-device smoke passes; perf budget validated; migration tests if schema
  changed; abstraction-debt ledger updated; feature has a kill-switch.

---

## Product invariants (LOCKED; override Expo/RN defaults)

1. Billing -- never Apple/Google IAP. "Upgrade" opens the website's Stripe
   Checkout in the system browser (`expo-web-browser`).
2. Auth -- API key paste only; no password flow in-app. Payment + key issuance
   happen on the website.
3. Auth storage -- `expo-secure-store` (Keychain iOS /
   EncryptedSharedPreferences Android). API keys never touch AsyncStorage,
   plain JS state, or backups.
4. Auth UX -- never auto-paste API keys from clipboard without an explicit user
   tap (implicit clipboard read = privacy-violation surface).
5. External content -- never load untrusted HTML in WebView; source / news URLs
   open via `expo-web-browser` (in-app tab iOS / Custom Tabs Android).
6. Theme -- dark mode only in v1 (light mode intentionally not implemented).
7. Watchlist -- free / unauth users get a local AsyncStorage watchlist; not
   gated behind auth. Worker `/api/watchlist` exists but is off the v1 critical
   path.
8. Worker contract mirroring -- client API types stay in sync with Worker
   `congress-trade-alerts/src/types.ts` (Worker is the single source of truth).
9. Interaction density -- every data surface is live (parity target =
   congresstradealerts.com). NO inert boxes: every stat tile, card, chip,
   chart segment, constellation bubble, and list row is either interactive or
   simplified away -- never a dead decorative box. Tapping a surface opens an
   info sheet (the RN port of the web dashboard's `#card-info-modal` +
   `CARD_INFO` / `HOMEPAGE_METRIC_INFO` registries) carrying the same richer
   context: what the number means, how it's computed (method), caveats, and
   sources. Inside that sheet, indexed variables -- member names, tickers,
   committees, sectors -- are themselves tappable and deep-link to the matching
   native route (`/member/[name]`, `/ticker/[symbol]`, committee detail, or a
   filtered feed), so disclosure chains one level deeper on each tap. When a
   value can't yet be computed, the surface says so honestly instead of
   rendering an inert placeholder. The two flagship surfaces this invariant
   mandates and the app still lacks: the InfoSheet registry (it multiplies
   every surface) and the profile Constellation (`features/members`). Parity
   source of truth = `congress-trade-alerts/src/dashboard.html`.

10. Store display name -- LOCKED on every Freshcod3s property. For CTA the
    locked value is "Congress Trade Alerts" (21/30) on BOTH Play and the App
    Store. Changing a store name AWAY from its locked value is a standalone
    product decision requiring Joe's explicit, isolated approval -- it never
    rides inside an ASO pass, a compliance fix, a release runsheet, or a batch,
    and a "go" answering a multi-item list never authorizes one. Restoring a
    name TO its locked value is ordinary corrective work and needs no gate. If
    a name is found off-value: restore it, and report it. Corollary: Play sends
    the entire pending set for review at once, so audit the full pending set
    before any send.

---

## Mobile-side decisions

Launch, press, newsletter, and business planning are NOT in this public repo --
see the private Worker repo `congress-trade-alerts/CLAUDE.md` Decisions Log.
Mobile-side config that belongs here:

- NO client-side analytics SDK on cta-app, ever. Apple Privacy Nutrition:
  Tracking = NO; Data Linked to User = none. Engagement is measured
  server-side.
- On push-notification tap, the opened deep link should
  `POST /api/push/engagement` with `{ trade_id }` (aggregate-only; no user or
  token sent). Separate cta-app ticket.

---

## Workflow conventions

Parallel CC chats share these repos -- preflight every fresh dispatch.

Section A -- Preflight, in order: (1) `git fetch origin`; (2) `git status`,
working tree clean (untracked `.claude/` OK, tracked diffs not); (3) on master
`git pull --ff-only origin master`, on a branch `git rebase origin/master`;
(4) sync deps -- `npm install` / `npx expo install --check` (a pull syncs
source, NOT `node_modules`); (5) report master SHA + branch state; (6) then
start work.

Section B -- Branches: branch off master at task start, merge back same session
(preferred), delete the source branch after merge. `feat/` / `chore/` /
`docs/` branches are session-local; never carry one across sessions without
rebasing `origin/master` first. Long-running hardening branches are the
explicit exception.

Section C -- After every master merge, emit the cross-chat broadcast block
(template: `docs/cross-chat-broadcast-template.md`) -- final SHA, commit delta,
shipped commits by track, new deps, likely-conflict files, orphan SHAs, rebase
command. Joe pastes it into other active chats before they continue.

Section D -- Committer identity changed mid-history. Commits before
2026-08-06 01:36 are authored under a personal freemail address (redacted; see the private history archive); commits from that point
on are `241018594+freshcod3s@users.noreply.github.com`. Same person, same
machine -- a GitHub noreply switch, not a second contributor. A session that
compares author or committer emails across that boundary will read one person
as two and conclude a concurrent session pushed. That misdiagnosis has already
happened once: the 2026-08-07 attribution audit opened on the premise that a
parallel session pushed `d8d92f4` to master, when this clone's own reflog
(`.git/logs/refs/remotes/origin/master`, `update by push`) showed the push came
from here. Attribute pushes from reflog verbs and the GitHub events API, never
from an email comparison.

Section E -- Pushes to master are hook-guarded. `push.default` is `current`
(repo-local), and the global pre-push hook at `~/.claude/git-hooks/pre-push`
(reached via a GLOBAL `core.hooksPath`, so it covers every repo on this
machine) refuses any refspec whose destination branch differs from its named
source: `branch:master`, `HEAD:master` from another branch, and `<sha>:master`
all exit 1. It reads the refspec pairs off stdin, so being on the "right"
branch does not launder a wrong destination. It gates on `CLAUDECODE=1`, so
Joe's own terminal is unaffected. Vetted one-off override:
`CLAUDE_ALLOW_CROSS_PUSH=1 git push ...`. Do not route around it -- push the
branch under its own name and merge deliberately.

---

## SECRETS POLICY (vault-first -- Bitwarden Secrets Manager)

Secrets are injected from the BWS vault at runtime, never stored in the repo.
Tooling: `bws` CLI v2.x + the wrappers in `scripts/`. Binding every session.

### Hard rules
- Never ask Joe to paste a token, key, or password into chat or a terminal.
  The access token is loaded once by Joe into Windows Credential Manager (via
  `scripts/set-bws-token.ps1` or the Credential Manager GUI). Claude never
  sees it.
- Refer to secrets by NAME only (e.g. `BWS_ACCESS_TOKEN`, `EXPO_TOKEN`), never
  by value. Do not read, grep, source, or echo any `.env`. To learn which key
  names exist, STOP and ask Joe.
- All credentialed commands go through `scripts/bws-exec.sh` (or the named
  wrappers `scripts/dev.sh` / `scripts/deploy.sh`). No ad-hoc `bws run` with a
  token pulled some other way.
- Never run `env` / `printenv` / `set` / `export` or any env-dumping command
  inside `bws run` (it would print injected secret values). `bws-exec.sh`
  refuses these; the rule stands regardless.
- Never write secret values to `wrangler.toml`, `package.json`, `app.json`,
  `eas.json`, logs, docs, commits, or chat output.
- On auth failure report only: the secret NAME, the provider (Windows
  Credential Manager / BWS), and the failing command. Never the value or a
  partial value.

### How it works
- Bootstrap token `BWS_ACCESS_TOKEN`: a Windows Credential Manager *Generic*
  credential (target `bws_access_token`), read at runtime by
  `scripts/cred-get.ps1` (Win32 CredRead); exported only inside `bws-exec.sh`,
  unset by an exit trap, never hits disk.
- Project id: `.bws-project` holds the BWS project UUID (project IDs are not
  secrets, so the file is committed).
- Wrappers / `BWS_ENV_MODE`: `isolated` (default) = bws `--no-inherit-env`
  (child gets PATH + SystemRoot + ComSpec + windir + secrets); `minimal` =
  inherit but pruned to `BWS_ENV_ALLOWLIST` + secrets; `full`
  (`BWS_INHERIT_ENV=1`) = whole parent env minus token + secrets. `dev.sh`
  (`expo start`) and `deploy.sh` (`eas build|submit|update`) run `minimal`.

### Scope notes
- cta-app deploys via EAS, not wrangler; there is NO Cloudflare Worker in this
  repo, so no `sync-worker-secrets.sh` here (that pattern lives in
  `congress-trade-alerts/`).
- bws v2.x strips `BWS_ACCESS_TOKEN` from the wrapped command's env in every
  mode, so the bootstrap token never reaches expo/eas. `--no-inherit-env` keeps
  too little on Windows for Node tools (no APPDATA/USERPROFILE/TEMP) -- that is
  why `minimal` prunes to an allowlist instead. The child still carries
  injected vault secrets in every mode (hence the env-dump ban); prefer
  `minimal` over `full`.

---

## Known Issues / Operational Notes

Verified operational dead-ends -- do NOT re-attempt these:

1. **Bitwarden vault route is DEAD for cta-app.** The cta-app BWS project
   (UUID prefix `ac76651c-...`) returns 404 from Bitwarden, so `bws-exec.sh`
   cannot inject `GOOGLE_PLAY_SA_JSON` -- or any cta-app secret -- until that
   project is recreated. Working fallback for Play credentials: the gitignored
   on-disk key at `store/google-play/service-account-key.json` (the same
   credential `eas.json` uses).

2. **RESOLVED 2026-08-09 -- CTA store-listing edits ARE now API-pushable.**
   This entry previously read "cannot be pushed via the androidpublisher API",
   because `cta-play-publisher@freshcod3s-llc.iam.gserviceaccount.com` had
   release-to-track rights but not "Manage store presence" -- it could stage a
   `listings.update` / `images.upload` and then took a 403 on
   `edits.validate` / `edits.commit`. Joe granted that permission on
   2026-08-09; `edits.validate` went 403 -> 200 in the same session and the vc7
   submission committed. The 403 is a reliable detector: if it returns, the
   permission was revoked -- do not conclude the API path is impossible.

   Two API constraints that DO still hold:
   - `changesNotSentForReview` is REFUSED on this app -- passing it returns
     400 "Changes are sent for review automatically." So an `edits.commit`
     IS the send-for-review; there is no API way to stage a release and leave
     it unsent. Anything that must ride along in the same submission has to be
     saved as a pending Console change BEFORE the commit (a new edit's baseline
     does include pending unsent Console changes -- verified by `listings.get`).
   - `file_upload` over the browser bridge is NOT a path for Play assets: it
     caps at 10 MB (the AAB is 63.5 MB) and its `paths` argument failed
     validation on every attempt in the 2026-08-09 session. Use the API.

---

## Release log

### 2026-08-09 -- vc7 consolidated submission SENT FOR REVIEW (not published)

Executed `docs/aso/runsheet-vc7.md` sections 5, 7a, 7b, 7c, 8 end to end.
Console confirms **"Changes in review"** with managed publishing ON, so Google's
approval will NOT publish -- the go-live click is still Joe's. Awaiting review;
section 9 (post-publish verification) is unstarted.

The submission is ONE change set of six items: Production 1.0.0 "Start full
rollout" (versionCode 7), plus five en-US Default store listing changes -- app
name, short description, full description, Phone screenshots, Feature graphic.

- Binary: versionCode **7**, sha256
  `875c9a0dc3add7e8b02e8181afabc52c1c4f7ec642a522cd9982bcd3a46294d8`, built from
  commit `0211e79` (EAS `0afc3497-69f4-4cea-aefd-7040df74fcf9`). Play's own
  `bundles.upload` response echoed that hash and versionCode -- both gated.
- Listing text from `store/google-play/metadata.txt` lines 15/16/19-51 at the
  audited counters: 27/30, 77/80, **2516/4000**.
- Graphics: all six `store/google-play/aso/final/screenshot-0*.png` re-uploaded
  in narrative order (verified slot-by-slot against each file's sha256) plus
  `feature-graphic-1024x500.png`. The eight superseded vc4-era frames were
  deleted, not left alongside.
- Five claim defects were serving, not the one on record: the short description
  ("Real-time STOCK Act alerts..."), "Live feed of every congressional stock
  trade as it's disclosed", "Refreshed every 30 minutes from official filings"
  (wrong for the Senate), "Free. No ads. Updated every 30 minutes.", and a
  **"Real-time" badge inside the feature graphic image itself**. A text-only fix
  would have left the last one serving.
- Execution deviated from the runsheet's stated order for cause: the API cannot
  stage a release without sending it (see Known Issues 2), so the listing text
  was saved as a pending Console change FIRST and the binary committed LAST,
  which put the corrected listing and the corrected binary in front of the
  reviewer together instead of shipping the binary against overclaiming
  graphics. Same consolidated outcome, reversed order.

### 2026-08-09 -- production track re-verified (serving versionCode 6)

- `androidpublisher` `tracks.get` (read-only scratch edit, deleted uncommitted)
  reports the production track serving **versionCode 6**, release name 1.0.0,
  status `completed`; the internal track serves versionCode 5; alpha is an empty
  draft. The "production is on versionCode 4" record below was true only for
  2026-07-31 -- vc5 and vc6 were promoted afterwards, and the public listing's
  "Updated on Aug 3, 2026" stamp is the vc6 promotion. Do not re-derive the
  serving versionCode from the EAS build record; it cannot answer that question.
- versionCode **7** exists as an EAS artifact only, NOT a Play release: build
  `0afc3497-69f4-4cea-aefd-7040df74fcf9`, commit `0211e79`, finished 2026-08-09,
  sha256 `875c9a0dc3add7e8b02e8181afabc52c1c4f7ec642a522cd9982bcd3a46294d8`.
  It carries the vc7 claim fixes and ships as one consolidated submission with
  the tranche-1 listing kit (`docs/aso/runsheet-vc7.md`). The Console steps are
  Joe's; this entry gets the release date once he publishes.

### 2026-07-31 -- Android production launch (1.0.0, versionCode 4)

- **2026-07-31 8:05 PM ET: Congress Trade Alerts is LIVE on Google Play
  production** -- full rollout, US + rest of world. versionCode 4 (1.0.0),
  `com.congresstradealerts.cta`, published via managed publishing. Review
  cleared ~2026-07-26, after the 2026-07-24 Misleading-Claims rejection was
  fixed with official .gov source URLs plus a non-affiliation disclaimer in
  the full description. Listing:
  https://play.google.com/store/apps/details?id=com.congresstradealerts.cta
- Backend state verified 2026-07-31: Worker PRs #37-#41 all merged 2026-07-25
  / 07-26; Senate feed healthy (the SQLITE_TOOBIG chunking fix holds, data
  committing again); `/health?strict=true` green -- 40,551 trades, D1 + Redis
  ok, pipeline not stale.

- Listing copy follow-up: tracked in the private Worker repo CLAUDE.md.
