// Conflict types -- sourced from the politician profile
// (GET /api/politicians/{name}/profile). The Worker computes a committee-
// jurisdiction conflict per trade (services/conflict-detector.ts,
// detectConflictStructured) and an aggregate scorecard per member. There is
// no standalone client conflict route (only /api/debug/conflicts), so we
// read both off the profile payload.
//
// Accountability framing: a "conflict" means the member sits on a committee
// whose jurisdiction overlaps the security's GICS sector -- a transparency
// signal about oversight overlap, NOT a claim of wrongdoing.

export type ConflictSeverity = "direct" | "adjacent";

// Per-trade conflict (profile.trades[].conflict). Worker ConflictResult.
export type TradeConflict = {
  committee: string;
  severity: ConflictSeverity;
  subcommittee?: string | null;
  role?: string;
  weight?: number;
};

// Aggregate member conflict scorecard (profile.scorecard).
export type ConflictScorecard = {
  directConflictCount: number;
  directConflictDollars: number;
  adjacentConflictCount: number;
  adjacentConflictDollars: number;
  conflictedPortfolioPct: number;
};

// One entry of profile.trades[] -- we only read id + conflict here.
export type ProfileTradeConflict = {
  id: number;
  conflict?: TradeConflict | null;
};

// Minimal profile envelope view for this slice.
export type ConflictProfileEnvelope = {
  ok: boolean;
  data?: {
    trades?: ProfileTradeConflict[];
    scorecard?: ConflictScorecard;
  };
};

// What the hook resolves to for a given trade: the specific trade's overlap
// (if found in the capped trades[]) plus the member aggregate as fallback.
export type TradeConflictResult = {
  conflict: TradeConflict | null;
  scorecard: ConflictScorecard | null;
};
