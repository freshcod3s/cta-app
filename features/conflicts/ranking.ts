// Conflicts view -- ranking + tier logic (pure, no React, unit-testable).
//
// NOTE on naming: this `features/conflicts/` (plural) is the AGGREGATE
// accountability SCREEN. It consumes the existing `features/conflict/`
// (singular) per-trade committee-overlap DATA layer. Different directories,
// different jobs -- do not merge.
//
// Ranking principle (locked): rank on data that is CORRECT. The strongest,
// statutorily-grounded signal is disclosure lateness (45-day STOCK Act), so
// late filings sort first, then trade materiality (amount). Committee overlap
// is computed on the CURRENT roster (not time-aware), so it is a LABELED
// secondary chip -- it never participates in the ordering until the Worker
// goes time-aware. No opaque composite score: the comparator below is the
// whole ranking, fully explainable from the visible LATE pill + dollar range.
import { isLateFiling, type TradeRecord } from "@/features/trades/api/types";
import type { TradeConflict } from "@/features/conflict/api/types";

// The feed serves a plain TradeRecord today. `owner_type` and an inline
// `conflict` are FORWARD-COMPATIBLE optionals: when the Worker starts
// projecting them onto /api/trades, the chips light up with zero client
// changes. Until then they are simply absent and omitted cleanly.
export type ConflictTrade = TradeRecord & {
  owner_type?: string | null;
  conflict?: TradeConflict | null;
};

// Tier-A = DOCUMENTED accountability signal (statutory). Today that is a
// late filing; "amended filing" joins here when the Worker exposes it.
export function isTierA(trade: ConflictTrade): boolean {
  return isLateFiling(trade.disclosure_lag_days);
}

// Deterministic ranking. Late first (most overdue first), then larger trades,
// then newest disclosure as a stable tiebreaker. Pure: returns a new array.
export function rankConflicts(trades: ConflictTrade[]): ConflictTrade[] {
  return [...trades].sort((a, b) => {
    const aLate = isLateFiling(a.disclosure_lag_days) ? 1 : 0;
    const bLate = isLateFiling(b.disclosure_lag_days) ? 1 : 0;
    if (aLate !== bLate) return bLate - aLate; // documented (late) first
    if (aLate && bLate && b.disclosure_lag_days !== a.disclosure_lag_days) {
      return b.disclosure_lag_days - a.disclosure_lag_days; // most overdue first
    }
    const aAmt = a.amount_high ?? 0;
    const bAmt = b.amount_high ?? 0;
    if (bAmt !== aAmt) return bAmt - aAmt; // larger materiality first
    return (b.disclosure_date ?? "").localeCompare(a.disclosure_date ?? "");
  });
}

// Human-readable reason for the Tier-A chip -- the "why", not a score.
export function lateReason(lagDays: number): string {
  return `Filed ${lagDays}d after the trade -- past the 45-day STOCK Act window`;
}

// Owner chip label. The chip is accountability-interesting ONLY for
// spouse/joint/dependent (a household account the member benefits from).
// 'self' is the uninteresting baseline and 'unknown' (the Worker default for
// uncaptured/legacy rows) carries no signal -- both return null so the caller
// omits the chip entirely rather than render "Self"/"Unknown" noise on nearly
// every row. Any unmapped value is likewise suppressed.
export function ownerLabel(raw?: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v.startsWith("spouse") || v === "sp") return "Spouse";
  if (v.startsWith("joint") || v === "jt") return "Joint";
  if (v.startsWith("depend") || v.startsWith("child") || v === "dc") {
    return "Dependent";
  }
  return null; // self | unknown | filer | unmapped -> no chip
}
