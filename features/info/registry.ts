// InfoSheet content registry -- the RN port of the web dashboard's
// CARD_INFO + HOMEPAGE_METRIC_INFO registries (congress-trade-alerts/
// src/dashboard.html). One entry per data surface; the copy is ported
// from the web's explainer text (method / caveats / sources) so the two
// products say the same thing about the same number.
//
// Product Invariant #9 (interaction density): every data surface taps to
// open one of these, with tappable indexed variables that deep-link
// deeper. This file is the content half; features/info/components/
// InfoSheet.tsx is the presentation half and features/info/store.ts is
// the open/close state.
//
// Framing (LOCKED, civic transparency): "conflicts" / "overlap" mean a
// committee-jurisdiction overlap -- an oversight-transparency flag, NOT a
// claim of wrongdoing and NOT a trading signal.

// A tappable indexed variable inside a sheet. `route` deep-links to a
// native screen (expo-router); `url` opens the web via expo-web-browser
// (Product Invariant #5). A row with neither is static context.
export type InfoRow = {
  label: string;
  value?: string;
  route?: string;
  url?: string;
};

// A source citation. `url` opens externally via expo-web-browser.
export type InfoSource = {
  label: string;
  url?: string;
};

export type InfoEntry = {
  eyebrow?: string;
  title: string;
  // Primary explainer paragraph -- what the number means.
  body: string;
  // "How it's computed."
  method?: string;
  // Honest caveats / limitations.
  caveats?: string[];
  // Indexed variables; tappable when they carry a route/url.
  rows?: InfoRow[];
  sources?: InfoSource[];
  // "flag" accents the title (used where a value is an oversight flag).
  tone?: "neutral" | "flag";
};

const METHODOLOGY = "https://congresstradealerts.com/methodology";

