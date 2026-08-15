// Cluster = several members buying the same ticker inside a short window.
// The conflict-first view (GET /api/clusters?view=conflict-first) ranks
// clusters where >=1 member sits on a committee whose jurisdiction covers
// the stock's sector. Mirrors the Worker payload (handleClustersConflictFirst)
// -- Worker is the source of truth (Product Invariant #8).
export type ClusterConflictCommittee = {
  committee: string;
  member: string;
  sector: string;
};

export type ClusterRecord = {
  id: number | string;
  ticker: string | null;
  asset_name: string | null;
  first_trade_date: string | null;
  last_trade_date: string | null;
  politician_count: number;
  total_midpoint_value?: number | null;
  status?: string;
  members: string[];
  ticker_sector?: string | null;
  conflict_committees?: ClusterConflictCommittee[];
  frequent_traders?: string[];
  party_split?: { D?: number; R?: number; I?: number };
  historical?: boolean;
};

export type ClustersEnvelope = { ok: boolean; data: ClusterRecord[] };
