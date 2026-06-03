// Query-key registry for the ticker feature.
// Lock rule: "Query keys are part of the API contract. Centralize in
// /features/<feature>/api/keys.ts. No inline ad-hoc keys at call sites."
//
// Symbols are uppercased before they reach a key so the same ticker never
// caches under two casings (the worker uppercases server-side too).
export const tickerKeys = {
  all: ["ticker"] as const,
  // Company/asset profile from GET /api/ticker-info/{symbol}.
  info: (symbol: string) => [...tickerKeys.all, "info", symbol] as const,
  // Paginated congressional trades on a ticker from
  // GET /api/trades?ticker={symbol}.
  trades: (symbol: string) => [...tickerKeys.all, "trades", symbol] as const,
};
