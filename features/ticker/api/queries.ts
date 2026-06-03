// Ticker-feature queries. Uses centralized keys from ./keys (Lock rule).
//
// Two independent server-state reads back the ticker detail screen:
//   useTickerInfo(symbol)   -> GET /api/ticker-info/{symbol}  (header card)
//   useTickerTrades(symbol) -> GET /api/trades?ticker={symbol} (the list)
//
// The trades list reuses the trades feature's page-cursor logic
// (getTradesPageParam) and TradesListPage shape -- the ticker-filtered feed
// is the same /api/trades envelope, just narrowed by one query param, so
// there is no second pagination contract to maintain.
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { getTradesPageParam } from "@/features/trades/api/queries";
import type { TradeRecord, TradesListPage } from "@/features/trades/api/types";
import { tickerKeys } from "./keys";
import type { TickerInfo, TickerInfoEnvelope } from "./types";

// Worker accepts [A-Za-z0-9.\-]{1,10}; normalize to uppercase to match the
// server (handleTrades uppercases ticker; handleTickerInfo trims+uppercases)
// and to keep one cache entry per symbol regardless of incoming casing.
export function normalizeSymbol(symbol: string | undefined): string {
  return (symbol ?? "").trim().toUpperCase();
}

// useTickerInfo -- GET /api/ticker-info/{symbol}. Company/asset profile.
// Worker caches profiles for 30 days (they change slowly), so a long
// staleTime is safe; 1h here keeps the in-app cache warm without re-hitting
// the worker on every screen focus.
export function useTickerInfo(symbol: string) {
  const sym = normalizeSymbol(symbol);
  return useQuery({
    queryKey: tickerKeys.info(sym),
    queryFn: ({ signal }) =>
      apiFetch<TickerInfoEnvelope>(`/api/ticker-info/${sym}`, { signal }),
    enabled: sym.length > 0,
    staleTime: 1000 * 60 * 60,
    select: (env) => env.data as TickerInfo,
  });
}

// useTickerTrades -- GET /api/trades?ticker={symbol}&page=N. Every disclosed
// congressional trade on the ticker, newest disclosure first (worker orders
// by disclosure_date DESC). Mirrors useTradesList's infinite-query + flatten
// shape so the screen can drive a FlatList with the same paging affordances.
export function useTickerTrades(symbol: string) {
  const sym = normalizeSymbol(symbol);
  return useInfiniteQuery({
    queryKey: tickerKeys.trades(sym),
    queryFn: ({ signal, pageParam }) =>
      apiFetch<TradesListPage>(
        `/api/trades?ticker=${encodeURIComponent(sym)}&page=${pageParam}&per_page=25`,
        { signal },
      ),
    enabled: sym.length > 0,
    initialPageParam: 1,
    getNextPageParam: getTradesPageParam,
    staleTime: 1000 * 60,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // Flattened convenience: every TradeRecord across loaded pages.
      flat: data.pages.flatMap((p) => p.data) as TradeRecord[],
      total: data.pages[0]?.meta.total ?? 0,
    }),
  });
}
