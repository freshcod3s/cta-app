import { describe, expect, it } from "vitest";

import {
  needsRefreshOnMount,
  savedCopyBanner,
  savedCopyState,
  type SavedCopyInput,
} from "./savedCopy";

const START = Date.parse("2026-09-14T18:00:00Z");
const EARLIER = START - 3 * 60_000; // rehydrated: fetched 3 min before launch
const LATER = START + 5_000; // fetched (or refreshed) in this process

const base: SavedCopyInput = {
  hasProfile: true,
  dataUpdatedAt: LATER,
  processStartMs: START,
  hasSnapshot: false,
  snapshotUpdatedAt: null,
};

describe("savedCopyState", () => {
  it("a profile retrieved in this process is live", () => {
    expect(savedCopyState(base)).toEqual({ kind: "live" });
  });

  it("a profile rehydrated from the persisted cache is a copy from its first render, dated by dataUpdatedAt", () => {
    expect(savedCopyState({ ...base, dataUpdatedAt: EARLIER })).toEqual({
      kind: "cached-profile",
      retrievedAt: new Date(EARLIER).toISOString(),
    });
  });

  it("negative control: the same profile once refreshed in this process is live again", () => {
    // The only thing that changes between the two calls is dataUpdatedAt
    // crossing the process start, which is what a successful refetch does.
    const before = savedCopyState({ ...base, dataUpdatedAt: EARLIER });
    const after = savedCopyState({ ...base, dataUpdatedAt: START + 1 });
    expect(before.kind).toBe("cached-profile");
    expect(after).toEqual({ kind: "live" });
  });

  it("with no profile, the saved snapshot is the copy; with neither there is nothing to label", () => {
    expect(
      savedCopyState({
        ...base,
        hasProfile: false,
        dataUpdatedAt: 0,
        hasSnapshot: true,
        snapshotUpdatedAt: "2026-09-10T12:00:00Z",
      }),
    ).toEqual({ kind: "snapshot", retrievedAt: "2026-09-10T12:00:00Z" });
    expect(
      savedCopyState({ ...base, hasProfile: false, dataUpdatedAt: 0 }),
    ).toEqual({ kind: "live" });
  });
});

describe("needsRefreshOnMount", () => {
  it("only a rehydrated profile forces a refetch, regardless of staleTime", () => {
    expect(needsRefreshOnMount(true, EARLIER, START)).toBe(true);
    expect(needsRefreshOnMount(true, LATER, START)).toBe(false);
    expect(needsRefreshOnMount(true, 0, START)).toBe(false);
    expect(needsRefreshOnMount(false, EARLIER, START)).toBe(false);
  });
});

describe("savedCopyBanner", () => {
  const now = START + 60_000;

  it("says nothing for live data", () => {
    expect(savedCopyBanner({ kind: "live" }, true, now)).toBeNull();
  });

  it("a saved member keeps the saved-copy wording with the shared freshness label", () => {
    const iso = new Date(EARLIER).toISOString();
    expect(savedCopyBanner({ kind: "cached-profile", retrievedAt: iso }, true, now)).toBe(
      "Showing your saved copy. Saved offline · Data retrieved today",
    );
    expect(savedCopyBanner({ kind: "snapshot", retrievedAt: iso }, true, now)).toBe(
      "Showing your saved copy. Saved offline · Data retrieved today",
    );
  });

  it("a member who is only cached is called a cached copy, never a saved one", () => {
    const iso = new Date(EARLIER).toISOString();
    expect(savedCopyBanner({ kind: "cached-profile", retrievedAt: iso }, false, now)).toBe(
      "Showing a cached copy. Data retrieved today",
    );
    const old = "2026-09-01T12:00:00Z";
    expect(
      savedCopyBanner({ kind: "cached-profile", retrievedAt: old }, false, now),
    ).toMatch(/^Showing a cached copy\. Data retrieved (?!today)/);
  });
});
