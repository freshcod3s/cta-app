# App Store screenshot spec -- Congress Trade Alerts iOS v1

Status: AUDITED 2026-07-11 against the live App Store Connect screenshot
specifications page (developer.apple.com/help/app-store-connect/reference/
screenshot-specifications/, fetched 2026-07-11). Supersedes the screenshot
notes in store/mac-cc-asc-prompt.md and store/screenshots-brief.md where
they conflict.

RE-CAPTURE DONE 2026-07-11 (Mac CC): 01/02/05 re-captured and
06-settings-push/07-methodology added per section 3, from a Release
simulator build of feat/web-parity @ 589e9bd (RETURNS_DISPLAY=false,
SHOW_UPGRADE_CTA=false), iPhone 17 Pro Max, status bar per section 4.
The section-2 verdicts below describe the superseded 2026-06-09 set and
are kept for the audit trail. Shots 6-7 from the section-3 list are
committed; ASC upload still pending (blocked on the app record / ASC
API key).

---

## 1. ASC requirements (verified 2026-07-11, primary source)

- **6.9-inch iPhone set is the only required set.** Accepted portrait
  sizes for the 6.9" row: 1260x2736, 1290x2796, or **1320x2868**
  (landscape equivalents also accepted). Devices in the row include
  iPhone 17 Pro Max / 16 Pro Max.
- **6.5-inch set (1284x2778 or 1242x2688) is required ONLY if no 6.9"
  set is provided.** We provide 6.9", so skip it.
