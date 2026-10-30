import { describe, expect, it } from "vitest";

import {
  LAUNCH_GRACE_MS,
  initialState,
  migrateState,
  onReviewEvent,
  type ReviewEvent,
  type ReviewPromptState,
} from "./rule";

const LATER = LAUNCH_GRACE_MS + 1; // well past launch

function run(state: ReviewPromptState, events: ReviewEvent[], ms = LATER) {
  const asks: boolean[] = [];
  for (const e of events) {
    const r = onReviewEvent(state, e, ms);
    state = r.state;
    asks.push(r.ask);
  }
  return { state, asks };
}

describe("review prompt trigger rule", () => {
  it("1st viewed trade: no", () => {
    expect(run(initialState("1.0.0"), ["trade_view"]).asks).toEqual([false]);
  });

  it("2nd viewed trade: yes", () => {
    expect(run(initialState("1.0.0"), ["trade_view", "trade_view"]).asks).toEqual([false, true]);
  });

  it("first saved watch before any trade view: yes", () => {
    expect(run(initialState("1.0.0"), ["saved_watch"]).asks).toEqual([true]);
  });

  it("first saved watch after one trade view: yes (whichever comes first)", () => {
    expect(run(initialState("1.0.0"), ["trade_view", "saved_watch"]).asks).toEqual([false, true]);
  });

  it("never on launch: a qualifying event inside the launch grace does not ask", () => {
    const s = run(initialState("1.0.0"), ["trade_view"]).state;
    const atLaunch = onReviewEvent(s, "trade_view", LAUNCH_GRACE_MS - 1);
    expect(atLaunch.ask).toBe(false);
    expect(atLaunch.state.askedVersion).toBeNull();
    // ...and the next qualifying event after the grace asks.
    expect(onReviewEvent(atLaunch.state, "trade_view", LATER).ask).toBe(true);
  });

  it("a saved watch at launch does not ask either", () => {
    expect(onReviewEvent(initialState("1.0.0"), "saved_watch", 0).ask).toBe(false);
  });

  it("asks at most once per installed version", () => {
    const { asks } = run(initialState("1.0.0"), [
      "trade_view", "trade_view", "trade_view", "saved_watch", "trade_view",
    ]);
    expect(asks.filter(Boolean)).toHaveLength(1);
  });

  it("asks again after an update, once that version qualifies on its own", () => {
    const asked = run(initialState("1.0.0"), ["trade_view", "trade_view"]).state;
    expect(asked.askedVersion).toBe("1.0.0");
    const upgraded = migrateState(JSON.parse(JSON.stringify(asked)), "1.1.0");
    expect(upgraded.tradeViews).toBe(0);
    expect(upgraded.askedVersion).toBe("1.0.0");
    expect(run(upgraded, ["trade_view", "trade_view"]).asks).toEqual([false, true]);
  });
});

describe("review prompt state migration", () => {
  it("unreadable or foreign state starts fresh", () => {
    expect(migrateState(null, "1.0.0")).toEqual(initialState("1.0.0"));
    expect(migrateState("garbage", "1.0.0")).toEqual(initialState("1.0.0"));
    expect(migrateState({ schemaVersion: 99, tradeViews: 5 }, "1.0.0")).toEqual(initialState("1.0.0"));
  });

  it("same version keeps its counters", () => {
    const s = { ...initialState("1.0.0"), tradeViews: 1, savedWatch: false };
    expect(migrateState(s, "1.0.0").tradeViews).toBe(1);
  });
});
