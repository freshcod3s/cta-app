// Saved workspace store -- Zustand + AsyncStorage persist.
//
// CONSOLIDATION, not a second system. Before this, "following" a member was
// a bare string in settings.subscriptionPrefs.members[]. That array is a
// CROSS-REPO CONTRACT: the worker reads it out of
// push_tokens.subscription_prefs and targets push on it, so it cannot simply
// be replaced. It is now a derived MIRROR of the saved members here, kept in
// step by syncFollowMirror, and this store is the single write path.
//
// FollowButton, the Subscribe pill and the Saved screen therefore all move
// the same underlying collection -- starring a member in the feed and saving
// one from a profile are the same act, which is what §4 asks for.
//
// Legacy import: a user upgrading from a build that only had the string
// array keeps their list. onRehydrateStorage adopts any member present in
// subscriptionPrefs but missing here, with a null snapshot (unfilled until
// their profile is next loaded).
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useSettingsStore } from "@/features/settings/store";
import { recordReviewEvent } from "@/lib/review-prompt";
import type { MemberProfile } from "@/features/members/api/types";
import type { TradeRecord } from "@/features/trades/api/types";
import {
  buildMemberSnapshot,
  buildTradeSnapshot,
  memberSubtitle,
  savedKey,
  type SavedEntityType,
  type SavedItem,
  type SavedMember,
} from "./types";

interface SavedState {
  items: SavedItem[];

  isSaved: (entityType: SavedEntityType, entityId: string) => boolean;
  savedMembers: () => SavedMember[];

  // Save-or-update. Passing a profile fills the offline snapshot, stamped
  // with retrievedAt -- when that profile's data was actually fetched (the
  // query's dataUpdatedAt) -- never the clock at save time, so a profile
  // rehydrated from yesterday's cache reads as yesterday's copy. Passing
  // only a name records the save and leaves the snapshot for later.
  saveMember: (
    nameOrProfile: string | MemberProfile,
    retrievedAt?: string | null,
  ) => void;
  toggleMember: (
    nameOrProfile: string | MemberProfile,
    retrievedAt?: string | null,
  ) => void;

  // Save by name now, fill the snapshot when the profile arrives. For a
  // screen that has no profile in hand (trade detail): the save takes effect
  // at once, the fetch runs after it, and a failed fetch leaves the save in
  // place with no snapshot -- the same state a feed star leaves, with the
  // same "open once while online" label.
  saveMemberWithSnapshot: (
    name: string,
    fetchProfile: () => Promise<FetchedProfile>,
  ) => Promise<void>;
  saveTrade: (trade: TradeRecord) => void;
  toggleTrade: (trade: TradeRecord) => void;

  // Refresh an already-saved member's snapshot from a fetched profile,
  // stamped with that profile's retrieval time. No-op when the member is
  // not saved -- viewing a profile must never silently add it to the
  // workspace.
  refreshMemberSnapshot: (
    profile: MemberProfile,
    retrievedAt: string | null,
  ) => void;

  remove: (id: string) => void;
  clearAll: () => void;
}

// A fetched profile together with when its data was retrieved (ISO), which
// is the stamp its snapshot carries. null = the fetcher has no record of it.
export type FetchedProfile = {
  profile: MemberProfile;
  retrievedAt: string | null;
};

const nowIso = () => new Date().toISOString();

