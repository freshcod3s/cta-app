// Query-key registry for the committees feature.
// Lock rule: "Query keys are part of the API contract. Centralize in
// /features/<feature>/api/keys.ts. No inline ad-hoc keys at call sites."
//
// Two server resources back the committee detail screen:
//   members(name) -> GET /api/committees/members?name={name}  (roster + meta)
//   info()        -> GET /api/committees/info                 (static ref data)
// `name` is the raw (decoded) canonical committee name and is the cache
// identity -- the worker exact-matches politician_committees.committee on it.
// info() takes no args: one shared cache entry serves every committee screen.
export const committeesKeys = {
  all: ["committees"] as const,
  members: (name: string) => [...committeesKeys.all, "members", name] as const,
  info: () => [...committeesKeys.all, "info"] as const,
};
