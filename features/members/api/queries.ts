// Members-feature queries. Uses centralized keys from ./keys (Lock rule).
//
// useMemberProfile -- GET /api/politicians/{name}/profile. The worker
// returns a richer per-member payload than the trades table alone:
// committees, bio (photo_url / years_served), aggregate stats, and a
// disclosure-lag summary. We use it for the profile HEADER + summary
// line + committee chips. The member's paginated trade FEED is fetched
// separately via the shared useTradesList({ politician }) so it reuses
// the feed's cache + onEndReached pagination instead of the profile's
// one-shot (capped-500) trades array.
//
// name is the DECODED politician name (the route already decodes the
// URL-encoded param). apiFetch builds the request URL, so we re-encode
// the path segment here; the worker matches segs[3] = encoded name and
// decodeURIComponent()s it back.
//
// staleTime 5m: a member's bio + committee assignments + lifetime stats
// move on the order of days, not seconds. Generous cache, no staleness
// risk for a profile surface.
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { membersKeys } from "./keys";
import type { MemberProfile, MemberProfileEnvelope } from "./types";

export function useMemberProfile(name: string | undefined) {
  return useQuery({
    queryKey: name ? membersKeys.profile(name) : membersKeys.all,
    queryFn: ({ signal }) =>
      apiFetch<MemberProfileEnvelope>(
        `/api/politicians/${encodeURIComponent(name as string)}/profile`,
        { signal },
      ),
    enabled: !!name,
    staleTime: 1000 * 60 * 5,
    select: (env) => env.data as MemberProfile,
  });
}
