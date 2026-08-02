# ASO tranche-1 screenshot compositor (CTA-ASO-1, 2026-08-02).
#
# Takes the six raw 1080x2400 emulator screencaps in
# store/google-play/aso/raw/ and composites each into a Play-compliant
# 1080x1920 store screenshot: brand background, one headline, the phone
# frame at one shared scale bleeding off the bottom edge.
#
# Play constraints honored: 24-bit PNG (RGB, no alpha), min dim >= 320,
# max dim <= 3840, max dim <= 2x min dim (1920 <= 2160).
#
# Rerunnable: python scripts/aso/composite_screenshots.py
# (no repo .venv -- the system interpreter is the intended one here;
# needs Pillow, same dependency the icon pipeline used).
#
# Headlines are LOCKED copy from the ASO tranche-1 ticket. Do not reword
# without a matching update to docs/aso/fact-audit-tranche1.md.
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW = os.path.join(ROOT, "store", "google-play", "aso", "raw")
OUT = os.path.join(ROOT, "store", "google-play", "aso", "final")

CANVAS = (1080, 1920)
BG = (13, 18, 32)          # deep navy, one shade under the app's gray-900
GLOW = (99, 102, 241)      # indigo-500 -- the app's primary accent
FG = (255, 255, 255)
BORDER = (55, 65, 81)      # gray-700 device edge

# (raw file, headline) -- order is the intended Play listing order.
FRAMES = [
    ("raw-01-feed.png", "Congress Stock Trades,\nIn One Feed"),
    ("raw-02-alerts.png", "Alerts When New\nFilings Appear"),
    ("raw-03-follow.png", "Follow Any Member\nor Company"),
    ("raw-04-overlap.png", "See Committee\nOverlap Flags"),
    # Substituted from the ticket's "Open Every Official Filing": 76% of the
    # historical backfill rows serve no source_url yet (worker-side gap), so
    # "Every" fails the fact audit. New ingests are 100% linked.
    ("raw-05-source.png", "Open The Official\n.gov Filing"),
    ("raw-06-constellation.png", "Free. No Ads.\nNo Account."),
]

HEAD_ZONE = 400            # px reserved for the headline block
PHONE_SCALE = 0.67         # one shared scale: 1080 -> 723 px wide
# (0.67 keeps frame 5's "View original disclosure" button -- the payoff for
# its headline -- inside the visible window; 0.70 cropped it at the bleed.)
CORNER = 42                # device corner radius after scaling


def load_font(size):
    for name in ("segoeuib.ttf", "arialbd.ttf"):
        try:
            return ImageFont.truetype(os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", name), size)
        except OSError:
            continue
    return ImageFont.load_default()


def radial_glow(canvas):
    # Soft indigo glow behind the phone so the dark UI separates from the
    # dark background. Painted on a small gradient and upscaled -- cheap
    # and deterministic.
    small = Image.new("RGB", (54, 96), BG)
    d = ImageDraw.Draw(small)
    cx, cy = 27, 40
    for r in range(46, 0, -1):
        t = r / 46.0
        col = tuple(int(BG[i] + (GLOW[i] - BG[i]) * (1 - t) * 0.28) for i in range(3))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    canvas.paste(small.resize(CANVAS, Image.LANCZOS))


def rounded(img, radius):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], radius, fill=255)
    out = Image.new("RGB", img.size, BG)
    out.paste(img, (0, 0), mask)
    return out, mask


def build(raw_name, headline):
    canvas = Image.new("RGB", CANVAS, BG)
    radial_glow(canvas)
    draw = ImageDraw.Draw(canvas)

    # Headline: single hierarchy, two centered lines, indigo keyline under.
    font = load_font(84)
    lines = headline.split("\n")
    y = 96
    for line in lines:
        w = draw.textlength(line, font=font)
        draw.text(((CANVAS[0] - w) / 2, y), line, font=font, fill=FG)
        y += 104
    bar_w = 180
    draw.rounded_rectangle(
        [(CANVAS[0] - bar_w) / 2, y + 18, (CANVAS[0] + bar_w) / 2, y + 30],
        6, fill=GLOW)

    # Phone: shared scale, centered, top under the headline zone, bleeding
    # off the bottom of the canvas.
    shot = Image.open(os.path.join(RAW, raw_name)).convert("RGB")
    pw = int(shot.size[0] * PHONE_SCALE)
    ph = int(shot.size[1] * PHONE_SCALE)
    shot = shot.resize((pw, ph), Image.LANCZOS)
    shot, mask = rounded(shot, CORNER)
    px = (CANVAS[0] - pw) // 2
    py = HEAD_ZONE + 60
    # thin border for edge separation
    bdr = Image.new("RGB", (pw + 8, ph + 8), BORDER)
    bmask = Image.new("L", (pw + 8, ph + 8), 0)
    ImageDraw.Draw(bmask).rounded_rectangle([0, 0, pw + 7, ph + 7], CORNER + 4, fill=255)
    canvas.paste(bdr, (px - 4, py - 4), bmask)
    canvas.paste(shot, (px, py), mask)
    return canvas


def main():
    os.makedirs(OUT, exist_ok=True)
    for i, (raw_name, headline) in enumerate(FRAMES, 1):
        img = build(raw_name, headline)
        assert img.mode == "RGB" and img.size == CANVAS
        path = os.path.join(OUT, f"screenshot-{i:02d}.png")
        img.save(path, "PNG")
        print(f"wrote {path} {img.size} {img.mode}")


if __name__ == "__main__":
    main()
