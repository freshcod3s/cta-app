// Server-state cache. RQ client + AsyncStorage persister per Lock
// ("Offline cache: React Query + AsyncStorage persist"). gcTime 24h so
// cached responses survive cold-starts within a day. retry once on a
// failed query (silent backend hiccup) and never on mutations.
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_DAY_MS,
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "cta.rq.cache",
  throttleTime: 1000,
});
