# Play Console Metadata Draft

Store-listing copy, content-rating questionnaire answers, and target-audience
declaration for the Play Console submission. Companion to
`docs/android-launch-checklist.md` and `docs/data-safety-form.md`.

**OPSEC posture:** field-path-only. Copy placeholders (`<PRODUCT_NAME>`,
`<TAGLINE>`, `<ELEVATOR_PITCH>`, `<SHORT_DESC>`, `<FULL_DESC>`,
`<SCREENSHOT_N_CAPTION>`) substitute at Play Console upload time. The
literal strings live in Joe's offline copy doc.

---

## 1. Store listing copy

| Field | Constraint | Placeholder |
|---|---|---|
| App name | 30 char max | `<PRODUCT_NAME>` |
| Short description | 80 char max | `<SHORT_DESC>` |
| Full description | 4000 char max | `<FULL_DESC>` -- positions the product as a civic-transparency tool per `CLAUDE.md` Strategic positioning; NEVER positions as a fintech / copy-trade / actionable-signal product |
| Promo text / tagline | 80 char max | `<TAGLINE>` |
| Elevator pitch (one-liner) | n/a | `<ELEVATOR_PITCH>` |
| Developer name (public seller) | shown publicly | `<LLC_NAME>` -- LLC seller identity |
| Developer contact email | shown publicly | `<SUPPORT_EMAIL>` -- mirrored across `app/(drawer)/about.tsx` PRESS_EMAIL constant + worker repo `privacy.html` + worker repo `press.ts` per `CLAUDE.md` three-surface email rule |
| Website | URL | `<BRAND_DOMAIN>` |
| Privacy policy URL | URL, must be reachable | `<BRAND_DOMAIN>/privacy` |

---

## 2. Graphical assets

| Asset | Spec | Placeholder |
|---|---|---|
| App icon (Play Console) | 512x512 PNG, 32-bit, transparent | `<ICON_512_FILE>` -- separate from in-app `assets/icon.png` 1024x1024 master |
| Feature graphic | 1024x500 JPG/PNG, no transparency | `<FEATURE_GRAPHIC_1024x500_FILE>` |
| Phone screenshots | min 2, max 8; portrait or landscape; min side 320px, max side 3840px; ratio between 16:9 and 9:16 | `<PHONE_SCREENSHOT_N>` with `<SCREENSHOT_N_CAPTION>` for each |
| 7-inch tablet screenshots | optional; min 2 if any | `<TABLET_7IN_SCREENSHOT_N>` |
| 10-inch tablet screenshots | optional; min 2 if any | `<TABLET_10IN_SCREENSHOT_N>` |
| Foldable screenshots | optional | defer until foldable-specific UX work |
| Promo video (YouTube URL) | optional | defer post-launch |

Recommended phone screenshot set (4 minimum for visual completeness):
1. Trade feed (`app/(drawer)/index.tsx`) with sample data -- `<SCREENSHOT_1_CAPTION>`
2. Trade detail (`app/trade/[id].tsx`) showing methodology footer + source link -- `<SCREENSHOT_2_CAPTION>`
3. Settings push toggle (`app/(drawer)/settings.tsx`) -- `<SCREENSHOT_3_CAPTION>`
4. About / methodology (`app/(drawer)/methodology.tsx`) -- `<SCREENSHOT_4_CAPTION>`

---

## 3. Categorization

| Field | Value | Justification |
|---|---|---|
| App category (primary) | News & Magazines `[VERIFY-PRE-COMMIT]` | Civic-data positioning per `CLAUDE.md` Strategic positioning. Finance category also viable for the literal data subject, but News & Magazines reinforces civic-transparency framing and avoids Finance-category review scrutiny. Joe to confirm before Play upload. |
| Tags (up to 5, Play-curated list) | News, Politics, Government, Stocks, Finance | Mix of framings -- Politics + Government reinforce civic angle even if primary category is News |
| Contains ads | NO | Per `CLAUDE.md` product invariant -- no ads |
| In-app purchases | NO | Per product invariant #1 -- subscriptions via web Stripe Checkout, never IAP |

