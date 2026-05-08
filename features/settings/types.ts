// Subscription preferences blob -- shared shape between mobile +
// backend. CTA-N (backend dispatcher targeting filter, future ticket)
// mirrors this verbatim; keep them in step.
//
// CTA-31 stores this JSON-encoded in push_tokens.subscription_prefs.
// CTA-N reads JSON_EXTRACT(subscription_prefs, '$.members') in the
// fanout SQL JOIN; falls back to broadcast when prefs.members is null
// or empty so pre-targeting tokens still receive notifications.
//
// v1 ships only members[]; tickers + event_classes scaffold for
// CTA-App-1-N future UI.
export interface SubscriptionPrefs {
  members: string[];
  tickers?: string[]; // CTA-App-1-N
  event_classes?: string[]; // CTA-App-1-N
}
