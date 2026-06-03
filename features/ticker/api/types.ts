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
