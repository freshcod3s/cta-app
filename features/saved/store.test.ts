import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSavedStore, type FetchedProfile } from "@/features/saved/store";
import { useSettingsStore } from "@/features/settings/store";
import { SNAPSHOT_TRADE_CAP, savedKey } from "@/features/saved/types";
import type { MemberProfile } from "@/features/members/api/types";
import type { TradeRecord } from "@/features/trades/api/types";

function profile(over: Partial<MemberProfile> = {}): MemberProfile {
  return {
    name: "Nancy Pelosi",
    party: "D",
    chamber: "House",
    state: "CA",
    district: "11",
    committees: [],
    bioguide_id: "P000197",
    photo_url: null,
    years_served: null,
    status: "current",
    status_date: null,
    stats: {
      total_trades: 128,
      last_trade: "2026-08-14",
      first_trade: "2019-02-01",
      buys: 70,
      sells: 58,
      volume_high: null,
      avg_return_pct: null,
      avg_spx_pct: null,
    },
    disclosureLag: { median: 21, max: 90, over30Count: 4, histogram: [] },
    trades: [tradeRecord()],
    ...over,
  } as MemberProfile;
}

// When the fixture profile's data was fetched -- deliberately not "now".
const RETRIEVED_AT = "2026-09-13T08:30:00.000Z";

let nextId = 1;
function tradeRecord(over: Partial<TradeRecord> = {}): TradeRecord {
  return {
    id: nextId++,
    politician: "Nancy Pelosi",
    party: "D",
    chamber: "House",
    ticker: "NVDA",
    asset_name: "NVIDIA Corp",
    tx_type: "Purchase",
    amount_range: "$1,001 - $15,000",
    trade_date: "2026-08-14",
    disclosure_date: "2026-08-20",
    disclosure_lag_days: 6,
    sector: "Technology",
    date_quality: null,
  } as unknown as TradeRecord;
}

// Must match the `name` given to persist() in the store.
const PERSIST_KEY = "cta.saved.v1";

beforeEach(() => {
  useSavedStore.setState({ items: [] });
  useSettingsStore.setState({
    subscriptionPrefs: { members: [], tickers: [] },
  });
});

describe("saving members", () => {
  it("saves and unsaves", () => {
    const s = useSavedStore.getState();
    s.saveMember("Nancy Pelosi");
    expect(useSavedStore.getState().isSaved("member", "Nancy Pelosi")).toBe(true);

    useSavedStore.getState().remove(savedKey("member", "Nancy Pelosi"));
    expect(useSavedStore.getState().isSaved("member", "Nancy Pelosi")).toBe(false);
  });

  it("does not create a duplicate row on a second save", () => {
    const s = useSavedStore.getState();
    s.saveMember("Nancy Pelosi");
    useSavedStore.getState().saveMember("Nancy Pelosi");
    useSavedStore.getState().saveMember("Nancy Pelosi");
    expect(useSavedStore.getState().items).toHaveLength(1);
  });

  it("toggles rather than stacking", () => {
    useSavedStore.getState().toggleMember("Nancy Pelosi");
    expect(useSavedStore.getState().items).toHaveLength(1);
    useSavedStore.getState().toggleMember("Nancy Pelosi");
    expect(useSavedStore.getState().items).toHaveLength(0);
  });

  it("captures an offline snapshot when saved from a profile", () => {
    useSavedStore.getState().saveMember(profile());
    const item = useSavedStore.getState().items[0];
    expect(item.entityType).toBe("member");
    expect(item.snapshotUpdatedAt).not.toBeNull();
    if (item.entityType !== "member") throw new Error("expected a member");
    expect(item.snapshot?.total_trades).toBe(128);
    expect(item.snapshot?.median_lag_days).toBe(21);
  });

  // A star tapped in the feed has no profile to hand. That must still save,
  // and must not claim to be offline-ready.
  it("saves without a snapshot when only a name is known", () => {
    useSavedStore.getState().saveMember("Nancy Pelosi");
    const item = useSavedStore.getState().items[0];
    expect(item.snapshotUpdatedAt).toBeNull();
    if (item.entityType !== "member") throw new Error("expected a member");
    expect(item.snapshot).toBeNull();
  });

  it("upgrades a name-only save in place once the profile arrives", () => {
    useSavedStore.getState().saveMember("Nancy Pelosi");
    const savedAt = useSavedStore.getState().items[0].savedAt;

    useSavedStore.getState().refreshMemberSnapshot(profile(), RETRIEVED_AT);
    const items = useSavedStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].savedAt).toBe(savedAt); // original save time preserved
    expect(items[0].snapshotUpdatedAt).not.toBeNull();
  });

  // Step 6 of the review lands on this row's "Data retrieved" date. The
  // stamp is when the profile's data actually came off the network, never
  // the clock at refresh time: a profile rehydrated from yesterday's cache
  // and refreshed into the snapshot today must still read as yesterday's.
  it("stamps a refreshed snapshot with the data's retrieval time, not the clock", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-09-14T20:00:00.000Z"));
      useSavedStore.getState().saveMember("Nancy Pelosi");
      useSavedStore.getState().refreshMemberSnapshot(profile(), RETRIEVED_AT);
      expect(useSavedStore.getState().items[0].snapshotUpdatedAt).toBe(RETRIEVED_AT);
      expect(useSavedStore.getState().items[0].snapshotUpdatedAt).not.toBe(
        "2026-09-14T20:00:00.000Z",
      );
      // Negative control: data fetched at this moment is stamped this moment,
      // so the assertion above cannot pass merely because the stamp is frozen.
      useSavedStore
        .getState()
        .refreshMemberSnapshot(profile(), new Date().toISOString());
      expect(useSavedStore.getState().items[0].snapshotUpdatedAt).toBe(
        "2026-09-14T20:00:00.000Z",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  // Viewing a profile must never silently add it to the workspace.
  it("does not add an unsaved member on snapshot refresh", () => {
    useSavedStore.getState().refreshMemberSnapshot(profile(), RETRIEVED_AT);
    expect(useSavedStore.getState().items).toHaveLength(0);
  });

  it("bounds the snapshot so storage cannot grow without limit", () => {
    const many = Array.from({ length: SNAPSHOT_TRADE_CAP + 40 }, (_, i) =>
      tradeRecord({ trade_date: `2026-${String((i % 12) + 1).padStart(2, "0")}-01` }),
    );
    useSavedStore.getState().saveMember(profile({ trades: many }));
    const item = useSavedStore.getState().items[0];
    if (item.entityType !== "member") throw new Error("expected a member");
    expect(item.snapshot?.trades.length).toBe(SNAPSHOT_TRADE_CAP);
  });
});

