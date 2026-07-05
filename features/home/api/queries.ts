import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

// GET /api/top-earners -- members ranked by 90-day activity. est_pnl is a
// returns-derived field, nulled by the Worker while RETURNS_DISPLAY is off,
// so the UI shows trade counts, not P&L.
export type TopEarner = {
  politician: string;
  party?: string | null;
  chamber?: string | null;
  trades?: number;
  est_pnl?: number | null;
  is_current?: boolean;
};

// GET /api/top-stocks -- tickers ranked by trade count.
export type TopStock = {
  ticker: string;
  asset_name?: string | null;
  trade_count?: number;
  trader_count?: number;
};

export function useTopEarners() {
  return useQuery({
    queryKey: ["top-earners"] as const,
    staleTime: 1000 * 60 * 15,
    queryFn: ({ signal }) =>
      apiFetch<{ ok: boolean; data: TopEarner[] }>("/api/top-earners", {
        signal,
      }),
    select: (env) => env.data,
  });
}

export function useTopStocks() {
  return useQuery({
    queryKey: ["top-stocks"] as const,
    staleTime: 1000 * 60 * 15,
    queryFn: ({ signal }) =>
      apiFetch<{ ok: boolean; data: TopStock[] }>("/api/top-stocks", {
        signal,
      }),
    select: (env) => env.data,
  });
}
