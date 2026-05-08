// Trade-feature queries. Uses centralized keys from ./keys (Lock rule).
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { tradesKeys } from "./keys";
import type {
  TradeDetailEnvelope,
  TradeRecord,
  TradesListPage,
} from "./types";

type StatsPayload = {
  ok: boolean;
  data: {
    overdue_members_119th?: number;
    disclosures_last_7d?: number;
    committee_overlap_trades_7d?: number;
    congress_alpha?: { avg_stock?: number; avg_spx?: number };
  };
};

export function useStats() {
  return useQuery({
    queryKey: tradesKeys.stats(),
    queryFn: ({ signal }) => apiFetch<StatsPayload>("/api/stats", { signal }),
  });
}

// useTradeDetail -- GET /api/trades/{id}. Trades don't update post-disclosure
// (price fields can refresh via cron, but the headline transaction record is
// immutable), so a 5-min staleTime is generous without staleness risk. The id
// param is string (from useLocalSearchParams); the API accepts both string
// and numeric path segments.
export function useTradeDetail(id: string | undefined) {
  return useQuery({
    queryKey: id ? tradesKeys.detail(id) : tradesKeys.all,
    queryFn: ({ signal }) =>
      apiFetch<TradeDetailEnvelope>(`/api/trades/${id}`, { signal }),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    select: (env) => env.data as TradeRecord,
  });
}

// CTA-App-1-5: Feed pagination cursor logic. Exported separately so unit
// tests can call it without mounting the hook.
//   - lastPage.meta.page is 1-indexed.
//   - Stop when consumed >= total.
export function getTradesPageParam(
  lastPage: TradesListPage,
): number | undefined {
  const { page, per_page, total } = lastPage.meta;
  const consumed = page * per_page;
  return consumed < total ? page + 1 : undefined;
}

// useTradesList -- GET /api/trades?page=N (CTA-App-1-5 P1 finding:
// page-based pagination, 1-indexed, per_page=25 default). Returns an
// infinite query whose pages flatten to TradeRecord[] for the FlatList.
// staleTime 60s keeps the list fresh enough for "what happened" without
// refetching every focus change.
export function useTradesList() {
  return useInfiniteQuery({
    queryKey: tradesKeys.list(),
    queryFn: ({ signal, pageParam }) =>
      apiFetch<TradesListPage>(
        `/api/trades?page=${pageParam}&per_page=25`,
        { signal },
      ),
    initialPageParam: 1,
    getNextPageParam: getTradesPageParam,
    staleTime: 1000 * 60,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // Flattened convenience: every TradeRecord across loaded pages.
      flat: data.pages.flatMap((p) => p.data),
      total: data.pages[0]?.meta.total ?? 0,
    }),
  });
}
