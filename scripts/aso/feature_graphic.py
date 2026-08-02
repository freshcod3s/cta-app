# ASO tranche-1 Play feature graphic (CTA-ASO-1, 2026-08-02).
#
# 1024x500 24-bit PNG: Capitol silhouette + disclosure-document /
# alert-pulse motif, one brand accent (indigo). Constraints from the
# ticket: no phone mockup, no small text, no feature list; critical
# content stays off the edges (>=8% safe margin).
#
# Rerunnable: python scripts/aso/feature_graphic.py
# (no repo .venv -- system interpreter is the intended one; needs Pillow)
import os
import random
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "store", "google-play", "aso", "feature-graphic-1024x500.png")

W, H = 1024, 500
NAVY_TOP = (11, 16, 30)
NAVY_BOT = (22, 28, 48)
SILHOUETTE = (30, 38, 60)
EDGE = (52, 63, 94)
ACCENT = (99, 102, 241)     # indigo-500, the single brand accent
PAPER = (226, 230, 240)


def gradient(draw):
    for y in range(H):
        t = y / (H - 1)
        col = tuple(int(NAVY_TOP[i] + (NAVY_BOT[i] - NAVY_TOP[i]) * t) for i in range(3))
        draw.line([(0, y), (W, y)], fill=col)


def starfield(draw):
    rng = random.Random(20260802)   # fixed seed -> deterministic output
    for _ in range(70):
        x, y = rng.randint(30, W - 30), rng.randint(20, H - 40)
        r = rng.choice((1, 1, 1, 2))
        a = rng.randint(45, 90)
        col = tuple(min(255, NAVY_BOT[i] + a) for i in range(3))
        draw.ellipse([x - r, y - r, x + r, y + r], fill=col)


def capitol(draw, cx, base_y):
    # Flat Capitol silhouette, symmetric around cx, sitting on base_y.
    # Steps
    draw.rectangle([cx - 240, base_y - 18, cx + 240, base_y], fill=SILHOUETTE)
    draw.rectangle([cx - 210, base_y - 36, cx + 210, base_y - 18], fill=SILHOUETTE)
    # Wings
    draw.rectangle([cx - 200, base_y - 100, cx - 70, base_y - 36], fill=SILHOUETTE)
    draw.rectangle([cx + 70, base_y - 100, cx + 200, base_y - 36], fill=SILHOUETTE)
    # Center block + portico columns
    draw.rectangle([cx - 80, base_y - 128, cx + 80, base_y - 36], fill=SILHOUETTE)
    for i in range(-3, 4):
        x = cx + i * 22
        draw.rectangle([x - 6, base_y - 120, x + 6, base_y - 40], fill=NAVY_BOT)
    # Pediment
    draw.polygon([(cx - 88, base_y - 128), (cx + 88, base_y - 128), (cx, base_y - 156)], fill=SILHOUETTE)
    # Dome drum + dome + lantern
    draw.rectangle([cx - 44, base_y - 176, cx + 44, base_y - 150], fill=SILHOUETTE)
    draw.pieslice([cx - 52, base_y - 240, cx + 52, base_y - 136], 180, 360, fill=SILHOUETTE)
    draw.rectangle([cx - 10, base_y - 258, cx + 10, base_y - 236], fill=SILHOUETTE)
    draw.ellipse([cx - 5, base_y - 270, cx + 5, base_y - 260], fill=SILHOUETTE)
    # Accent rim under the dome ties the silhouette to the brand color.
    draw.arc([cx - 52, base_y - 240, cx + 52, base_y - 136], 200, 340, fill=ACCENT, width=4)


def document(draw, x, y):
    # Disclosure-document card: rounded rect, folded corner, abstract
    # redacted-bar lines (bars, not legible text -- "no small text").
    w, h = 150, 190
    fold = 34
    draw.rounded_rectangle([x, y, x + w, y + h], 14, fill=PAPER)
    draw.polygon([(x + w - fold, y), (x + w, y + fold), (x + w - fold, y + fold)], fill=EDGE)
    draw.rectangle([x + w - fold, y, x + w, y], fill=PAPER)
    bar = SILHOUETTE
    for i, bw in enumerate((86, 100, 72, 100, 58)):
        by = y + 46 + i * 26
        draw.rounded_rectangle([x + 22, by, x + 22 + bw, by + 10], 5, fill=bar)
    # Accent seal dot -- the "new filing" marker the pulses radiate from.
    draw.ellipse([x + w - 34, y + h - 34, x + w - 12, y + h - 12], fill=ACCENT)


def pulses(draw, cx, cy):
    # Alert pulse: three concentric arcs radiating up-right from the seal.
    for i, r in enumerate((36, 62, 88)):
        draw.arc([cx - r, cy - r, cx + r, cy + r], -80, 10, fill=ACCENT, width=8 - i * 2)


def main():
    img = Image.new("RGB", (W, H), NAVY_TOP)
    draw = ImageDraw.Draw(img)
    gradient(draw)
    starfield(draw)

    # Ground glow behind the motif so it reads at thumbnail size.
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([170, 150, 850, 560], fill=(28, 26, 66))
    img = Image.blend(img, Image.composite(glow, img, glow.convert("L").point(lambda v: min(v * 2, 140))), 0.5)
    draw = ImageDraw.Draw(img)

    capitol(draw, cx=430, base_y=420)
    document(draw, x=650, y=170)
    pulses(draw, cx=650 + 150 - 23, cy=170 + 190 - 23)

    assert img.mode == "RGB" and img.size == (W, H)
    img.save(OUT, "PNG")
    print("wrote", OUT, img.size, img.mode)


if __name__ == "__main__":
    main()
