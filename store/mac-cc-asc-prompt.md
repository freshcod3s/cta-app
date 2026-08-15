# Mac Claude Code prompt -- ASC metadata paste

Paste the fenced block into a fresh Claude Code session on the Mac (which
has ASC auth via Safari). Self-contained. Updated 2026-06-14 after
researching current ASC requirements (see "Research notes" below).

---

```
cd ~/Projects/cta-app

Paste the App Store Connect metadata for Congress Trade Alerts. Read these
first; do not ask me for anything in them:
- store/app-store/metadata.txt
- store/app-store/privacy-checklist.md
- the project CLAUDE.md (identity, seller, handle specifics)

App exists in ASC (bundle ID com.congresstradealerts.cta). Open Safari to
appstoreconnect.apple.com -> My Apps -> Congress Trade Alerts.

App Information tab:
- Name: from NAME field
- Subtitle: from SUBTITLE field
- Primary Category: News
- Secondary Category: Reference
- Content Rights: does not contain, show, or access third-party content
  (we derive from public government records)

Pricing and Availability:
- Price: Free
- Availability: all territories

App Privacy:
- Use store/app-store/privacy-checklist.md.
- Tracking: NO. Data Linked to You: NONE.
- Data Not Linked to You: Identifiers > Device ID (purpose: App
  Functionality, not used for tracking, not linked to identity).
- Everything else: NO / NONE.

Version page (prepare only, do NOT submit):
- Promotional Text: from PROMOTIONAL_TEXT field
- Description: the full DESCRIPTION block, verbatim
- Keywords: from KEYWORDS field
- Support URL / Marketing URL: https://congresstradealerts.com
- Privacy Policy URL: https://congresstradealerts.com/privacy
- Copyright: from COPYRIGHT field

Age rating (NEW 2026 system -- 12+/17+ were removed; tiers are now
4+/9+/13+/16+/18+):
- Answer the questionnaire from the updated AGE_RATING_QUESTIONNAIRE_INPUTS
  in metadata.txt. Every content answer is NO; the new categories
  (in-app controls, capabilities, medical/wellness, violent themes) are
  None/NO. Expected result: 4+.

Screenshots -- READ CAREFULLY, this is the real work item:
- The existing files in store/google-play/screenshots/ are 1080x1920
  (9:16). ASC iPhone screenshots are 19.5:9, NOT 9:16. They are the
  WRONG aspect ratio -- do not resize, upscale, or letterbox them.
- ASC now accepts a SINGLE 6.9-inch set as sufficient for all iPhones.
  Target exactly 1320 x 2868 px (portrait). Pixel-exact; even 1px off
  is rejected.
- The 7-shot set ALREADY EXISTS and is upload-ready. store/app-store/
  screenshots/ holds 7 captures, all exactly 1320x2868, all alpha-clean
  (verified 2026-08-06). Default action is UPLOAD WHAT IS THERE, not
  recapture. The shot list and the reasoning behind it are in
  store/app-store/screenshot-spec.md sections 2-3. Note it is 7, not 8 --
  the Play set is 8; the iOS set drops one per that spec.
- Only if a specific shot must genuinely be re-captured: run the app in
  the iPhone 16/17 Pro Max simulator (6.9"), capture with xcrun simctl io
  booted screenshot, then run the alpha strip below. Nothing else in this
  section applies unless you are re-capturing.
- Do NOT use store/_generate_screenshots.py to produce submission
  screenshots. It renders CAPTIONED MARKETING MOCKUPS, which section 4 of
  screenshot-spec.md forbids for the submission set (raw full-bleed UI, no
  caption overlay). Its iOS output now goes to store/app-store/generated/,
  and it refuses outright to write into the capture directory. If it
  aborts with "REFUSED", that is the guard working as designed -- it is
  not a bug to route around.
- iPad screenshots: NOT required. app.json has ios.supportsTablet=false,
  so the app is iPhone-only in the store and ASC will not ask for iPad
  shots. Skip them.
- MANDATORY post-capture: strip the alpha channel from every capture.
  xcrun simctl io booted screenshot ALWAYS writes RGBA, and the ASC spec
  page states "Images can't include alpha channels or transparencies".
  A pixel-perfect 1320x2868 capture is still rejected if the alpha
  channel is present. Run from the repo root after capturing and before
  committing. Copy exactly -- the closing PY must sit at column 0 or the
  shell will not terminate the heredoc:

python3 - <<'PY'
import glob, os, hashlib
from PIL import Image   # pip3 install --user pillow

failed = False
for f in sorted(glob.glob("store/app-store/screenshots/*.png")):
    im = Image.open(f)
    name = os.path.basename(f)
    if im.mode != "RGBA":
        print("skip     %-26s already %s" % (name, im.mode))
        continue
    lo, _ = im.getchannel("A").getextrema()
    if lo != 255:
        # Non-opaque pixel means the alpha carries real information.
        # Flattening would change how the shot looks -- that is an edit,
        # not a format conversion. Hand it back rather than guess.
        print("REFUSED  %-26s alpha min=%d -- real transparency, NOT stripped" % (name, lo))
        failed = True
        continue
    w, h = im.size
    before = im.convert("RGB").tobytes()
    im.convert("RGB").save(f, "PNG", optimize=True)
    out = Image.open(f)
    after = out.convert("RGB").tobytes()
    ok = (hashlib.sha256(before).hexdigest() == hashlib.sha256(after).hexdigest()
          and out.size == (w, h) and out.mode == "RGB")
    print("stripped %-26s %dx%d RGBA->RGB pixels_identical=%s" % (name, w, h, ok))
    failed = failed or not ok
raise SystemExit(1 if failed else 0)
PY

  Exit code 0 with pixels_identical=True on every line means the strip
  was lossless -- only the constant channel was dropped, no colour value
  moved. Any REFUSED line stops the pass: re-capture that shot, do not
  flatten it by hand.
- Verify the strip independently. Do not let the stripping tool grade its
  own work. Byte 25 of a PNG is the IHDR colour-type field; read it
  directly:

for f in store/app-store/screenshots/*.png; do
  echo "$(basename "$f")  colortype=0x$(xxd -p -s 25 -l 1 "$f")"
done

  Every line must read colortype=0x02 (RGB). 0x06 is RGBA and will be
  rejected at upload. Confirm the dimensions held in the same pass:
  sips -g pixelWidth -g pixelHeight store/app-store/screenshots/*.png

Export compliance:
- app.json already sets ios.config.usesNonExemptEncryption=false, so the
  "Missing export compliance" prompt should not appear. If it does, the
  app uses only standard HTTPS (exempt) -> answer that it does not use
  non-exempt encryption.

Do NOT submit for review -- save all fields only. I'll review first.

OPSEC: never read or echo .env values; if a credential is missing, stop
and ask. All GitHub ops via gh CLI. Apple Developer account is an
ORGANIZATION -- Freshcod3s LLC (settled 2026-08-07). The public seller name
on the listing is the LLC, not a person. Do not select the individual
entity; it is Deprecated and carries no agreements.
```

---

## Research notes (2026-06-14, current ASC facts)

- **Age ratings changed.** Apple removed 12+ and 17+; tiers are now
  4+/9+/13+/16+/18+. New questionnaire categories: in-app controls,
  capabilities, medical/wellness, violent themes. Mandatory since
  2026-01-31. A clean news app rates **4+**. metadata.txt updated to match.
- **iPhone screenshots:** single 6.9" set (1320x2868) is sufficient.
  6.5" alt = 1242x2688, 6.7" = 1290x2796. 1080x1920 is not a valid
  iPhone size and is the wrong aspect ratio.
- **iPad screenshots:** required only if the app supports iPad. CTA is
  supportsTablet=false, so not required.
- **Export compliance:** usesNonExemptEncryption=false already set in
  app.json; standard HTTPS is exempt, prompt is pre-answered.
