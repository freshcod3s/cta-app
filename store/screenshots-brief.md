# Screenshots brief

Capture sequence for App Store Connect + Google Play Console listings.
Updated 2026-06-09 after Mac CC shipped 5x 6.9" iOS screenshots
(commit a9d573a).

## Current iOS set (shipped)

Device: **6.9" iPhone 17 Pro Max (1320 x 2868 portrait)**. Apple
auto-scales this master to smaller iOS sizes. 5 screenshots committed
to `store/app-store/screenshots/`.

| # | File | Surface |
|---|---|---|
| 1 | 01-feed.png | Trade feed |
| 2 | 02-trade-detail.png | Trade detail |
| 3 | 03-daily-dive.png | Daily Dive |
| 4 | 04-committee.png | Committee page |
| 5 | 05-ticker.png | Ticker page |

## Android (not yet updated)

`store/google-play/screenshots/` still contains the old 8-shot set
from the original CTA-App-1-10 brief (stale 6.7" captures). Android
screenshots need re-capture on a physical device or emulator after the
v2 feature surface is final. The Play set uses the same 1320x2868
master files -- Play accepts any portrait image with min side >= 320px
and ratio between 16:9 and 9:16.

Feature graphic (1024 x 500) placeholder exists at
`store/google-play/screenshots/feature-graphic.png` -- needs real
design work (out-of-band).

## Capture-time checklist

- [ ] App is on production build (NOT a debug build with dev banners).
- [ ] Status bar shows full signal + full battery + a clean time
  (9:41 AM is Apple convention; Play has no convention).
- [ ] No personally identifying data visible (use the live feed which
  is all public-record names).

## Output naming

```
store/app-store/screenshots/
  01-feed.png
  02-trade-detail.png
  03-daily-dive.png
  04-committee.png
  05-ticker.png

store/google-play/screenshots/
  (re-capture pending -- currently stale 8-shot set)
```