export const INFO_REGISTRY: Record<string, InfoEntry> = {
  // ---- Home feed modules -----------------------------------------------
  "home-volume": {
    eyebrow: "Corpus total",
    title: "All Tracked Trades",
    body:
      "The total disclosed dollar value of every congressional trade we track. Filings disclose ranges, not exact amounts, so this is shown as a band: the low end sums the bottom of each range, the high end sums the top.",
    method:
      "Sum of each trade's disclosed amount range. Bought / Sold / Exchanged split the high-end total by transaction type; 'Other' is the residual (placeholder or unclassified filings), surfaced rather than hidden.",
    caveats: [
      "Ranges, not exact dollars -- one disclosed 'trade' may be several fills.",
      "Trades over $50M disclose as an open-ended bracket, so the true total is higher than shown.",
    ],
    sources: [{ label: "Full stats breakdown", url: "https://congresstradealerts.com/stats" }],
  },
  "home-high-conflict": {
    eyebrow: "Same ticker, same window",
    title: "High-Conflict Activity",
    body:
      "Clusters of members who bought the same stock within a short window. A cluster is flagged when at least one of those members sits on a committee whose jurisdiction covers that stock's sector.",
    method:
      "Clusters come from a rolling 30-day detector (minimum 3 distinct members). The conflict flag fires when a member's committee-jurisdiction sector matches the stock's sector; clusters with a flag sort first.",
    caveats: [
      "Overlap is NOT evidence of wrongdoing or insider trading -- members can legally trade.",
      "Conflict checks are limited to the committees we've seeded.",
    ],
    sources: [
      { label: "Methodology", url: `${METHODOLOGY}#committee-jurisdiction-overlap` },
    ],
    tone: "flag",
  },
  "home-top-trades": {
    eyebrow: "Biggest recent",
    title: "Top Trades",
    body:
      "The largest single disclosures by midpoint dollar value in the most recent active window. Tap a row to see that ticker's full congressional activity.",
    method:
      "Trades sorted by the midpoint of their disclosed range (needs both range ends and a ticker). The window cascades 7 -> 14 -> 30 days until one has trades, and the header labels the window that hit.",
    caveats: [
      "Ranges aren't exact, so the midpoint is a rough sort key.",
    ],
    sources: [{ label: "Full trade feed", url: "https://congresstradealerts.com" }],
  },
  "home-featured": {
    eyebrow: "Last 90 days",
    title: "Most Active Members",
    body:
      "The members with the most disclosed trading volume over the last 90 days. Tap any member to open their full history, conflict scoring, and committee assignments.",
    method:
      "Ranked by total disclosed volume (the midpoint of each range) over the last 90 days; current members only.",
    caveats: [
      "Volume is a range-based midpoint, not an exact figure.",
      "Sorted by dollars traded, not by policy importance.",
    ],
    sources: [{ label: "Methodology", url: METHODOLOGY }],
  },
  "home-overdue": {
    eyebrow: "119th Congress",
    title: "Overdue members",
    body:
      "Members of the current (119th) Congress who have a disclosed trade filed past the STOCK Act's 45-day deadline. Late filing is common -- the statutory penalty is only $200 -- so a persistent late filer is itself a useful transparency signal.",
    method:
      "Distinct sitting members with at least one filing whose disclosure date is more than 45 days after the trade date.",
    caveats: [
      "Reflects disclosed filings, not live holdings.",
      "A single late filing can have a benign cause; the count is context, not an accusation.",
    ],
    sources: [
      { label: "STOCK Act reporting rules", url: "https://www.congress.gov/bill/112th-congress/senate-bill/2038" },
    ],
  },
  "home-disclosures-7d": {
    eyebrow: "Last 7 days",
    title: "Disclosures last 7 days",
    body:
      "The number of trades DISCLOSED in the last 7 calendar days -- disclosed, not traded. The underlying transaction may be up to 45 days older, since the STOCK Act allows that long to report.",
    method: "Filings whose disclosure date falls within the last 7 days.",
    caveats: [
      "Counts disclosure dates, not trade dates.",
      "A quiet week is normal -- Congress isn't always in session.",
    ],
    sources: [{ label: "How we count", url: METHODOLOGY }],
  },
  "home-overlap-7d": {
    eyebrow: "Last 7 days",
    title: "Committee-jurisdiction overlap",
    body:
      "Last-7-day trades by members who sit on a committee whose jurisdiction covers the traded security's sector. It surfaces where a member's policy authority overlaps their personal position -- an oversight signal, not evidence of wrongdoing.",
    method:
      "For each recent trade with a ticker: resolve the ticker's sector, pull the member's committee assignments, and flag when a committee's jurisdiction sector exactly matches the trade's sector.",
    caveats: [
      "Overlap is legal and routine; it is not a claim of insider trading.",
      "Limited to committees we have seeded; coverage of departed members is partial.",
    ],
    sources: [
      { label: "Conflict-scoring methodology", url: `${METHODOLOGY}#how-conflict-scoring-works` },
      { label: "Committee jurisdiction overlap", url: `${METHODOLOGY}#committee-jurisdiction-overlap` },
    ],
    tone: "flag",
  },

  // ---- Member profile MemberStatsRow tiles -----------------------------
  "profile-trades": {
    eyebrow: "This member",
    title: "Disclosed trades",
    body:
      "Every STOCK Act transaction this member has disclosed -- purchases, sales, and exchanges -- across the full tracked history.",
    method:
      "A count of the member's disclosed filings, deduplicated on politician, ticker, trade date, transaction type, and amount range.",
    caveats: [
      "Reflects disclosed filings, not current holdings.",
      "One disclosed 'trade' can represent several individual fills.",
    ],
    sources: [{ label: "How we count", url: METHODOLOGY }],
  },
  "profile-volume": {
    eyebrow: "This member",
    title: "Estimated volume",
    body:
      "The estimated total dollar value of this member's disclosed trades, measured at the HIGH end of each disclosed amount range -- so treat it as an upper bound, not an exact figure.",
    method: "The sum of the high end of every disclosed amount range.",
    caveats: [
      "Filings disclose ranges (e.g. $1,001-$15,000), never exact dollars.",
      "Trades over $50M use an open-ended top bracket, so very large positions are floored at $50M.",
    ],
    sources: [{ label: "Amount ranges explained", url: METHODOLOGY }],
  },
  "profile-conflicts": {
    eyebrow: "Committee overlap",
    title: "Conflicts",
    body:
      "Disclosed trades that fall in an industry one of this member's committees oversees -- a committee-jurisdiction overlap. It is an oversight-transparency flag, NOT a claim of wrongdoing and NOT a trading signal.",
    method:
      "Each trade's sector is matched against the jurisdiction sectors of the member's committee assignments; a match counts as a direct or adjacent overlap.",
    caveats: [
      "Members may legally trade; overlap is not evidence of insider trading.",
      "Limited to committees we have seeded.",
    ],
    sources: [
      { label: "Conflict-scoring methodology", url: `${METHODOLOGY}#how-conflict-scoring-works` },
    ],
    tone: "flag",
  },
  "profile-median-delay": {
    eyebrow: "This member",
    title: "Median filing delay",
    body:
      "The median gap, in days, between when this member trades and when they disclose it. The STOCK Act sets a 45-day deadline; a low number means prompt, transparent filing.",
    method:
      "The median of (disclosure date minus trade date) across the member's dated filings.",
    caveats: [
      "Computed over the most-recent loaded slice of trades, not always the full history.",
      "The late-filing penalty is only $200, so filing delay is a meaningful signal.",
    ],
    sources: [{ label: "STOCK Act reporting rules", url: "https://www.congress.gov/bill/112th-congress/senate-bill/2038" }],
  },

  // ---- Member profile cards (P3) ---------------------------------------
  "profile-scorecard": {
    eyebrow: "Committee overlap",
    title: "Conflict Scorecard",
    body:
      "The share of this member's disclosed trading dollars -- measured at the HIGH end of each amount range -- that falls in industries their committees oversee. It is a transparency flag, NOT a claim of wrongdoing and NOT a trading signal.",
    method:
      "Trades whose sector matches a committee's jurisdiction are summed (at range-high) and divided by the member's total disclosed dollars. Direct = the member's own committee; Adjacent = a related committee.",
    caveats: [
      "Amounts are disclosed ranges, so the percentage is an upper-bound estimate.",
      "Members may legally trade; overlap is not evidence of insider trading.",
    ],
    sources: [
      { label: "Conflict-scoring methodology", url: `${METHODOLOGY}#how-conflict-scoring-works` },
    ],
    tone: "flag",
  },
  "profile-sectors": {
    eyebrow: "This member",
    title: "Sector Breakdown",
    body:
      "Where this member's disclosed trades concentrate -- the top sectors by number of trades.",
    method:
      "Each trade's sector (worker-resolved, with a ticker-to-sector fallback) is counted; trades with no resolvable sector are excluded from the total.",
    caveats: [
      "Sector is read as delivered per trade; the ticker-to-sector fallback provenance isn't visible here.",
      "Computed over the most-recent loaded trades, not always the full history.",
    ],
    sources: [{ label: "How we count", url: METHODOLOGY }],
  },
  "profile-discspeed": {
    eyebrow: "This member",
    title: "Disclosure Speed",
    body:
      "How promptly this member files -- the gap in days between when they trade and when they disclose it. The STOCK Act sets a 45-day deadline.",
    method:
      "Per dated filing, disclosure date minus trade date; we report the median, fastest, and slowest across all such filings (needs at least 5).",
    caveats: [
      "Only filings with both a trade date and a disclosure date are counted.",
      "The late-filing penalty is only $200, so filing delay is a meaningful signal.",
    ],
    sources: [
      { label: "STOCK Act reporting rules", url: "https://www.congress.gov/bill/112th-congress/senate-bill/2038" },
    ],
  },
  "profile-trades-12mo": {
    eyebrow: "Last 12 months",
    title: "Trades · Last 12 Months",
    body:
      "Every disclosed transaction in the trailing 365 days, split into buys vs sells, with an estimated dollar volume.",
    method:
      "Trades with a trade date in the last 365 days, classified by transaction type; estimated volume sums the midpoint of each disclosed amount range.",
    caveats: [
      "Amounts are disclosed ranges, so estimated volume is approximate.",
      "Transactions that are neither a clear buy nor sell (e.g. exchanges) are counted in the total but not the buy/sell split.",
    ],
    sources: [{ label: "How we count", url: METHODOLOGY }],
  },
  "profile-top5": {
    eyebrow: "Last 12 months",
    title: "Top 5 Tickers",
    body:
      "The five tickers this member traded most often in the trailing 12 months, by number of transactions. Tap any ticker to see its full congressional activity.",
    method:
      "Trades in the last 365 days grouped by ticker and counted; the top five by count are shown, ties broken by most recent.",
    caveats: [
      "Ranks by trade count, not dollar volume.",
      "Fund holdings without a ticker are excluded.",
    ],
    sources: [{ label: "How we count", url: METHODOLOGY }],
  },
  "profile-committees": {
    eyebrow: "Committee overlap",
    title: "Committee Power Ranking",
    body:
      "This member's committee seats, ranked by how much of their disclosed trading falls in each committee's jurisdiction. It orders by overlap, NOT a numeric influence score -- and overlap is a transparency signal, not a claim of wrongdoing.",
    method:
      "Each conflicted trade (measured at range-high) is tallied against the committee whose jurisdiction it overlaps; committees are ranked by overlapping-trade count, then dollars. Seats with no overlap are kept, ranked last.",
    caveats: [
      "Role (chair / ranking member / member) reflects the current roster.",
      "Coverage is limited to committees we have seeded; some assignments may be missing.",
    ],
    sources: [
      { label: "Conflict-scoring methodology", url: `${METHODOLOGY}#how-conflict-scoring-works` },
    ],
    tone: "flag",
  },
  "profile-constellation": {
    eyebrow: "This member",
    title: "Trade Constellation",
    body:
      "A map of this member's disclosed holdings. Each bubble is a ticker, sized by disclosed dollar volume. The committees they trade into form the rings; a bubble sitting on a ring (with a colored edge to the center) is a holding that overlaps that committee's jurisdiction.",
    method:
      "Bubbles aggregate trades per ticker (size = sum of the high end of each amount range). Rings are the member's committees, ranked by trading overlap. Red stroke = direct overlap (the member's own committee), amber = adjacent.",
    caveats: [
      "Overlap is a transparency signal, NOT a claim of wrongdoing.",
      "Shows the largest ~30 tickers from the most-recent loaded trades; gain/loss coloring is off while returns are hidden.",
    ],
    sources: [
      { label: "Conflict-scoring methodology", url: `${METHODOLOGY}#how-conflict-scoring-works` },
    ],
    tone: "flag",
  },
};

export function getInfoEntry(slug: string | null): InfoEntry | null {
  if (!slug) return null;
  return INFO_REGISTRY[slug] ?? null;
}
