import { describe, expect, it } from "vitest";

import {
  applyFilters,
  availableYears,
  groupByMonth,
  lagStats,
  monthKey,
  monthlySeries,
  sectorCounts,
  txTypeCounts,
  type ExplorableTrade,
} from "@/features/explore/derive";

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

describe("monthKey", () => {
  it("slices the calendar month without a timezone round-trip", () => {
    // Parsing through Date would shift a UTC filing into the previous month
    // for anyone west of UTC, silently moving records between buckets.
    expect(monthKey("2026-01-01")).toBe("2026-01");
    expect(monthKey("2026-01-01 00:00:00")).toBe("2026-01");
  });

  it("returns null for unusable input", () => {
    expect(monthKey(null)).toBeNull();
    expect(monthKey("")).toBeNull();
    expect(monthKey("not-a-date")).toBeNull();
  });
});

describe("groupByMonth", () => {
  it("groups by month, newest first", () => {
    const groups = groupByMonth([
      trade({ trade_date: "2026-06-02" }),
      trade({ trade_date: "2026-08-14" }),
      trade({ trade_date: "2026-08-01" }),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["2026-08", "2026-06"]);
    expect(groups[0].count).toBe(2);
    expect(groups[0].label).toBe("Aug 2026");
  });

  it("is deterministic regardless of input order", () => {
    const a = [trade({ trade_date: "2026-08-01" }), trade({ trade_date: "2026-08-14" })];
    const b = [...a].reverse();
    expect(groupByMonth(a).map((g) => g.key)).toEqual(groupByMonth(b).map((g) => g.key));
    expect(groupByMonth(a)[0].trades.map((t) => t.trade_date)).toEqual(
      groupByMonth(b)[0].trades.map((t) => t.trade_date),
    );
  });

  // The methodology copy tells readers corrupt-date rows are excluded, so
  // the timeline has to actually exclude them rather than inventing a
  // filing in whatever year the mis-parse produced.
  it("excludes corrupt-date rows from the timeline", () => {
    const groups = groupByMonth([
      trade({ trade_date: "2026-08-14" }),
      trade({ trade_date: "1998-03-02", date_quality: "corrupt" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("2026-08");
  });

  it("handles an empty dataset", () => {
    expect(groupByMonth([])).toEqual([]);
    expect(availableYears([])).toEqual([]);
    expect(monthlySeries([])).toEqual([]);
  });
});

describe("applyFilters", () => {
  const set = [
    trade({ trade_date: "2026-08-14", sector: "Technology", tx_type: "Purchase" }),
    trade({ trade_date: "2026-08-02", sector: "Energy", tx_type: "Sale (partial)" }),
    trade({ trade_date: "2025-04-09", sector: "Technology", tx_type: "Sale" }),
  ];

  it("filters by year", () => {
    expect(applyFilters(set, { year: "2026" })).toHaveLength(2);
    expect(applyFilters(set, { year: "2025" })).toHaveLength(1);
  });

  it("filters by month", () => {
    expect(applyFilters(set, { month: "2026-08" })).toHaveLength(2);
  });

  it("filters by sector", () => {
    expect(applyFilters(set, { sector: "Technology" })).toHaveLength(2);
  });

  // tx_type is contaminated upstream: "Sale (partial)" must still count as a
  // sale, which an equality check would miss.
  it("classifies transaction types permissively", () => {
    expect(applyFilters(set, { txType: "sell" })).toHaveLength(2);
    expect(applyFilters(set, { txType: "buy" })).toHaveLength(1);
  });

  it("stacks filters conjunctively", () => {
    expect(applyFilters(set, { year: "2026", sector: "Technology" })).toHaveLength(1);
    expect(applyFilters(set, { year: "2026", sector: "Utilities" })).toHaveLength(0);
  });

  it("returns everything when no filter is set", () => {
    expect(applyFilters(set, {})).toHaveLength(3);
  });
});

describe("breakdowns", () => {
  it("counts sectors descending, grouping missing ones", () => {
    const counts = sectorCounts([
      trade({ sector: "Technology" }),
      trade({ sector: "Technology" }),
      trade({ sector: null }),
    ]);
    expect(counts[0]).toEqual({ sector: "Technology", count: 2 });
    expect(counts[1]).toEqual({ sector: "Unclassified", count: 1 });
  });

  it("splits transaction types", () => {
    expect(
      txTypeCounts([
        trade({ tx_type: "Purchase" }),
        trade({ tx_type: "Sale" }),
        trade({ tx_type: "Exchange" }),
      ]),
    ).toEqual({ buys: 1, sells: 1, other: 1 });
  });
});

describe("lagStats", () => {
  it("takes the median, not the mean", () => {
    // One outlier would drag an average into nonsense; the median holds.
    const s = lagStats([
      trade({ disclosure_lag_days: 5 }),
      trade({ disclosure_lag_days: 7 }),
      trade({ disclosure_lag_days: 900 }),
    ]);
    expect(s.median).toBe(7);
    expect(s.counted).toBe(3);
  });

  it("averages the two middle values on an even count", () => {
    const s = lagStats([
      trade({ disclosure_lag_days: 10 }),
      trade({ disclosure_lag_days: 20 }),
    ]);
    expect(s.median).toBe(15);
  });

  it("counts filings past the 45-day STOCK Act window", () => {
    const s = lagStats([
      trade({ disclosure_lag_days: 45 }),
      trade({ disclosure_lag_days: 46 }),
    ]);
    expect(s.late).toBe(1);
  });

  it("excludes corrupt and null lags from the denominator", () => {
    const s = lagStats([
      trade({ disclosure_lag_days: 10 }),
      trade({ disclosure_lag_days: null }),
      trade({ disclosure_lag_days: 99999, date_quality: "corrupt" }),
    ]);
    expect(s.counted).toBe(1);
    expect(s.median).toBe(10);
  });

  it("reports no median for an empty set rather than zero", () => {
    expect(lagStats([])).toEqual({ median: null, late: 0, counted: 0 });
  });
});

describe("monthlySeries", () => {
  // A chart that omits quiet months compresses time and misrepresents a gap
  // in filing as continuous activity.
  it("includes empty months between the first and last filing", () => {
    const series = monthlySeries([
      trade({ trade_date: "2026-01-10" }),
      trade({ trade_date: "2026-04-02" }),
    ]);
    expect(series.map((b) => b.key)).toEqual([
      "2026-01", "2026-02", "2026-03", "2026-04",
    ]);
    expect(series.map((b) => b.count)).toEqual([1, 0, 0, 1]);
  });

  it("rolls the year boundary correctly", () => {
    const series = monthlySeries([
      trade({ trade_date: "2025-11-10" }),
      trade({ trade_date: "2026-02-02" }),
    ]);
    expect(series.map((b) => b.key)).toEqual([
      "2025-11", "2025-12", "2026-01", "2026-02",
    ]);
  });

  it("keeps the most recent window when the archive is long", () => {
    const series = monthlySeries(
      [trade({ trade_date: "2020-01-10" }), trade({ trade_date: "2026-04-02" })],
      6,
    );
    expect(series).toHaveLength(6);
    expect(series[series.length - 1].key).toBe("2026-04");
  });
});