- **All smaller iPhone sizes auto-scale down** from the 6.9" set
  (6.3" <- 6.5" <- 6.9" scaling chain per the spec page). Nothing else
  to upload.
- **Count: 1 to 10 screenshots per localization**, .png or .jpeg.
  The first 3 are the ones surfaced in App Store search results, so
  order matters.
- **iPad screenshots: NOT required.** The spec page says iPad shots are
  "Required if app runs on iPad." app.json sets ios.supportsTablet=false,
  so the app is iPhone-only and ASC will not present an iPad upload
  requirement. See section 5.

## 2. Audit of the 5 existing PNGs

All five files in store/app-store/screenshots/ measured via PNG IHDR
(2026-07-11): **1320 x 2868 portrait -- an exactly accepted 6.9" size.
Dimensionally, all 5 pass as-is.** They are raw iPhone 17 Pro Max
simulator captures (Dynamic Island status bar, dark theme, no device
frame, no caption overlays), shipped by Mac CC in commit a9d573a.

| File | Surface | Dimensions | Verdict |
|---|---|---|---|
| 01-feed.png | Trade feed | 1320x2868 OK | **RE-CAPTURE** -- shows the "Congress vs S&P 500 (30D) -49.2%" benchmark card (PulseHero), which is HIDDEN in the shipping build (RETURNS_DISPLAY=false in lib/flags.ts) |
| 02-trade-detail.png | Trade detail | 1320x2868 OK | **RE-CAPTURE** -- shows the At-Trade / Current / +4.26% price snapshot (TransactionHero), hidden in the shipping build |
| 03-daily-dive.png | Daily Dive | 1320x2868 OK | **REUSABLE AS-IS** -- disclosure-fact aggregates only (counts, amount-range volume), no price-derived display |
| 04-committee.png | Committee page (Judiciary) | 1320x2868 OK | **REUSABLE AS-IS** -- roster/subcommittee facts only |
| 05-ticker.png | Ticker page (NVDA) | 1320x2868 OK | **RE-CAPTURE** -- shows the $224.36 / +4.3% vs S&P price hero (TickerHeader), hidden in the shipping build |

**Why re-capture, not just resize:** guideline 2.3.3 requires screenshots
to show the app in use. lib/flags.ts ships v1 with RETURNS_DISPLAY=false,
which (per the flag's own doc comment) hides the per-trade price/% change,
the Congress-vs-S&P benchmark on feed and leaderboard, and the ticker
price snapshot. Screenshots 01, 02, and 05 therefore depict UI the
reviewer will not find in the binary -- a metadata-rejection risk and, in
this app's case, a positioning risk (the gated elements are exactly the
"actionable returns" framing the project avoids). Re-capture those three
from a build with the production flag values. Dimensions and capture rig
are already correct; only the content is stale.

Also confirmed absent (correct for v1): no Subscription/Upgrade card in
any shot (SHOW_UPGRADE_CTA=false), no pricing, no purchase surface.
"Subscribe to alerts" in 02 is the free push-alert follow button -- fine
to show, it is a real free feature.

## 3. Recommended shot list (target: 7, max 10)

Mirrors the Play set (feed, trade detail, settings/push, methodology,
about) adjusted for iOS, keeping the strongest existing surfaces. Order
puts the three clearest value shots first (search-result visibility):

1. **01-feed.png** -- trade feed with filter chips + stat tiles
   (re-capture, gated build). The hero shot.
2. **02-trade-detail.png** -- trade detail: amount range, committee
   overlap card, timeline with disclosure lag (re-capture, gated build).
3. **03-daily-dive.png** -- reuse as-is.
4. **04-committee.png** -- reuse as-is.
5. **05-ticker.png** -- ticker page, 167 disclosed trades list
   (re-capture, gated build).
6. **06-settings-push.png** -- NEW: Settings screen with the push
   opt-in toggle visible (mirrors Play 04-settings). Shows the
   no-account, opt-in-only posture -- the privacy differentiator.
7. **07-methodology.png** -- NEW: Methodology screen (mirrors Play
   05-methodology). Data sources + lag stats; the civic-transparency
   credibility shot.

Optional 8th: About screen (mirrors Play 06-about) if the set feels
thin; do not exceed 8 -- later shots are rarely seen.

## 4. Capture guidance

- **Device/target:** iPhone 17 Pro Max simulator (6.9"), portrait,
  exactly 1320x2868. Pixel-exact; ASC rejects off-by-one sizes.
- **Build:** production-flagged build (RETURNS_DISPLAY=false,
  SHOW_UPGRADE_CTA=false), no dev banners, live prod API data (all
  public-record names -- no PII concern per screenshots-brief.md).
- **Status bar:** the shipped set shows 8:55/8:56 with a real carrier
  row. Cosmetic only, but on re-capture apply the Apple convention:
  `xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100 --cellularBars 4 --dataNetwork wifi`
  then capture with `xcrun simctl io booted screenshot <file>.png`.
- **Device frames / captions:** keep the current style -- raw, full-bleed
  app UI, no marketing frame, no caption overlay. ASC accepts framed or
  raw; the shipped raw dark-theme set is consistent and honest (2.3.3).
  If captions are ever added, add them to ALL shots in the same pass.
- **Dark theme:** app is dark-locked (Appearance.setColorScheme("dark")),
  so dark captures are the correct and only representation.

## 5. iPhone-only v1 (no iPad) -- recommendation

Ship iPhone screenshots only. Rationale:
- app.json ios.supportsTablet=false -> the binary declares
  iPhone-only device family; ASC only requires iPad screenshots for
  apps that run on iPad. The iPad upload slot does not apply.
- The layout is a single-column phone design (drawer nav, full-width
  cards); there is no iPad-optimized surface to show, and shipping
  stretched phone shots on iPad would be a 2.3.3 risk in reverse.
- Play launch is likewise phone-screenshot-only; keeping the matrices
  identical keeps the store-asset pipeline one-dimensional for v1.

## 6. Capture path (no Mac on the Windows rig)

iOS Simulator requires macOS -- EAS builds are cloud, but EAS does not
produce screenshots. Options, in order of practicality:

1. **RECOMMENDED: re-run the Mac CC session.** The current 5 shots were
   produced by a Claude Code session on the Mac (commit a9d573a), and
   store/mac-cc-asc-prompt.md is the standing paste-prompt for that rig
   (it already targets 1320x2868 on the 6.9" simulator). Update that
   prompt's shot list to this spec's section 3 before the next Mac
   session: 3 re-captures (01, 02, 05) + 2 new (settings, methodology),
   using the production flag values. Note the prompt's line about
   "8 screenshots ... recompose the caption overlays" is stale -- the
   shipped set is 5 raw uncaptioned shots; this spec supersedes it.
2. **TestFlight on a physical iPhone.** Works (device screenshots from
   an iPhone 16/17 Pro Max are native 1320x2868), but requires the ASC
   build pipeline to be further along than the listing work, and a
   6.9-inch physical device. Fallback only.
3. **Resized Android-parity captures: DO NOT.** Android emulator
   captures are 9:16 with Android status bar chrome; ASC iPhone shots
   are 19.5:9. Letterboxing or stretching is both rejectable and
   dishonest about the iOS UI. (Same warning already in
   mac-cc-asc-prompt.md.)

## 7. Follow-ups (out of scope for this file)

- store/screenshots-brief.md and store/mac-cc-asc-prompt.md both
  predate the RETURNS_DISPLAY gate and describe the 5-shot set as
  "shipped/final" -- update after the re-capture lands.
- Play set (store/google-play/screenshots/) is a separate stale 8-shot
  1080x1920 batch; already tracked in screenshots-brief.md.
