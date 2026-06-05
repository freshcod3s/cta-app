# CTA launch research -- vaulted 2026-06-04

External deep-research (run by Joe), saved here as the cross-chat + cross-machine
record. Eight topics (P1-P8). Verdicts + key findings + checklists + primary
source URLs. NOT legal advice where noted; a securities attorney signs off on P2/P4.

Status tags: P1 confirmed against Apple's own doc; P4/P6 high-confidence; the rest
are well-sourced but verify the specifics before relying in copy/press.

---

## P1 -- Individual -> Organization app transfer  [BLOCKER]

**Bottom line: NO. You cannot transfer a never-released / TestFlight-only app from
an Individual account to an Organization account.** Apple's criterion: "The app
must have at least one version that was released to the App Store." So shipping
under Individual now and transferring to the LLC later requires a PUBLIC release
under the Individual seller identity first.

**For the actual goal (LLC = public seller identity):** do NOT public-release under
Individual. Wait for D-U-N-S / Organization approval (or have Apple convert the
membership) BEFORE the first public release.

Transfer is also blocked while the app is in: pre-order; Processing for
Distribution / Waiting for Review / In Review / Accepted / Pending Developer
Release / Pending Apple Release. Both accounts must be non-pending and on the
latest agreements (+ EU Alternative Terms addendum if used). IAP products must be
Approved/Ready to Submit/Developer Removed/Rejected with no duplicate product IDs
on the recipient. Apple Arcade + certain sandboxed Mac apps can't transfer.

Active subscriptions/IAP are NOT an automatic blocker (need an app-specific shared
secret; recipient regenerates after). Transfer preserves bundle ID, reviews,
ratings, availability, update path; Apple does NOT formally promise search-ranking
preservation. Re-creating fresh under the Org is clean ONLY if no build was ever
uploaded to the Individual record (an uploaded build can burn the bundle ID).

Sources:
https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria/
https://developer.apple.com/help/app-store-connect/transfer-an-app/overview-of-app-transfer/
https://developer.apple.com/help/app-store-connect/transfer-an-app/initiate-an-app-transfer/
https://developer.apple.com/help/account/membership/program-enrollment/

---

## P2 -- App Store review for a congressional-trade civic app  [BLOCKER-adjacent]

**Bottom line: the app is approvable; the real risk is the Pro monetization flow,
not the STOCK Act content.** Read-only civic transparency is low-risk -- Apple
already hosts Quiver Quantitative, Unusual Whales (Finance), and even Autopilot
(brokerage connect + auto-execute, wrapped in SEC-RIA disclosures).

Guidelines that matter:
- 3.1.1 / 3.1.1(a) / 3.1.3 (payments): baseline still says in-app unlocks use IAP
  and bans "license keys" as a self-unlock. BUT as of the May 1, 2025 update,
  external purchase links/buttons are allowed WITHOUT an entitlement on the **US
  storefront**. So "Upgrade on web" -> your Stripe checkout is defensible US-only.
  Non-US storefronts: assume IAP required unless you hold a regional entitlement.
- 3.2.1(viii) (finance): trading/investing/money-management apps must be submitted
  by the licensed institution. Stay clearly NON-trading/advice. (Note: current
  guidelines renumber -- "5.4" is now VPN apps, not financial services.)
- 1.1 / 1.1.6 (content): no defamatory/false framing. Use neutral labels
  ("disclosed trade", "late-filed disclosure"), never assert "insider/corrupt/
  illegal" as fact.
- 2.3 / 5.2.2 (metadata/3rd-party data): accurate metadata + Notes for Review
  declaring civic/read-only scope; keep proof of any data-provider terms.

**The weak spot:** an "API-key paste to unlock Pro" pattern reads like a license-key
self-unlock under old 3.1.1. Use account login + server-side entitlement instead.
Lowest-risk v1: ship FREE/read-only first; add Pro after approval (US external
Stripe with account entitlement, or IAP-backed for global).

