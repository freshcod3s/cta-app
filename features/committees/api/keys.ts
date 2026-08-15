// Query-key registry for the committees feature.
// Lock rule: "Query keys are part of the API contract. Centralize in
// /features/<feature>/api/keys.ts. No inline ad-hoc keys at call sites."
//
// Two server resources back the committee detail screen:
//   members(name, parent?) -> GET /api/committees/members?name={name}[&parent]
//   info()                 -> GET /api/committees/info        (static ref data)
// `name` is the raw (decoded) canonical committee name; `parent` (set only when
// drilling into a subcommittee) is the raw parent name. Both form the cache
// identity -- the worker exact-matches politician_committees.committee, and the
// parent disambiguates same-named subs (e.g. "Health" under multiple parents).
// info() takes no args: one shared cache entry serves every committee screen.
export const committeesKeys = {
  all: ["committees"] as const,
  members: (name: string, parent?: string | null) =>
    [...committeesKeys.all, "members", name, parent ?? null] as const,
  info: () => [...committeesKeys.all, "info"] as const,
};
