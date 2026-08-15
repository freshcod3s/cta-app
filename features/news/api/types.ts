// News item shape from the politician profile's `news` array
// (GET /api/politicians/{name}/profile -> data.news). Mirrors the Worker's
// NewsItem (congress-trade-alerts src/enrichment/news.ts): GDELT-sourced,
// deduped, cached ~1h server-side. There is NO per-trade or per-ticker news
// endpoint -- news is per-member and only surfaced inside the profile.
//
// `image` is kept on the type for forward-compat, but NewsSection does NOT
// render it: GDELT socialimage URLs decay from ~50% resolvable at ingest to
// <5% within 24h on premium publishers (WAF / CDN-token / referer blocks),
// so a broken <Image> would be the common case. Text-only render.
export type NewsItem = {
  title: string;
  link: string;
  source: string;
  published: string; // ISO
  image?: string | null;
};

// Minimal view of the profile envelope -- this slice only reads `news`.
export type NewsProfileEnvelope = {
  ok: boolean;
  data?: { news?: NewsItem[] };
};
