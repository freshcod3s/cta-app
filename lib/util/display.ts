// Shared display helpers for trade/member rendering (pure, no React).
//
// displayName(): STOCK Act filings use legal names; map to common/public
// names. Ported verbatim from the web dashboard's DISPLAY_NAMES alias map
// (congress-trade-alerts src/dashboard.html) -- keep the two in sync when
// a new alias lands there. Render-time only: route params and API filters
// MUST keep the legal name (the Worker matches on it).

export const DISPLAY_NAMES: Record<string, string> = {
  "Rohit Khanna": "Ro Khanna",
  "Gilbert Cisneros": "Gil Cisneros",
  "Joshua Gottheimer": "Josh Gottheimer",
  "Edward Case": "Ed Case",
  "Timothy Moore": "Tim Moore",
};

export function displayName(name: string): string {
  return DISPLAY_NAMES[name] || name;
}

// "$8.0K" / "$32.5K" / "$50.4M" / "$1.2B" -- the web dashboard's short
// money format for mid estimates and member volume.
export function formatMoneyShort(n: number | null | undefined): string | null {
  if (n == null || !isFinite(n) || n <= 0) return null;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

// Midpoint of the disclosed amount band. Null when the band is absent or
// a $0 placeholder (amount_low/high = 0 rows exist upstream).
export function midEstimate(
  low: number | null | undefined,
  high: number | null | undefined,
): number | null {
  if (low == null || high == null || high <= 0) return null;
  return (low + high) / 2;
}

// "Jul 2, 2026" from an ISO-ish date string; falls back to the raw string
// when unparseable (never throws on dirty upstream dates).
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}
