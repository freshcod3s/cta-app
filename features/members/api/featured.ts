import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

// GET /api/featured-politicians -- top ~8 members by 90-day disclosed volume
// (current members only, Pelosi-pinned on the Worker). Edge-cached 1h.
export type FeaturedMember = {
  name: string;
  party?: string | null;
  chamber?: string | null;
  state?: string | null;
  district?: string | null;
  bioguide_id?: string | null;
  photo_url?: string | null;
  trade_count?: number;
  total_volume?: number | null;
};

type FeaturedEnvelope = { ok: boolean; data: FeaturedMember[] };

export function useFeaturedMembers() {
  return useQuery({
    queryKey: ["featured-members"] as const,
    staleTime: 1000 * 60 * 30,
    queryFn: ({ signal }) =>
      apiFetch<FeaturedEnvelope>("/api/featured-politicians", { signal }),
    select: (env) => env.data,
  });
}
