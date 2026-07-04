// Shared display helpers for trade/member rendering (pure, no React).
//
// displayName(): STOCK Act filings use legal names; map to common/public
// names. Ported verbatim from the web dashboard's DISPLAY_NAMES alias map
// (congress-trade-alerts src/dashboard.html) -- keep the two in sync when
// a new alias lands there. Render-time only: route params and API filters
// MUST keep the legal name (the Worker matches on it).
//
// cleanAssetName(): the Worker serves asset_name verbatim from the STOCK
// Act filing, which for some filers embeds the CUSTODIAN/account line
// ("Bank of America Argan, Inc. Common Stock", "S O : Schwab One ...")
// and raw NUL bytes from PDF extraction. Interim CLIENT-SIDE cleanup.
// TODO(worker-ingest): remove once the Worker's ingest pipeline strips
// custodian prefixes at parse time (tracked with the tx_type/asset-name
// ingest cleanup ticket in congress-trade-alerts).

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

// Custodian/account-line prefixes observed in served asset_name values
// (live /api/trades probe, 2026-07-04). Order matters: broker-account
// junk first, then the bare custodian name.
const CUSTODIAN_PREFIXES: RegExp[] = [
  // "S O : Schwab One Account ..." (PDF-mangled Schwab account line)
  /^S\s+O\s*:\s*(Schwab\s+One(\s+Account\S*)?)?\s*/i,
  /^Bank of America\s+/i,
  /^Charles Schwab\s+/i,
  // "D : Ticker BNP FP ..." (broker's own ticker ref, exposed once the
  // custodian name above is stripped -- must run AFTER it, single pass)
  /^D\s*:\s*Ticker\s+[A-Z]{1,6}(\s+[A-Z]{1,6})?\s+/,
];

// Corp-ish leading tokens that mean the "prefix" was actually the company
// itself (e.g. a real Bank of America Corporation holding) -- do not strip.
const CORP_REMAINDER = /^(Corp\b|Corporation\b|Inc\b|N\.A\.|Co\b|Common\b|-\s)/i;

export function cleanAssetName(raw: string | null | undefined): string {
  if (!raw) return "";
  // Collapse PDF-extraction NULs/control chars into single spaces.
  let s = raw
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  for (const re of CUSTODIAN_PREFIXES) {
    const stripped = s.replace(re, "");
    if (stripped !== s && stripped.length >= 4 && !CORP_REMAINDER.test(stripped)) {
      s = stripped.trim();
    }
  }
  return s;
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
