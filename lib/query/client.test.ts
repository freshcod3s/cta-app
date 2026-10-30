import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/client";
import { retryDelayMs, shouldRetry } from "@/lib/query/client";

const rateLimited = (retryAfterMs: number | null) =>
  new ApiError(429, "429 Too Many Requests for /api/trades", retryAfterMs);
const serverError = new ApiError(500, "500 for /api/trades");

describe("shouldRetry", () => {
  // RQ passes failureCount starting at 0 and increments it AFTER this
  // decision (query-core retryer.js:89,94). These two cases are what pins
  // the previous `retry: 1` behaviour -- an off-by-one here would silently
  // drop every retry the app used to make.
  it("still allows exactly one retry for an ordinary failure", () => {
    expect(shouldRetry(0, serverError)).toBe(true);
    expect(shouldRetry(1, serverError)).toBe(false);
  });

  it("applies the same single retry to non-ApiError failures", () => {
    expect(shouldRetry(0, new Error("network down"))).toBe(true);
    expect(shouldRetry(1, new Error("network down"))).toBe(false);
  });

  it("allows two attempts for a 429", () => {
    expect(shouldRetry(0, rateLimited(60_000))).toBe(true);
    expect(shouldRetry(1, rateLimited(60_000))).toBe(true);
    expect(shouldRetry(2, rateLimited(60_000))).toBe(false);
  });
});

describe("retryDelayMs", () => {
  it("honours the server's Retry-After", () => {
    expect(retryDelayMs(0, rateLimited(5_000))).toBe(5_000);
  });

  // Retry-After: 60 is what the Worker actually sends; waiting the full
  // minute would strand the screen, so the honoured value is capped.
  it("caps a long Retry-After at 30s", () => {
    expect(retryDelayMs(0, rateLimited(60_000))).toBe(30_000);
  });

  it("falls back to backoff when a 429 carries no usable header", () => {
    expect(retryDelayMs(0, rateLimited(null))).toBe(1_000);
  });

  // Reproduces RQ's own defaultRetryDelay curve, so non-429 timing is
  // unchanged from before the 429 handling was added.
  it("matches RQ's default curve for ordinary failures", () => {
    expect(retryDelayMs(0, serverError)).toBe(1_000);
    expect(retryDelayMs(1, serverError)).toBe(2_000);
    expect(retryDelayMs(2, serverError)).toBe(4_000);
    expect(retryDelayMs(99, serverError)).toBe(30_000);
  });
});
