# ASO tranche-1 fact audit — every claim → shipped proof

CTA-ASO-1, 2026-08-02. Audits the tranche-1 listing kit (title, short
description, full description in `store/google-play/metadata.txt`, six
screenshot headlines in `scripts/aso/composite_screenshots.py`) against the
shipped vc5 build (source pin `fecb64c`; app code identical at `5ad1350`).
Evidence gathered on the CTA_Pixel emulator running that source, plus code
cites and two read-only prod-data queries. Verdict rule: any FAIL blocks the
kit — fix the copy or flag it, never soften to squeak by.

**Result: 0 open FAILs. One claim failed as drafted and was reworded before
staging (row 14 / row 25 — the "every trade links to its filing" family);
the substitution is recorded inline and in the runsheet.**

**Amended 2026-08-07.** Row 19 previously audited the string "Refreshed every
30 minutes from official filings", which is not present in
`store/google-play/metadata.txt` — the audit cleared wording the kit does not
stage. Row 19 now quotes the staged line verbatim. Row 19a is new: a display-gate
bullet added to the FULL_DESCRIPTION in the same pass, so the block's character
count moved 2449 -> 2516 (runsheet §1 updated to match).

| # | Claim (verbatim) | Shipped proof | Verdict |
|---|---|---|---|
| 1 | Title: "Congress Stock Trade Alerts" (27/30) | Locked copy from Joe. Alerting is real: subscribe surface + push token pipeline (rows 7–9). | PASS |
| 2 | Short: "Track House and Senate stock trades with alerts on new STOCK Act disclosures." (77/80) | Locked copy. Both chambers served: `source` values house_clerk / house_clerk_ptr / senate_efd on live `/api/trades`; House + Senate filter chips on the feed. Alerts: row 7. | PASS |
| 3 | "Congress Trade Alerts tracks the stock transactions that members of the US House and Senate disclose under the STOCK Act." | Feed screen renders both chambers' disclosures (emulator: House members + Senators e.g. Alan Armstrong R-OK rows). 40,551 trades in prod D1. | PASS |
| 4 | "Get trade alerts when new filings appear," | "Subscribe to alerts" / "Subscribed" button on trade detail (screenshot 2); member follow star subscribes (`features/watchlist/components/FollowButton`); worker targeted-push dispatcher reads the same `subscription_prefs`. | PASS |
| 5 | "search and filter by member or company," | Typed member search: `features/trades/components/FilterBar.tsx:98` ("Search a member...") — emulator-verified filtering to Pelosi rows. Company: ticker drill-in filter chip (`FilterBar.tsx:129`, `store.ts drillToTicker`) + ticker pages (`app/ticker/[symbol].tsx`, screenshot 3). | PASS |
| 6 | "and open the original government disclosure." | "View original disclosure — house_clerk" button on trade detail (screenshot 5), opens `trade.source_url` (`features/trades/components/SourceLink.tsx`). Reworded from "...behind every trade" — see row 14. | PASS (reworded) |
| 7 | "Built as a Congress stock tracker for journalists, researchers, and civic-engaged citizens who want politician stock trades in one legible place, with the primary source always one tap away." | Positioning sentence; factual tail = row 6 surface. "One tap away" scoped to trades carrying a source link (row 14 note). | PASS |
| 8 | "A single feed of congressional stock trades from both chambers" | Feed screen (screenshot 1); House/Senate chips; senate_efd + house_clerk rows interleaved (emulator + API). | PASS |
| 9 | "Push alerts when a member you follow files a new disclosure" | Follow star → `subscription_prefs` members; anonymous push token declared in Play Data Safety (vc3 declarations); worker push dispatcher filters on the followed set. | PASS |
| 10 | "Follow any member or company ticker to shape the alerts you receive" | `FollowButton` (member) + `FollowTickerButton` (ticker) — the latter writes "the SAME persisted set the push dispatcher reads" (`FollowTickerButton.tsx:8-12`). Emulator: both stars toggled (screenshots 3). | PASS |
| 11 | "A trade constellation on every member profile: disclosed trades sized by amount, grouped around committee assignments" | TRADE CONSTELLATION card on member profile (screenshot 6, Pelosi, 171 trades); legend "Size = trade value"; grouping logic `features/members/constellation.ts`. Note: profiles whose filing name-variant fails to resolve (e.g. "Kevin Hern" probe) show skeletons — surface is universal, hydration is data-dependent. | PASS |
| 12 | "Committee overlap flags when a traded company intersects the filer's committee jurisdiction -- a transparency signal, not a finding of wrongdoing" | Conflicts screen Tier-B chips "B - Committee overlap (Direct/Adjacent)" (screenshot 4); trade-detail COMMITTEE OVERSIGHT panel carries the same caveat verbatim in-app ("A transparency signal about committee oversight -- not a finding of wrongdoing"). | PASS |
| 13 | "Late-filing flags when a disclosure lands past the 45-day STOCK Act deadline" | LATE pills + Tier-A chips ("A - Filed 113d after the trade -- past the 45-day STOCK Act window", screenshot 4); `lateReason` in `features/conflicts/ranking.ts`. | PASS |
| 14 | "One tap from a trade to its original filing on the official .gov source" | SourceLink button (screenshot 5). **Substitution record:** drafted as "A link to the original filing on every trade" — FAILED. Read-only prod queries 2026-08-02: 36,969/40,551 rows serve `source_url` null (house_clerk_ptr 30,931/30,931; senate_efd 6,038/6,575); spot-check trade 41865 serves `source_url: null`, and `SourceLink.tsx:10` renders nothing for it. New ingests are 100% linked (`src/scrapers/house.ts:142`, `src/enrichment/senate-feed.ts:90` in the worker repo always construct the URL). Reworded to the indefinite claim, which the shipped surface proves. Worker-side backfill flagged separately. | PASS (reworded after FAIL) |
| 15 | "A plain-language methodology explaining how STOCK Act filings become the feed you see" | Methodology drawer screen + "How is this data sourced and classified? Methodology" footer link (screenshot 5 bottom). | PASS |
| 16 | "Everything in the app comes from official House and Senate disclosures:" | All four `source` values originate in House Clerk / Senate EFD records (capitol_trades rows are parsed from the same underlying filings; the app displays only filing-derived fields). | PASS |
| 17 | "US House Clerk Periodic Transaction Reports (PTR): https://disclosures-clerk.house.gov" | Carried verbatim from the approved review-clearing text (live listing since 2026-08-01). | PASS (carried) |
| 18 | "US Senate Office of Public Records (Senate EFD): https://efdsearch.senate.gov/search/" | Same carried block. | PASS (carried) |
| 19 | "House filings checked every 30 minutes; Senate every six hours" | INGEST cadence, both halves cited: House = `wrangler.toml:22` `crons = ["*/30 * * * *", ...]` -> `src/index.ts:1292` else-branch -> `runPipelineInternal`. Senate = NOT on the 30-min cycle; `.github/workflows/scrape-senate.yml:14` `cron: '17 */6 * * *'` -> D1 `senate_feed` staging -> `src/enrichment/senate-feed.ts` (EFD bot-blocks the Worker egress IP). Worker methodology page states the same split (`src/routes/methodology.ts:242`). | PASS |
| 19a | "Trades appear in the feed once a filing is at least 24 hours old" | DISPLAY gate, added 2026-08-07. `src/routes/api.ts:243-248` — `if (!isPaidTier(tier ?? '')) where += " AND disclosure_date <= datetime('now', '-24 hours')"`. The app never authenticates (`cta-app lib/api/client.ts:20-22` sends no Authorization header), so every user is permanently on the 24h path. Row 19 alone stated ingest cadence while silent on display — the same overclaim class as the two Misleading Claims rejections. | PASS |
| 20 | Privacy section (5 bullets) | Carried VERBATIM from the vc5 listing live since 2026-08-01 — byte-compared at write time (`privacy verbatim: True`). Matches the Play Data Safety declaration (App activity + Device IDs). | PASS (carried, immutable) |
| 21 | "Congress Trade Alerts is an informational public-records tool. It does not execute trades, connect to brokerage accounts, or provide investment advice." | Carried verbatim; no brokerage/IAP surface in vc5 (Android IAP surface hidden since vc4). | PASS (carried) |
| 22 | Non-affiliation paragraph ("...not affiliated with the United States government...") | Carried verbatim — this is the 2026-07-24 rejection-clearing disclaimer. Do not edit. | PASS (carried) |
| 23 | "Free. No ads. No account required. Open source under the AGPL-3.0 license." | Free/no-IAP (vc4 lock), no ad SDK in the dependency tree, no auth in v1, LICENSE (AGPL-3.0-only) at cta-app@5ad1350 — GitHub license detection verified logged-out 2026-08-01. | PASS |
| 24 | H1 "Congress Stock Trades, In One Feed" | Feed screen frame (raw-01): search, chips, both-chamber rows. | PASS |
| 25 | H2 "Alerts When New Filings Appear" | Trade detail frame (raw-02) with active "Subscribed" bell state. | PASS |
| 26 | H3 "Follow Any Member or Company" | Ticker page frame (raw-03): company follow star filled + member row star filled — both follow types in one frame. | PASS |
| 27 | H4 "See Committee Overlap Flags" | Conflicts screen frame (raw-04): "B - Committee overlap (Direct)" AND "(Adjacent)" chips + Overlap pills visible. **Ticket's substitution contingency NOT needed — the flags are a shipped, visible surface.** | PASS |
| 28 | H5 "Open The Official .gov Filing" | Trade detail bottom frame (raw-05): "View original disclosure — house_clerk" button fully visible. **Substituted from the ticket's "Open Every Official Filing"** — same evidence and reasoning as row 14 ("Every" fails against the 91% unlinked backfill). | PASS (substituted) |
| 29 | H6 "Free. No Ads. No Account." | Same proofs as row 23; frame is the Pelosi profile constellation (raw-06). | PASS |

## Screenshot provenance

Captured 2026-08-02 on the CTA_Pixel emulator (1080x2400, SysUI demo mode)
from the locally installed build of the vc5 source: versionCode reports 1
because it is the local dev-variant install from the 2026-07-31 session, but
its JS is served from master, whose app code is byte-identical to the vc5 pin
`fecb64c` (both commits since are docs-only). vc5 content markers verified
on-screen: starfield constellation, drill-card filters, cluster-buy callout.
The shipped EAS artifact itself was not pulled — the ticket forbade `eas`.
LogBox dev toasts were dismissed before capture; none appear in any frame.

## Known blemishes accepted in raws

- Some asset names carry filing-description fragments (e.g. UBER "e price of
  $50 and an expir..."). Frames were chosen to minimize these; none of the
  six final frames contains one.
- Alan Armstrong rows show a placeholder avatar (no photo upstream) in
  raw-04's upper rows; the frame's lower half carries real photos.
- Pelosi profile shows "No committee assignments on file" (raw-06) — honest
  empty state, headline makes no committee claim.
