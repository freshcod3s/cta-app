import { describe, expect, it } from "vitest";

import {
  buildCompareColumn,
  COMPARE_ROWS,
  recentCount,
  type CompareSource,
} from "@/features/compare/derive";
import type { ExplorableTrade } from "@/features/explore/derive";

const NOW = Date.parse("2026-08-25T00:00:00Z");

let nextId = 1;
function trade(over: Partial<ExplorableTrade> = {}): ExplorableTrade {
  return {
    id: nextId++,
    ticker: "AAPL",
    asset_name: "Apple Inc",
    tx_type: "Purchase",
    amount_range: "$1,001 - $15,000",
    trade_date: "2026-08-14",
    disclosure_date: "2026-08-20",
    disclosure_lag_days: 6,
    sector: "Technology",
    date_quality: null,
    ...over,
  };
}

function source(over: Partial<CompareSource> = {}): CompareSource {
  return {
    name: "Nancy Pelosi",
    party: "D",
    chamber: "House",
    state: "CA",
    photoUrl: null,
    totalTrades: 3,
    firstTrade: "2019-02-01",
    lastTrade: "2026-08-14",
    trades: [trade(), trade({ tx_type: "Sale" }), trade({ tx_type: "Sale (partial)" })],
    fromSnapshot: false,
    snapshotUpdatedAt: null,
    ...over,
  };
}

describe("recentCount", () => {
  it("counts filings inside the window", () => {
    expect(
      recentCount([trade({ trade_date: "2026-08-14" })], NOW),
    ).toBe(1);
  });

  it("excludes filings outside the window", () => {
    expect(recentCount([trade({ trade_date: "2025-01-02" })], NOW)).toBe(0);
  });

  // A five-digit lag means the date is untrustworthy; letting one land in
  // "recent activity" would invent activity that did not happen.
  it("excludes corrupt-date rows", () => {
    expect(
      recentCount(
        [trade({ trade_date: "2026-08-14", date_quality: "corrupt" })],
        NOW,
      ),
    ).toBe(0);
  });
});

describe("buildCompareColumn", () => {
  it("derives counts, years and promptness", () => {
    const c = buildCompareColumn(source(), NOW);
    expect(c.buys).toBe(1);
    expect(c.sells).toBe(2); // "Sale (partial)" counts as a sale
    expect(c.firstYear).toBe("2019");
    expect(c.lastYear).toBe("2026");
    expect(c.medianLag).toBe(6);
    expect(c.topSector).toEqual({ sector: "Technology", count: 3 });
  });

  // total_trades is the true archive total; the trades array is capped. When
  // the cap bites the UI has to say the breakdown is a sample, not the whole
  // record -- otherwise the comparison quietly understates a prolific filer.
  it("flags a capped sample", () => {
    const c = buildCompareColumn(source({ totalTrades: 500 }), NOW);
    expect(c.sampled).toBe(true);
    expect(c.loadedCount).toBe(3);
    expect(c.totalTrades).toBe(500);
  });

  it("does not flag a sample when everything is loaded", () => {
    expect(buildCompareColumn(source({ totalTrades: 3 }), NOW).sampled).toBe(false);
  });

  it("carries snapshot provenance so a column can be labelled offline", () => {
    const c = buildCompareColumn(
      source({ fromSnapshot: true, snapshotUpdatedAt: "2026-08-20T00:00:00Z" }),
      NOW,
    );
    expect(c.fromSnapshot).toBe(true);
    expect(c.snapshotUpdatedAt).toBe("2026-08-20T00:00:00Z");
  });

  it("handles a member with no loaded filings without throwing", () => {
    const c = buildCompareColumn(
      source({ trades: [], totalTrades: null, firstTrade: null, lastTrade: null }),
      NOW,
    );
    expect(c.buys).toBe(0);
    expect(c.medianLag).toBeNull();
    expect(c.topSector).toBeNull();
    expect(c.firstYear).toBeNull();
  });
});

describe("comparison rows", () => {
  const col = buildCompareColumn(source(), NOW);

  it("every row renders a string and an accessible equivalent", () => {
    for (const row of COMPARE_ROWS) {
      expect(typeof row.value(col)).toBe("string");
      expect(row.a11y(col).length).toBeGreaterThan(0);
    }
  });

  // The standing product rule: disclosed amounts are ranges, so no dimension
  // may be a money figure. This asserts the rule at the row level, where a
  // future addition would otherwise slip through unnoticed.
  it("compares no dollar amounts", () => {
    const money = /\$|dollar|volume|amount|total value/i;
    for (const row of COMPARE_ROWS) {
      expect(row.label).not.toMatch(money);
      expect(row.value(col)).not.toMatch(/\$/);
    }
  });

  it("renders an em dash rather than a zero when a value is unknown", () => {
    const empty = buildCompareColumn(
      source({ trades: [], totalTrades: null, firstTrade: null, lastTrade: null }),
      NOW,
    );
    const lag = COMPARE_ROWS.find((r) => r.key === "lag")!;
    expect(lag.value(empty)).toBe("—");
  });
});
