# cta-app - CLAUDE.md

Project-specific architecture lock for the Congress Trade Alerts mobile app
(iOS + Android day-one). Global rules in `~/.claude/CLAUDE.md` apply on top
of this file.

Operates under Universal Priorities v2.2.0+ from `~/.claude/CLAUDE.md`.

This is the LIVE mobile repo. Per global memory rule #30:
`Projects/congress-trade-mobile/` and `Projects/congress_trade_alerts_app/`
are abandoned scratch and are NOT to be referenced for active work. Only
`Projects/cta-app/` (this directory) and `freshcod3s/cta-app` on GitHub are
canonical going forward.

---

## Strategic positioning (cross-cutting)

CTA is a **civic-transparency tool**, not a fintech tool. eToro shipped copy-Congress portfolios via Quiver (Nov 2025); the market is pulling toward consumer financial products built on STOCK Act data. Do not follow. Privacy/no-tracking civic stance is the differentiator. Lead with that in every press release, store listing, and landing-page draft. If a product decision drifts toward fintech (copy-trade buttons, broker integrations, "actionable signal" framing), reverse it.

Mirrored at top of `congress-trade-alerts/CLAUDE.md` -- these are paired, edit both if revised.

---

## Repo state (as of 2026-05-07, pre-scaffold)

- Local: `C:\Users\jcros\Projects\cta-app\` -- this directory, fresh
  `git init` on master branch, no commits yet.
- Remote: `freshcod3s/cta-app` on GitHub -- DOES NOT EXIST YET. CTA-App-1-1
  scaffold ticket is responsible for `gh repo create freshcod3s/cta-app`
  before first push.
- Status: pre-scaffold. The architecture lock below governs CTA-App-1-1.
  Everything else (Expo project init, EAS config, dependency install,
  first build) lands in CTA-App-1-1.

---

## Stack lock - 2026-05-07 (CTA-App-1)

Both platforms share an identical setup. Asymmetry is limited to (a) prod
push-notification provider (APNs vs FCM) and (b) build artifact format.

### Runtime + language

- Runtime:        Expo managed workflow + EAS Build cloud
- Language:       TypeScript strict
- Navigation:     Expo Router (file-based; iOS swipe-back + Android
                  hardware-back both auto-handled)
- Server state:   TanStack Query / React Query
- Client state:   Zustand (with persist middleware)
- UI:             NativeWind (same Tailwind classes both platforms)
- Safe area:      react-native-safe-area-context (notch / Dynamic Island
                  iOS, edge-to-edge Android)
- Offline cache:  React Query + AsyncStorage persist
- Secure storage: expo-secure-store (Keychain iOS, Keystore Android,
                  unified API)
- Telemetry v1:   none (Sentry RN when first crash lands)
- Auth v1:        none (read-only + waitlist signup form)
- Tablet/iPad v1: phone-only; adaptive tablet layout = v2

### Push notifications (asymmetric prod, symmetric dev)

- Library:        expo-notifications + Expo Push service (unified API)
- iOS dev push:   Expo Go no longer delivers iOS push tokens (deprecated in SDK 53+). Validate via a development build (`eas build --profile development --platform ios`) or via TestFlight. Android dev push via Expo Go is unaffected.
- iOS prod:       APNs key via Apple Developer Program (post-enrollment)
- Android dev:    Expo Go provides dev tokens (no enrollment needed)
- Android prod:   FCM via free Firebase project + Google Play Console
                  enrollment

### Build + distribution (Joe on Windows -- no Mac required)

- iOS build:      EAS Build cloud
- iOS dev test:   Expo Go on physical iPhone (no enrollment)
- iOS beta:       TestFlight (post-Apple Developer enrollment)
- iOS prod:       App Store (post-enrollment + APNs cert)
- Android build:  EAS Build cloud OR local (cloud is simpler; default to
                  cloud unless reason to switch)
- Android dev:    Expo Go on Joe's Android phone
- Android beta:   Internal testing track (post-Google Play Console
                  enrollment)
- Android prod:   Google Play Store (post-enrollment + signing keystore)

### Assets pipeline (single source, Expo derives per platform)

- App icon master:   `/assets/icon.png` at 1024x1024
- iOS sizes:         auto-derived by Expo from master
- Android adaptive:  foreground PNG 432x432 + background color/image
                     declared in `app.json`
- Splash:            Expo splash-screen with separate iOS launch screen +
                     Android splash config

### Permissions (declare at scaffold time, not retrofitted)

- iOS:     `app.json` -> `ios.infoPlist` with `NS*UsageDescription` strings
           REQUIRED for push: `NSUserNotificationsUsageDescription`
- Android: `app.json` -> `android.permissions` array
           REQUIRED for push: auto-included by `expo-notifications`

### Bundle identifiers (LOCKED at first build -- changing later = ID rotation pain)

- iOS:     `ios.bundleIdentifier = com.congresstradealerts.cta`
- Android: `android.package      = com.congresstradealerts.cta`
- Convention: identical reverse-DNS across both, suffix only on field name.

---

## Architectural rules (apply to ALL CTA-App-N work)

- React Query is server-state only; never UI state, never form drafts.
- Query keys are part of the API contract. Centralize in
  `/features/<feature>/api/keys.ts`. No inline ad-hoc keys at call sites.
- Route folders are API surfaces, not dumping grounds.
- Route-specific hooks co-locate; cross-route hooks promote to `/lib`.
- Shared UI never lives in `/app`.
- All screen-root components wrap with `SafeAreaView` (no bare `View` at
  root).
- All push code paths tested on BOTH platforms before merge -- no "ship
  Android, fix iOS later."

---

## Folder structure (single tree, both platforms use it)

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
                                   (Expo derives sizes)
```

