// Member profile shape from GET /api/politicians/{name}/profile.
// Source of truth: congress-trade-alerts/src/routes/api.ts
// handlePoliticianProfile (the worker is canonical per CLAUDE.md
// Product Invariant #8). Field names match the response verbatim.
//
// The web-parity rebuild (P2) promoted the fields the profile cards +
// constellation consume: scorecard, disclosureLag, the 500-cap trades[]
// array, committee_tree, and committee_context. `news` and `social`
// remain omitted until a surface renders them.
//
// Framing note: the worker's `scorecard` exposes conflict-of-interest
// counts. That is civic accountability data (committee-jurisdiction
// overlap), NOT a trading signal -- consistent with the transparency
// mandate. Surfaced since the v1-credibility pass (MemberStatsRow) with
// exactly that framing.

import type { Chamber, Party, TradeRecord } from "@/features/trades/api/types";
import type { ConflictScorecard } from "@/features/conflict/api/types";

// One committee assignment from the worker's buildCommitteeTree (feeds the
// Committee Power Ranking card + the constellation rings). `role` is the
// seat role (chair / ranking-member / member); `url`/`thomas_id` are the
// official committee refs.
export type CommitteeSeat = {
  committee: string;
  role: string | null;
  url: string | null;
  thomas_id: string | null;
};

export type CommitteeTreeNode = CommitteeSeat & {
  subcommittees: CommitteeSeat[];
};

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
  // Aggregate committee-overlap scorecard (worker always includes it on
  // the profile; optional here so the name-only fallbackProfile stays
  // valid). Counts + dollars, civic-accountability framing.
  scorecard?: ConflictScorecard | null;
  // The member's most-recent trades (worker caps at 500, ORDER BY
  // trade_date DESC), each with inline `conflict` + `sector`. This is the
  // ONE-SHOT profile array that powers the profile cards + constellation
  // (distinct from the paginated feed via useTradesList). Web parity:
  // window._allTrades. Optional so the name-only fallbackProfile stays
  // valid; scope-relabel figures against stats.total_trades when
  // trades.length < stats.total_trades (the 500 cap).
  trades?: TradeRecord[] | null;
  // Committee assignments as a tree (parent committee -> subcommittees),
  // worker buildCommitteeTree. Powers the Committee Power Ranking card and
  // the constellation rings.
  committee_tree?: CommitteeTreeNode[] | null;
  // Per-committee "why it matters" context copy, keyed by committee name;
  // shown in the no-direct-conflicts branch. Loosely typed until a card
  // renders it explicitly.
  committee_context?: Record<string, unknown> | null;
};

export type MemberProfileEnvelope = {
  ok: boolean;
  data: MemberProfile;
};
