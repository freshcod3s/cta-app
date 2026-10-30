import { describe, expect, it } from "vitest";

import { isLateFiling } from "@/features/trades/api/types";

describe("isLateFiling", () => {
  // The §25 item-5 guard. disclosure_lag_days is nullable in the D1 schema
  // and the worker's own queries filter `IS NOT NULL`, but the client type
  // used to declare a bare `number`. A null lag must never read as late.
  it("is false for a missing lag rather than coercing it", () => {
    expect(isLateFiling(null)).toBe(false);
  });

  it("holds the 45-day STOCK Act boundary", () => {
    expect(isLateFiling(45)).toBe(false);
    expect(isLateFiling(46)).toBe(true);
  });

  it("is false for a same-day filing", () => {
    expect(isLateFiling(0)).toBe(false);
  });
});