---

## Initial dependencies

```
expo
expo-router
expo-splash-screen
expo-notifications
expo-constants
expo-secure-store
react-native-safe-area-context
@tanstack/react-query
@tanstack/react-query-async-storage-persister
zustand
nativewind
tailwindcss
```

---

## Pre-scaffold parity checklist (CTA-App-1-1 acceptance criteria)

CTA-App-1-1 ships 9/10 items. Item #10 is split: `.aab` ✓ this ticket;
`.ipa` deferred to CTA-App-1-2 post-Apple-Developer-enrollment.

- [x] `app.json` with both `ios.bundleIdentifier` AND `android.package` set
      (both `com.congresstradealerts.cta`)
- [x] `app.json` with `ios.infoPlist` usage strings for every permission
      used (incl. `NSUserNotificationsUsageDescription`)
- [x] `app.json` with `android.adaptiveIcon` (foregroundImage +
      backgroundColor `#0b1220`)
- [x] `/assets/icon.png` 1024x1024 master committed
- [x] `/assets/splash.png` + iOS launch screen + Android splash configured
      (via `expo-splash-screen` plugin in app.json)
- [x] `expo-notifications` wired (`/lib/push/register.ts`); APNs/FCM
      setup paths documented in README
- [x] `SafeAreaProvider` in root `_layout.tsx`
- [x] Android `BackHandler` verified on every custom modal/screen
      (`/components/back-handler-modal.tsx`; real-device test = Joe-task
      per RULE #1)
- [x] EAS Build profiles (development, preview, production) configured
      for BOTH platforms (`eas.json`)
- [~] First EAS Build run produces both `.ipa` AND `.aab` artifacts:
      - [x] `.aab` -- Android preview build queued at
            <https://expo.dev/accounts/freshcod3s/projects/cta-app/builds/a280e094-957f-491d-88e8-0e2d973bad32>
            (managed keystore auto-generated by EAS).
      - [ ] `.ipa` -- PENDING. Apple Developer Program enrollment
            required + EAS credentials. Tracked in CTA-App-1-2.

## CTA-App-1-1 ship notes

- Expo SDK 54.0.34 + React 19.1 + RN 0.81.5.
- EAS project ID: `9174d3a2-1b14-4c57-adaa-9fdadfff21a6` (owner:
  `freshcod3r`). Expo account for cta-app is `freshcod3r`. Existing
  dev repos stay on the freshcod3r handle; the freshcod3s handle is
  reserved for the LLC-era App Store / Play Store seller identity
  (post-migration) and freshcod3s-archive public-facing work -- NOT
  for the EAS/Expo build layer. /sync-memory pending.
- Template scaffolded via `npx create-expo-app@latest --template default`
  in a sibling tmp dir, then file-copied into `cta-app/` with `.git/`
  preserved (after a near-miss where `cp -R` overwrote `.git/`; soft-
  reset to `850c7f3` recovered it). All template example code stripped
  (`/app/(tabs)/`, themed-*.tsx, react-logo assets, etc.) in favor of
  Lock-aligned `/app/(main)/` + custom scaffolding.

---

## Cross-references

- Global rules: `~/.claude/CLAUDE.md` (tone, ASCII, secrets, RULE #1
  Claude-Code-does-executable-work, OUTSOURCING POLICY tier rules)
- Anti-Planning-Loop / Iteration Safety / Definition of Complete --
  inherited from global CLAUDE.md
- Memory rule #30 -- abandoned-scratch projects (`congress-trade-mobile`,
  `congress_trade_alerts_app`) are NOT to be referenced for active work
