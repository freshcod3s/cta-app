# Store-listing assets

Marketing copy + privacy declarations + asset briefs for App Store
Connect (iOS) and Google Play Console (Android). Scaffolded by
CTA-App-1-9; metadata + briefs filled by CTA-App-1-10.

## Layout

```
store/
  README.md                          (this file)
  screenshots-brief.md               (capture sequence + caption text)
  feature-graphic-brief.md           (Play 1024x500 banner spec)
  app-preview-brief.md               (30s portrait video spec)
  app-store/
    metadata.txt                     (ASC listing copy - filled)
    privacy-checklist.md             (Apple Privacy Nutrition Labels)
    screenshots/                     (device-framed PNGs - Joe-side)
  google-play/
    metadata.txt                     (Play Console copy - filled)
    data-safety-checklist.md         (Play Data Safety form answers)
    screenshots/                     (PNGs + feature-graphic.png)
```

## What's filled vs pending

- [x] Listing copy (name, subtitle, descriptions, keywords, categories,
      URLs) -- both stores, in `metadata.txt`.
- [x] Privacy declarations -- iOS Privacy Nutrition Labels checklist
      + Play Data Safety checklist.
- [x] Asset capture briefs -- screenshots, feature graphic, app preview
      video.
- [x] **Designed-mockup screenshots (8 per store)** -- baked-in caption
      strips at the brand color over a representative app surface, at
      exact store dimensions (1290x2796 iOS, 1080x1920 Play). Generated
      by `_generate_screenshots.py` (Pillow). These are preliminary
      assets; Joe can swap real-device captures over them at any point
      for higher fidelity. Both Apple and Play accept designed
      screenshots as long as they accurately represent the app.
- [ ] Feature graphic image -- Joe-side design (Play only, see
      `feature-graphic-brief.md`).
- [ ] App preview video -- Joe-side capture (30s per
      `app-preview-brief.md`).
- [ ] Real-device screenshots (optional fidelity upgrade) -- Joe-side
      capture from a production EAS build, replacing the designed
      mockups in place.
- [ ] Real submit credentials -- substituted into `eas.json` only at
      `eas submit` time, never committed (see repo-root
      `submission-instructions.md`).

## Regenerating the mockup screenshots

`_generate_screenshots.py` is self-contained Python (Pillow only). Edit
the `SHOTS` list or per-surface drawing functions and re-run from the
repo root:

```
python store/_generate_screenshots.py
```

Outputs overwrite `store/app-store/screenshots/*.png` and
`store/google-play/screenshots/*.png`. Brand tokens mirror
`lib/theme/tokens.ts` and `tailwind.config.js`.

## Field length limits (Joe-reference)

### App Store Connect (iOS)

| Field | Max length | Notes |
| --- | --- | --- |
| Name | 30 chars | App name as shown on the home screen / store listing. |
| Subtitle | 30 chars | One-line tagline directly under the name. |
| Promotional text | 170 chars | Editable without resubmitting; use for time-sensitive copy. |
| Description | 4000 chars | Full app description. |
| Keywords | 100 chars | Comma-separated; counts against the 100-char total. |
| Support URL | -- | Required. |
| Marketing URL | -- | Optional. |
| Privacy Policy URL | -- | Required. Use `https://congresstradealerts.com/privacy`. |

### Google Play Console (Android)

| Field | Max length | Notes |
| --- | --- | --- |
| App name | 30 chars | Title as shown on the Play Store. |
| Short description | 80 chars | Shown above the screenshots in the listing. |
| Full description | 4000 chars | Below-the-fold description. |
| Privacy Policy URL | -- | Required. Use `https://congresstradealerts.com/privacy`. |
| Support email | -- | Required and publicly displayed. |

## Screenshot dimensions

### iOS (required: at least one set)

- 6.7" iPhone (1290 x 2796 portrait, 2796 x 1290 landscape)
- 6.5" iPhone (1284 x 2778 or 1242 x 2688)
- 5.5" iPhone (1242 x 2208) -- legacy, no longer required as of 2024 but
  Apple may still request

Per-language: up to 10 screenshots per device size.

### Android

- Phone: at least 2, up to 8. 16:9 or 9:16, 320--3840 px on the long edge.
- Feature graphic: 1024 x 500 PNG/JPG (NOT a screenshot -- a banner).

## Workflow

1. CTA-App-1-10 (this ticket) ships listing copy + privacy declarations
   + asset briefs.
2. **Joe-side asset capture (next step):**
   - 8 screenshots per store from a real-device EAS production build,
     per `screenshots-brief.md`.
   - 1024x500 feature graphic, per `feature-graphic-brief.md`.
   - 30-second app preview video, per `app-preview-brief.md`.
3. CTA-App-1-2 (separate ticket): `.ipa` parity build. (Apple Developer
   enrollment is DONE as of 2026-08-07 -- ORGANIZATION, Freshcod3s LLC,
   Team ID `LML7BRJ68Q`. It is no longer part of this item.)
4. Submit via `eas submit -p ios` and `eas submit -p android` after
   substituting real credentials into `eas.json` (see repo-root
   `submission-instructions.md`).
