// Explore derivations -- pure functions over a member's filings.
//
// Everything here is deterministic and side-effect free so the screen can
// memoize it and the test suite can pin it without a renderer.
//
// TWO STANDING RULES ENCODED HERE:
//
// 1. NO DOLLAR MATH. Disclosed amounts are congressional RANGES, not values.
//    Every aggregate below is a count, a date, or a day-count. amount_range
//    is carried through as the filed string and never parsed into a number.
//
// 2. CORRUPT DATES ARE EXCLUDED FROM TIME GROUPING. Rows the ingest flagged
//    date_quality='corrupt' carry five-digit lags from mis-parsed filing
//    dates; bucketing them by month would invent activity in years the
//    member did not file. The methodology copy already tells readers these
//    rows are excluded, so the timeline must actually exclude them. They
//    remain visible in the unfiltered record list -- excluded from the
//    ANALYSIS, not hidden from the user.

import type { SavedTradeLite } from "@/features/saved/types";

export type ExplorableTrade = SavedTradeLite;

// Same permissive classification the web and profileDerive use: tx_type is
// contaminated with PTR-Filing placeholders and date-misparse rows, so a
// naive equality check under-counts badly.
export const isBuyTx = (tx: string): boolean => /urchase|buy/i.test(tx);
export const isSellTx = (tx: string): boolean => /sale|sell/i.test(tx);

export const isCorrupt = (t: ExplorableTrade): boolean =>
  t.date_quality === "corrupt";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "2026-08" from "2026-08-14" or "2026-08-14 00:00:00". String slicing
// rather than Date parsing: the API returns UTC calendar dates, and running
// them through a local-timezone Date can shift a filing into the previous
// month for anyone west of UTC.
export function monthKey(iso: string | null | undefined): string | null {
  if (!iso || iso.length < 7) return null;
  const key = iso.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(key) ? key : null;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const idx = Number(m) - 1;
  return `${MONTH_LABELS[idx] ?? m} ${y}`;
}

export const yearOf = (iso: string | null | undefined): string | null =>
  iso && /^\d{4}/.test(iso) ? iso.slice(0, 4) : null;

// -- Filters -----------------------------------------------------------------

export type ExploreFilters = {
  year?: string | null;
  sector?: string | null;
  txType?: "buy" | "sell" | null;
  month?: string | null;
};

export function applyFilters(
  trades: ExplorableTrade[],
  f: ExploreFilters,
): ExplorableTrade[] {
  return trades.filter((t) => {
    if (f.year && yearOf(t.trade_date) !== f.year) return false;
    if (f.month && monthKey(t.trade_date) !== f.month) return false;
    if (f.sector && (t.sector ?? "") !== f.sector) return false;
    if (f.txType === "buy" && !isBuyTx(t.tx_type)) return false;
    if (f.txType === "sell" && !isSellTx(t.tx_type)) return false;
    return true;
  });
}

// -- Timeline ----------------------------------------------------------------

export type MonthGroup = {
  key: string;
  label: string;
  count: number;
  trades: ExplorableTrade[];
};

// Newest month first; filings within a month newest first. Deterministic:
// ties break on id so the order never depends on input ordering.
export function groupByMonth(trades: ExplorableTrade[]): MonthGroup[] {
  const map = new Map<string, ExplorableTrade[]>();
  for (const t of trades) {
    if (isCorrupt(t)) continue;
    const key = monthKey(t.trade_date);
    if (!key) continue;
    const bucket = map.get(key);
    if (bucket) bucket.push(t);
    else map.set(key, [t]);
  }

  return Array.from(map.entries())
    .map(([key, ts]) => ({
      key,
      label: monthLabel(key),
      count: ts.length,
      trades: ts.sort(
        (a, b) => (b.trade_date ?? "").localeCompare(a.trade_date ?? "") || b.id - a.id,
      ),
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

export function availableYears(trades: ExplorableTrade[]): string[] {
  const set = new Set<string>();
  for (const t of trades) {
    if (isCorrupt(t)) continue;
    const y = yearOf(t.trade_date);
    if (y) set.add(y);
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

// -- Breakdowns --------------------------------------------------------------

export type SectorCount = { sector: string; count: number };

// Descending by count, then alphabetical so equal counts have a stable
// order. Rows with no sector are grouped under "Unclassified" rather than
// dropped -- the absence is itself informative.
export function sectorCounts(trades: ExplorableTrade[]): SectorCount[] {
  const map = new Map<string, number>();
  for (const t of trades) {
    const s = (t.sector ?? "").trim() || "Unclassified";
    map.set(s, (map.get(s) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count || a.sector.localeCompare(b.sector));
}

export type TxTypeCounts = { buys: number; sells: number; other: number };

export function txTypeCounts(trades: ExplorableTrade[]): TxTypeCounts {
  let buys = 0, sells = 0, other = 0;
  for (const t of trades) {
    if (isBuyTx(t.tx_type)) buys += 1;
    else if (isSellTx(t.tx_type)) sells += 1;
    else other += 1;
  }
  return { buys, sells, other };
}

// -- Filing promptness -------------------------------------------------------

export type LagStats = { median: number | null; late: number; counted: number };

// Median rather than mean: a handful of five-digit lags would drag an
// average into nonsense. Corrupt rows and null lags are excluded from the
// calculation and from `counted`, so the denominator is honest.
export function lagStats(trades: ExplorableTrade[]): LagStats {
  const lags: number[] = [];
  let late = 0;
  for (const t of trades) {
    if (isCorrupt(t)) continue;
    const l = t.disclosure_lag_days;
    if (l == null || l < 0) continue;
    lags.push(l);
    if (l > 45) late += 1;
  }
  if (lags.length === 0) return { median: null, late: 0, counted: 0 };
  lags.sort((a, b) => a - b);
  const mid = Math.floor(lags.length / 2);
  const median =
    lags.length % 2 === 0 ? (lags[mid - 1] + lags[mid]) / 2 : lags[mid];
  return { median, late, counted: lags.length };
}

// -- Chart series ------------------------------------------------------------

export type MonthBar = { key: string; label: string; count: number };

// Oldest -> newest, with EMPTY MONTHS PRESENT. A bar chart that silently
// omits quiet months compresses time and misrepresents a gap in filing as
// continuous activity.
export function monthlySeries(
  trades: ExplorableTrade[],
  maxMonths = 24,
): MonthBar[] {
  const groups = groupByMonth(trades);
  if (groups.length === 0) return [];

  const counts = new Map(groups.map((g) => [g.key, g.count]));
  const newest = groups[0].key;
  const oldest = groups[groups.length - 1].key;

  const out: MonthBar[] = [];
  let [y, m] = oldest.split("-").map(Number);
  const [ny, nm] = newest.split("-").map(Number);

  while (y < ny || (y === ny && m <= nm)) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push({ key, label: monthLabel(key), count: counts.get(key) ?? 0 });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }

  // Keep the most recent window; a five-year archive will not fit on a phone.
  return out.slice(-maxMonths);
}