- CTA Worker source-of-truth for trade-data contracts:
  `Projects/congress-trade-alerts/` (separate project, separate repo)

---

## Conventions specific to this repo

- ASCII only in code, configs, and prose (per global rule). The Lock
  document content above uses ASCII even where the original drop had
  Unicode dashes.
- Commits: structured, one ticket per commit, push to origin/master
  immediately after commit (no long-lived feature branches in v1).
- Verification: every CTA-App-N ticket ends with explicit pass/fail of the
  Pre-scaffold parity checklist (for CTA-App-1-1) or an analogous
  vertical-slice acceptance test (for later tickets).
- No real-device perception checks executed by Claude Code -- those are
  Joe-tasks per RULE #1 ("real-device pixel rendering"). Claude Code may
  drive simulator / Expo Go web-preview but final pass requires Joe on
  hardware.
- Three-surface email rule: the contact email is mirrored across three
  user-facing surfaces -- cta-app `app/(drawer)/about.tsx` PRESS_EMAIL
  constant + the Worker repo's `privacy.html` + the Worker repo's
  `press.ts`. Any change touches all three or the surfaces drift.
  Currently locked on `congresstradealertsapp@gmail.com`; flips to
  `press@congresstradealerts.com` when Cloudflare Email Routing is wired
  (currently blocked per Worker repo's
  `docs/embargo/PRE_SEND_CHECKLIST.md` Phase 1).

---

## Gotchas

- **JSX TS1382 (literal angle brackets in text content):** `<` and `>`
  inside JSX text trip `tsc` with `error TS1382: Unexpected token`.
  Fix: escape as `&lt;` / `&gt;`. Easy to miss in copy-heavy diffs
  (long descriptions, methodology body, About paragraphs). Hit during
  CTA-App-1-8 ship.

---

## Process Kernel (v2.1.1)

The architectural-discipline kernel below was developed under the
deprecated `congress-trade-mobile/` rebuild and ported here verbatim
on 2026-05-08 when that scratch project was retired. It applies to all
CTA-App-N work alongside the Stack lock and Architectural rules above.

Sections 0-13 are preserved with original numbering and content;
heading levels were adjusted (H1 -> H3, H2 -> H4) to nest under this
section in the host document hierarchy. Section 13's bootstrap-prompt
template references "the congress-trade-mobile rebuild" verbatim from
the original kernel; when applying that prompt to a cta-app session,
mentally substitute "the cta-app rebuild" (or edit inline at paste
time).

### 0. Core philosophy (non-overridable)

- Vertical slices > layers
- Explicit > implicit
- Deterministic > reactive magic
- Delete > add
- State machines > booleans
- Contracts > conventions

### 1. System architecture rules

