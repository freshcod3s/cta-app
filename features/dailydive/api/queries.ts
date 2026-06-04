// Daily Dive query -- GET /api/daily-dive. Worker caches the digest for 15
// min; a 10-min client staleTime keeps refetches light. select unwraps the
// envelope to the data block.
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { dailyDiveKeys } from "./keys";
import type { DailyDiveData, DailyDiveEnvelope } from "./types";

export function useDailyDive() {
  return useQuery({
    queryKey: dailyDiveKeys.dive(),
    queryFn: ({ signal }) =>
      apiFetch<DailyDiveEnvelope>("/api/daily-dive", { signal }),
    staleTime: 1000 * 60 * 10,
    select: (env): DailyDiveData => env.data,
  });
}
