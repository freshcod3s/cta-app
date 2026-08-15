// Query-key registry for the members feature.
// Lock rule: "Query keys are part of the API contract. Centralize in
// /features/<feature>/api/keys.ts. No inline ad-hoc keys at call sites."
//
// Separate namespace from tradesKeys: the member profile is its own
// server resource (GET /api/politicians/:name/profile), distinct from
// the trades list/detail surface. The profile's trade feed itself is
// fetched via the shared useTradesList (tradesKeys.list) so it shares
// cache + pagination with the main feed -- no duplicate trade keys here.
export const membersKeys = {
  all: ["members"] as const,
  // name is the raw (decoded) politician name; it is the cache identity.
  profile: (name: string) => [...membersKeys.all, "profile", name] as const,
};