#### 1.1 Vertical slice model
Every feature = UI + state machine + domain logic + data + tests
- No horizontal "services" spanning unrelated features
- No "global auth layer", "global feed layer", etc.
- Each slice owns its full lifecycle

#### 1.2 Domain boundaries
- Each domain has: one canonical model, one public API surface, one persistence adapter
- Rule: No duplicate domain representations across layers

#### 1.3 Dependency rule (strict DAG)
Allowed flow only: UI -> State Machine -> Domain -> Data Adapter
Forbidden:
- UI -> API calls directly
- UI -> database/cache
- Domain -> UI imports

#### 1.4 Dependency injection (mandatory)
All external dependencies must be injected: network client, storage, clock, analytics, feature flags
- Rule: No hidden singletons except platform runtime primitives

### 2. State & behavior model

#### 2.1 Finite state machines required
Every feature state must be explicit FSM. Required minimum:
- idle / loading / success / empty / error / offline (if networked)
- Rule: No boolean-driven UI flow logic

#### 2.2 Pure UI rule
UI is a pure projection. Forbidden in UI: side effects, API calls, business decisions, state mutation
- Allowed: rendering state, dispatching intents only

#### 2.3 Idempotency contract (mandatory)
Every mutation defines: idempotency key, retry policy, merge strategy
- Rule: No mutation without replay safety

#### 2.4 Event emission (system-level)
Every state transition emits: feature_id, user_id (if available), from_state -> to_state, idempotency_key, timestamp
- Rule: UI never emits events directly

### 3. Data & schema discipline

#### 3.1 Schema-first pipeline
Order is mandatory: Schema -> API contract -> Domain -> State machine -> UI
- Rule: No UI exists before schema definition

#### 3.2 Versioned local storage
All local persistence must define: schemaVersion, migration path, maxAge or maxSize
- Rule: Unversioned storage is rejected

#### 3.3 Migration requirement
Every schema change must include: forward migration, backward compatibility test

### 4. Error system

#### 4.1 Unified error taxonomy
All errors must be one of: validation_error, network_error, auth_error, permission_error, conflict_error, timeout_error, unknown_error
- Rule: No raw string errors in domain or UI layers

#### 4.2 Error propagation rule
Errors propagate: Domain -> State Machine -> UI
- Rule: UI never constructs or interprets raw backend errors

### 5. Performance & resource contracts

#### 5.1 Hard budgets per slice
- <= 60ms first render (target device class)
- <= 200MB peak memory
- <= 16ms main-thread blocking
- <= 0.5% battery/hour background impact
- Rule: Budget violation = merge rejection

#### 5.2 Background work constraints
All background tasks must define: throttle state in FSM, max runtime, retry policy, cancellation behavior
- Rule: No fire-and-forget execution

### 6. Cross-platform parity system

#### 6.1 Parity levels per feature
Each feature declares: strict (auth, payments, data integrity), tolerant (UI layout, animation), divergent (platform-native UX differences)
- Rule: Undeclared divergence = bug

#### 6.2 Determinism requirement
Given same state -> identical UI output across platforms. Forbidden: time-based UI branching, implicit locale-driven layout changes (unless abstracted), platform heuristics inside components

#### 6.3 Platform adapter boundary
Platform-specific logic lives ONLY in: platform adapters, token overrides, input abstraction layer
- Rule: No platform logic in feature code

### 7. Design system constraints

- No hard-coded spacing/colors/fonts
- All values come from token system
- No platform default styling leaks
- Rule: UI must be fully token-driven

### 8. Testing & verification system

#### 8.1 Required state coverage
Every screen must test: loading, empty, success, error, offline (if applicable)

#### 8.2 Integration requirement
Every feature must include at least one cross-domain integration test
- Rule: No isolated feature-only testing

#### 8.3 Simulation test suite (mandatory)
Each feature must include: iOS Simulator test, Android Emulator test
- These run in CI on every commit

