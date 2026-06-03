// Member profile shape from GET /api/politicians/{name}/profile.
// Source of truth: congress-trade-alerts/src/routes/api.ts
// handlePoliticianProfile (the worker is canonical per CLAUDE.md
// Product Invariant #8). Field names match the response verbatim.
//
// We model ONLY the fields this slice renders (header + summary +
// committees). The worker also returns committee_tree, committee_context,
// scorecard, news, social, disclosureLag, and the full trades array; those
// are intentionally typed loosely / omitted here to keep the v1 slice
// tight. When a future ticket renders them, promote them to explicit
// shapes at that point.
//
// Framing note: the worker's `scorecard` exposes conflict-of-interest
// counts. That is civic accountability data (committee-jurisdiction
// overlap), NOT a trading signal -- consistent with the transparency
// mandate. This slice does not surface it yet; left out of the v1 type.

import type { Chamber, Party } from "@/features/trades/api/types";

// Aggregate trade stats block (worker computes these in SQL).
export type MemberStats = {
  total_trades: number;
  last_trade: string | null;
  first_trade: string | null;
  buys: number;
  sells: number;
  volume_high: number | null;
  avg_return_pct: number | null;
  avg_spx_pct: number | null;
};

// Disclosure-lag summary. NOTE the worker's over30Count uses a >30-day
// threshold, whereas the app's isLateFiling() helper uses >45 (the STOCK
// Act violation line per features/trades/api/types.ts). This slice derives
// its "late" count from loaded trades via isLateFiling for app-wide
// consistency; over30Count is kept on the type for completeness only.
export type MemberDisclosureLag = {
  median: number;
  max: number;
  over30Count: number;
  histogram: number[];
};

export type MemberProfile = {
  name: string;
  party: Party | null;
  chamber: Chamber | null;
  state: string | null;
  district: string | null;
  committees: string[];
  bioguide_id: string | null;
  photo_url: string | null;
  years_served: number | null;
  status: string;
  status_date: string | null;
  stats: MemberStats | null;
  disclosureLag: MemberDisclosureLag | null;
};

export type MemberProfileEnvelope = {
  ok: boolean;
  data: MemberProfile;
};
