import { describe, expect, it } from "vitest";

import { resolveMemberSlug, slugifyName } from "./slug";

describe("web profile slugs", () => {
  it("matches the Worker's slugifyName", () => {
    expect(slugifyName("Nancy Pelosi")).toBe("nancy-pelosi");
    // NFKD splits the accent off and the class turns it into a hyphen; the
    // Worker does the same, and matching it is the point.
    expect(slugifyName("Nanette Diaz Barrag\u00e1n")).toBe("nanette-diaz-barraga-n");
    expect(slugifyName("  John P. Ricketts ")).toBe("john-p-ricketts");
  });

  const names = ["Joshua Gottheimer", "Nancy Pelosi", "Ro Khanna", "Rohit Khanna"].sort();

  it("resolves a legal-name slug", () => {
    expect(resolveMemberSlug("nancy-pelosi", names)).toBe("Nancy Pelosi");
  });

  it("resolves a display-alias slug to the legal name", () => {
    expect(resolveMemberSlug("josh-gottheimer", names)).toBe("Joshua Gottheimer");
  });

  it("prefers an exact legal-name match over an alias", () => {
    expect(resolveMemberSlug("ro-khanna", names)).toBe("Ro Khanna");
  });

  it("returns null for an unknown or empty slug", () => {
    expect(resolveMemberSlug("nobody-here", names)).toBeNull();
    expect(resolveMemberSlug("", names)).toBeNull();
  });
});
