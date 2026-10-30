// Native review prompt -- the trigger rule (pure, no React, no native modules).
//
// Ask for a store review at the 2nd viewed trade or the first saved watch,
// whichever comes first; at most once per installed app version; never on
// launch. "Never on launch" also covers a cold start straight into a trade
// (a tapped push or link): an event inside LAUNCH_GRACE_MS of the process
// start does not ask, and the next qualifying event after the grace does.
//
// State is versioned (schemaVersion) and per app version: when the installed
// version changes, the counters start over, so each version needs its own
// 2nd trade view or saved watch before it asks.

export const REVIEW_PROMPT_SCHEMA_VERSION = 1;
export const LAUNCH_GRACE_MS = 15_000;
export const TRADE_VIEWS_TO_ASK = 2;

export type ReviewPromptState = {
  schemaVersion: number;
  appVersion: string;   // the version the counters below belong to
  tradeViews: number;
  savedWatch: boolean;
  askedVersion: string | null;
};

export type ReviewEvent = "trade_view" | "saved_watch";

export function initialState(appVersion: string): ReviewPromptState {
  return {
    schemaVersion: REVIEW_PROMPT_SCHEMA_VERSION,
    appVersion,
    tradeViews: 0,
    savedWatch: false,
    askedVersion: null,
  };
}

// Persisted JSON -> state for this app version. Anything unreadable, from a
// newer schema, or from another app version starts fresh; askedVersion is
// carried across versions so it still says which version was last asked.
export function migrateState(raw: unknown, appVersion: string): ReviewPromptState {
  const s = raw as Partial<ReviewPromptState> | null;
  if (!s || typeof s !== "object" || s.schemaVersion !== REVIEW_PROMPT_SCHEMA_VERSION) {
    return initialState(appVersion);
  }
  const askedVersion = typeof s.askedVersion === "string" ? s.askedVersion : null;
  if (s.appVersion !== appVersion) return { ...initialState(appVersion), askedVersion };
  return {
    schemaVersion: REVIEW_PROMPT_SCHEMA_VERSION,
    appVersion,
    tradeViews: Number.isFinite(s.tradeViews) ? Math.max(0, Number(s.tradeViews)) : 0,
    savedWatch: s.savedWatch === true,
    askedVersion,
  };
}

// One event in, the next state and whether to ask now.
export function onReviewEvent(
  state: ReviewPromptState,
  event: ReviewEvent,
  msSinceLaunch: number,
): { state: ReviewPromptState; ask: boolean } {
  const next: ReviewPromptState =
    event === "trade_view"
      ? { ...state, tradeViews: state.tradeViews + 1 }
      : { ...state, savedWatch: true };
  const qualifies = next.tradeViews >= TRADE_VIEWS_TO_ASK || next.savedWatch;
  const ask =
    qualifies &&
    next.askedVersion !== next.appVersion &&
    msSinceLaunch >= LAUNCH_GRACE_MS;
  return { state: ask ? { ...next, askedVersion: next.appVersion } : next, ask };
}
