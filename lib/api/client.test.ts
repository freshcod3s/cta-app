import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  ApiTimeoutError,
  apiFetch,
  parseRetryAfter,
} from "@/lib/api/client";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("parseRetryAfter", () => {
  const NOW = Date.parse("2026-08-25T00:00:00Z");

  it("reads delta-seconds, which is what the Worker sends", () => {
    // src/middleware/rate-limit-native.ts sets `Retry-After: 60`.
    expect(parseRetryAfter("60", NOW)).toBe(60_000);
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseRetryAfter("  60  ", NOW)).toBe(60_000);
  });

  it("reads an HTTP-date", () => {
    expect(parseRetryAfter("Tue, 25 Aug 2026 00:00:30 GMT", NOW)).toBe(30_000);
  });

  it("clamps an HTTP-date already in the past to zero", () => {
    expect(parseRetryAfter("Mon, 24 Aug 2026 23:59:00 GMT", NOW)).toBe(0);
  });

  it("returns null for absent or unreadable values rather than throwing", () => {
    // A malformed header must degrade to normal backoff, not crash the
    // request path.
    expect(parseRetryAfter(null, NOW)).toBeNull();
    expect(parseRetryAfter(undefined, NOW)).toBeNull();
    expect(parseRetryAfter("", NOW)).toBeNull();
    expect(parseRetryAfter("soon", NOW)).toBeNull();
  });
});

describe("apiFetch", () => {
  it("returns the parsed body on success", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, data: [1, 2] }), { status: 200 }),
    ) as unknown as typeof fetch;

    await expect(apiFetch<{ ok: boolean; data: number[] }>("/api/trades"))
      .resolves.toEqual({ ok: true, data: [1, 2] });
  });

  it("attaches retryAfterMs from a 429 so the query client can honour it", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("{}", { status: 429, headers: { "Retry-After": "60" } }),
    ) as unknown as typeof fetch;

    const err = await apiFetch("/api/trades").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    if (!(err instanceof ApiError)) throw err;
    expect(err.status).toBe(429);
    expect(err.retryAfterMs).toBe(60_000);
  });

  it("leaves retryAfterMs null on a non-429 failure", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("{}", { status: 500, headers: { "Retry-After": "60" } }),
    ) as unknown as typeof fetch;

    const err = await apiFetch("/api/trades").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    if (!(err instanceof ApiError)) throw err;
    expect(err.status).toBe(500);
    expect(err.retryAfterMs).toBeNull();
  });

  // The bug this guards: with no deadline a stalled socket left the query
  // pending forever and the screen sat in its loading branch.
  it("throws ApiTimeoutError when the deadline passes", async () => {
    globalThis.fetch = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    ) as unknown as typeof fetch;

    const err = await apiFetch("/api/trades", { timeoutMs: 20 }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiTimeoutError);
    if (!(err instanceof ApiTimeoutError)) throw err;
    expect(err.timeoutMs).toBe(20);
  });

  // A caller abort (React Query cancelling a query) must stay a plain
  // abort -- reporting it as a timeout would misattribute navigation.
  it("does not disguise a caller abort as a timeout", async () => {
    globalThis.fetch = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    ) as unknown as typeof fetch;

    const controller = new AbortController();
    const pending = apiFetch("/api/trades", {
      signal: controller.signal,
      timeoutMs: 10_000,
    }).catch((e) => e);
    controller.abort();

    const err = await pending;
    expect(err).not.toBeInstanceOf(ApiTimeoutError);
    expect((err as DOMException).name).toBe("AbortError");
  });

  // App Review may run on a network that injects a portal or a bot check.
  // A 200 carrying HTML must not surface as a bare SyntaxError, and must
  // never let upstream markup reach a screen.
  it("degrades a non-JSON 200 to ApiError instead of a SyntaxError", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("<!doctype html><title>Just a moment...</title>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    ) as unknown as typeof fetch;

    const err = await apiFetch("/api/trades").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    if (!(err instanceof ApiError)) throw err;
    expect(err.name).toBe("ApiError");
    // The message names the content type, never the upstream body.
    expect(err.message).toContain("text/html");
    expect(err.message).not.toContain("doctype");
  });

  it("forwards the caller signal that React Query supplies", async () => {
    const seen: (AbortSignal | undefined)[] = [];
    globalThis.fetch = vi.fn(async (_url: string, init: RequestInit) => {
      seen.push(init.signal ?? undefined);
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    await apiFetch("/api/trades", { signal: new AbortController().signal });
    expect(seen[0]).toBeInstanceOf(AbortSignal);
  });

  it("forwards the cache option to fetch only where it is set", async () => {
    // The member profile refetch sets cache: "no-cache" so React Native's
    // fetch polyfill appends a cache-busting `_=` parameter and iOS's URL
    // cache cannot answer it offline. Every other request must keep the
    // default policy, so the option must not leak onto the init object
    // when absent -- not even as `cache: undefined`.
    const inits: RequestInit[] = [];
    globalThis.fetch = vi.fn(async (_url: string, init: RequestInit) => {
      inits.push(init);
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    await apiFetch("/api/politicians/x/profile", { cache: "no-cache" });
    await apiFetch("/api/trades");

    expect(inits[0].cache).toBe("no-cache");
    expect(inits[1]).not.toHaveProperty("cache");
  });
});
