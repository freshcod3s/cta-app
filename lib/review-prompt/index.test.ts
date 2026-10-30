import { describe, expect, it, vi } from "vitest";

// Native modules have no Node implementation; the runtime is exercised with
// injected deps, so these stubs only have to load.
vi.mock("expo-constants", () => ({ default: { expoConfig: { version: "test" } } }));
vi.mock("expo-store-review", () => ({
  isAvailableAsync: async () => true,
  requestReview: async () => undefined,
}));

import { recordReviewEvent, type ReviewPromptDeps } from "./index";
import { LAUNCH_GRACE_MS } from "./rule";

function fakeDeps(over: Partial<ReviewPromptDeps> = {}) {
  let stored: string | null = null;
  const requests: number[] = [];
  const deps: ReviewPromptDeps = {
    read: async () => stored,
    write: async (v) => { stored = v; },
    appVersion: () => "1.0.0",
    msSinceLaunch: () => LAUNCH_GRACE_MS + 1,
    available: async () => true,
    request: async () => { requests.push(1); },
    ...over,
  };
  return { deps, requests, stored: () => stored };
}

describe("recordReviewEvent", () => {
  it("requests the native review once, on the 2nd trade view, and persists", async () => {
    const f = fakeDeps();
    expect(await recordReviewEvent("trade_view", f.deps)).toBe(false);
    expect(await recordReviewEvent("trade_view", f.deps)).toBe(true);
    expect(await recordReviewEvent("trade_view", f.deps)).toBe(false);
    expect(f.requests).toHaveLength(1);
    expect(JSON.parse(f.stored() as string).askedVersion).toBe("1.0.0");
  });

  it("two saves at once still ask only once", async () => {
    const f = fakeDeps();
    const r = await Promise.all([
      recordReviewEvent("saved_watch", f.deps),
      recordReviewEvent("saved_watch", f.deps),
    ]);
    expect(r.filter(Boolean)).toHaveLength(1);
    expect(f.requests).toHaveLength(1);
  });

  it("no review sheet available: does not ask, and leaves the version un-asked", async () => {
    let available = false;
    const f = fakeDeps({ available: async () => available });
    expect(await recordReviewEvent("saved_watch", f.deps)).toBe(false);
    expect(f.requests).toHaveLength(0);
    expect(JSON.parse(f.stored() as string).askedVersion).toBeNull();
    available = true;
    expect(await recordReviewEvent("trade_view", f.deps)).toBe(true);
  });

  it("never at launch", async () => {
    const f = fakeDeps({ msSinceLaunch: () => 0 });
    await recordReviewEvent("trade_view", f.deps);
    expect(await recordReviewEvent("trade_view", f.deps)).toBe(false);
    expect(f.requests).toHaveLength(0);
  });

  it("a storage failure never throws", async () => {
    const f = fakeDeps({ read: async () => { throw new Error("disk"); }, write: async () => { throw new Error("disk"); } });
    await expect(recordReviewEvent("saved_watch", f.deps)).resolves.toBe(false);
  });
});
