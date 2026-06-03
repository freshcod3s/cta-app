// useMemberRecentTrades -- recent disclosures for a single followed member.
//
// Server state: thin wrapper over useTradesList({ politician }) (the feed's
// existing infinite query). No new endpoint -- the worker's GET /api/trades
// supports `politician` as a LIKE match (src/routes/api.ts handleTrades),
// which is exactly the per-member filter we need. Reusing useTradesList
// means we inherit its centralized query key (tradesKeys.list({politician}))
// for free; we do NOT mint a watchlist-specific server key.
//
// We only ever render a short preview per member on the watchlist, so we
// slice the first PREVIEW_LIMIT records client-side rather than asking the
// server for a smaller page (page size is fixed at 25 upstream, and the
// first page is plenty for a 3-row preview). We never call fetchNextPage
// here -- the watchlist is a glance surface; tapping a row drills into the
// full feed / detail.
import { useMemo } from "react";

import { useTradesList } from "@/features/trades/api/queries";
import type { TradeRecord } from "@/features/trades/api/types";

const PREVIEW_LIMIT = 3;

export function useMemberRecentTrades(politician: string) {
  const query = useTradesList({ politician });

  const all: TradeRecord[] = query.data?.flat ?? [];
  const trades = useMemo(() => all.slice(0, PREVIEW_LIMIT), [all]);

  return {
    trades,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
