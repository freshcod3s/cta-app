// Subscription preferences blob -- shared shape between mobile +
// backend. CTA-N (backend dispatcher targeting filter, future ticket)
// mirrors this verbatim; keep them in step.
//
// CTA-31 stores this JSON-encoded in push_tokens.subscription_prefs.
// The worker's selectTokensForTrade reads JSON_EXTRACT('$.members') and
// JSON_EXTRACT('$.tickers') in the fanout filter; a token is targeted if the
// trade's politician is in members[] OR its ticker is in tickers[], and falls
// back to broadcast only when BOTH lists are null/empty.
//
// members[] + tickers[] are live (member + ticker push targeting);
// event_classes[] remains scaffolded for a future UI.
export interface SubscriptionPrefs {
  members: string[];
  tickers?: string[]; // ticker watchlist (push targeting)
  event_classes?: string[]; // CTA-App-1-N
}
