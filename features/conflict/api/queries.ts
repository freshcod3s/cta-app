// Trade-detail conflict -- committee-jurisdiction overlap for this trade,
// read off the politician profile (GET /api/politicians/{name}/profile).
// The Worker has already computed the per-trade conflict (profile.trades[]
// .conflict) and the member scorecard; we just locate this trade by id and
// surface it. Shares the members profile query KEY so it dedups with the
// news + members slices (one fetch).
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { membersKeys } from "@/features/members/api/keys";
import type { ConflictProfileEnvelope, TradeConflictResult } from "./types";

export function useTradeConflict(
  politician: string | undefined,
  tradeId: number | string | undefined,
) {
  const idNum = tradeId != null ? Number(tradeId) : NaN;
  return useQuery({
    queryKey: politician ? membersKeys.profile(politician) : membersKeys.all,
    queryFn: ({ signal }) =>
      apiFetch<ConflictProfileEnvelope>(
        `/api/politicians/${encodeURIComponent(politician as string)}/profile`,
        { signal },
      ),
    enabled: !!politician,
    staleTime: 1000 * 60 * 5,
    select: (env): TradeConflictResult => {
      const data = env.data;
      const row = data?.trades?.find((t) => t.id === idNum);
      return {
        conflict: row?.conflict ?? null,
        scorecard: data?.scorecard ?? null,
      };
    },
  });
}
