# Feature graphic brief - CTA-App-1-10

Google Play Console requires a feature graphic for the storefront
listing. Apple does NOT use a feature graphic; this asset is Play-only.

## Spec (from Google Play Console)

- **Dimensions:** 1024 x 500 pixels (no exceptions; Play rejects others).
- **Format:** PNG or JPG. Prefer PNG for transparency-friendly source
  but Play renders flat regardless.
- **Max file size:** 1 MB.
- **Color profile:** sRGB.
- **No text required**, but text overlay is conventional.

## Brand direction

- **Visual:** subtle Capitol dome silhouette occupying the right third
  of the frame; clean ticker-tape strip horizontal across the bottom
  third showing 4-6 placeholder ticker symbols (e.g. AAPL, NVDA, TSLA,
  MSFT, GOOG -- generic large-caps, not real disclosed trades).
- **Typography:** app name "Congress Trade Alerts" in display
  weight 700+, sans-serif. Below it: subtitle "Capitol Hill Stock
  Disclosures" in regular weight.
- **Color:**
  - Background: dark navy #0b1220 (matches splash backgroundColor in
    app.json + adaptiveIcon backgroundColor).
  - Accent: cta-accent #6366f1 from lib/theme/tokens.ts (the dome
    silhouette outline + the ticker-tape underline).
  - Text: white on the dark background.
- **Mood:** restrained, civic, news-tier. NOT trading-app aggressive
  (no green-up-arrows, no flashing tickers, no profit-loss imagery).

## Composition rules

- Title "Congress Trade Alerts" left-aligned, vertically centered.
- Subtitle on the line directly below title, same x-origin, smaller
  weight + size.
- Capitol dome silhouette right-aligned, occupying the right ~35% of
  the canvas.
- Ticker-tape strip across the bottom 20% of the canvas; tickers in
  white on a slightly lighter navy band (#0f1830 or similar) with a
  cta-accent underline.
- Maintain 64px safe padding from all four edges so the title isn't
  clipped on Play's storefront thumbnails.

## Output

Save as:
```
store/google-play/screenshots/feature-graphic.png
```

(Lives in screenshots/ even though it isn't a screenshot, because
Play's submission UI groups it with the other listing imagery.)

## Tools

Joe-side suggestions: Figma, Canva, Affinity Designer, or
Photoshop. Any tool that exports 1024x500 PNG sRGB works.
