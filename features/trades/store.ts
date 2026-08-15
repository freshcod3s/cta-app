// Feed filter store -- Zustand, client state (Lock: "Client state:
// Zustand"; React Query stays server-state-only). Deliberately NOT
// persisted: filters are an ephemeral browsing context and should reset
// on cold start, not surprise the user with a stale filter days later.
//
// Chip semantics are single-select-per-dimension with toggle-off:
// tapping the active value clears it (party/chamber/txType each hold one
// value or undefined). politician + ticker are set by the search box and
// row drill-in respectively.
import { create } from "zustand";

import type { TradeFilters } from "./api/types";

type ChipKey = "party" | "chamber" | "txType";

interface TradeFiltersState {
  filters: TradeFilters;
  // Search box (debounced upstream). Empty string clears it.
  setPolitician: (politician: string) => void;
  // Row drill-in: jump the feed to one member / one ticker.
  drillToTicker: (ticker: string) => void;
  drillToPolitician: (politician: string) => void;
  // Chip toggle: set value, or clear if it's already the active one.
  toggleChip: (key: ChipKey, value: string) => void;
  toggleCurrentOnly: () => void;
  clear: () => void;
}

export const useTradeFiltersStore = create<TradeFiltersState>((set) => ({
  filters: {},
  setPolitician: (politician) =>
    set((s) => ({
      filters: { ...s.filters, politician: politician.trim() || undefined },
    })),
  drillToTicker: (ticker) =>
    set((s) => ({
      filters: { ...s.filters, ticker: ticker.toUpperCase() || undefined },
    })),
  drillToPolitician: (politician) =>
    set((s) => ({
      filters: { ...s.filters, politician: politician || undefined },
    })),
  toggleChip: (key, value) =>
    set((s) => ({
      filters: {
        ...s.filters,
        [key]: s.filters[key] === value ? undefined : value,
      },
    })),
  toggleCurrentOnly: () =>
    set((s) => ({
      filters: { ...s.filters, currentOnly: s.filters.currentOnly ? undefined : true },
    })),
  clear: () => set({ filters: {} }),
}));