---

## 4. Content rating (IARC questionnaire)

Play uses the IARC global content-rating questionnaire. Answers below assume
a finance/civic-news app with no user-generated content surfaces, no
violent/sexual/drug content, and no chat/social features.

| # | Question category | Answer | Tag |
|---|---|---|---|
| 1 | Does your app contain violence? | No | [DEFAULT] |
| 2 | Does your app contain fear, horror, or distressing content? | No | [DEFAULT] |
| 3 | Does your app contain sexual content or nudity? | No | [DEFAULT] |
| 4 | Does your app contain crude humor or toilet humor? | No | [DEFAULT] |
| 5 | Does your app contain depictions of or references to discrimination? | No | [DEFAULT] |
| 6 | Does your app contain references to or use of controlled substances (alcohol, tobacco, drugs)? | No | [DEFAULT] |
| 7 | Does your app contain simulated gambling? | No | [DEFAULT] |
| 8 | Does your app contain real gambling with real currency? | No | [DEFAULT] |
| 9 | Does your app contain user-generated content? | No | [DEFAULT] -- watchlist is local-only per product invariant #7; no UGC surfaces |
| 10 | Does your app share user location with other users? | No | [DEFAULT] -- no location permission |
| 11 | Does your app allow users to interact or exchange content with other users? | No | [DEFAULT] -- no social/chat |
| 12 | Does your app allow users to purchase digital goods in-app? | No | [DEFAULT] -- Stripe via web, not in-app |
| 13 | Does your app feature unrestricted internet access? | No | [DEFAULT] -- `expo-web-browser` opens only allowlisted Stripe + source-document URLs per product invariants #1 and #5 |
| 14 | Does your app share user-identifiable info with third parties? | No | [DEFAULT] -- see `docs/data-safety-form.md` |
| 15 | Does your app collect precise location data? | No | [DEFAULT] |
| 16 | Does your app contain offensive language? | No | [DEFAULT] |
| 17 | Does your app contain references to suicide or self-harm? | No | [DEFAULT] |
| 18 | Does your app contain content that promotes hate speech? | No | [DEFAULT] |
| 19 | Does your app contain content involving extremism, terrorism, or political violence? | No | [DEFAULT] -- civic-transparency framing is non-partisan reporting, not extremism |
| 20 | Does your app contain content related to political parties, candidates, or campaigns? | YES (informational only) | App reports public stock-trade disclosures by sitting members of Congress, sourced from official disclosures + Capitol Trades per `app/(drawer)/methodology.tsx:55-60`. Non-partisan; no endorsement / donation / campaign-organizing features. |
| 21 | Does your app encourage political participation (voting, donations, volunteering)? | No | [DEFAULT] -- informational only |
| 22 | Does your app contain content related to gambling or wagering? | No | [DEFAULT] |
| 23 | Does your app encourage users to make financial decisions? | YES (informational only) | App surfaces public disclosures; methodology footer (`app/(drawer)/methodology.tsx`) explicitly disclaims investment advice |
| 24 | Does your app provide investment advice or financial recommendations? | NO | Methodology disclaimer per product positioning; no actionable-signal framing per `CLAUDE.md` Strategic positioning |
| 25 | Does your app allow real-money trading or brokerage activity? | No | [DEFAULT] -- no broker integration; product invariant against fintech drift |
| 26 | Is your app primarily directed at children under 13? | No | [DEFAULT] |
| 27 | Does your app contain ads? | No | [DEFAULT] -- per product invariant |
| 28 | Does your app contain interactive elements (users can interact with content)? | YES (tap a trade to see detail; toggle push; watchlist add/remove) | Standard read-only app interactions |
| 29 | Does your app share user data with third parties (analytics SDKs, ad networks, etc.)? | No | [DEFAULT] -- no client analytics SDK; `docs/data-safety-form.md` row 1 details push token transmission to worker (first-party, not a Play-defined third party) |
| 30 | Does your app provide tools or services for managing personal finances (budgeting, expense tracking, money transfers)? | No | [DEFAULT] -- informational only; no PFM features |

