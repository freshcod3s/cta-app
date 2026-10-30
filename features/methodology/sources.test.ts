import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { describe, expect, it } from "vitest";

import { GOVERNMENT_DISCLAIMER, GOVERNMENT_SOURCES, OTHER_SOURCES } from "./sources";

const metadata = readFileSync(new URL("../../store/google-play/metadata.txt", import.meta.url), "utf8");
const full = metadata.split("FULL_DESCRIPTION (max 4000):\n")[1]?.split("\n\nPRIMARY_CATEGORY:")[0].trim();

describe("government information source disclosures", () => {
  it("keeps the Play description complete when an in-app provider is added", () => {
    expect(full).toBeTruthy();
    for (const source of [...GOVERNMENT_SOURCES, ...OTHER_SOURCES]) {
      expect(full, `Missing listing attribution: ${source.name}`).toContain(source.url);
      expect(source.description.length).toBeGreaterThan(20);
      expect(new URL(source.url).protocol).toBe("https:");
    }
  });

  it("covers government information beyond transaction filings", () => {
    const hosts = GOVERNMENT_SOURCES.map((source) => new URL(source.url).hostname);
    expect(hosts).toEqual(expect.arrayContaining([
      "disclosures-clerk.house.gov", "efdsearch.senate.gov", "clerk.house.gov",
      "www.house.gov", "www.senate.gov", "www.congress.gov", "bioguide.congress.gov",
      "ethics.house.gov", "www.ethics.senate.gov",
    ]));
    expect(OTHER_SOURCES.some((source) => source.url.includes("capitoltrades.com"))).toBe(true);
  });

  it("puts non-affiliation first and stays within Play field limits", () => {
    expect(full?.startsWith(GOVERNMENT_DISCLAIMER)).toBe(true);
    expect(full!.length).toBeLessThanOrEqual(4000);
    const short = metadata.match(/SHORT_DESCRIPTION \(max 80\): (.+)/)?.[1];
    expect(short?.length).toBeLessThanOrEqual(80);
    expect(metadata).toContain("APP_NAME (max 30): Congress Trade Alerts");
    expect(full).not.toMatch(/all data comes from|every congressional stock trade/i);
  });
});
