// Keep a saved member's offline snapshot current.
//
// Whenever a saved member's profile is fetched, refresh the stored snapshot
// from it. That means simply visiting a member you have saved tops up the
// copy you can read offline, without the user managing anything.
//
// Deliberately one-directional: refreshMemberSnapshot no-ops for members
// that are NOT saved, so viewing a profile can never quietly add it to the
// workspace. Saving stays an explicit act.
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSavedStore } from "@/features/saved/store";
import { profileRetrievedAt } from "@/features/members/api/queries";
import type { MemberProfile } from "@/features/members/api/types";

export function useSnapshotSync(profile: MemberProfile | null | undefined) {
  const refresh = useSavedStore((s) => s.refreshMemberSnapshot);
  const queryClient = useQueryClient();

  // Keyed on the payload identity that actually matters -- the member and
  // how many records came back -- so a referentially-new-but-identical
  // profile object does not rewrite storage on every render.
  const name = profile?.name;
  const tradeCount = profile?.trades?.length ?? 0;
  const total = profile?.stats?.total_trades ?? null;
  // The stamp the snapshot carries is when this data was fetched, not now:
  // a profile rehydrated from the persisted cache is a day-old copy and its
  // Saved row must say so. A refresh in this process moves it forward.
  const retrievedAt = name ? profileRetrievedAt(queryClient, name) : null;

  useEffect(() => {
    if (!profile?.name) return;
    if (tradeCount === 0) return; // nothing worth persisting yet
    refresh(profile, retrievedAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, tradeCount, total, retrievedAt, refresh]);
}