#### 8.4 Real-device smoke test (mandatory)
Each feature must ship with a one-command smoke test script that runs on physical iPhone + physical Pixel
- Required checks: navigation gestures, haptics, Dynamic Island / Live Activities, dynamic colors, accessibility tree, offline edge cases
- Rule: Emulators lie. Real-device pass is required for "done."

#### 8.5 Accessibility & i18n invariants
- a11y tree validation required
- RTL layout validation required
- Rule: Not optional, not separate QA phase

### 9. Abstraction control system

#### 9.1 Abstraction debt ledger
Each abstraction must record: consumers count, creation date, expiry (default 30 days)
- Rule: 0-consumer abstractions must be deleted

#### 9.2 Anti-overengineering rule
Before adding abstraction: must exist in >=2 real use cases

#### 9.3 Max abstraction depth
UI -> Domain max 3 layers

### 10. AI drift prevention system

#### 10.1 Mandatory self-audit before code generation
Check: Is this minimal? Is this duplicating existing model? Can this be deleted instead? Does this introduce >3 abstractions?
- If yes -> reject or simplify

#### 10.2 Prompt discipline
Every session must include: CLAUDE.md version, feature slice name
- Rule: No global "improve system" prompts

#### 10.3 Anti-pattern bans
Strictly forbidden: magic observers, implicit event systems, hidden global listeners, auto-refresh side effects, service locator patterns

### 11. Observability rules

- Logs emitted ONLY in domain/state layer
- UI never logs directly
- Events must be structured (not string logs)

### 12. Build & release gates

No merge unless:
- all tests pass (unit + integration + simulation parity)
- real-device smoke test passes
- performance budget validated
- migration tests included if schema changed
- abstraction debt ledger updated
- feature has kill-switch (feature flag or rollback path)

### 13. Session bootstrap prompt

Before every Claude Code session on the mobile rebuild, paste this at the top of your prompt:

```
I am running a Claude Code session against CLAUDE.md v2.1.1 on the congress-trade-mobile rebuild.

FEATURE: <slice_name> (e.g., "Politician profile screen + offline cache")
CLAUDE.md VERSION: v2.1.1
PLATFORM: <ios | android | cross-platform>

Before generating code, validate and report on:

1. Architecture compliance: Which sections of CLAUDE.md am I relying on? Which might I violate?
2. FSM definition: List the explicit FSM states for this slice. No booleans for UI flow.
3. Idempotency strategy: For every mutation, declare key + retry policy + merge strategy.
4. Error taxonomy: Map every error path to one of the 7 unified error types.
5. Abstraction debt: List entries I would create or modify in docs/abstraction-debt.md.
6. Performance budget: Confirm the slice can meet 60ms first render / 200MB peak memory / 16ms main-thread blocking.
7. Parity contract: Declare parity level (strict / tolerant / divergent) and any intentional platform divergences.
8. Test plan: List the simulation tests, integration test, real-device smoke test, a11y tree check.
9. Migration: If schema changes, describe forward + backward compatibility tests.
10. Kill-switch: Confirm feature flag and rollback path.

If any of the above cannot be answered, stop and request clarification before generating code.
```

---

## Product Invariants

LOCKED product / UX / security decisions inherited from the deprecated
`congress-trade-mobile/` rebuild's source-code comment headers, ported
here on 2026-05-08 when that scratch project was retired. They override
default Expo / RN platform conventions and apply to all CTA-App-N work.

1. **Subscription billing -- never Apple/Google IAP.** The "Upgrade"
   button opens the website's existing Stripe Checkout in the system
   browser (`expo-web-browser`). Source decision: original
   `congress-trade-mobile/src/screens/AccountScreen.tsx` header.

2. **Auth flow -- API key paste only.** No password flow in the app.
   Payment + key issuance happen on the website. Source decision:
   original `congress-trade-mobile/src/auth/context.tsx` header.

3. **Auth storage -- keychain (iOS) / EncryptedSharedPreferences
   (Android) via `expo-secure-store`.** API keys never land in
   AsyncStorage, plain JS state, or any backup that could leak them.
   Source decision: original `congress-trade-mobile/src/auth/storage.ts`
   header.

