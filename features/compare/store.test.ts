import { beforeEach, describe, expect, it } from "vitest";

import { useCompareStore, MAX_COMPARE } from "@/features/compare/store";

beforeEach(() => useCompareStore.setState({ selected: [] }));

describe("compare selection", () => {
  it("adds and removes", () => {
    useCompareStore.getState().add("Nancy Pelosi");
    expect(useCompareStore.getState().selected).toEqual(["Nancy Pelosi"]);

    useCompareStore.getState().remove("Nancy Pelosi");
    expect(useCompareStore.getState().selected).toEqual([]);
  });

  it("prevents duplicates", () => {
    useCompareStore.getState().add("Nancy Pelosi");
    useCompareStore.getState().add("Nancy Pelosi");
    expect(useCompareStore.getState().selected).toHaveLength(1);
  });

  it("enforces the maximum selection count", () => {
    for (let i = 0; i < MAX_COMPARE + 3; i++) {
      useCompareStore.getState().add(`Member ${i}`);
    }
    expect(useCompareStore.getState().selected).toHaveLength(MAX_COMPARE);
    expect(useCompareStore.getState().canAdd()).toBe(false);
  });

  // At the cap, an already-selected member must still be removable --
  // otherwise the selection would be a dead end.
  it("still allows removal at the cap", () => {
    for (let i = 0; i < MAX_COMPARE; i++) useCompareStore.getState().add(`M${i}`);
    useCompareStore.getState().toggle("M0");
    expect(useCompareStore.getState().selected).toHaveLength(MAX_COMPARE - 1);
    expect(useCompareStore.getState().canAdd()).toBe(true);
  });

  it("preserves insertion order, so columns never reorder themselves", () => {
    useCompareStore.getState().add("B");
    useCompareStore.getState().add("A");
    useCompareStore.getState().add("C");
    expect(useCompareStore.getState().selected).toEqual(["B", "A", "C"]);
  });

  it("ignores empty and whitespace names", () => {
    useCompareStore.getState().add("");
    useCompareStore.getState().add("   ");
    expect(useCompareStore.getState().selected).toEqual([]);
  });

  it("clears everything", () => {
    useCompareStore.getState().add("A");
    useCompareStore.getState().add("B");
    useCompareStore.getState().clear();
    expect(useCompareStore.getState().selected).toEqual([]);
  });
});
