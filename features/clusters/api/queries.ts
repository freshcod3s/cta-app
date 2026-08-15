import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ClustersEnvelope } from "./types";

export const clustersKeys = {
  all: ["clusters"] as const,
  conflictFirst: () => ["clusters", "conflict-first"] as const,
};

// GET /api/clusters?view=conflict-first -- top 6 clusters ranked
// conflict-first. Edge-cached 5 min on the Worker; 15 min staleTime here.
export function useConflictClusters() {
  return useQuery({
    queryKey: clustersKeys.conflictFirst(),
    queryFn: ({ signal }) =>
      apiFetch<ClustersEnvelope>("/api/clusters?view=conflict-first", {
        signal,
      }),
    staleTime: 1000 * 60 * 15,
    select: (env) => env.data,
  });
}
