// Query-key registry for the leaderboard / benchmark feature.
// Lock rule: "Query keys are part of the API contract. Centralize in
// /features/<feature>/api/keys.ts. No inline ad-hoc keys at call sites."
//
// `ranked(sort)` is parameterized by the Worker sort key so the
// most-active and most-overdue lists cache independently.
import type { LeaderboardSort } from "./types";

export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  ranked: (sort: LeaderboardSort) =>
    [...leaderboardKeys.all, "ranked", sort] as const,
  // Benchmark summary reads from /api/stats. Namespaced under this
  // feature so the leaderboard's view of the stats payload is keyed
  // separately from the feed's StatsBanner (tradesKeys.stats()).
  benchmark: () => [...leaderboardKeys.all, "benchmark"] as const,
};
