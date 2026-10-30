// API client. Custom domain on the CTA Worker; no auth in v1.
// Per Lock: "No /api prefix in URL constants -- endpoint paths add their own."
export const API_BASE_URL = "https://congresstradealerts.com";

// Every request carries a deadline. fetch has none of its own and React
// Query has none either, so a stalled socket on a flaky mobile connection
// leaves the query pending forever and the screen sits in its loading
// branch with no error and no recovery.
export const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    // Milliseconds the server asked us to wait, parsed from Retry-After on
    // a 429. The Worker's native per-IP limiter sends `Retry-After: 60`
    // (src/middleware/rate-limit-native.ts). null when absent or
    // unparseable, in which case callers fall back to their own backoff.
    public retryAfterMs: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Distinct from a caller-initiated abort: this means the request was too
// slow, not that the user navigated away. Callers that treat every
// AbortError as "cancelled, ignore it" would otherwise swallow a timeout.
export class ApiTimeoutError extends Error {
  constructor(
    public timeoutMs: number,
    public path: string,
  ) {
    super(`Request timed out after ${timeoutMs}ms for ${path}`);
    this.name = "ApiTimeoutError";
  }
}

// Retry-After is either delta-seconds or an HTTP-date (RFC 9110 10.2.3).
// Exported for tests; returns null on anything it cannot read, so a
// malformed header degrades to normal backoff rather than throwing.
export function parseRetryAfter(
  header: string | null | undefined,
  nowMs: number,
): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const at = Date.parse(trimmed);
  if (Number.isNaN(at)) return null;
  return Math.max(0, at - nowMs);
}

type FetchOpts = {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  // Forwarded to fetch only when set. React Native's fetch is the whatwg
  // polyfill, which turns "no-cache" / "no-store" on a GET into a
  // `_=<epoch ms>` query parameter -- the only lever it offers -- and that
  // is what defeats iOS's NSURLCache. Without it a response carrying
  // `Cache-Control: max-age` is answered from the URL cache with NO network
  // attempt for the whole max-age, even with no route to the host, so a
  // "refresh" can succeed offline. Set it where a request must prove the
  // network is reachable. Do NOT set it on list/search endpoints: the
  // Worker's serveCachedAnonQuery keys its edge cache on the full query
  // string (index.ts:279-311, wrapping /api/politicians, /api/search,
  // /api/trades, /api/top-trades), so a cache-buster there is a miss on
  // every request. The profile route is not wrapped (verified 2026-09-14).
  cache?: "no-cache" | "no-store";
};

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Compose our deadline with the caller's signal -- React Query passes one
  // and aborts it when a query is cancelled, and dropping it would leak
  // cancelled requests. AbortSignal.any() is not reliably present in the RN
  // runtime, so the two are wired together by hand.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  opts.signal?.addEventListener("abort", onCallerAbort);
  if (opts.signal?.aborted) controller.abort();

  try {
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
      ...(opts.cache ? { cache: opts.cache } : {}),
    });
    if (!res.ok) {
      throw new ApiError(
        res.status,
        `${res.status} ${res.statusText} for ${path}`,
        res.status === 429
          ? parseRetryAfter(res.headers.get("Retry-After"), Date.now())
          : null,
      );
    }
    // A 2xx does not guarantee JSON. An interstitial, a CDN error page or a
    // bot-check can answer 200 with HTML, and res.json() would then throw a
    // bare SyntaxError that reads like a bug in our parsing rather than a
    // bad response. Surface it as an ApiError so callers show their normal
    // error state and never render upstream markup.
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError(
        res.status,
        `Expected JSON from ${path} but received ${res.headers.get("Content-Type") ?? "an unknown content type"}`,
      );
    }
  } catch (e) {
    if (timedOut) throw new ApiTimeoutError(timeoutMs, path);
    throw e;
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onCallerAbort);
  }
}
