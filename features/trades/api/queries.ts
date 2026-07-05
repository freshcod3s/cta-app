// Trade-feature queries. Uses centralized keys from ./keys (Lock rule).
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { tradesKeys } from "./keys";
import type {
  TradeDetailEnvelope,
  TradeFilters,
  TradeRecord,
  TradesListPage,
} from "./types";

export type TradeBreakdown = {
  total_volume?: number;
  total_volume_low?: number;
  buy_volume_high?: number;
  sale_volume_high?: number;
  exchange_volume_high?: number;
  buy_count?: number;
  sale_count?: number;
  exchange_count?: number;
  open_bucket_count?: number;
};

export type StatsData = {
  total_trades?: number;
  total_politicians?: number;
  overdue_members_119th?: number;
  disclosures_last_7d?: number;
  committee_overlap_trades_7d?: number;
  congress_alpha?: { avg_stock?: number; avg_spx?: number };
  trade_breakdown?: TradeBreakdown;
};

type StatsPayload = { ok: boolean; data: StatsData };

export function useStats() {
  return useQuery({
    queryKey: tradesKeys.stats(),
    queryFn: ({ signal }) => apiFetch<StatsPayload>("/api/stats", { signal }),
  });
}

type TopTradesEnvelope = { ok: boolean; data: TradeRecord[] };

// GET /api/top-trades?days=7|14|30 -- the 5 largest single trades by midpoint.
// Web parity: cascade 7 -> 14 -> 30 until a window has rows, and surface the
// window that hit so the header can label it honestly. One query; the queryFn
// walks the windows server-side-ish (three cheap edge-cached calls at worst).
export function useTopTrades() {
  return useQuery({
    queryKey: ["top-trades", "cascade"] as const,
    staleTime: 1000 * 60 * 15,
    queryFn: async ({ signal }) => {
      for (const days of [7, 14, 30]) {
        const env = await apiFetch<TopTradesEnvelope>(
          `/api/top-trades?days=${days}`,
          { signal },
        );
        if (env.data && env.data.length > 0) return { rows: env.data, days };
      }
      return { rows: [] as TradeRecord[], days: 30 };
    },
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

// Build the /api/trades path, appending only the filters that are set.
// Mirrors the server contract (worker src/routes/api.ts handleTrades):
// politician -> LIKE, ticker/party/chamber -> exact, tx_type -> LIKE,
// current=1 -> sitting members only. Built by hand rather than via
// URLSearchParams because RN's polyfill lacks a reliable .set()/object
// constructor across versions.
function buildTradesPath(page: number, filters: TradeFilters): string {
  const parts = [`page=${page}`, "per_page=25"];
  if (filters.politician)
    parts.push(`politician=${encodeURIComponent(filters.politician)}`);
  if (filters.ticker) parts.push(`ticker=${encodeURIComponent(filters.ticker)}`);
  if (filters.party) parts.push(`party=${encodeURIComponent(filters.party)}`);
  if (filters.chamber)
    parts.push(`chamber=${encodeURIComponent(filters.chamber)}`);
  if (filters.txType) parts.push(`tx_type=${encodeURIComponent(filters.txType)}`);
  if (filters.currentOnly) parts.push("current=1");
  return `/api/trades?${parts.join("&")}`;
}

// useTradesList -- GET /api/trades?page=N (CTA-App-1-5 P1 finding:
// page-based pagination, 1-indexed, per_page=25 default), now filterable.
// Returns an infinite query whose pages flatten to TradeRecord[] for the
// FlatList. staleTime 60s keeps the list fresh enough for "what happened"
// without refetching every focus change. The filters object is part of
// the query key, so switching filters swaps to a separate cache entry.
export function useTradesList(filters: TradeFilters = {}) {
  return useInfiniteQuery({
    queryKey: tradesKeys.list(filters),
    queryFn: ({ signal, pageParam }) =>
      apiFetch<TradesListPage>(buildTradesPath(pageParam, filters), { signal }),
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
