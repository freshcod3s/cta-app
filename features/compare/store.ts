// Compare selection -- session state, deliberately NOT persisted.
//
// Persisting it would mean a user who compared two members last week gets a
// half-built comparison on next launch with no memory of why. The saved
// workspace is the durable collection; a comparison is a thing you assemble
// in the moment from it.
//
// Selection is by member NAME, the same key trade.politician uses and the
// same key the saved store and every existing query join on.
import { create } from "zustand";

// Apple's reviewer needs to see a real side-by-side, and the comparison
// table has to stay legible on a phone. Four columns is the ceiling where
// values are still readable without horizontal scrolling tricks.
export const MAX_COMPARE = 4;
export const MIN_COMPARE = 2;

interface CompareState {
  selected: string[];
  isSelected: (name: string) => boolean;
  canAdd: () => boolean;
  add: (name: string) => void;
  remove: (name: string) => void;
  toggle: (name: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  selected: [],

  isSelected: (name) => get().selected.includes(name),

  canAdd: () => get().selected.length < MAX_COMPARE,

  add: (name) => {
    const n = name?.trim();
    if (!n) return;
    const cur = get().selected;
    // Duplicate prevention and the cap both live here, so every entry point
    // (saved row, profile button, search result) inherits them.
    if (cur.includes(n) || cur.length >= MAX_COMPARE) return;
    set({ selected: [...cur, n] });
  },

  remove: (name) => set({ selected: get().selected.filter((n) => n !== name) }),

  toggle: (name) => {
    const n = name?.trim();
    if (!n) return;
    if (get().selected.includes(n)) get().remove(n);
    else get().add(n);
  },

  clear: () => set({ selected: [] }),
}));
