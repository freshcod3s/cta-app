// How old is a saved item's offline snapshot, and how do we say so.
//
// §8: cached information must be clearly distinguishable from newly fetched
// information, and we must never imply cached data is current. Every string
// this produces names BOTH that the data is local and when it was retrieved.

import { formatShortDate } from "@/lib/util/display";

const DAY_MS = 86_400_000;

// Beyond this a snapshot is called out as possibly behind the source. It is
// a display hint only -- nothing is deleted or hidden at this age.
export const STALE_AFTER_DAYS = 7;

export type Freshness = {
  // Null when the item has been saved but no snapshot retrieved yet.
  ageDays: number | null;
  stale: boolean;
  offlineReady: boolean;
  label: string;
};

export function snapshotFreshness(
  snapshotUpdatedAt: string | null | undefined,
  now: number = Date.now(),
): Freshness {
  if (!snapshotUpdatedAt) {
    return {
      ageDays: null,
      stale: true,
      offlineReady: false,
      label: "Open once while online to keep for offline",
    };
  }

  const t = Date.parse(snapshotUpdatedAt);
  if (Number.isNaN(t)) {
    return {
      ageDays: null,
      stale: true,
      offlineReady: false,
      label: "Open once while online to keep for offline",
    };
  }

  const ageDays = Math.max(0, Math.floor((now - t) / DAY_MS));
  const when = ageDays === 0 ? "today" : formatShortDate(snapshotUpdatedAt);

  return {
    ageDays,
    stale: ageDays >= STALE_AFTER_DAYS,
    offlineReady: true,
    // Deliberately "Data retrieved", never "Updated" -- the record itself
    // was filed by the member on its own date, which is a different thing.
    label: `Saved offline · Data retrieved ${when}`,
  };
}
