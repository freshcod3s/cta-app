// Leaderboard / benchmark feature types.
//
// Accountability framing -- this is a civic-transparency surface, NOT a
// "who to copy" list. Rankings exist to make disclosure behavior (volume
// of trading, lateness of filings) visible, and to benchmark Congress
// aggregate returns against the broad market so readers can judge the
// "do members beat the market" question for themselves.
//
// Source of truth: congress-trade-alerts Worker.
//   - Ranked members  -> GET /api/politicians (handlePoliticians)
//   - Benchmark summary -> GET /api/stats  (handleStats, congress_alpha)
// Field names mirror the Worker response verbatim -- do NOT camelCase-
// normalize without an explicit reason (Product Invariant #8: client
// types stay in sync with the Worker contract).

import type { Chamber, Party } from "@/features/trades/api/types";

// One row from GET /api/politicians. The Worker aggregates per politician
// from the trades table, so every member with >= 1 disclosed trade appears.
// Numeric metrics can be null when no enriched rows back them.
export type LeaderboardMember = {
  name: string;
  party: Party;
  chamber: Chamber;
  state: string;
  trade_count: number;
  buy_count: number;
  last_trade: string | null;
  avg_return_pct: number | null;
  avg_spx_pct: number | null;
  avg_lag_days: number | null;
  total_volume: number | null;
  bioguide_id: string | null;
  photo_url: string | null;
  is_current: boolean;
};

// GET /api/politicians envelope.
export type LeaderboardEnvelope = {
  ok: boolean;
  data: LeaderboardMember[];
};

// Worker sort keys we consume. The endpoint supports more (top_return,
// top_spx, volume, recent, name); this slice only surfaces the two that
// map to accountability questions:
//   trade_count -> "most active disclosers"
//   late_filer  -> "worst average disclosure lag" (STOCK Act timeliness)
export type LeaderboardSort = "trade_count" | "late_filer";

// Benchmark summary derived from GET /api/stats -> data.congress_alpha.
// avg_stock = average price-change % across enriched Purchase/Sale rows;
// avg_spx = the matched S&P 500 move over the same windows. The delta is
// the headline "did Congress aggregate beat the market" number.
export type CongressAlpha = {
  avg_stock?: number;
  avg_spx?: number;
  enriched_count?: number;
};

export type BenchmarkSummary = {
  congressAvgPct: number | null;
  sp500AvgPct: number | null;
  deltaPct: number | null;
  enrichedCount: number | null;
};

// STOCK Act deadline -- a disclosure_lag_days average above this flags a
// member as a chronic late filer. Mirrors isLateFiling() in the trades
// feature (45-day threshold) but applied to a per-member AVERAGE lag.
export const LATE_FILER_AVG_THRESHOLD = 45;

export const isOverdueAverage = (avgLagDays: number | null): boolean =>
  avgLagDays != null && avgLagDays > LATE_FILER_AVG_THRESHOLD;
