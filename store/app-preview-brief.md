# App preview video brief - CTA-App-1-10

Both stores accept an app preview video. Apple's "App Preview" plays
inline on the listing; Play's "Promo Video" embeds a YouTube link
that plays in a modal. This brief targets a single capture that works
for both surfaces.

## Spec

| Property | Apple App Store | Google Play Console |
| --- | --- | --- |
| Length | 15-30 seconds | 30 seconds to 2 minutes (we ship 30s) |
| Aspect | Portrait (1080 x 1920) | Either portrait or landscape; portrait recommended |
| Format | H.264 .mp4 or .mov, 30 fps | Hosted on YouTube; export 1080p H.264 .mp4 |
| Max size | 500 MB | YouTube limits apply |
| Audio | Optional; muted-autoplay-friendly preferred | Optional; muted-autoplay-friendly preferred |

## Capture rules

- **No narration.** Use on-screen captions for any explanation.
- **No music** in v1 (avoid licensing rabbit hole). Silent is fine on
  both stores.
- **No simulator** captures -- record on a real device. Apple rejects
  preview videos that are obviously simulator output.
- **Production build** -- no dev menus, no debug banners.
- **Status bar** -- 9:41 AM, full signal, full battery (Apple
  convention; Play has no convention but match for cross-store
  consistency).

## Sequence (30 seconds, portrait)

| Time | Visual | On-screen caption |
| --- | --- | --- |
| 0:00-0:03 | App opens, Feed populates (live trades scrolling in) | "Every congressional stock trade." |
| 0:03-0:08 | Tap a member's name on a feed row, Trade detail slides in | "Tap any politician." |
| 0:08-0:13 | Subscribe pill on Trade detail flips from unfilled to filled | "Subscribe in one tap." |
| 0:13-0:18 | Cut to phone lock screen, push notification arrives with a fresh trade headline | "Get alerted the moment they file." |
| 0:18-0:25 | Tap the notification, app deep-links to the matching Trade detail | "Deep links straight to the disclosure." |
| 0:25-0:30 | End frame: app icon + "Free. No ads. Open source." | (caption baked into end frame) |

## Capture workflow

1. Sideload a fresh production EAS build to Joe's iPhone + Android
   phone.
2. iOS: use the built-in screen recorder (Settings -> Control Center
   -> Screen Recording).
3. Android: `adb shell screenrecord /sdcard/preview.mp4` or use the
   built-in screen recorder.
4. Trim to 30 seconds in any video editor (iMovie, CapCut, DaVinci
   Resolve).
5. Add caption overlays per the table above. Use the same typography
   as the screenshots brief: sans-serif, weight 600+, contrast >= 4.5:1.
6. Export H.264 .mp4 at 1080 x 1920 portrait, target file size under
   100 MB (well below Apple's 500 MB cap).

## Output

Save as:
```
store/app-store/preview.mp4
store/google-play/preview.mp4    (or upload to YouTube and link)
```

(`store/` is gitignored at the file level for binary captures? No --
keep them tracked once produced, since they're store-listing assets and
v1 is small. Move to git-lfs only if the repo balloons.)
