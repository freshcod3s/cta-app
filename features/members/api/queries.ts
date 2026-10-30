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
import { useQuery, type QueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { membersKeys } from "./keys";
import type { MemberProfile, MemberProfileEnvelope } from "./types";
import { resolveMemberSlug } from "../slug";

const PROFILE_STALE_MS = 1000 * 60 * 5;

// cache: "no-cache" -- the profile endpoint answers with max-age=300, and
// iOS's URL cache would satisfy a refetch inside that window with no
// network attempt at all, offline included. Explore relies on this request
// actually reaching the network to decide whether a rehydrated profile is
// current or a copy (features/explore/savedCopy.ts). React Query's own
// cache already handles staleness and dedup for this key, so the HTTP
// cache adds nothing here. Verified 2026-09-14: the Worker answers the
// `_=` parameter with an identical body and headers, and keys nothing
// on it.
export function profileQueryFn(name: string) {
  return ({ signal }: { signal?: AbortSignal }) =>
    apiFetch<MemberProfileEnvelope>(
      `/api/politicians/${encodeURIComponent(name)}/profile`,
      { signal, cache: "no-cache" },
    );
}

export function useMemberProfile(name: string | undefined) {
  return useQuery({
    queryKey: name ? membersKeys.profile(name) : membersKeys.all,
    queryFn: profileQueryFn(name as string),
    enabled: !!name,
    staleTime: PROFILE_STALE_MS,
    select: (env) => env.data as MemberProfile,
  });
}

// One-shot fetch through the same cache entry the hook subscribes to -- same
// key, same request, same staleness -- for a screen that needs the profile
// once rather than as a subscription (saving a member from trade detail, to
// fill the offline snapshot). A profile the screen already holds in cache
// resolves without a request, and a fresh fetch warms the cache the member
// screens read next.
export function fetchMemberProfile(
  queryClient: QueryClient,
  name: string,
): Promise<MemberProfile> {
  return queryClient
    .fetchQuery({
      queryKey: membersKeys.profile(name),
      queryFn: profileQueryFn(name),
      staleTime: PROFILE_STALE_MS,
    })
    .then((env) => env.data as MemberProfile);
}

// When the cached profile for `name` was retrieved, as ISO, or null when the
// cache holds nothing for it. This is the query's own dataUpdatedAt: the
// moment the data actually came off the network, which for a profile
// rehydrated from the persisted cache can be a day old. Snapshot stamps in
// the Saved workspace carry this, never the clock at save time, so the row's
// "Data retrieved" date is the data's own date.
export function profileRetrievedAt(
  queryClient: QueryClient,
  name: string,
): string | null {
  const t = queryClient.getQueryState(membersKeys.profile(name))?.dataUpdatedAt;
  return t ? new Date(t).toISOString() : null;
}

// useMemberSlug -- resolve a web /politician/<slug> link to the legal name
// the member route takes. GET /api/politicians lists every member with
// trades (361 on 2026-10-28; the endpoint caps at 2000). Names are sorted so
// a slug two names share always resolves the same way (features/members/slug.ts).
// data: the name, or null when no member matches.
const DIRECTORY_STALE_MS = 1000 * 60 * 60;

export function useMemberSlug(slug: string | undefined) {
  return useQuery({
    queryKey: membersKeys.directory(),
    queryFn: ({ signal }) =>
      apiFetch<{ data?: { name: string }[] }>(`/api/politicians?sort=name&limit=2000`, { signal }),
    enabled: !!slug,
    staleTime: DIRECTORY_STALE_MS,
    select: (env) =>
      resolveMemberSlug(
        slug ?? "",
        (env.data ?? []).map((m) => m.name).sort(),
      ),
  });
}