Expected resulting rating: PEGI 3 / ESRB Everyone / USK 0 (informational
content with mild political and financial subject matter; finalized by
IARC after submission).

**Note on questions 20, 23, 24:** these are the only non-defaults. They
reflect the actual content surface (Congress trade disclosures + methodology
disclaimer). IARC treats these as factual reporting, not editorial advocacy.

---

## 5. Target audience declaration

**Declared age band:** 18 and over `[VERIFY-PRE-COMMIT]`

Reasoning:
- Play Families Policy: apps that include detailed financial information or
  that could be misinterpreted as investment advice should not target
  Designed-for-Families.
- Finance-category target-audience norms in Play Console pull-down: 18+ is
  the standard for trading/investment apps.
- The civic-transparency framing is not Designed-for-Families either;
  political reporting typically lands in 13+ to 18+ depending on the
  Play classifier.

`[VERIFY-PRE-COMMIT]` items:
- Confirm against current Play Families Policy text (verify before commit
  to 18+; Play has revised this policy multiple times).
- Confirm 13+ is not a viable framing if civic-data positioning is loud
  enough to outweigh the finance subject. Industry precedent leans 18+ for
  any app that surfaces named trade data, even when not providing advice.
- Joe may swap 18+ -> 13+ if research returns supporting that.

---

## 6. Additional Play declarations

| Declaration | Value | Source |
|---|---|---|
| Government app | NO | Independent civic-data tool; not government-published |
| News app | DECIDE `[VERIFY-PRE-COMMIT]` | Civic-data tool is borderline -- Play has a specific definition for "news app" that may or may not apply. Recommend NO unless explicitly aligned with Play's news-publisher requirements (verifiable editorial standards, fact-checking process, etc.). |
| Financial-features app | YES | Surfaces securities trades; triggers Play's finance-app declaration even though no advice / no broker integration |
| Health app | NO | n/a |
| COVID-19 contact-tracing | NO | n/a |
| User-generated content | NO | Watchlist is local-only per product invariant #7 |
| Designed-for-Families | NO | 18+ target audience; finance content not eligible |
| Data sharing across the EEA | n/a until EU launch | Apple auto-pulls D&B address for EU DSA fields per `docs/launch/canonical_address.md`; same posture applies to Play's EU obligations when EU distribution is enabled |

---

## 7. Pre-submission gates

Before clicking Submit for review in Play Console:

- [ ] All copy placeholders substituted with final strings (Joe-side).
- [ ] All screenshot files dropped in with caption mapping confirmed.
- [ ] Privacy policy URL returns 200 + contains all sections cited in `docs/data-safety-form.md` (encryption-in-transit, encryption-at-rest, deletion mechanism, contact email).
- [ ] Data Safety form (`docs/data-safety-form.md`) entered into Play Console UI; verified summary matches.
- [ ] Content rating questionnaire submitted; resulting IARC rating reviewed and acceptable.
- [ ] Target audience set per `[VERIFY-PRE-COMMIT]` outcome (18+ default; 13+ alternative).
- [ ] App category set per `[VERIFY-PRE-COMMIT]` outcome (News & Magazines default; Finance alternative).
- [ ] News-app declaration set per `[VERIFY-PRE-COMMIT]` outcome.
- [ ] Pricing & distribution: free; country list set; tax category set.
- [ ] App bundle uploaded to internal testing track via `eas submit -p android --profile production` (see `docs/android-launch-checklist.md` section 7 + T7 deliverable).
