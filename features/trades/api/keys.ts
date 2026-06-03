// Query-key registry for the trades feature.
// Lock rule: "Query keys are part of the API contract. Centralize in
// /features/<feature>/api/keys.ts. No inline ad-hoc keys at call sites."
import type { TradeFilters } from "./types";

export const tradesKeys = {
  all: ["trades"] as const,
  // Filters are part of the key so each filter combo caches independently.
  // React Query hashes object keys deterministically, so {party:"D"} is a
  // stable key regardless of property insertion order.
  list: (filters: TradeFilters = {}) =>
    [...tradesKeys.all, "list", filters] as const,
  detail: (id: string) => [...tradesKeys.all, "detail", id] as const,
  stats: () => [...tradesKeys.all, "stats"] as const,
};