describe("saving from a screen with no profile in hand", () => {
  // Trade detail knows only the member's name. The save has to take effect
  // at once, and the snapshot has to follow from the fetched profile, so a
  // member saved there is as offline-ready as one saved from Explore.
  it("saves immediately and fills the snapshot when the profile arrives", async () => {
    let deliver!: (p: FetchedProfile) => void;
    const inFlight = new Promise<FetchedProfile>((resolve) => {
      deliver = resolve;
    });
    const done = useSavedStore
      .getState()
      .saveMemberWithSnapshot("Nancy Pelosi", () => inFlight);

    // Saved before the profile exists, and not yet claiming offline access.
    const before = useSavedStore.getState().items[0];
    expect(before.entityType).toBe("member");
    expect(before.snapshotUpdatedAt).toBeNull();

    deliver({ profile: profile(), retrievedAt: RETRIEVED_AT });
    await done;

    // One row, same save time, now carrying the bounded snapshot.
    const items = useSavedStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].savedAt).toBe(before.savedAt);
    expect(items[0].snapshotUpdatedAt).not.toBeNull();
    if (items[0].entityType !== "member") throw new Error("expected a member");
    expect(items[0].snapshot?.total_trades).toBe(128);
    expect(items[0].snapshot?.trades).toHaveLength(1);
  });

  it("keeps the save, with no snapshot, when the fetch fails", async () => {
    await useSavedStore
      .getState()
      .saveMemberWithSnapshot("Nancy Pelosi", () =>
        Promise.reject(new Error("offline")),
      );
    expect(useSavedStore.getState().isSaved("member", "Nancy Pelosi")).toBe(true);
    expect(useSavedStore.getState().items).toHaveLength(1);
    const item = useSavedStore.getState().items[0];
    expect(item.snapshotUpdatedAt).toBeNull();
    if (item.entityType !== "member") throw new Error("expected a member");
    expect(item.snapshot).toBeNull();
  });

  // The button reads "Saved" before the profile arrives, so a second tap (a
  // remove) can land while the fetch is in flight. The late profile must not
  // bring the member back.
  it("does not re-add a member removed while the fetch is in flight", async () => {
    let deliver!: (p: FetchedProfile) => void;
    const inFlight = new Promise<FetchedProfile>((resolve) => {
      deliver = resolve;
    });
    const done = useSavedStore
      .getState()
      .saveMemberWithSnapshot("Nancy Pelosi", () => inFlight);
    useSavedStore.getState().remove(savedKey("member", "Nancy Pelosi"));
    expect(useSavedStore.getState().isSaved("member", "Nancy Pelosi")).toBe(false);

    deliver({ profile: profile(), retrievedAt: RETRIEVED_AT });
    await done;

    expect(useSavedStore.getState().isSaved("member", "Nancy Pelosi")).toBe(false);
    expect(useSavedStore.getState().items).toHaveLength(0);
  });
});

