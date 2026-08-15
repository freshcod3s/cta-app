# ASC age rating + export compliance -- Congress Trade Alerts iOS v1

Drafted 2026-07-11 against the CURRENT App Store Connect age-rating
system (the 2025 overhaul: tiers 4+/9+/13+/16+/18+, old 12+/17+ removed,
updated questionnaire mandatory since 2026-01-31). Question categories
and their rating triggers verified 2026-07-11 from Apple's
"Age ratings values and definitions" reference page
(developer.apple.com/help/app-store-connect/reference/app-information/
age-ratings-values-and-definitions/) and the "Set an app age rating"
help page.

**SUPERSEDES the AGE_RATING_QUESTIONNAIRE_INPUTS block in
store/app-store/metadata.txt (lines 49-70)** -- that block is the old
pre-2026 questionnaire and predicts 12+, a tier that no longer exists.
Follow-up: update metadata.txt to point here (not touched by this task).

---

## 1. Questionnaire answers

App context for every answer: informational civic-transparency tool
displaying public STOCK Act disclosure records (member names, tickers,
amount ranges, dates, committee assignments). No user accounts, no
user-generated content, no ads, no purchases, no chat. All editorial
content is factual government-record data.

### Step 1 -- In-app controls
| Question | Answer | Note |
|---|---|---|
| Parental controls | No | None exist; none needed |
| Age assurance | No | No age gate; app has no age-sensitive content |

### Capabilities
| Question | Answer | Note |
|---|---|---|
| Unrestricted Web Access | **No** | See rationale below -- this is the only question needing justification |
| User-Generated Content | No | No accounts, no posting, no comments; nothing user-created exists in-app |
| Messaging and Chat | No | None |
| Social Media | No | None |
| Advertising | No | No ads of any kind |

**Unrestricted Web Access rationale (answer: No).** This question
targets apps that provide open, general-purpose web browsing (a browser
or browser-equivalent); answering Yes forces a 16+ floor per Apple's
definitions page. CTA does not embed a browser. External links
(official committee pages, source filings at disclosures-clerk.house.gov
/ ethics.senate.gov, press-kit page, news items) open via
expo-web-browser, which presents SFSafariViewController -- the system
browser surface -- or hand off entirely via Linking.openURL. Every link
target is a developer-specified URL; there is no address bar, no
search-the-web entry point, and no in-app WebView (Product Invariant #5
in the codebase bans WebViews). Curated outbound links to the system
browser are the App Store norm for news/reference apps rated 4+ and do
not constitute providing unrestricted web access. Residual nuance,
flagged for honesty: once SFSafariViewController is open the user can
navigate onward within it; Apple's question, per its definitions,
concerns the app *providing* unfettered access (browser functionality),
which this is not. Confidence: high.

### Violence
| Question | Answer |
|---|---|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic or Sadistic Realistic Violence | None |
| Guns or Other Weapons | None |
| Violent themes (new-category umbrella) | None |

### Sexuality or nudity
| Question | Answer |
|---|---|
| Mature or Suggestive Themes | None |
| Sexual Content or Nudity | None |
| Graphic Sexual Content and Nudity | None |

### Mature themes
| Question | Answer |
|---|---|
| Profanity or Crude Humor | None |
| Horror/Fear Themes | None |
| Alcohol, Tobacco, or Drug Use or References | None |

### Medical or wellness (new 2026 category)
| Question | Answer | Note |
|---|---|---|
| Medical or Treatment Information | None | Financial-disclosure data only |
| Health or Wellness Topics | No | |

### Chance-based activities
| Question | Answer | Note |
|---|---|---|
| Gambling (real) | No | Yes would force 18+ |
| Simulated Gambling | None | |
| Contests | None | |
| Loot Boxes | No | |

### Financial content -- no question exists
Verified against the current category list: the questionnaire has **no
"financial information" descriptor**. Displaying congressional financial
disclosures is unrated factual reference content; there is nothing to
declare. (The app gives no investment advice and states so in the
description; that is a review-notes point under guideline 2.3.10 /
positioning, not an age-rating input.) If a reviewer probes, the answer:
the app reports public government records, comparable to a news app.

### AI/chatbot consideration
Apple's 2025 guidance says to account for AI assistant/chatbot features
when judging content frequency. CTA has none -- no generative surface,
no chat. Nothing to declare.

## 2. Expected resulting rating: **4+**

Every content descriptor is None and every capability question is No,
which triggers no tier floor -- the computed global rating is 4+ under
the current system. This matches the 2026-06-14 research note in
store/mac-cc-asc-prompt.md ("A clean news app rates 4+"). Flag: the
rating is COMPUTED by ASC from the submitted answers -- Apple's help page
confirms selections translate to the global tier plus region-specific
ratings (e.g. Brazil, Korea) automatically, and Apple may override
upward. Treat 4+ as the expected outcome, not a guarantee; if the form
yields anything else at submission time, stop and reconcile the answer
set against this file before accepting it.

## 3. Export compliance

- app.json already sets ios.config.usesNonExemptEncryption=false, which
  Expo prebuild writes to Info.plist as ITSAppUsesNonExemptEncryption=
  false -- ASC will not show the export-compliance prompt at submission.
- Verified exempt per Apple's "Complying with Encryption Export
  Regulations": the app uses only OS-provided standard TLS (HTTPS fetch
  to congresstradealerts.com plus system push); Apple states OS-built-in
  encryption such as HTTPS via URLSession "is exempt from export
  documentation upload requirements." No proprietary crypto anywhere.
- No annual BIS self-classification report obligation: under Note 4 to
  Category 5 Part 2 of the EAR (added 75 FR 36482, 2010-06-25), an item
  whose primary function is not communications/networking/computing/
  information-security, with cryptography limited to supporting that
  primary function, falls outside Cat. 5 Pt. 2 entirely (EAR99) -- so
  the License Exception ENC self-classification reporting regime never
  attaches. FLAG: Apple's own doc hedges that exempt apps "might" owe a
  year-end self-classification report (that applies to 740.17(b)(1)
  self-classified items, not Note 4/EAR99 items); this Note 4 reading is
  the standard industry analysis for an informational app using only
  TLS, but it is a self-made classification, not a BIS ruling.
