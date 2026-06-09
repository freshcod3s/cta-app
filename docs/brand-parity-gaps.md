# Brand parity audit: site surfaces vs app screens

**Branch:** `brand-parity-audit` (forked from `master` 2026-05-28).
**Sources:** WebFetch on `<BRAND_DOMAIN>/` + `<BRAND_DOMAIN>/methodology` (live), Read on `congress-trade-alerts/src/*` (worker source), Read on `cta-app/app/*` + `cta-app/features/*` (app source).

**OPSEC posture:** field-path-only. Source-tree paths used directly. `<BRAND_DOMAIN>` substitutes for the live origin.

---

## Verdict

The mobile APK shows roughly 5% of what the live site surfaces. Most of that gap was deliberate v1 scope per the stack lock at `cta-app/CLAUDE.md:38-83` (phone-only, read-only, no auth, no analytics, waitlist signup web-side). A smaller slice is real product gap that would make a public launch read as "gutted" even for a self-described lean v1.

| Bucket | Surfaces | Posture |
|---|---|---|
| Per-spec v1 omissions | 11 | Intentional -- stack lock + product invariants govern these |
| Real gaps before public launch | 6 | Need to land or be deliberately reframed |
| Server-side ready, app-unwired | 6 | Worker endpoints exist; mobile client never calls them |
| Acceptable web-only by design | 5 | Site retains these; mobile points at web link |

---

## Re-audit -- 2026-06-04 (post Track A + Gap 1 + Track C + Track B)

After Tracks A, B, and C plus the Gap-1 Upgrade button shipped, the mobile app now covers roughly **65-70%** of the meaningful civic-transparency surface -- up from the ~5% baseline above. The remaining delta is intentional omissions plus two minor surfaces.

### Closed since last audit (12 surfaces)

| # | Surface | Closed by |
|---|---|---|
| 1 | Live Feed -- party/chamber/type filters + member search | Track A |
| 2 | Stats / leaderboards -- Leaderboard + Congress-vs-S&P benchmark | Track A |
| 4 | Press / media kit | Track B |
| 7 | FAQ | Track B |
| 11 | Pricing / Upgrade -> external Stripe Checkout | Gap 1 |
| 14 | Watchlist (local follow) | Track A |
| 17 | Per-politician profile route | Track A |
| 18 | Per-ticker page | Track A |
| 20 | Search -- inline FilterBar member search (replaced the stub FAB) | Track A |
| 21 | Daily Dive / Briefing surface | Track B |
| 25 | News + ConflictScore on trade detail | Track C |
| 27 | Share-a-trade action | Track C |

### Remaining

