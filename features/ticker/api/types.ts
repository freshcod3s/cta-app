// Ticker-info shape from GET /api/ticker-info/{symbol} (CTA Worker
// src/routes/ticker-info.ts). Field names match the API response verbatim,
// per the worker-contract-mirroring product invariant.
//
// Wrapper: { ok: boolean, data: TickerInfo }
//
// Notes for the UI:
//   * company_name / industry can be null when Finnhub + the static
//     fallback + Haiku all miss. The header falls back to the asset_name
//     / sector carried on the first TradeRecord in that case.
//   * market_cap_usd is a raw USD integer (worker multiplies Finnhub's
//     millions value back up) or null.
//   * The endpoint does NOT carry price / % vs S&P. Those live per-trade
//     on TradeRecord (current_price, price_change_pct, sp500_change_pct);
//     the header derives the "latest known" price snapshot from the most
//     recent trade that has them.
//   * source records which provider answered ('finnhub' | 'haiku' |
//     'mixed' | 'fallback' | 'none'); kept for parity but not rendered.
export type TickerInfoSource =
  | "finnhub"
  | "haiku"
  | "mixed"
  | "fallback"
  | "none";

export type TickerInfo = {
  ticker: string;
  company_name: string | null;
  industry: string | null;
  country: string | null;
  market_cap_usd: number | null;
  logo_url: string | null;
  web_url: string | null;
  description: string | null;
  congress_trade_count_90d: number;
  source: TickerInfoSource;
};

export type TickerInfoEnvelope = {
  ok: boolean;
  data: TickerInfo;
};

// Congressional-activity shape from GET /api/tickers/{symbol}/congressional
// (CTA Worker src/routes/api.ts handleTickerCongressional). Field names match
// the API response verbatim, per the worker-contract-mirroring invariant.
//
// Wrapper: { ok: boolean, data: TickerCongressional }
//
// Notes for the UI:
//   * All dollar figures are disclosure-range midpoints (amount_low/high
//     band math server-side) -- disclosure-derived, never price-derived, so
//     they sit outside the RETURNS_DISPLAY gate.
//   * clusters is already filtered server-side to politician_count >= 3
//     within the last 90 days (max 5 rows, newest first).
export type TickerCongressionalTrader = {
  politician: string;
  party: string | null;
  state: string | null;
  chamber: string | null;
  trade_count: number;
  buy_count: number;
  sell_count: number;
  total_midpoint: number;
  biggest_position: number;
  signed_midpoint: number;
  net_direction: "buy" | "sell" | "mixed";
  latest_trade_date: string | null;
  latest_source_url: string | null;
};

export type TickerCongressionalCluster = {
  id: number;
  politician_count: number;
  total_midpoint_value: number;
  first_trade_date: string;
  last_trade_date: string;
  status: string;
  members: string[];
};

export type TickerCongressional = {
  ticker: string;
  count: number;
  traders: TickerCongressionalTrader[];
  clusters: TickerCongressionalCluster[];
};

export type TickerCongressionalEnvelope = {
  ok: boolean;
  data: TickerCongressional;
};
