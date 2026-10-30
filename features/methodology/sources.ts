// Public provenance for the information displayed in the mobile app.
// Government records, third-party delivery, and our analysis are distinct.
export const GOVERNMENT_DISCLAIMER =
  "Congress Trade Alerts is an independent app. It does not represent, and is " +
  "not affiliated with or endorsed by, any government entity.";

export type InformationSource = {
  name: string;
  url: string;
  description: string;
};

export const GOVERNMENT_SOURCES: InformationSource[] = [
  {
    name: "U.S. House Clerk - financial disclosures",
    url: "https://disclosures-clerk.house.gov/FinancialDisclosure",
    description: "Official House financial disclosures and Periodic Transaction Report (PTR) documents.",
  },
  {
    name: "U.S. Senate - public financial disclosures",
    url: "https://efdsearch.senate.gov/search/",
    description: "Official Senate financial disclosures and PTRs. The public search requires acknowledging its use terms.",
  },
  {
    name: "U.S. House - representatives",
    url: "https://www.house.gov/representatives",
    description: "Official House member directory for checking member names, states, and districts.",
  },
  {
    name: "U.S. Senate - senators",
    url: "https://www.senate.gov/senators/",
    description: "Official Senate member directory for checking names and states.",
  },
  {
    name: "U.S. House Clerk - committees",
    url: "https://clerk.house.gov/Committees",
    description: "Official House committee membership and links to committee websites and jurisdiction information.",
  },
  {
    name: "U.S. Senate - committees",
    url: "https://www.senate.gov/committees/",
    description: "Official Senate committee membership and links to committee websites and jurisdiction information.",
  },
  {
    name: "Congress.gov",
    url: "https://www.congress.gov/",
    description: "Official legislative records used for committee activity, including bills, hearings, and votes.",
  },
  {
    name: "Biographical Directory of the U.S. Congress",
    url: "https://bioguide.congress.gov/",
    description: "Official congressional biographies and an additional source for member portraits.",
  },
  {
    name: "House Ethics - financial disclosure guidance",
    url: "https://ethics.house.gov/financial-disclosure/",
    description: "Official House reporting requirements, including PTR deadlines.",
  },
  {
    name: "Senate Ethics - financial disclosure guidance",
    url: "https://www.ethics.senate.gov/public/index.cfm/financialdisclosure",
    description: "Official Senate reporting requirements, including PTR deadlines.",
  },
];

export const OTHER_SOURCES: InformationSource[] = [
  {
    name: "unitedstates/congress-legislators",
    url: "https://github.com/unitedstates/congress-legislators",
    description: "Independent dataset used to assemble member profiles and committee assignments. It is not a government service; check the official directories above for the underlying information.",
  },
  {
    name: "unitedstates/images",
    url: "https://github.com/unitedstates/images",
    description: "Independent collection used for member portraits, with Bioguide as an additional official source.",
  },
  {
    name: "Capitol Trades - historical records",
    url: "https://www.capitoltrades.com/trades",
    description: "Third-party provider of some historical trade records. It is not our current filing feed. Some historical rows do not have a direct original-filing link; use the official House or Senate search above to investigate them.",
  },
  {
    name: "Finnhub - company profiles",
    url: "https://finnhub.io/docs/api/company-profile2",
    description: "Company names, industries, and market capitalization where available, supplemented by locally maintained company details. These are not government disclosures.",
  },
  {
    name: "GDELT - related news",
    url: "https://www.gdeltproject.org/",
    description: "Finds related news articles. Each article links to its publisher; news is separate from official filing evidence.",
  },
  {
    name: "Anthropic Claude - company summaries",
    url: "https://www.anthropic.com/claude",
    description: "Some company descriptions are generated with AI when available. They may contain errors and are not government records or filing evidence.",
  },
];
