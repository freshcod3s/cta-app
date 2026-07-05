// Global InfoSheet state -- one open sheet at a time, mirroring the web
// dashboard's single #card-info-modal. Any data surface calls
// useInfoSheet.getState().open(slug) (or the useOpenInfo() hook) and the
// single <InfoSheet /> mounted at the app root renders the matching entry
// from features/info/registry.ts.
//
// Deliberately tiny (activeSlug + open/close) -- no analytics side effects
// (Product Invariant: no client-side analytics SDK; the web's
// track('card_info_open') has no mobile equivalent by design).
import { create } from "zustand";

type InfoSheetState = {
  activeSlug: string | null;
  open: (slug: string) => void;
  close: () => void;
};

export const useInfoSheet = create<InfoSheetState>((set) => ({
  activeSlug: null,
  open: (slug) => set({ activeSlug: slug }),
  close: () => set({ activeSlug: null }),
}));

// Convenience selector for surfaces that only need to open a sheet.
export function useOpenInfo() {
  return useInfoSheet((s) => s.open);
}
