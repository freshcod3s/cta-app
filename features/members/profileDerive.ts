// Client-side derivations over profile.trades[] (the 500-cap one-shot array)
// for the web-parity profile cards. Ports the dashboard's client math
// (renderDisclosureSpeedPanel / renderTrades12moPanel / renderTop5Tickers)
// so the mobile cards match the web byte-for-byte.
//
// Lives in features/members/ (not a new lib/ subdir) so Metro's Windows
// file watcher -- which misses newly-created directories until a restart --
// picks it up without one.
import type { TradeRecord } from "@/features/trades/api/types";

const DAY_MS = 86_400_000;
const YEAR_MS = 365 * DAY_MS;

function parseDay(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

// Per-trade disclosure lag in days (non-negative only), for dated filings.
function disclosureLags(trades: TradeRecord[]): number[] {
  const lags: number[] = [];
  for (const t of trades) {
    const td = parseDay(t.trade_date);
    const dd = parseDay(t.disclosure_date);
    if (td == null || dd == null) continue;
    const days = Math.round((dd - td) / DAY_MS);
    if (days >= 0) lags.push(days);
  }
  return lags;
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export type DiscSpeed = {
  median: number;
  fastest: number;
  slowest: number;
  count: number;
};

// Web parity: requires >= 5 dated pairs, else null (card self-hides).
export function disclosureSpeed(trades: TradeRecord[]): DiscSpeed | null {
  const lags = disclosureLags(trades);
  if (lags.length < 5) return null;
  return {
    median: median(lags),
    fastest: Math.min(...lags),
    slowest: Math.max(...lags),
    count: lags.length,
  };
}

// tx_type is contaminated (PTR Filing placeholders, date-misparse rows); use
// the same permissive buy/sell classification the web uses.
function isBuyTx(tx: string): boolean {
  return /urchase|buy/i.test(tx);
}
function isSellTx(tx: string): boolean {
  return /sale|sell/i.test(tx);
}

function midpoint(t: TradeRecord): number {
  const lo = t.amount_low ?? 0;
  const hi = t.amount_high ?? 0;
  if (hi <= 0) return 0;
  return (lo + hi) / 2;
}

export type Trades12mo = {
  total: number;
  buys: number;
  sells: number;
  estVolume: number;
};

export function trades12mo(
  trades: TradeRecord[],
  now: number = Date.now(),
): Trades12mo {
  const cutoff = now - YEAR_MS;
  let total = 0;
  let buys = 0;
  let sells = 0;
  let estVolume = 0;
  for (const t of trades) {
    const td = parseDay(t.trade_date);
    if (td == null || td < cutoff) continue;
    total += 1;
    if (isBuyTx(t.tx_type)) buys += 1;
    else if (isSellTx(t.tx_type)) sells += 1;
    estVolume += midpoint(t);
  }
  return { total, buys, sells, estVolume };
}

export type TopTicker = { ticker: string; count: number; lastDate: string | null };

// Most-traded tickers in the trailing 12 months, by transaction count.
export function topTickers(
  trades: TradeRecord[],
  now: number = Date.now(),
  limit = 5,
): TopTicker[] {
  const cutoff = now - YEAR_MS;
  const map = new Map<string, { count: number; lastDate: string | null }>();
  for (const t of trades) {
    const tk = (t.ticker ?? "").trim();
    if (!tk) continue;
    const td = parseDay(t.trade_date);
    if (td == null || td < cutoff) continue;
    const cur = map.get(tk) ?? { count: 0, lastDate: null };
    cur.count += 1;
    if (!cur.lastDate || (t.trade_date ?? "") > cur.lastDate) {
      cur.lastDate = t.trade_date;
    }
    map.set(tk, cur);
  }
  return Array.from(map.entries())
    .map(([ticker, v]) => ({ ticker, count: v.count, lastDate: v.lastDate }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        (b.lastDate ?? "").localeCompare(a.lastDate ?? ""),
    )
    .slice(0, limit);
}