Category: primary News or Reference (Finance only if you lean into tickers, with
explicit no-trading posture). Civic framing materially lowers review risk vs
copy-trade framing. Provide a demo/Pro-enabled account for the reviewer.

Disclaimer to embed (onboarding + detail + legal): "Displays public financial-
disclosure records for civic transparency. Not investment advice, recommendations,
or brokerage. Disclosures may be delayed/amended/incomplete and reported in ranges.
Verify against official House/Senate sources." Attribute sources as "U.S. House
Office of the Clerk" and "U.S. Senate Select Committee on Ethics".

Sources:
https://developer.apple.com/app-store/review/guidelines/
https://developer.apple.com/app-store/categories/
https://apps.apple.com/us/app/quiver-quantitative/id1568546369
https://apps.apple.com/us/app/unusual-whales/id1514447510
https://apps.apple.com/us/app/autopilot-automated-investing/id1613625799
https://disclosures-clerk.house.gov/FinancialDisclosure
https://www.ethics.senate.gov/public/index.cfm/financialdisclosure

---

## P3 -- Congressional stock-trading ban legislation (mid-2026)

**Bottom line: no federal ban is law; momentum is real but fractured (full-divest
ban vs narrow purchase ban).** ~86% public support, but leadership bottlenecks
floor action. No comprehensive ban has had a floor vote in the 119th Congress as
of mid-2026 (verify specifics on Congress.gov before citing).

Live vehicles:
- S.1498 HONEST Act (formerly Hawley PELOSI Act) -- full ban + divestiture; covers
  members/spouses/dependents (+ President/VP in text); reported by Senate HSGAC
  Dec 2025. Best Senate procedural posture, low floor odds.
- H.R.7008 Stop Insider Trading Act (Steil) -- restriction not true ban: bans NEW
  purchases, 7-14 day advance sale notice, NO divestiture; reported, Union Calendar
  Feb 2026, ~93 cosponsors; Trump publicly backed it (Feb 2026). Most plausible
  narrow bill, but the Q1 House vote slipped.
- S.4134 (Ricketts) -- Senate companion to H.R.7008; referred to HSGAC, no markup
  scheduled (as of Mar 31, 2026).
- H.R.5106 Restore Trust in Congress Act (Roy) -- true House full ban + divest;
  ~128 cosponsors; coalition splintered after leadership backed the milder Steil
  bill.
- H.R.4890 ETHICS Act (Krishnamoorthi); H.R.396 TRUST in Congress (blind-trust);
  plus PELOSI-House / No Getting Rich variants -- mostly stalled at referral.

White House: supportive only in the NARROW lane (Trump pushed Stop Insider Trading
Act; criticized broader bills that cover the President/VP). Realistic outlook: if
anything passes in 2026 it's a watered-down purchase-ban-only bill; "late 2026 /
lame duck" more likely than summer; "no enactment this Congress" is live.

**Product implication: a ban is a TAILWIND, not a threat.** STOCK Act disclosure
obligations + the historical record persist; a ban creates compliance events
(divestiture deadlines, certifications, late/missing-notice flags). Pivot framing
from "what are they buying" to "are they complying" -- conflict/committee-overlap
context, divestiture tracking, before-ban archive. Copy-trade demand would fall;
civic-transparency demand rises. Civic framing is ban-robust; copy-trade is gutted.

Sources:
https://www.congress.gov/bill/119th-congress/senate-bill/1498
https://www.congress.gov/bill/119th-congress/house-bill/7008
https://www.congress.gov/bill/119th-congress/house-bill/5106
https://www.everycrsreport.com/reports/R48641.html
https://rollcall.com/2026/03/31/congress-stock-trading-ban-what-happened/

---

## P4 -- Civic transparency vs investment-adviser line  [general research, attorney needed]

**Bottom line: the line is PERSONALIZATION.** Under the Investment Advisers Act and
Lowe v. SEC (472 U.S. 181, 1985), impersonal, bona fide publishing to the public at
large is NOT "investment adviser" activity even when it names securities. CTA's
civic-not-fintech lock sits on the protected (Lowe) side. The danger is converting
impersonal publishing into individualized advice or a performance/return engine.