4. **Auth UX -- never auto-paste API keys from clipboard without
   explicit user tap.** Auto-paste-on-screen-mount would be a privacy
   violation surface (any other app's clipboard content would be read
   implicitly). Source decision: original
   `congress-trade-mobile/src/screens/SignInScreen.tsx` header.

5. **External content -- never load untrusted HTML in WebView.** Source
   URLs (news links, congressional source documents) open via
   `expo-web-browser` (in-app browser tab on iOS, Custom Tabs on
   Android). Source decision: original
   `congress-trade-mobile/src/screens/TradeDetailScreen.tsx` header.

6. **Theme -- dark mode only in v1.** Light mode intentionally not
   implemented; >90% dark usage observed on prior shipped finance apps.
   Reduces surface area + maintenance burden. Source decision: original
   `congress-trade-mobile/src/theme/colors.ts` header.

7. **Watchlist -- free / unauth users get a local AsyncStorage
   watchlist; not gated behind auth.** The worker's `/api/watchlist`
   endpoint exists but is not on the v1 critical path. Source decision:
   original `congress-trade-mobile/src/watchlist/storage.ts` header.

8. **Worker contract mirroring -- client API types stay in sync with
   `congress-trade-alerts/src/types.ts`.** When the Worker changes a
   response shape, the client's `src/api/types.ts` (or equivalent)
   updates with it; the Worker repo is the single source of truth.
   Source decision: original `congress-trade-mobile/src/api/types.ts`
   header.

---

## Decisions Log -- Pre-Launch Round 3 (resolved 2026-05-21)

### Launch
- Embargo-first via existing Sherman (Punchbowl) -> Tully-McManus (Politico) -> Karni (NYT) two-stage flow
- Show HN + r/dataisbeautiful + r/SideProject as Day+1 amplifiers (not Day 0)
- Product Hunt: optional vanity layer (~100 signups ceiling for civic-data)
- Hard skip: PR firms, growth-bro copy, tier-1 newsletter sponsorship (Politico/Axios at $300K+/wk; Punchbowl $100K+/wk)
- Launch date: NOT LOCKED -- gated on:
  - D-U-N-S case 10436878 still processing (submitted 2026-05-20, typical 7-10 business days)
  - Apple Individual->Org migration can't begin until D-U-N-S clears
  - iPostal1 CMRA address update at D&B needed before EU launch (Apple auto-pulls D&B address to public EU DSA fields)
  - Push dispatch verification (trade 321039, TCNNF) still open pending `ADMIN_KEY` paste
  - Sherman availability has to be coordinated against his actual calendar, not assumed
- Earliest realistic window: mid-to-late June 2026, but Joe owns the call

### Newsletter (cross-ref)
Full content in `congress-trade-alerts/CLAUDE.md` -> Decisions Log -> Newsletter. Beehiiv signup form lives on the web (Worker) side. Key points for mobile: Beehiiv free under 2,500 subs; bundled with Pro tier (not a separate SKU); 2x/week analytical + 1x/week digest; no brokerage/advisor sponsors.

### Analytics (cross-ref)
Full content in `congress-trade-alerts/CLAUDE.md` -> Decisions Log -> Analytics. D1 events table lives on Worker. Mobile-side implication: NO client-side analytics SDK on cta-app, ever. Apple Privacy Nutrition: Tracking = NO; Data Linked to User = none. Push engagement measured server-side via trade-ID echo in deep links, no client telemetry.

### Open follow-ons
- Build D1 events table -- **DONE 2026-05-21** Worker-side. See `congress-trade-alerts/CLAUDE.md` Decisions Log for full deviations list. Mobile-side action item: when a push notification is tapped and the deep link opens, the app should `POST /api/push/engagement` with `{ trade_id }` (aggregate-only, no user/token sent). Separate cta-app ticket; no work in this repo for the D1 table itself.
- Lock launch date once D-U-N-S clears and Org migration completes
- Draft 90-day post-launch tactical plan once date is real
