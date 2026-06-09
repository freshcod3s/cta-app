// Daily Dive types -- GET /api/daily-dive (worker handleDailyDive). A 7-day
// accountability digest aggregated from the trades table. Field names mirror
// the worker response verbatim (Product Invariant #8).
//
// Renders pulse + stocks + politicians + unusual + sectors + bipartisan +
// fresh_faces (2026-06-05 completeness slice). The worker also returns
// `companies` (same shape as stocks, ranked by 30-day volume) -- intentionally
// left unrendered as redundant with the stocks section.

export type DailyDivePulse = {
  trades_7d: number;
  trades_prior_7d: number;
  active_politicians: number;
  buys: number;
  sells: number;
  volume: number;
};

// Top stocks by disclosed trade count, last 7 days.
export type DailyDiveStock = {
  ticker: string;
  asset_name: string;
  trade_count: number;
  buys: number;
  sells: number;
  trader_count: number;
  avg_return: number | null;
  total_volume: number | null;
};

// Most active members by disclosure count, last 7 days.
export type DailyDiveMember = {
  politician: string;
  party: string | null;
  chamber: string | null;
  state: string | null;
  trade_count: number;
  buys: number;
  sells: number;
  total_volume: number | null;
  last_disclosure: string | null;
  photo_url: string | null;
};

// Large (>= $250K) or late (>= 45-day lag) filings, last 14 days.
export type DailyDiveUnusual = {
  politician: string;
  ticker: string | null;
  asset_name: string;
  tx_type: string;
  amount_range: string;
  amount_high: number;
  disclosure_lag_days: number;
  disclosure_date: string;
  sector: string | null;
  party: string | null;
};

// Disclosed trades grouped by sector, last 7 days (by trade count).
export type DailyDiveSector = {
  sector: string;
  trade_count: number;
  buys: number;
  sells: number;
  total_volume: number | null;
};

// Securities purchased by members of BOTH parties, last 30 days.
export type DailyDiveBipartisan = {
  ticker: string;
  asset_name: string;
  dem_traders: number;
  rep_traders: number;
  trade_count: number;
  buys: number;
  avg_return: number | null;
  total_volume: number | null;
};

// Members whose first-ever disclosure landed in the last 30 days.
export type DailyDiveFreshFace = {
  politician: string;
  party: string | null;
  chamber: string | null;
  state: string | null;
  first_trade: string;
  trades: number;
};

export type DailyDiveData = {
  pulse: DailyDivePulse;
  stocks: DailyDiveStock[];
  politicians: DailyDiveMember[];
  unusual: DailyDiveUnusual[];
  sectors: DailyDiveSector[];
  bipartisan: DailyDiveBipartisan[];
  fresh_faces: DailyDiveFreshFace[];
};

export type DailyDiveEnvelope = {
  ok: boolean;
  data: DailyDiveData;
};
