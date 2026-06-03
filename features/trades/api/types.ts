// Trade record shape from GET /api/trades/{id} (CTA-App-1-4 P1 probe,
// 2026-05-07). Field names match the API response verbatim -- do NOT
// camelCase-normalize without an explicit reason.
//
// Wrapper:  { ok: boolean, data: TradeRecord }
//
// Tx type values observed: "Purchase", "Sale" (and likely
// "Sale (partial)"). Treat any non-"Purchase" string as a sell-side
// transaction for buy/sell pill coloring (TransactionHero).
//
// Late-filing convention: per global CTA project memory, a
// disclosure_lag_days > 45 is a STOCK Act violation. Use that threshold
// for the cta-late pill in TimelineSection.

export type Party = "D" | "R" | "I" | string;
export type Chamber = "House" | "Senate" | string;
export type TxType = "Purchase" | "Sale" | "Sale (partial)" | string;

export type TradeRecord = {
  id: number;
  filing_id: string;
  politician: string;
  party: Party;
  chamber: Chamber;
  state: string;
  district: number | null;
  ticker: string;
  asset_name: string;
  asset_type: string | null;
  tx_type: TxType;
  amount_range: string;
  amount_low: number;
  amount_high: number;
  trade_date: string;
  disclosure_date: string;
  disclosure_lag_days: number;
  source: string;
  source_url: string;
  sector: string | null;
  current_price: number | null;
  trade_price: number | null;
  price_change_pct: number | null;
  sp500_change_pct: number | null;
  created_at: string;
  updated_at: string;
  sources: string;
  enrichment_attempts: number;
  enrichment_failed_at: string | null;
  enrichment_error: string | null;
  date_quality: string | null;
  photo_url: string | null;
};

export type TradeDetailEnvelope = {
  ok: boolean;
  data: TradeRecord;
};

// /api/trades?page=N envelope (CTA-App-1-5 P1: page-based pagination,
// 1-indexed, per_page=25 default; per_page can be overridden via query
// param). meta drives the next-page cursor logic.
export type TradesListMeta = {
  total: number;
  page: number;
  per_page: number;
};

export type TradesListPage = {
  ok: boolean;
  data: TradeRecord[];
  meta: TradesListMeta;
};

// Helpers used across feature components.
export const isBuy = (tx: TxType) => tx === "Purchase";
export const isLateFiling = (lagDays: number) => lagDays > 45;

// Feed filter state. Each field maps 1:1 to a GET /api/trades query
// param (worker src/routes/api.ts handleTrades). Absent = not applied.
//   politician -> partial LIKE match (search box)
//   ticker     -> exact match (tap-to-drill from a row)
//   party      -> D | R | I        chamber -> House | Senate
//   txType     -> Purchase | Sale (partial LIKE server-side)
//   currentOnly-> current=1 (only sitting members)
export type TradeFilters = {
  politician?: string;
  ticker?: string;
  party?: "D" | "R" | "I";
  chamber?: "House" | "Senate";
  txType?: "Purchase" | "Sale";
  currentOnly?: boolean;
};

// How many filters are live -- drives the "N active" badge + whether an
// empty result is "no data" vs "filtered to nothing".
export function activeFilterCount(f: TradeFilters): number {
  let n = 0;
  if (f.politician) n++;
  if (f.ticker) n++;
  if (f.party) n++;
  if (f.chamber) n++;
  if (f.txType) n++;
  if (f.currentOnly) n++;
  return n;
}
