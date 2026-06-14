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
- iOS `.ipa`: PENDING Apple Developer enrollment + EAS credentials
  (tracked in CTA-App-1-2).

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
- Three-surface email rule: the contact email is mirrored across cta-app
  `app/(drawer)/about.tsx` PRESS_EMAIL + Worker `privacy.html` + Worker
  `press.ts`. Change one -> change all three. Locked on
  `congresstradealertsapp@gmail.com`; flips to `press@congresstradealerts.com`
  when Cloudflare Email Routing is wired (currently blocked; rationale in the
  private Worker repo).

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
