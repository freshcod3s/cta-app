// Web profile slugs -> the legal name the app's member route takes (pure).
//
// The site links a member as /politician/<slug>, where slug is
// slugifyName(name) -- ported from congress-trade-alerts
// src/social/og-head.ts; keep the two identical. The Worker matches the slug
// of the legal (filing) name; the web dashboard also accepts the slug of the
// display alias (e.g. josh-gottheimer -> Joshua Gottheimer), so this does too.
import { DISPLAY_NAMES } from "@/lib/util/display";

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// The legal name whose slug (or whose display alias's slug) equals `slug`,
// or null. Names are scanned in the order given; the caller passes a sorted
// list so a slug shared by two names always resolves the same way.
export function resolveMemberSlug(slug: string, names: readonly string[]): string | null {
  const want = slugifyName(slug);
  if (!want) return null;
  for (const name of names) {
    if (slugifyName(name) === want) return name;
  }
  for (const name of names) {
    const alias = DISPLAY_NAMES[name];
    if (alias && slugifyName(alias) === want) return name;
  }
  return null;
}
