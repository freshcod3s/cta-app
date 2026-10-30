// Saved workspace -- the on-device collection model.
//
// This is an explicit persisted domain model, NOT persisted UI state. Every
// field is either identity (so the user knows what they saved) or a bounded
// snapshot (so the item is useful with no network).
//
// Editorial posture (CLAUDE.md, and the civic-transparency mandate): these
// are public records. Nothing here scores, ranks, or characterises a member.
// The snapshot carries counts, dates and categories only.
//
// NO DOLLAR AGGREGATES. Disclosed amounts are congressional ranges, never
// exact values, so this model deliberately stores each trade's amount_range
// STRING and no numeric total. Nothing downstream can sum or average what it
// was never given.

import type { TradeRecord } from "@/features/trades/api/types";
import type { MemberProfile } from "@/features/members/api/types";

// Bounded per §15: a saved member keeps at most this many recent trades.
// 500 come back from the profile endpoint; persisting all of them for every
// saved member would bloat AsyncStorage for no user-visible gain, since the
// offline surfaces show a timeline and a summary, not the full archive.
export const SNAPSHOT_TRADE_CAP = 120;

// The minimum useful projection of a trade. Mirrors the field names on
// TradeRecord so the offline path and the live path can share renderers.
export type SavedTradeLite = {
  id: number;
  ticker: string | null;
  asset_name: string;
  tx_type: string;
  amount_range: string;
  trade_date: string;
  disclosure_date: string;
  disclosure_lag_days: number | null;
  sector: string | null;
  date_quality: string | null;
};

export type SavedMemberSnapshot = {
  name: string;
  party: string | null;
  chamber: string | null;
  state: string | null;
  district: string | null;
  photo_url: string | null;
  bioguide_id: string | null;
  // Counts and dates from the worker's own aggregate block. total_trades is
  // the true total; trades[] below is capped, so any "N of M" relabelling
  // reads from here.
  total_trades: number | null;
  first_trade: string | null;
  last_trade: string | null;
  buys: number | null;
  sells: number | null;
  median_lag_days: number | null;
  trades: SavedTradeLite[];
};

export type SavedTradeSnapshot = SavedTradeLite & {
  politician: string;
  party: string | null;
  chamber: string | null;
};

type SavedBase = {
  // Stable composite key: `${entityType}:${entityId}`. Used for dedupe.
  id: string;
  title: string;
  subtitle?: string;
  savedAt: string;
  // When the snapshot below was retrieved. Null means "saved, not yet
  // filled" -- e.g. starred from a feed row before the profile loaded.
  // The UI must never present a null-snapshot item as offline-ready.
  snapshotUpdatedAt: string | null;
};

export type SavedMember = SavedBase & {
  entityType: "member";
  // The member's name exactly as trade.politician spells it -- the key the
  // worker's push targeting and every existing query already join on.
  entityId: string;
  snapshot: SavedMemberSnapshot | null;
};

export type SavedTrade = SavedBase & {
  entityType: "trade";
  entityId: string;
  snapshot: SavedTradeSnapshot;
};

export type SavedItem = SavedMember | SavedTrade;

export type SavedEntityType = SavedItem["entityType"];

export const savedKey = (entityType: SavedEntityType, entityId: string) =>
  `${entityType}:${entityId}`;

// -- Projections --------------------------------------------------------------

export function toSavedTradeLite(t: TradeRecord | SavedTradeLite): SavedTradeLite {
  return {
    id: t.id,
    ticker: t.ticker ?? null,
    asset_name: t.asset_name,
    tx_type: t.tx_type,
    amount_range: t.amount_range,
    trade_date: t.trade_date,
    disclosure_date: t.disclosure_date,
    disclosure_lag_days: t.disclosure_lag_days,
    sector: t.sector ?? null,
    date_quality: t.date_quality ?? null,
  };
}

// Newest first, then capped -- so the cap drops the OLDEST records rather
// than whichever the API happened to return last.
export function buildMemberSnapshot(profile: MemberProfile): SavedMemberSnapshot {
  const trades = (profile.trades ?? [])
    .slice()
    .sort((a, b) => (b.trade_date ?? "").localeCompare(a.trade_date ?? ""))
    .slice(0, SNAPSHOT_TRADE_CAP)
    .map(toSavedTradeLite);

  return {
    name: profile.name,
    party: profile.party ?? null,
    chamber: profile.chamber ?? null,
    state: profile.state ?? null,
    district: profile.district ?? null,
    photo_url: profile.photo_url ?? null,
    bioguide_id: profile.bioguide_id ?? null,
    total_trades: profile.stats?.total_trades ?? null,
    first_trade: profile.stats?.first_trade ?? null,
    last_trade: profile.stats?.last_trade ?? null,
    buys: profile.stats?.buys ?? null,
    sells: profile.stats?.sells ?? null,
    median_lag_days: profile.disclosureLag?.median ?? null,
    trades,
  };
}

export function buildTradeSnapshot(t: TradeRecord): SavedTradeSnapshot {
  return {
    ...toSavedTradeLite(t),
    politician: t.politician,
    party: t.party ?? null,
    chamber: t.chamber ?? null,
  };
}

// Subtitle for a saved member row: "D · House · CA", omitting absent parts
// rather than rendering separators around blanks.
export function memberSubtitle(m: {
  party?: string | null;
  chamber?: string | null;
  state?: string | null;
}): string {
  return [m.party, m.chamber, m.state].filter(Boolean).join(" · ");
}
