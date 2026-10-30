// Server-state cache. RQ client + AsyncStorage persister per Lock
// ("Offline cache: React Query + AsyncStorage persist"). gcTime 24h so
// cached responses survive cold-starts within a day. One retry on a failed
// query (silent backend hiccup), extra 429-aware retries below, and never
// any retry on mutations.
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ApiError } from "@/lib/api/client";

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

// When this JS process began. Lives here, not next to its consumer: the
// root layout renders the query client before any screen exists, so this
// module is evaluated at app start, whereas a route module (and anything
// it imports) is only evaluated on first navigation to it. Data whose
// dataUpdatedAt is earlier than this was rehydrated by the persister, not
// retrieved in this session -- see features/explore/savedCopy.ts.
export const PROCESS_START_MS = Date.now();

// The Worker rate-limits per IP and answers 429 with `Retry-After: 60`
// (src/middleware/rate-limit-native.ts). A single blind retry on the
// default 1s backoff is the worst of both worlds: it fires long before the
// window reopens, earns a second 429, and then gives up on a request that
// would have succeeded moments later.
const MAX_429_RETRIES = 2;
const MAX_RETRY_DELAY_MS = 30_000;

// Unchanged from the previous `retry: 1`. RQ passes failureCount starting
// at 0 and increments it AFTER this decision (query-core retryer.js:89,94),
// so `< 1` is exactly one retry -- not zero.
const DEFAULT_RETRIES = 1;

const is429 = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.status === 429;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (is429(error)) return failureCount < MAX_429_RETRIES;
  return failureCount < DEFAULT_RETRIES;
}

export function retryDelayMs(failureCount: number, error: unknown): number {
  // Honour the server's own number when it gave us one, capped so a long
  // Retry-After cannot strand a screen in its loading state.
  if (is429(error) && error.retryAfterMs != null) {
    return Math.min(error.retryAfterMs, MAX_RETRY_DELAY_MS);
  }
  // Matches RQ's defaultRetryDelay exactly, so non-429 timing is untouched.
  return Math.min(1000 * 2 ** failureCount, MAX_RETRY_DELAY_MS);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_DAY_MS,
      staleTime: 1000 * 60 * 5,
      retry: shouldRetry,
      retryDelay: retryDelayMs,
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