// Push targeting reads subscriptionPrefs.members[]. Keep it equal to the set
// of saved member names, without disturbing tickers[] or min_amount.
function syncFollowMirror(items: SavedItem[]) {
  const desired = items
    .filter((i): i is SavedMember => i.entityType === "member")
    .map((i) => i.entityId);
  const settings = useSettingsStore.getState();
  const current = settings.subscriptionPrefs.members;

  const same =
    current.length === desired.length &&
    desired.every((n) => current.includes(n));
  if (same) return;

  // Reconcile via the store's own idempotent toggle so its persist/migrate
  // logic stays the only thing that writes that shape.
  for (const name of desired) {
    if (!current.includes(name)) settings.toggleMemberSubscription(name);
  }
  for (const name of current) {
    if (!desired.includes(name)) settings.toggleMemberSubscription(name);
  }
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => {
      const commit = (items: SavedItem[]) => {
        set({ items });
        syncFollowMirror(items);
      };

      return {
        items: [],

        isSaved: (entityType, entityId) =>
          get().items.some((i) => i.id === savedKey(entityType, entityId)),

        savedMembers: () =>
          get().items.filter((i): i is SavedMember => i.entityType === "member"),

        saveMember: (nameOrProfile, retrievedAt) => {
          const profile =
            typeof nameOrProfile === "string" ? null : nameOrProfile;
          const name =
            typeof nameOrProfile === "string" ? nameOrProfile : nameOrProfile.name;
          if (!name) return;

          const id = savedKey("member", name);
          const items = get().items;
          const existing = items.find((i) => i.id === id);

          // Duplicate save is an update, never a second row.
          if (existing && !profile) return;

          const snapshot = profile ? buildMemberSnapshot(profile) : null;
          const next: SavedMember = {
            id,
            entityType: "member",
            entityId: name,
            title: name,
            subtitle: profile ? memberSubtitle(profile) : existing?.subtitle,
            savedAt: existing?.savedAt ?? nowIso(),
            // The data's own retrieval time. The save time stands in only
            // when the caller has no record of the fetch.
            snapshotUpdatedAt: snapshot
              ? (retrievedAt ?? nowIso())
              : (existing?.snapshotUpdatedAt ?? null),
            snapshot:
              snapshot ??
              (existing?.entityType === "member" ? existing.snapshot : null),
          };

          commit(
            existing ? items.map((i) => (i.id === id ? next : i)) : [next, ...items],
          );
          // A new watch counts toward the store-review prompt (lib/review-prompt).
          if (!existing) void recordReviewEvent("saved_watch");
        },

        toggleMember: (nameOrProfile, retrievedAt) => {
          const name =
            typeof nameOrProfile === "string" ? nameOrProfile : nameOrProfile.name;
          if (!name) return;
          if (get().isSaved("member", name)) {
            get().remove(savedKey("member", name));
          } else {
            get().saveMember(nameOrProfile, retrievedAt);
          }
        },

        saveMemberWithSnapshot: async (name, fetchProfile) => {
          if (!name) return;
          get().saveMember(name);

          let fetched: FetchedProfile;
          try {
            fetched = await fetchProfile();
          } catch {
            return; // saved, not offline-ready; the row's label says so
          }
          // refreshMemberSnapshot no-ops for a member no longer saved, so a
          // profile arriving after a remove can never re-add them.
          get().refreshMemberSnapshot(fetched.profile, fetched.retrievedAt);
        },

        saveTrade: (trade) => {
          const entityId = String(trade.id);
          const id = savedKey("trade", entityId);
          const items = get().items;
          if (items.some((i) => i.id === id)) return; // idempotent

          commit([
            {
              id,
              entityType: "trade",
              entityId,
              title: trade.ticker || trade.asset_name,
              subtitle: `${trade.politician} · ${trade.tx_type}`,
              savedAt: nowIso(),
              // A trade record is fully self-contained, so it is offline-ready
              // the moment it is saved.
              snapshotUpdatedAt: nowIso(),
              snapshot: buildTradeSnapshot(trade),
            },
            ...items,
          ]);
          void recordReviewEvent("saved_watch");
        },

        toggleTrade: (trade) => {
          const id = savedKey("trade", String(trade.id));
          if (get().items.some((i) => i.id === id)) get().remove(id);
          else get().saveTrade(trade);
        },

        refreshMemberSnapshot: (profile, retrievedAt) => {
          if (!profile?.name) return;
          if (!get().isSaved("member", profile.name)) return;
          get().saveMember(profile, retrievedAt);
        },

        remove: (id) => commit(get().items.filter((i) => i.id !== id)),

        clearAll: () => commit([]),
      };
    },
    {
      name: "cta.saved.v1",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Adopt any pre-existing follow that predates this store.
        const legacy = useSettingsStore.getState().subscriptionPrefs.members;
        const known = new Set(
          state.items
            .filter((i) => i.entityType === "member")
            .map((i) => i.entityId),
        );
        const adopted: SavedMember[] = legacy
          .filter((name) => name && !known.has(name))
          .map((name) => ({
            id: savedKey("member", name),
            entityType: "member",
            entityId: name,
            title: name,
            savedAt: nowIso(),
            snapshotUpdatedAt: null,
            snapshot: null,
          }));
        if (adopted.length) state.items = [...state.items, ...adopted];
      },
    },
  ),
);
