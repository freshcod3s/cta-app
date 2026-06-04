// Committee shapes from the CTA Worker. Field names match the API responses
// verbatim, per the worker-contract-mirroring product invariant (#8).
// Sources of truth:
//   GET /api/committees/members?name={name}  -> congress-trade-alerts
//        src/routes/api.ts handleCommitteeMembers (roster + meta)
//   GET /api/committees/info                 -> congress-trade-alerts
//        src/routes/committees-info.ts + src/data/committees.json (reference)
//
// Wrappers: { ok: boolean, data: ... } for both endpoints.
//
// Note: the roster the worker returns can include name-format variants of the
// same person as separate rows (the documented trades-table name
// inconsistency). The client dedupes on bioguide -- see api/queries.ts.
import type { Chamber, Party } from "@/features/trades/api/types";

export type CommitteeRole =
  | "Chairman"
  | "Ranking Member"
  | "Vice Chairman"
  | "Ex Officio"
  | "Member"
  | string;

export type CommitteeMember = {
  name: string;
  chamber: Chamber;
  role: CommitteeRole;
  party: Party | null;
  state: string | null;
  // Worker stringifies the district (House only); null for Senate / unknown.
  district: string | null;
  bioguide: string | null;
  photo_url: string | null;
};

export type CommitteeSubcommittee = {
  name: string;
  member_count: number;
};

export type CommitteeRecentEvent = {
  id: string;
  event_type: string;
  committee: string | null;
  date: string;
  title: string;
  sectors: string[];
  url: string;
};

export type CommitteeMembersData = {
  committee: string;
  parent_committee: string | null;
  is_subcommittee: boolean;
  chamber: Chamber | null;
  member_count: number;
  members: CommitteeMember[];
  subcommittees: CommitteeSubcommittee[];
  official_url: string | null;
  recent_activity: CommitteeRecentEvent[];
};

export type CommitteeMembersEnvelope = {
  ok: boolean;
  data: CommitteeMembersData;
};

// --- Reference data (GET /api/committees/info) ---------------------------

export type CommitteeRefSource = { label?: string; url: string };

export type CommitteeRef = {
  slug: string;
  name: string;
  full_name?: string;
  type: string;
  parent_slug: string | null;
  thomas_id?: string;
  jurisdiction: string | null;
  chair: string | null;
  ranking_member: string | null;
  member_count: number;
  sectors: string[];
  official_url?: string | null;
  sources?: CommitteeRefSource[];
};

export type CommitteesInfoData = {
  version: number;
  updated: string;
  note?: string;
  committees: Record<string, CommitteeRef>;
  name_to_slug: Record<string, string>;
};

export type CommitteesInfoEnvelope = {
  ok: boolean;
  data: CommitteesInfoData;
};
