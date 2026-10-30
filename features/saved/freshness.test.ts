import { describe, expect, it } from "vitest";

import { snapshotFreshness, STALE_AFTER_DAYS } from "@/features/saved/freshness";

const NOW = Date.parse("2026-08-25T12:00:00Z");
const daysAgo = (n: number) =>
  new Date(NOW - n * 86_400_000).toISOString();

describe("snapshotFreshness", () => {
  it("names both that the data is local and when it was retrieved", () => {
    // §8: never imply cached data is current.
    const f = snapshotFreshness(daysAgo(0), NOW);
    expect(f.offlineReady).toBe(true);
    expect(f.label).toContain("Saved offline");
    expect(f.label).toContain("retrieved");
  });

  it("says 'today' for a snapshot taken today", () => {
    expect(snapshotFreshness(daysAgo(0), NOW).label).toContain("today");
  });

  it("names the retrieval date for an older snapshot", () => {
    const f = snapshotFreshness(daysAgo(3), NOW);
    expect(f.ageDays).toBe(3);
    expect(f.label).toContain("Aug 22, 2026");
    expect(f.stale).toBe(false);
  });

  it("marks a snapshot stale past the threshold", () => {
    expect(snapshotFreshness(daysAgo(STALE_AFTER_DAYS - 1), NOW).stale).toBe(false);
    expect(snapshotFreshness(daysAgo(STALE_AFTER_DAYS), NOW).stale).toBe(true);
  });

  // An item saved from a feed star has no snapshot yet. It must not be
  // presented as offline-ready, and the label has to tell the user how to
  // make it so.
  it("does not claim offline readiness without a snapshot", () => {
    for (const v of [null, undefined, "not-a-date"]) {
      const f = snapshotFreshness(v, NOW);
      expect(f.offlineReady).toBe(false);
      expect(f.ageDays).toBeNull();
      expect(f.label).not.toContain("Saved offline");
      expect(f.label).toContain("online");
    }
  });

  it("never reports a negative age from clock skew", () => {
    expect(snapshotFreshness(daysAgo(-2), NOW).ageDays).toBe(0);
  });
});
