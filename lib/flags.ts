// Returns-display launch gate. Mirrors the Worker's RETURNS_DISPLAY feature
// flag. Build-time module constant, same idiom as SHOW_UPGRADE_CTA below.
//
// While this is OFF the app hides every price-derived figure it DISPLAYS:
//   - the per-trade price / % change snapshot (TransactionHero)
//   - the Congress-vs-S&P 500 benchmark (feed PulseHero + Leaderboard
//     BenchmarkCard, incl. their "vs S&P 500" labels)
//   - the ticker price snapshot + vs-S&P line (TickerHeader)
// The disclosure facts (politician, ticker, transaction type, amount range,
// dates) always render -- only the price-derived display is gated.
//
// MECHANISM: build-time module constant (same as SHOW_UPGRADE_CTA).
// TRADEOFF -- flipping this requires an app REBUILD + STORE RESUBMIT. It does
// NOT flip in lockstep with the Worker's server-side RETURNS_DISPLAY; mobile
// re-enable lags the server by a store-review cycle. (A remote-config signal --
// e.g. the Worker exposing the flag in a response the app already fetches --
// would flip without a resubmit, but that needs a Worker change and is out of
// scope for this display + null-safety pass.)
//
// Flip to `true` in the SAME app release that enables RETURNS_DISPLAY on the
// Worker.
//
// NULL-SAFETY NOTE (independent of this flag): when the SERVER flag is off the
// API returns these price fields as null. The app already renders those as
// clean placeholders / hidden blocks (price fields were always nullable for
// un-enriched trades), so a server-only flip never crashes the app regardless
// of this constant's value.
export const RETURNS_DISPLAY = false;

// Purchase-surface gate. v1 ships with NO in-app purchase surface on ANY
// platform (App Store option (a), decided 2026-07-11): Android is not
// enrolled in Play's external-offers program, and the first iOS review goes
// in as a free stand-alone companion app (guideline 3.1.3(f)) with no
// upgrade CTA. Apple's 3.1.1(a) US-storefront external-link carveout DOES
// currently permit the web Stripe link-out, so flipping this to `true`
// restores the isUS-gated Subscription card in Settings
// (app/(drawer)/settings.tsx) in a post-approval release. Same rebuild +
// store-resubmit tradeoff as RETURNS_DISPLAY above.
export const SHOW_UPGRADE_CTA = false;
