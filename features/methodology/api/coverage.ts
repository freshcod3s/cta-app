import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";

// GET /api/coverage -- live snapshot of price-enrichment health across the
// trades table. Edge-cached 300s on the Worker.
//
// The field this app reads is missing_unpriceable: rows carrying no ticker
// symbol (private investments, LLCs and other holdings that cannot be
// priced from public market data). It is read live rather than hardcoded
// because it only moves downward as the House-PTR ticker extractor drains
// the historical backlog -- the methodology copy said "~15,900" while the
// true figure was 8,703, and a literal would simply drift again.
//
// The same expression backs the web methodology page, so the two surfaces
// cannot disagree.
export type Coverage = {
  total: number;
  enriched: number;
  missing_priceable: number;
  missing_unpriceable: number;
  failed: number;
  pct: number;
  backfill_status: "running" | "paused_quota" | "complete";
  backfill_resume_at: string | null;
  generated_at: string;
};

type CoverageEnvelope = { ok: boolean; data: Coverage };

export function useCoverage() {
  return useQuery({
    queryKey: ["coverage"] as const,
    // Copy-surface figure: an hour-old value is fine, and this keeps a
    // static reading screen from refetching on every visit.
    staleTime: 1000 * 60 * 60,
    queryFn: ({ signal }) => apiFetch<CoverageEnvelope>("/api/coverage", { signal }),
    select: (env) => env.data,
  });
}

// Thousands separators without leaning on Intl in the RN runtime.
export const withCommas = (n: number): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
