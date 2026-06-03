// Trade-detail news -- the member's recent press, sourced from the
// politician profile (GET /api/politicians/{name}/profile -> data.news).
// There is no per-trade or per-ticker news endpoint; news is per-member
// (GDELT) and only surfaced inside the profile payload. We reuse the
// members slice's profile query KEY so this dedups with the members + the
// conflict slice -- one network fetch feeds all three on the trade detail.
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { membersKeys } from "@/features/members/api/keys";
import type { NewsItem, NewsProfileEnvelope } from "./types";

export function useTradeNews(politician: string | undefined) {
  return useQuery({
    queryKey: politician ? membersKeys.profile(politician) : membersKeys.all,
    queryFn: ({ signal }) =>
      apiFetch<NewsProfileEnvelope>(
        `/api/politicians/${encodeURIComponent(politician as string)}/profile`,
        { signal },
      ),
    enabled: !!politician,
    staleTime: 1000 * 60 * 5,
    select: (env): NewsItem[] => env.data?.news ?? [],
  });
}