describe("saving records", () => {
  it("saves a filing with a self-contained snapshot", () => {
    const t = tradeRecord();
    useSavedStore.getState().saveTrade(t);
    const item = useSavedStore.getState().items[0];
    expect(item.entityType).toBe("trade");
    // A filing is offline-ready the moment it is saved.
    expect(item.snapshotUpdatedAt).not.toBeNull();
    if (item.entityType !== "trade") throw new Error("expected a trade");
    expect(item.snapshot.politician).toBe("Nancy Pelosi");
    expect(item.snapshot.amount_range).toBe("$1,001 - $15,000");
  });

  it("is idempotent", () => {
    const t = tradeRecord();
    useSavedStore.getState().saveTrade(t);
    useSavedStore.getState().saveTrade(t);
    expect(useSavedStore.getState().items).toHaveLength(1);
  });

  // The stored amount stays the filed RANGE STRING. Nothing downstream can
  // sum or average what it was never given a number for.
  it("stores the disclosed range verbatim and no numeric amount", () => {
    useSavedStore.getState().saveTrade(tradeRecord());
    const item = useSavedStore.getState().items[0];
    if (item.entityType !== "trade") throw new Error("expected a trade");
    expect(typeof item.snapshot.amount_range).toBe("string");
    expect(item.snapshot).not.toHaveProperty("amount_low");
    expect(item.snapshot).not.toHaveProperty("amount_high");
  });
});

describe("push-targeting mirror", () => {
  // subscriptionPrefs.members[] is a cross-repo contract: the worker reads it
  // out of push_tokens.subscription_prefs. Consolidating on the saved store
  // must not silently break it.
  it("keeps subscriptionPrefs.members in step with saved members", () => {
    useSavedStore.getState().saveMember("Nancy Pelosi");
    expect(useSettingsStore.getState().subscriptionPrefs.members).toEqual([
      "Nancy Pelosi",
    ]);

    useSavedStore.getState().remove(savedKey("member", "Nancy Pelosi"));
    expect(useSettingsStore.getState().subscriptionPrefs.members).toEqual([]);
  });

  it("leaves the ticker watchlist and amount floor untouched", () => {
    useSettingsStore.setState({
      subscriptionPrefs: { members: [], tickers: ["NVDA"], min_amount: 50000 },
    });
    useSavedStore.getState().saveMember("Nancy Pelosi");
    const prefs = useSettingsStore.getState().subscriptionPrefs;
    expect(prefs.tickers).toEqual(["NVDA"]);
    expect(prefs.min_amount).toBe(50000);
  });

  it("does not mirror saved filings into push targeting", () => {
    useSavedStore.getState().saveTrade(tradeRecord());
    expect(useSettingsStore.getState().subscriptionPrefs.members).toEqual([]);
  });
});

describe("rehydration", () => {
  it("survives a store rehydrate with items intact", async () => {
    useSavedStore.getState().saveMember(profile());
    expect(useSavedStore.getState().items).toHaveLength(1);

    // Faithful cold-launch simulation. Note setState itself triggers a
    // persist write, so simply clearing in-memory state would ALSO blank
    // the stored blob and this test would pass against a store that
    // persists nothing. Capture what actually reached storage, clear, put
    // it back, then replay rehydration.
    const storage = useSavedStore.persist.getOptions().storage!;
    const onDisk = await storage.getItem(PERSIST_KEY);
    expect(onDisk).toBeTruthy();

    useSavedStore.setState({ items: [] });
    await storage.setItem(PERSIST_KEY, onDisk!);
    await useSavedStore.persist.rehydrate();

    const items = useSavedStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].entityId).toBe("Nancy Pelosi");
    if (items[0].entityType !== "member") throw new Error("expected a member");
    // The offline snapshot is what makes the item useful with no network --
    // it has to survive the round-trip, not just the id.
    expect(items[0].snapshot?.total_trades).toBe(128);
  });

  it("adopts a legacy follow that predates this store", async () => {
    useSavedStore.setState({ items: [] });
    useSettingsStore.setState({
      subscriptionPrefs: { members: ["Legacy Member"], tickers: [] },
    });

    await useSavedStore.persist.rehydrate();

    expect(
      useSavedStore.getState().isSaved("member", "Legacy Member"),
    ).toBe(true);
  });
});
