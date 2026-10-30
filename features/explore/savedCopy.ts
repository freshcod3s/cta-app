// Is the profile on the Explore screen current, or a copy?
//
// §8 / the Review Notes: cached material is always labelled with the date
// it was retrieved, never presented as current. The query client persists
// every response for 24h, so after a relaunch a member's profile comes back
// from AsyncStorage looking exactly like a live one. Without this the
// offline Explore screen rendered a day-old copy with no cue at all.
//
// A profile is a copy when it predates this process: its dataUpdatedAt is
// earlier than the process start, so it was rehydrated from the persisted
// cache, not retrieved in this session. It stays a copy until a refresh in
// this process succeeds, which moves dataUpdatedAt past the process start.
// The label therefore appears from the first render: offline it simply
// stays (the refresh fails, or dies at the 15 s request deadline -- the
// simulator was measured taking the full deadline), online it shows only
// for the one request the screen makes on mount and then clears. Keying
// the label off the failure instead left the copy unlabelled for up to
// that deadline, which is exactly the window the rule forbids.
//
// The screen also treats a rehydrated profile as stale regardless of the
// query's staleTime (needsRefreshOnMount): otherwise a member viewed five
// minutes before a relaunch is never refetched and the label could never
// clear while online. No connectivity source is consulted; this app does
// not wire TanStack's onlineManager, and none is needed for this.
//
// processStartMs is supplied by the caller from lib/query/client.ts, which
// the root layout evaluates at app start. It must not be stamped in this
// module: route modules load on first navigation, so a stamp taken here
// would be "first time Explore opened", and a profile fetched earlier in
// the same session (saving from trade detail, Compare) would read as
// rehydrated and flash the label.

import { formatShortDate } from "@/lib/util/display";
import { snapshotFreshness } from "@/features/saved/freshness";

export type SavedCopyInput = {
  hasProfile: boolean;
  // query.state.dataUpdatedAt; 0 when the query has no data.
  dataUpdatedAt: number;
  processStartMs: number;
  hasSnapshot: boolean;
  snapshotUpdatedAt: string | null;
};

export type SavedCopyState =
  | { kind: "live" }
  // A profile rehydrated from the persisted query cache and not yet
  // refreshed in this process. retrievedAt is dataUpdatedAt as ISO.
  | { kind: "cached-profile"; retrievedAt: string }
  // No profile at all; the Saved workspace snapshot is on screen.
  | { kind: "snapshot"; retrievedAt: string | null };

export function isRehydrated(
  hasProfile: boolean,
  dataUpdatedAt: number,
  processStartMs: number,
): boolean {
  return hasProfile && dataUpdatedAt > 0 && dataUpdatedAt < processStartMs;
}

// Whether the screen should force one refetch on mount, ignoring staleTime.
export function needsRefreshOnMount(
  hasProfile: boolean,
  dataUpdatedAt: number,
  processStartMs: number,
): boolean {
  return isRehydrated(hasProfile, dataUpdatedAt, processStartMs);
}

export function savedCopyState(i: SavedCopyInput): SavedCopyState {
  if (i.hasProfile) {
    if (isRehydrated(true, i.dataUpdatedAt, i.processStartMs)) {
      return {
        kind: "cached-profile",
        retrievedAt: new Date(i.dataUpdatedAt).toISOString(),
      };
    }
    return { kind: "live" };
  }
  if (i.hasSnapshot) {
    return { kind: "snapshot", retrievedAt: i.snapshotUpdatedAt };
  }
  return { kind: "live" };
}

// Banner copy. A saved member keeps the existing wording and the shared
// freshness label; a member who is merely cached gets the plain truth.
export function savedCopyBanner(
  state: SavedCopyState,
  isSavedMember: boolean,
  now: number = Date.now(),
): string | null {
  if (state.kind === "live") return null;
  if (state.kind === "snapshot" || isSavedMember) {
    return `Showing your saved copy. ${snapshotFreshness(state.retrievedAt, now).label}`;
  }
  const ageDays = Math.max(
    0,
    Math.floor((now - Date.parse(state.retrievedAt)) / 86_400_000),
  );
  const when = ageDays === 0 ? "today" : formatShortDate(state.retrievedAt);
  return `Showing a cached copy. Data retrieved ${when}`;
}
