// Compare derivations -- one column per member, built from whatever source
// that member's data came from (live profile or saved snapshot).
//
// HONESTY CONSTRAINTS, both load-bearing:
//
// 1. NO DOLLAR COMPARISON. Disclosed amounts are ranges. Comparing two
//    members on a summed midpoint would manufacture a precision neither
//    filing has, and would read as a ranking of who trades "more". Every
//    dimension here is a count, a year, or a day-count.
//
// 2. SAMPLE vs TOTAL. total_trades is the member's true total from the
//    worker's own SQL. buys/sells/recent/topSector are derived from the
//    trades array, which is capped (500 live, 120 in a snapshot). When the
//    cap bites, `sampled` is true and the UI must say the breakdown covers
//    the most recent N filings rather than the whole archive.

import type { ExplorableTrade } from "@/features/explore/derive";
import {
  isBuyTx,
  isCorrupt,
  isSellTx,
  lagStats,
  sectorCounts,
  yearOf,
} from "@/features/explore/derive";

const DAY_MS = 86_400_000;
export const RECENT_WINDOW_DAYS = 90;

export type CompareColumn = {
  name: string;
  party: string | null;
  chamber: string | null;
  state: string | null;
  photoUrl: string | null;

  // Provenance, so the UI can mark a column as read from a saved copy.
  fromSnapshot: boolean;
  snapshotUpdatedAt: string | null;

  totalTrades: number | null;
  loadedCount: number;
  sampled: boolean;

  firstYear: string | null;
  lastYear: string | null;
  recentCount: number;
  buys: number;
  sells: number;
  medianLag: number | null;
  lateCount: number;
  topSector: { sector: string; count: number } | null;
};

export type CompareSource = {
  name: string;
  party: string | null;
  chamber: string | null;
  state: string | null;
  photoUrl: string | null;
  totalTrades: number | null;
  firstTrade: string | null;
  lastTrade: string | null;
  trades: ExplorableTrade[];
  fromSnapshot: boolean;
  snapshotUpdatedAt: string | null;
};

// Filings in the trailing window. Corrupt-date rows are excluded: a
// five-digit lag means the date is untrustworthy, and letting one land
// inside "recent activity" would invent activity that did not happen.
export function recentCount(
  trades: ExplorableTrade[],
  now: number = Date.now(),
  days: number = RECENT_WINDOW_DAYS,
): number {
  const cutoff = now - days * DAY_MS;
  let n = 0;
  for (const t of trades) {
    if (isCorrupt(t)) continue;
    const ts = Date.parse(t.trade_date);
    if (Number.isNaN(ts) || ts < cutoff) continue;
    n += 1;
  }
  return n;
}

export function buildCompareColumn(
  src: CompareSource,
  now: number = Date.now(),
): CompareColumn {
  const trades = src.trades;
  const lag = lagStats(trades);
  const sectors = sectorCounts(trades.filter((t) => !isCorrupt(t)));

  let buys = 0, sells = 0;
  for (const t of trades) {
    if (isBuyTx(t.tx_type)) buys += 1;
    else if (isSellTx(t.tx_type)) sells += 1;
  }

  // Prefer the worker's own first/last dates; fall back to the loaded set.
  const years = trades
    .filter((t) => !isCorrupt(t))
    .map((t) => yearOf(t.trade_date))
    .filter((y): y is string => !!y)
    .sort();

  return {
    name: src.name,
    party: src.party,
    chamber: src.chamber,
    state: src.state,
    photoUrl: src.photoUrl,
    fromSnapshot: src.fromSnapshot,
    snapshotUpdatedAt: src.snapshotUpdatedAt,

    totalTrades: src.totalTrades,
    loadedCount: trades.length,
    sampled: src.totalTrades != null && trades.length < src.totalTrades,

    firstYear: yearOf(src.firstTrade) ?? years[0] ?? null,
    lastYear: yearOf(src.lastTrade) ?? years[years.length - 1] ?? null,
    recentCount: recentCount(trades, now),
    buys,
    sells,
    medianLag: lag.median,
    lateCount: lag.late,
    topSector: sectors[0] ?? null,
  };
}

// -- Row definitions ---------------------------------------------------------

export type CompareRow = {
  key: string;
  label: string;
  // Note shown under the label when the figure comes from the capped sample.
  sampledNote?: boolean;
  value: (c: CompareColumn) => string;
  // Screen-reader text; the visual value alone is often too terse.
  a11y: (c: CompareColumn) => string;
  // Filter to apply when the user drills from this cell into Explore.
  drill?: (c: CompareColumn) => Record<string, string> | null;
};

const yearsCovered = (c: CompareColumn) =>
  c.firstYear && c.lastYear
    ? c.firstYear === c.lastYear
      ? c.firstYear
      : `${c.firstYear}-${c.lastYear}`
    : "—";

export const COMPARE_ROWS: CompareRow[] = [
  {
    key: "total",
    label: "Filings on record",
    value: (c) => (c.totalTrades ?? c.loadedCount).toLocaleString(),
    a11y: (c) => `${(c.totalTrades ?? c.loadedCount).toLocaleString()} filings on record`,
    drill: () => ({}),
  },
  {
    key: "years",
    label: "Years covered",
    value: yearsCovered,
    a11y: (c) => `covers ${yearsCovered(c)}`,
  },
  {
    key: "recent",
    label: `Filings in the last ${RECENT_WINDOW_DAYS} days`,
    sampledNote: true,
    value: (c) => c.recentCount.toLocaleString(),
    a11y: (c) =>
      `${c.recentCount} filings in the last ${RECENT_WINDOW_DAYS} days`,
    drill: () => ({}),
  },
  {
    key: "buys",
    label: "Purchases",
    sampledNote: true,
    value: (c) => c.buys.toLocaleString(),
    a11y: (c) => `${c.buys} purchases`,
    drill: () => ({ txType: "buy" }),
  },
  {
    key: "sells",
    label: "Sales",
    sampledNote: true,
    value: (c) => c.sells.toLocaleString(),
    a11y: (c) => `${c.sells} sales`,
    drill: () => ({ txType: "sell" }),
  },
  {
    key: "lag",
    label: "Median filing lag",
    value: (c) => (c.medianLag == null ? "—" : `${Math.round(c.medianLag)}d`),
    a11y: (c) =>
      c.medianLag == null
        ? "median filing lag not available"
        : `median filing lag ${Math.round(c.medianLag)} days`,
  },
  {
    key: "late",
    label: "Filed after 45 days",
    sampledNote: true,
    value: (c) => c.lateCount.toLocaleString(),
    a11y: (c) => `${c.lateCount} filed more than 45 days after the transaction`,
  },
  {
    key: "sector",
    label: "Most-filed sector",
    sampledNote: true,
    value: (c) => c.topSector?.sector ?? "—",
    a11y: (c) =>
      c.topSector
        ? `most-filed sector ${c.topSector.sector}, ${c.topSector.count} filings`
        : "no sector on file",
    drill: (c) => (c.topSector ? { sector: c.topSector.sector } : null),
  },
];