To stay a "publisher": impersonal (not tailored to a user's portfolio/risk/goals),
bona fide (not a touting front; no undisclosed positions -- see SEC v. Capital
Gains Research Bureau), general+regular circulation (news cadence, not market-timed
tips).

Framing-risk map:
- SAFE: raw disclosure feed (member/date/ticker/type/range/filing date/source link);
  search/filter; source attribution + late-filing/amended flags; neutral conflict
  score (committee/bill overlap); civic leaderboards ("most active discloser",
  "late-filing").
- RISKY: "congressional portfolio performance" charts; backtests ("following
  Congress returned X%"); "most traded -> best opportunities" framing.
- RADIOACTIVE: "alpha"/"beat the market"/"smart money"/"actionable signal"; buy/
  sell/hold labels; "copy/mirror Pelosi"/one-click copy; broker links/order
  buttons/affiliate-per-trade; onboarding that takes portfolio/risk/goals then
  ranks tickers; AI chat that answers "given my portfolio, should I buy X";
  model portfolios / "Congress ETF". Performance/alpha claims also trigger the SEC
  Marketing Rule (17 CFR 275.206(4)-1: substantiation, hypothetical-performance
  burdens).

Keep personalization to content ROUTING ("notify me about these tickers/members"),
not advice. Monetize convenience (saved searches, alerts, CSV export, source PDFs,
committee/bill overlays) -- never "premium picks". Counsel reviews the actual
screens/paywall/alerts/onboarding/AI/SEO/metadata, not just the disclaimer.

Sources:
https://www.law.cornell.edu/uscode/text/15/80b-2
https://supreme.justia.com/cases/federal/us/472/181/  (Lowe v. SEC)
https://supreme.justia.com/cases/federal/us/375/180/  (Capital Gains Research Bureau)
https://www.law.cornell.edu/cfr/text/17/275.206%284%29-1  (Marketing Rule)
https://law.justia.com/cases/federal/district-courts/new-york/nysdce/1%3A2023cv05849/601791/37/  (Seeking Alpha, 2024)

---

## P5 -- EU DSA trader disclosure / public address

**Bottom line: for an LLC Organization account, the EU App Store page publicly shows
seller legal name, address, phone, email -- and the ADDRESS is auto-pulled from your
D-U-N-S / D&B record.** So D&B is the control point, not a free-typed Apple field.

- DSA Art. 30 requires the platform to collect + publicly display trader name/
  address/phone/email (+ ID, payment account, registration #, self-certification).
  Apple has blocked EU distribution without verified trader status since 2025-02-17.
- Organization: public address = the D-U-N-S address; change it VIA D&B (allow ~2
  business days to sync to Apple), not in Apple settings.
- CMRA / iPostal1: plausible but NOT explicitly blessed. Apple's doc allows an
  alternate display address (e.g., PO box) WITH documentation, but for an Org the
  address tracks D-U-N-S -- so set D&B to the address you want public. Confirm CMRA
  acceptability with D&B directly (case-by-case verification risk).
- Registered-agent address: weak for D&B/Apple identity (it's for service of
  process); use only if also documented as the LLC's business/principal address.
- Privacy: an Org account exposes only the DUNS-tied address -> forming the LLC
  keeps your HOME address off the public listing. Individual enrollment would
  expose personal name + contact.

Checklist: identical legal name across WV SoS + D&B + Apple Developer + App Store
Connect; public EU address = D&B record (set via D&B); business phone + email (both
public); enroll as Organization (no DBA/trade names); verify the EU product-page
trader block in an EU storefront before enabling EU distribution.

Sources:
https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/
https://developer.apple.com/help/account/membership/D-U-N-S/
https://developer.apple.com/programs/enroll/
https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2065  (DSA)

---

## P6 -- App Privacy "Data Not Collected"  [high confidence]

**Bottom line: do NOT claim "Data Not Collected".** Apple's "collect" = transmitted
off-device and RETAINED beyond servicing the real-time request. A push token stored
server-side to deliver notifications is therefore collected. The defensible posture:
**Identifiers -> Device ID, collected, App Functionality, Data NOT Linked to You,
Tracking: NO** -- mirroring DuckDuckGo (which declares "Not Linked to You", not
"Not Collected").

- The optional-disclosure escape hatch fails (it needs infrequent, non-core, user-
  typed-with-name data; push is core functionality).
- You are NOT "Tracking" (no third-party-data linking, no ads, no broker, no
  analytics SDK) -> Tracking NO; no ATT prompt needed.
- If the app sends a "push opened/tapped" event to your server, declare Usage Data
  -> Product Interaction -> Analytics -> Not Linked -> Tracking NO. If engagement is
  inferred only from APNs/FCM delivery receipts (no app->server callback), OMIT
  Usage Data.

Exact App Store Connect answers:
- Identifiers -> Device ID: Collected = Yes; Use = App Functionality; Linked = No;
  Tracking = No.
- Usage Data -> Product Interaction (only if app pings server on open): Yes;
  Analytics; Linked = No; Tracking = No.
Implementation: store tokens with NO account/email/phone/IP/IDFA/fingerprint; keep
engagement as aggregate counters not per-token rows; no analytics/ad SDKs. Android/
Play equivalent: "Device or other IDs" (App functionality), shared-with-processor
= yes if using Expo/FCM. ACTION: update store/app-store/privacy-checklist.md.

Sources:
https://developer.apple.com/app-store/app-privacy-details/
https://developer.apple.com/app-store/user-privacy-and-data-use/
https://apps.apple.com/us/app/duckduckgo-duck-ai-vpn/id663592361
https://support.google.com/googleplay/android-developer/answer/10787469

---

## P7 -- Competitive scan (2026)

**Bottom line: the market is crowded with FINTECH/copy-trade + account-based tools;
a privacy-first, no-tracking, civic-accountability app is genuine white space.**
STOCK Act data is disclosure-after-lag (~30-45 days), not real-time -- make the lag
a feature.

- Quiver Quantitative -- "alternative data" for traders; freemium ~$25-30/mo or
  $300/yr; web+iOS+Android; backtester/leaderboards/copytrade; account-based.
- Unusual Whales -- options-flow/dark-pool platform; Congress is a tab; ~$42-170/mo;
  web+iOS+Android; heavy engagement tracking.
- Autopilot -- explicit copy-trade; connects brokerage + auto-executes; ~$100/yr +
  $500 min per portfolio; SEC-registered adviser; Plaid brokerage access. The foil.
- eToro "Copy Congress" -- regulated brokerage Smart Portfolios; $500 min; NOT
  available to US users; full KYC.
- Capitol Trades (2iQ) -- free web dashboard; B2B lead-gen for 2iQ's enterprise data.
- Kapitol.ai / Stockcircle / Pelosi Tracker / Insiderwave -- subscription
  investor-edge / copy-trade tools; "alpha"/"insider score"/"profit" framing.

White space = "Digital public infrastructure": no accounts, no ad/analytics SDK, no
brokerage, no portfolio import, local-only watchlists, anonymous push tokens,
original filing linked on every trade, disclosure-lag shown.

Press/launch angles:
1. "The Congress-trades app that won't let you copy them -- on purpose."
2. "No account. No brokerage. No trackers. Just public records." (vs Plaid-grabbing
   copy-trade apps).
3. "Every trade with its delay label" (bought Jan 4, filed Feb 17, published +44d).
4. "From stock picks to conflict maps" (committees/bills/lobbying/contracts).
5. "A privacy nutrition label for civic tech" -- publish a plain-language pledge.
Build a contrast table: copy-trade apps vs civic-transparency app, claims binary +
auditable.

Sources:
https://www.quiverquant.com/congresstrading/
https://apps.apple.com/us/app/unusual-whales/id1514447510
https://www.joinautopilot.com/
https://www.etoro.com/news-and-analysis/press-releases/copy-congress-trades-etoro-launches-three-portfolios-based-on-us-political-activity/
https://www.capitoltrades.com/about-us
https://www.disclosure.senate.gov/

---

## P8 -- Expo Push / APNs at scale

**Bottom line: Expo Push is fine for thousands-to-100k tokens if you treat it as a
queued, rate-limited pipeline. The bottleneck is Expo's 600 notifications/sec/project
limit, not per-message cost (Expo Push + FCM are free; APNs has no per-push fee).
10k ~= 17s, 50k ~= 83s, 100k ~= 167s minimum send windows. No Expo SLA.** Confirmed:
iOS push does NOT work in Expo Go on SDK 53/54 -- use a dev/TestFlight/prod build.

Limits: <=100 messages/request; receipts <=1000 IDs/request, check ~+15 min, cleared
after 24h; Node SDK uses ~6 concurrent connections; payload <=4 KiB; retry 429/5xx
with backoff.

Receipts are mandatory: tickets only mean Expo accepted. On DeviceNotRegistered (or
InvalidCredentials) -> stop sending / disable that token immediately (CTA's worker
already deactivates on DeviceNotRegistered/InvalidCredentials -- gap is a receipt-
polling pass + a >=600/s broadcast throttle).

APNs under an Organization: use an APNs Auth Key (.p8), team-scoped (one key for all
bundle IDs); Account Holder/Admin role to create. Limit 2 keys/Apple account. A new
key does NOT change existing ExpoPushTokens. Migration rule: new Apple team =
regenerate/upload push creds + rebuild; upload the NEW key BEFORE revoking the old
(revoking breaks push for all apps until replaced); run `eas credentials` to confirm
key/bundle/profile/team under the Org; keep same bundle ID + Expo project identity
(mixing old/new project tokens in one batch -> PUSH_TOO_MANY_EXPERIENCE_IDS).

Fanout: server-side audience selection -> Expo as transport; queue jobs (never inline
from ingest); chunk <=100; global rate-limit <600/s; dedupe by event_id + token_hash;
use collapseId per disclosure to coalesce; store "follows-all default" explicitly so
default-broadcast users don't get double-notified with targeted follows. Token
hygiene: upsert on launch/permission/update, timestamp refreshed_at, prune stale
(60-90d), disable (not hard-delete) on DeviceNotRegistered. Android: create
notification channels before token fetch (Android 13+ prompt); use priority "high"
selectively. Privacy payload: send only a type + public id + collapseId -- never the
user's followed tickers/members (Expo may see payloads in memory during debugging).

Go direct APNs/FCM only when: >600/s is too slow, you need native features (VoIP/
Live Activities/interruption levels), stricter delivery observability, or to drop
Expo as a dependency. FCM v1 direct default is 600k msgs/min/project (Android only;
iOS still needs direct APNs).

Sources:
https://docs.expo.dev/push-notifications/sending-notifications/
https://docs.expo.dev/push-notifications/faq/
https://developer.apple.com/help/account/capabilities/communicate-with-apns-using-authentication-tokens/
https://firebase.google.com/docs/cloud-messaging/manage-tokens
https://docs.expo.dev/app-signing/app-credentials/

---

## Net actions for CTA (derived)

- Launch stays gated on the LLC/Org migration; NO public release under Individual,
  NO app-transfer shortcut (P1).
- Pro tier: US-only external Stripe + account/server entitlement; avoid the API-key-
  paste-unlock pattern; consider free read-only v1 first (P2).
- Keep the civic-not-fintech lock; ban alpha/copy/personalization/broker links (P4).
- Set D&B address to the intended public address before EU; align name across
  WV/D&B/Apple (P5).
- Fix privacy-checklist: "Data Not Linked to You (Device ID) + Tracking NO" (P6).
- Push: add receipt-polling + <600/s broadcast throttle; .p8 key under the Org (P8).
