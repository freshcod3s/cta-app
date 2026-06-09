// Committees-feature queries. Uses centralized keys from ./keys (Lock rule).
//
// Two independent server-state reads back the committee detail screen:
//   useCommitteeMembers(name) -> GET /api/committees/members?name={name}
//   useCommitteesInfo()       -> GET /api/committees/info  (shared reference)
//
// The roster is deduped in `select` so every consumer sees the collapsed list
// and an honest member_count (see dedupeMembers). The reference data is a thin
// static lookup the worker caches hard; selectCommitteeRef resolves a record
// for a committee NAME without mounting a second hook.
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { committeesKeys } from "./keys";
import type {
  CommitteeMember,
  CommitteeMembersData,
  CommitteeMembersEnvelope,
  CommitteeRef,
  CommitteesInfoData,
  CommitteesInfoEnvelope,
} from "./types";

// Canonicalize a committee name for the ?name= param + cache key. The worker
// exact-matches politician_committees.committee, and the profile CSV that feeds
// the chips already carries canonical mixed-case names, so we only trim (no
// case-fold -- "Armed Services", not "ARMED SERVICES").
export function normalizeCommitteeName(name: string | undefined): string {
  return (name ?? "").trim();
}

// Dedupe roster rows by bioguide. The worker returns name-format variants of
// the same person as separate rows (e.g. "Alma Adams" / "Alma S Adams" /
// "Alma S. Adams", all bioguide A000370 -- the documented trades-table name
// inconsistency), which inflates member_count. We collapse on bioguide (the
// stable identity), falling back to name when bioguide is null. Rows arrive
// role-sorted from the worker, so keeping the first occurrence preserves the
// most senior role and a stable order.
export function dedupeMembers(members: CommitteeMember[]): CommitteeMember[] {
  const seen = new Set<string>();
  const out: CommitteeMember[] = [];
  for (const m of members) {
    const key = m.bioguide ?? m.name;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

// useCommitteeMembers -- GET /api/committees/members?name={name}[&parent].
// Roster + chamber + official_url + subcommittees. Pass `parent` when drilling
// into a SUBCOMMITTEE (the worker then filters on parent_committee +
// is_subcommittee=1); omit it for a parent committee. The parent also
// disambiguates same-named subs across parents (e.g. "Health"). The roster is
// deduped and member_count recomputed in `select`. staleTime 1h: committee
// membership moves on the order of weeks, so a warm cache is safe.
export function useCommitteeMembers(name: string, parent?: string | null) {
  const clean = normalizeCommitteeName(name);
  const cleanParent = parent ? normalizeCommitteeName(parent) : null;
  return useQuery({
    queryKey: committeesKeys.members(clean, cleanParent),
    queryFn: ({ signal }) =>
      apiFetch<CommitteeMembersEnvelope>(
        `/api/committees/members?name=${encodeURIComponent(clean)}` +
          (cleanParent ? `&parent=${encodeURIComponent(cleanParent)}` : ""),
        { signal },
      ),
    enabled: clean.length > 0,
    staleTime: 1000 * 60 * 60,
    select: (env): CommitteeMembersData => {
      const members = dedupeMembers(env.data.members ?? []);
      return { ...env.data, members, member_count: members.length };
    },
  });
}

// useCommitteesInfo -- GET /api/committees/info. Static reference data
// (jurisdiction, leadership, sectors, official URLs) keyed by slug + a
// name_to_slug index. The worker caches this hard (24h browser / 7d edge) and
// it only changes on redeploy, so a long client staleTime keeps one shared
// cache entry warm for every committee screen.
export function useCommitteesInfo() {
  return useQuery({
    queryKey: committeesKeys.info(),
    queryFn: ({ signal }) =>
      apiFetch<CommitteesInfoEnvelope>("/api/committees/info", { signal }),
    staleTime: 1000 * 60 * 60 * 24,
    select: (env) => env.data,
  });
}

// Resolve the reference record for a committee NAME via name_to_slug. Returns
// null when the committee isn't in committees.json -- the header then degrades
// to the fields the members endpoint already provides. Pure selector so the
// screen can call it on useCommitteesInfo() data without a second hook.
export function selectCommitteeRef(
  info: CommitteesInfoData | undefined,
  name: string,
): CommitteeRef | null {
  if (!info) return null;
  const slug = info.name_to_slug[name] ?? info.name_to_slug[name.trim()];
  if (!slug) return null;
  return info.committees[slug] ?? null;
}
