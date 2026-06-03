// Leaderboard / benchmark queries. Uses centralized keys from ./keys
// (Lock rule: no inline ad-hoc keys).
//
// Endpoints (verified against the Worker, congress-trade-alerts
// src/routes/api.ts):
//   GET /api/politicians?sort=<key>&current=1&limit=N  -> handlePoliticians
//     Aggregates per politician from the trades table. We pass current=1
//     so the accountability list shows only sitting members (an ex-member
//     topping a "most overdue" board is noise -- they can't be held to
//     account anymore). limit caps payload size for the screen.
//   GET /api/stats -> handleStats; data.congress_alpha = { avg_stock,
//     avg_spx, enriched_count } drives the Congress-vs-S&P benchmark.
//
// Both are read-only; no mutations in this slice (nothing to make
// idempotent). staleTime is generous -- leaderboard standings shift on
// the disclosure-batch cadence (cron), not per second.
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { leaderboardKeys } from "./keys";
import type {
  BenchmarkSummary,
  CongressAlpha,
  LeaderboardEnvelope,
  LeaderboardMember,
  LeaderboardSort,
} from "./types";

// How many ranked rows to pull per board. The screen renders a tight
// top-N; 25 is plenty of headroom without dragging the full 2000-row
// ceiling the endpoint allows.
const LEADERBOARD_LIMIT = 25;

// useLeaderboard -- GET /api/politicians?sort=<key>&current=1.
// sort drives both the query key (independent cache per board) and the
// Worker-side ordering. select unwraps the envelope to the row array.
export function useLeaderboard(sort: LeaderboardSort) {
  return useQuery({
    queryKey: leaderboardKeys.ranked(sort),
    queryFn: ({ signal }) =>
      apiFetch<LeaderboardEnvelope>(
        `/api/politicians?sort=${sort}&current=1&limit=${LEADERBOARD_LIMIT}`,
        { signal },
      ),
    staleTime: 1000 * 60 * 5,
    select: (env): LeaderboardMember[] => env.data ?? [],
  });
}

// /api/stats envelope -- we only read the congress_alpha block here, so
// the rest of the (large) stats payload stays untyped on purpose.
type StatsBenchmarkPayload = {
  ok: boolean;
  data: {
    congress_alpha?: CongressAlpha;
  };
};

// Round to one decimal so the UI never has to. null stays null.
function pct(v: number | undefined): number | null {
  return typeof v === "number" && isFinite(v)
    ? Math.round(v * 10) / 10
    : null;
}

// useBenchmark -- GET /api/stats, normalized to a BenchmarkSummary.
// deltaPct is the headline accountability number: aggregate Congress
// move minus the matched S&P move. Positive = Congress outperformed the
// market on average; this is presented as a transparency metric, not a
// signal to act on.
export function useBenchmark() {
  return useQuery({
    queryKey: leaderboardKeys.benchmark(),
    queryFn: ({ signal }) =>
      apiFetch<StatsBenchmarkPayload>("/api/stats", { signal }),
    staleTime: 1000 * 60 * 5,
    select: (env): BenchmarkSummary => {
      const a = env.data?.congress_alpha ?? {};
      const congressAvgPct = pct(a.avg_stock);
      const sp500AvgPct = pct(a.avg_spx);
      const deltaPct =
        congressAvgPct != null && sp500AvgPct != null
          ? Math.round((congressAvgPct - sp500AvgPct) * 10) / 10
          : null;
      return {
        congressAvgPct,
        sp500AvgPct,
        deltaPct,
        enrichedCount:
          typeof a.enriched_count === "number" ? a.enriched_count : null,
      };
    },
  });
}