- **Minor product gaps:** #13 push targeting is HALF-CLOSED -- per-politician targeting works end-to-end (FollowButton -> subscription_prefs.members[] -> worker selectTokensForTrade filter -> filtered delivery, free tier, no gate; audited 2026-06-04); per-ticker + min-amount threshold targeting remain (ticker closure in progress 2026-06-04, threshold a separate ticket). #16 full top-stocks / sectors discovery (largely covered by Leaderboard + Daily Dive). (#19 per-committee pages CLOSED 2026-06-04 -- see table row 19.)
- **Unchanged by design:** the per-spec v1 omissions (section 2) and the web-only / fintech-declined surfaces (#5, #6, #15, #26, #28) remain correctly out of scope.

---

## Re-audit -- 2026-06-09 (post Gap #13 closure + committee build-out + onboarding + RelatedTrades)

A run of surgical slices since 2026-06-04 (master @ d9feafb) pushed coverage of the meaningful civic-transparency surface to roughly **~85%**. The remaining delta is the intentional omissions (section 2) plus one partially-covered discovery surface (#16).

### Closed / extended since 2026-06-04

| # | Surface | Closed / extended by |
|---|---|---|
| 13 | Push targeting -- per-ticker + min-amount threshold | tickers[] + worker selectTokensForTrade `$.tickers` filter (deployed) + `min_amount` floor + Settings "Minimum trade size" chips. #13 push targeting now FULLY closed (per-politician + per-ticker + threshold); channel-mgmt UI stays web/Pro |
| 19 | Per-committee page -- richer | recent-activity timeline (congress.gov hearings/markups/votes) + Subcommittees section + tappable subcommittees (`?parent` disambiguation) |
| 21 | Daily Dive -- completeness | rendered the remaining worker sections: sectors, bipartisan, fresh-faces |
| 25 | Trade-detail richness -- RelatedTrades | other recent trades for the ticker + by the member; #25 now FULLY closed (News + ConflictScore + RelatedTrades) |

### New app-only surface (no web equivalent)

- **First-run onboarding** -- a civic-transparency disclaimer overlay shown once on first launch (persist v4 `hasSeenOnboarding`) before the feed. App Store review-safety placement. Not a site-parity row -- the web has no first-run gate.

### Remaining after this run

- **#16** Top Stocks / Top Earners / Top Trades / Hot Tickers / Sectors -- **DEFERRED to post-launch (v2)**. Partially covered (Leaderboard + Daily Dive sectors/bipartisan/fresh-faces); the dedicated top-* discovery views are deferred. Wide multi-view surface; placement TBD.
- **Unchanged by design:** per-spec v1 omissions (section 2) + web-only / fintech-declined surfaces (#5, #6, #15, #26, #28).

---

## 1. Full delta inventory

Site nav lifted from the live homepage (top nav + footer). App surfaces from `app/(drawer)/*` + `app/trade/[id].tsx`. Worker route source from `congress-trade-alerts/src/routes/*`.

| # | Site surface | Worker source | App surface | App source | Status |
|---|---|---|---|---|---|
| 1 | Trades / Live Feed | `dashboard.html` + `routes/api.ts:handleTrades` | Feed | `app/(drawer)/index.tsx` | **PARTIAL** -- list works; missing party/chamber/type filters, deadline-status overlay, "new since last visit" markers |
| 2 | Stats panel (Congress vs S&P 30d, top earners, leaderboards) | `routes/stats.ts` (28KB) | StatsBanner -- 4 stat cards above feed | `features/trades/components/StatsBanner.tsx` | **PARTIAL** -- 4 numbers shown; site has full breakdowns, time-range selectors, top-N tables |
| 3 | Methodology | `routes/methodology.ts` (20KB) | Methodology screen (abbreviated) | `app/(drawer)/methodology.tsx` | **ACCEPTABLE** -- mobile copy is condensed; "Read full methodology on web ->" link present (line 134-143) |
| 4 | Press / media kit | `routes/press.ts` (22KB) | Press drawer screen | `app/(drawer)/press.tsx` | **CLOSED (Track B)** -- press surface + media-kit link |
| 5 | For AI / Developers / MCP docs | `routes/mcp-docs.ts` (26KB) | None | -- | **WEB-ONLY BY DESIGN** -- developer surface, not mobile-shaped |
| 6 | Benchmark (LLM eval) | `routes/benchmark.ts` (27KB) | None | -- | **WEB-ONLY BY DESIGN** -- meta/research surface |
| 7 | FAQ (6 Q&A pairs) | embedded in `dashboard.html` | FAQ drawer screen | `app/(drawer)/faq.tsx` | **CLOSED (Track B)** -- FAQ accordion |
| 8 | RSS feed | `routes/feed.ts` | None directly; push system serves the same alerting function | `lib/push/*` | **ACCEPTABLE** -- push is the mobile-native equivalent of an RSS subscription |
| 9 | Privacy policy | `privacy.html` | About -> external browser link | `app/(drawer)/about.tsx:124` via `PRIVACY_URL` | **OK** -- per product invariant #5, external HTML in browser, never in-WebView |
| 10 | Terms of Service | `terms.html` | About -> external browser link | `app/(drawer)/about.tsx:128` via `TERMS_URL` | **OK** -- same posture as Privacy |
| 11 | Pricing tiers (Free, Pro, Trader) | `routes/stripe.ts` + `routes/pro.ts` + dashboard pricing section | Upgrade button (Settings, US storefront) -> external Stripe Checkout | `features/billing/components/UpgradeButton.tsx` | **CLOSED (Gap 1)** -- Upgrade button opens external Stripe Checkout per invariant #1; US-storefront gated (3.1.1(a)) |
| 12 | Pro API key login | dashboard form + `middleware/auth.ts` | None | -- | **PER-SPEC v1 OMIT** -- auth v1 = none per stack lock line 60; API key paste UI lives in product invariants #2-3 but is not built yet |
| 13 | Alerts configuration (email, Telegram, Discord channels + watchlist rules) | dashboard + `routes/pro.ts:handleProChannels` | Push toggle + per-politician + per-ticker targeting + min-amount threshold | `app/(drawer)/settings.tsx`, `features/watchlist/*`, `features/settings/*` | **PARTIAL (targeting CLOSED)** -- push targeting fully closed 2026-06-09: per-politician (members[]) + per-ticker (tickers[]) + min-amount threshold (min_amount floor) all wired end-to-end through selectTokensForTrade, free tier. Full alerts-config UI (channel mgmt) stays web/Pro by design |
| 14 | Watchlist (named politicians + tickers) | `routes/watchlist.ts` + dashboard watchlist panel | Watchlist drawer screen + FollowButton / FollowTickerButton | `app/(drawer)/watchlist.tsx`, `features/watchlist/*` | **CLOSED (Track A)** -- local AsyncStorage watchlist (members[] + tickers[]) per invariant #7 |
| 15 | Copy-Trade Simulator | dashboard simulator section + `routes/api.ts:handleRealism` | None | -- | **WEB-ONLY BY DESIGN** -- per `CLAUDE.md` Strategic positioning, copy-trade framing IS the fintech drift the lock forbids on mobile; declining is correct |
| 16 | Top Stocks / Top Earners / Top Trades / Hot Tickers / Sectors | `routes/api.ts:handleTopStocks` `:handleTopEarners` `:handleTopTrades` `:handleBigPictureAngles` | Partial: Leaderboard + Daily Dive (sectors / bipartisan / fresh-faces) | `app/(drawer)/leaderboard.tsx`, `app/(drawer)/daily-dive.tsx` | **DEFERRED (post-launch v2)** -- discovery is partly covered by Leaderboard + the Daily Dive sections; the dedicated Top-Stocks / Top-Trades / Hot-Tickers views are deferred to post-launch. Wide multi-view surface; placement TBD |
| 17 | Per-politician profile (committee power, activity snapshot, conflict scoring) | `routes/api.ts:handlePoliticianProfile` | Member profile route; tappable from feed/detail | `app/member/[name].tsx`, `features/members/*` | **CLOSED (Track A)** -- /member/[name] profile (trades, committees, late-filing flags) |
| 18 | Per-ticker page (who in Congress traded this) | `routes/ticker-info.ts` (6.8KB) + `routes/api.ts:handleTickerCongressional` | Ticker route; tappable ticker from feed/detail | `app/ticker/[symbol].tsx`, `features/ticker/*` | **CLOSED (Track A)** -- /ticker/[symbol] (Congress buyers, follow-ticker) |
| 19 | Per-committee page | `routes/committees-info.ts` + `routes/api.ts:handleCommitteeMembers` | `app/committee/[name].tsx` + `features/committees/*`; chips tappable on trade detail + member profile | `features/committees/components/*` | **CLOSED 2026-06-04, extended 2026-06-09** -- /committee/[name] roster (deduped by bioguide, role-sorted) + reference header; 2026-06-09 added the recent-activity timeline (congress.gov hearings/markups/votes), the Subcommittees section, and tappable subcommittees (`?parent` disambiguation). Worker endpoint was already live |
| 20 | Search | dashboard search + `routes/api.ts:handleSearch` | Inline member search in the feed FilterBar | `app/(drawer)/index.tsx`, `features/trades/components/FilterBar.tsx` | **CLOSED (Track A)** -- inline FilterBar member search replaced the stub FAB |
| 21 | Daily Dive / Briefing | `routes/api.ts:handleDailyDive` `:handleBriefing` | `app/(drawer)/daily-dive.tsx` + `features/dailydive/*` | `features/dailydive/components/*` | **CLOSED (Track B), completed 2026-06-09** -- pulse + stocks + members + unusual (Track B); 2026-06-09 added the remaining worker sections: sectors, bipartisan, fresh-faces |
| 22 | Mobile App Signup form (web -> email collection for app launch) | dashboard mobile signup section | N/A -- app users are post-signup | -- | **INVERSE** -- web-only by design; app IS the destination |
| 23 | Waitlist | `routes/waitlist.ts` | N/A -- app users are post-waitlist | -- | **INVERSE** -- same as above |
| 24 | Account / delete-account | `routes/stripe.ts:handleDeleteAccount` | None | -- | **PER-SPEC v1 OMIT** -- no accounts in v1; Settings has push-off as the only deletion path |
| 25 | News enrichment / per-trade context | `enrichment/news.ts` + `services/conflict-detector.ts` | NewsSection + ConflictScore + RelatedTrades on trade detail | `features/news/*`, `features/conflict/*`, `features/trades/components/RelatedTrades.tsx` | **CLOSED** -- NewsSection + ConflictScore (Track C) + RelatedTrades (2026-06-09: other trades for the ticker + by the member). #25 fully closed |
| 26 | Cluster / coordinated-trading detection | `clusters.ts` (26KB) | None | -- | **WEB-ONLY BY DESIGN** -- research surface, not mobile-shaped |
| 27 | Social share cards (SVG/PNG per trade) | `social/card.ts` + `social/png.ts` + `social/poster.ts` | Share-a-trade action on trade detail | `features/share/components/ShareTradeButton.tsx` | **CLOSED (Track C)** -- share + copy-link (expo-clipboard) on the trade detail |
| 28 | Footer: System Status | embedded | None | -- | **WEB-ONLY BY DESIGN** -- meta-observability, not user-facing on mobile |
| 29 | Footer: Contact (email) | `mailto:` link | About -> "Press + contact" section | `app/(drawer)/about.tsx:139-144` | **OK** -- same email surfaced |
| 30 | Edge-to-edge dark theme | site is dark by default | App is dark per product invariant #6 | `tailwind.config.js` + NativeWind | **OK** -- parity |

---

## 2. Per-spec v1 omissions (deliberate, do not auto-build)

These are intentionally absent on mobile per the stack lock and product invariants. Building them is a product re-scope, not a parity fix.

| Surface | Source rule |
|---|---|
| Auth / API key paste | `cta-app/CLAUDE.md:60` "Auth v1: none (read-only + waitlist signup form)" + product invariants #2-3 (when auth lands, API key paste pattern is locked) |
| Account screen | follows from no-auth v1 |
| Client analytics SDK | product invariant per `cta-app/CLAUDE.md` Decisions Log + `congress-trade-alerts/CLAUDE.md` Decisions Log: "no client-side analytics SDK on web or mobile, ever" |
| In-app purchases | product invariant #1 -- subscriptions always via web Stripe Checkout opened in `expo-web-browser` |
| Telemetry / crash reporting | `cta-app/CLAUDE.md:64` "Telemetry v1: none (Sentry RN when first crash lands)" |
| Tablet / iPad adaptive layout | `cta-app/CLAUDE.md:65` "Tablet/iPad v1: phone-only" |
| Copy-trade simulator | `CLAUDE.md` Strategic positioning explicitly forbids fintech drift -- simulator is borderline; on mobile it would read as "copy trades from Congress" which is the eToro/Quiver positioning the project is differentiated against |
| Paper portfolio / mirror trade / close position | same fintech-drift reason; worker endpoints exist (`routes/mobile.ts`) but mobile spec excluded these |
| Pro/Trader tier API access | `routes/mobile.ts` Pro endpoints exist server-side; mobile v1 = free tier only |
| Light mode | product invariant #6 -- dark-only v1 |
| WebView for source documents | product invariant #5 -- external HTML opens in `expo-web-browser`, never in WebView |

---

## 3. Real gaps before public launch (need to land or deliberately re-frame)

Six surfaces stand out as "the app feels gutted without these." Sequenced rough-order-of-impact:

### Gap 1 -- Upgrade button + Stripe Checkout external open
- **Why:** product invariant #1 mandates the pattern (Upgrade -> system browser -> Stripe Checkout) but the button itself is nowhere in the app. Without an Upgrade affordance, the app has no monetization path and no signaling that Pro exists.
- **Where:** drawer item OR settings screen section OR feed empty-state CTA.
- **Worker contract:** `routes/stripe.ts:handleSubscribe` already returns Checkout URL; mobile just needs `expo-web-browser.openBrowserAsync(url)` on tap.
- **Effort:** ~1 ticket, 1 hr.

### Gap 2 -- Per-politician profile route
- **Why:** civic-transparency positioning hinges on "this is what YOUR member is doing." Without tap-to-profile from any trade row, the user can see "Jonathan Jackson sold ORLY" but cannot see Jackson's committee assignments, full trade history, conflict score, voting record overlap. The site has this; the app has the member's name as plain text.
- **Where:** new route `app/politician/[name].tsx` (or `[id]`); `MemberHeader.tsx` becomes a `Pressable`.
- **Worker contract:** `routes/api.ts:handlePoliticianProfile` already returns the payload.
- **Effort:** ~1 ticket, 4-6 hrs.

### Gap 3 -- Per-ticker page
- **Why:** "Who else in Congress traded $TSLA?" is the second natural drill-down after politician. Site has it; app's ticker is plain text on the trade row + detail hero.
- **Where:** new route `app/ticker/[symbol].tsx`; `TransactionHero.tsx` ticker becomes tappable.
- **Worker contract:** `routes/ticker-info.ts` + `routes/api.ts:handleTickerCongressional` ready.
- **Effort:** ~1 ticket, 3-4 hrs.

### Gap 4 -- Search wired up
- **Why:** the FAB shows on the feed (`app/(drawer)/index.tsx:108-115`) but tapping it pops an alert saying "Search ships in CTA-App-1-N." Punting an obvious affordance reads as broken on first launch.
- **Where:** `app/search.tsx` modal screen + dispatch from the FAB.
- **Worker contract:** `routes/api.ts:handleSearch` ready.
- **Effort:** ~1 ticket, 4-6 hrs.

### Gap 5 -- Watchlist screen
- **Why:** product invariant #7 says free/unauth users get a local AsyncStorage watchlist. The storage primitive exists (`features/settings/store.ts` has `subscriptionPrefs.members[]` per `lib/push/register.ts:162`) but no UI to add/remove members or browse the watchlist. Without it, "subscribe to alerts" requires landing on a trade row first.
- **Where:** drawer item `app/(drawer)/watchlist.tsx` + add/remove from politician profile (gap 2).
- **Worker contract:** none required -- local-first per invariant; optional sync via `routes/watchlist.ts` for Pro.
- **Effort:** ~1 ticket, 6-8 hrs (couples with gap 2).

### Gap 6 -- Trade-row filters (party / chamber / type / amount)
- **Why:** site's feed is filterable; app's is not. With 42 disclosures in 7d (from the stat banner), unfiltered scrolling becomes the only navigation. Filters are a 1-day chip-row addition.
- **Where:** `app/(drawer)/index.tsx` adds a horizontal scroll chip row above `StatsBanner`.
- **Worker contract:** `routes/api.ts:handleTrades` already accepts filter query params.
- **Effort:** ~1 ticket, 1 day.

**Recommended v2 minimum-viable feel-not-gutted sprint:** all six. ~3 weeks of CTA-App-2-N tickets.

---

## 4. Server-side ready, app-unwired (bonus surface, free for the wiring)

These mobile-specific endpoints exist on the worker at `congress-trade-alerts/src/routes/mobile.ts` but are not called from the cta-app codebase. Each is a "client wire-up only" task -- no server work required.

| Worker endpoint | Header at | Mobile use case |
|---|---|---|
| `POST /api/mobile/register` | `routes/mobile.ts:77-` | First-run device handshake (separate from push token register at `/api/push/token`) -- establishes the device row for Pro tier upgrades |
| `GET/POST/DELETE /api/mobile/subscriptions` | `routes/mobile.ts:handleListSubscriptions` etc. | Pro-tier targeted alerts (per-politician, per-ticker, min-amount thresholds) |
| `GET /api/mobile/portfolio` | `routes/mobile.ts:handleGetPortfolio` | Paper trading portfolio view |
| `POST /api/mobile/mirror` | `routes/mobile.ts:handleMirrorTrade` | Mirror a trade (paper) |
| `POST /api/mobile/close` | `routes/mobile.ts:handleClosePosition` | Close a paper position |
| `GET /api/mobile/export` | `routes/mobile.ts:handleMobileExport` | CSV export (Pro) |

Note: the portfolio / mirror / close trio is fintech-drift adjacent per `CLAUDE.md` Strategic positioning. Even though the server-side endpoints exist, hooking them up in the mobile app would conflict with the civic-transparency posture. Either re-frame ("track what you would have made if you'd watched Congress" as historical commentary) or leave them unwired and consider deleting the server endpoints to reduce attack surface.

---

## 5. App-side surfaces that work as-is (do not regress)

For completeness, what the app DOES handle well today:

| App surface | Source | Why it works |
|---|---|---|
| Edge-to-edge dark theme | `tailwind.config.js` + `app.json:android.edgeToEdgeEnabled` | Matches site dark posture; no design-system drift |
| Trade row tap -> detail | `app/(drawer)/index.tsx` + `app/trade/[id].tsx` | Standard mobile navigation; 6 detail components compose cleanly |
| Push notification flow | `lib/push/register.ts` + T4 channel-importance fix from android-hardening branch | Heads-up notification + sound + vibration on HIGH-importance `trades` channel |
| Deep-link from push tap | `app.json:android.intentFilters` + Expo Router | `<BRAND_DOMAIN>/trade/{id}` opens the trade detail screen |
| Methodology condensed copy | `app/(drawer)/methodology.tsx` | Acceptable simplification with "read full on web" exit |
| About / press contact | `app/(drawer)/about.tsx` | Three-surface email rule honored; methodology + privacy + terms linked |
| Settings push toggle UX | `app/(drawer)/settings.tsx` | Permission-denied "Open OS Settings" affordance, debounced re-sync at `app/_layout.tsx:33-61` |
| FlatList virtualization + pull-to-refresh + infinite scroll | `app/(drawer)/index.tsx` | Standard mobile feed mechanics |
| Hardware back button on modals | `components/back-handler-modal.tsx` | Per `CLAUDE.md` parity checklist |
| SafeAreaView edges discipline | every screen root | Per architectural rules (`cta-app/CLAUDE.md:115-117`) |

---

## 6. Recommended v2 sequencing

Three tracks, parallel-safe:

### Track A -- Feel-not-gutted (~3 weeks, 6 tickets)
The 6 gaps from section 3, in order: Upgrade button -> Search -> Filters -> Politician profile -> Ticker page -> Watchlist screen. Lands the surfaces a user expects when comparing to the site.

### Track B -- Strategic positioning surfaces (~2 weeks, 3 tickets)
- FAQ drawer item (mirror dashboard FAQ section)
- Press page drawer item (mirror `routes/press.ts` reduced for mobile)
- Daily Dive / Briefing surface (per `routes/api.ts:handleDailyDive`)

### Track C -- Trade-detail richness (~1 week, 3 tickets)
- NewsSection component on trade detail (per `enrichment/news.ts`)
- ConflictScore component (per `services/conflict-detector.ts`)
- Share-a-trade Action with SVG card pull (per `social/card.ts`)

Total: 12 tickets, ~6 weeks of CTA-App-2-N work. Pre-launch minimum is Track A; Tracks B+C can land between closed-testing day 1 and the production-track promotion.

**Status (2026-06-09): Tracks A, B, C CLOSED + Gap-1; the 2026-06-09 run closed #13 (full push targeting), extended #19 (committee recent-activity + subcommittees + tappable subs), completed #21 (Daily Dive sections), closed #25 (RelatedTrades), and added first-run onboarding.** Pre-launch surface work is complete; #16 (top-stocks / sectors discovery) is DEFERRED to post-launch (v2), partially covered by Leaderboard + Daily Dive.

### What this audit does NOT recommend

- Building copy-trade simulator into mobile (fintech drift per Strategic positioning).
- Building paper portfolio / mirror trade UI into mobile (same fintech-drift reason).
- Building auth / API key paste UI before a Stripe-issued key flow is sequenced server-side (per product invariants #2-3 the pattern is locked, but the prerequisite Stripe issuance flow is still web-only).
- Light mode (product invariant #6).
- Tablet layouts (product invariant: phone-only v1).

---

## 7. Re-audit triggers

Re-run this audit if:
- Worker adds a new public route under `src/routes/` (new surface to evaluate)
- App adds a new screen under `app/` (delta closes)
- Strategic positioning in `CLAUDE.md` shifts (e.g., a deliberate pivot toward Pro-tier portfolio features would re-classify several "fintech-drift" omissions)
- Worker's `src/routes/mobile.ts` Pro endpoints get wired in app (this audit's section 4 becomes obsolete)

Last audit: 2026-06-09 against `master` @ `d9feafb` (closed #13 full push targeting + extended #19 + completed #21 + closed #25 + added onboarding; only #16 remains). Prior: 2026-06-04 @ `9edb36e` (Gap #13 per-politician CLOSED, per-ticker + threshold remain; #19 committee pages closed). Earlier: 2026-06-04 @ `c715680` (Tracks A/B/C + Gap 1; 12 surfaces); 2026-05-28 @ `a76d6f0`.
