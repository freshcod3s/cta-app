"""
Google Play feature graphic generator (1024 x 500 PNG, sRGB).

Per store/feature-graphic-brief.md: dark navy background, cta-accent dome
silhouette right-third, ticker-tape strip across the bottom, app name +
subtitle on the left. Apple does NOT use a feature graphic; this asset
is Play-only.

Run from repo root:
    python store/_generate_feature_graphic.py
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Brand tokens (mirror lib/theme/tokens.ts).
ACCENT = (99, 102, 241)         # #6366f1 cta-accent
NAVY = (11, 18, 32)             # #0b1220
NAVY_2 = (15, 23, 42)
NAVY_3 = (22, 33, 56)
TEXT = (243, 244, 246)
TEXT_DIM = (156, 163, 175)
WHITE = (255, 255, 255)
ACCENT_TINT = (84, 87, 215)     # subtle dome shadow

W, H = 1024, 500
SAFE_PAD = 64

FONT_CANDIDATES_BOLD = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]
FONT_CANDIDATES_REG = [
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    cands = FONT_CANDIDATES_BOLD if bold else FONT_CANDIDATES_REG
    for path in cands:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_capitol_dome(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float):
    """Stylized Capitol dome silhouette in cta-accent stroke. Draws around
    center (cx, cy) at the given scale (multiplier for proportions)."""
    s = scale
    stroke = max(2, int(3 * s))

    # Base platform (wide rectangle).
    base_w = int(220 * s)
    base_h = int(20 * s)
    by = cy + int(110 * s)
    draw.rounded_rectangle(
        [cx - base_w // 2, by, cx + base_w // 2, by + base_h],
        radius=int(4 * s), outline=ACCENT, width=stroke,
    )

    # Steps under the platform (3 narrowing tiers).
    for i, w_mul in enumerate([0.9, 0.8, 0.7]):
        sw = int(base_w * w_mul)
        sh = int(8 * s)
        sy = by + base_h + i * (sh + 2)
        draw.rectangle(
            [cx - sw // 2, sy, cx + sw // 2, sy + sh],
            outline=ACCENT, width=stroke,
        )

    # Pediment / portico (triangle).
    pw = int(180 * s)
    ph = int(28 * s)
    py = by - ph
    draw.polygon(
        [(cx - pw // 2, by), (cx + pw // 2, by), (cx, py)],
        outline=ACCENT,
    )
    # Need stroke width for polygons -- redraw with line segments.
    draw.line([(cx - pw // 2, by), (cx, py)], fill=ACCENT, width=stroke)
    draw.line([(cx, py), (cx + pw // 2, by)], fill=ACCENT, width=stroke)
    draw.line([(cx - pw // 2, by), (cx + pw // 2, by)], fill=ACCENT, width=stroke)

    # Columns (5 vertical strokes under the pediment).
    col_top = by - int(2 * s)
    col_bot = by + int(2 * s)
    col_h = int(70 * s)
    col_zone_w = int(150 * s)
    n_cols = 5
    for i in range(n_cols):
        x = cx - col_zone_w // 2 + i * (col_zone_w // (n_cols - 1))
        draw.line([(x, col_top), (x, col_top - col_h)], fill=ACCENT, width=stroke)

    # Drum (rectangle below dome).
    drum_w = int(120 * s)
    drum_h = int(36 * s)
    drum_top = col_top - col_h - drum_h
    draw.rectangle(
        [cx - drum_w // 2, drum_top, cx + drum_w // 2, drum_top + drum_h],
        outline=ACCENT, width=stroke,
    )

    # Dome (semi-ellipse on top of drum).
    dome_w = int(150 * s)
    dome_h = int(95 * s)
    dome_top = drum_top - dome_h
    draw.arc(
        [cx - dome_w // 2, dome_top, cx + dome_w // 2, dome_top + dome_h * 2],
        180, 360, fill=ACCENT, width=stroke,
    )

    # Lantern (small box on dome apex).
    lan_w = int(28 * s)
    lan_h = int(18 * s)
    lan_top = dome_top - lan_h
    draw.rectangle(
        [cx - lan_w // 2, lan_top, cx + lan_w // 2, lan_top + lan_h],
        outline=ACCENT, width=stroke,
    )

    # Spire (vertical line + diamond cap).
    spire_h = int(40 * s)
    spire_top = lan_top - spire_h
    draw.line([(cx, lan_top), (cx, spire_top)], fill=ACCENT, width=stroke)
    diamond = int(10 * s)
    draw.polygon(
        [(cx, spire_top - diamond),
         (cx + diamond // 2, spire_top - diamond // 2),
         (cx, spire_top),
         (cx - diamond // 2, spire_top - diamond // 2)],
        fill=ACCENT,
    )


def draw_ticker_tape(img: Image.Image):
    """Bottom 20% strip with placeholder tickers + accent underline."""
    draw = ImageDraw.Draw(img)
    strip_h = int(H * 0.20)
    strip_top = H - strip_h
    # Slightly lighter band background.
    draw.rectangle([0, strip_top, W, H], fill=NAVY_3)
    # Top border accent line.
    draw.rectangle([0, strip_top, W, strip_top + 2], fill=ACCENT)
    # Bottom thin accent line for depth.
    draw.rectangle([0, H - 2, W, H], fill=ACCENT_TINT)

    tickers = ["AAPL", "NVDA", "TSLA", "MSFT", "GOOGL"]
    f = font(34, bold=True)
    f_pct = font(22, bold=True)
    deltas = ["+1.4%", "-0.6%", "+2.1%", "+0.3%", "-0.9%"]
    delta_colors = [(16, 185, 129), (239, 68, 68), (16, 185, 129),
                    (16, 185, 129), (239, 68, 68)]

    # Lay out evenly across the strip, offset from edges by safe pad.
    inner_w = W - 2 * SAFE_PAD
    spacing = inner_w / len(tickers)
    cy = strip_top + strip_h // 2

    for i, t in enumerate(tickers):
        cx = int(SAFE_PAD + spacing * (i + 0.5))
        bbox = draw.textbbox((0, 0), t, font=f)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text((cx - tw // 2 - bbox[0], cy - th - 4 - bbox[1]),
                  t, font=f, fill=TEXT)
        # Delta below the ticker.
        d = deltas[i]
        dbbox = draw.textbbox((0, 0), d, font=f_pct)
        dw = dbbox[2] - dbbox[0]
        dh = dbbox[3] - dbbox[1]
        draw.text((cx - dw // 2 - dbbox[0], cy + 6 - dbbox[1]),
                  d, font=f_pct, fill=delta_colors[i])
        # Accent underline beneath each ticker block.
        u_w = int(min(tw, dw) * 1.6)
        u_y = cy + 6 + dh + 6
        draw.rectangle([cx - u_w // 2, u_y, cx + u_w // 2, u_y + 2],
                       fill=ACCENT)


def main():
    img = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)

    # Subtle accent vignette in the top-right where the dome sits.
    # Skip a heavy gradient -- keep it flat for printable cleanliness.

    # Title block on the left.
    title = "Congress Trade Alerts"
    subtitle = "Capitol Hill Stock Disclosures"
    f_title = font(64, bold=True)
    f_sub = font(28, bold=False)

    # Left-align with safe padding; vertically center above ticker tape.
    available_h = int(H * 0.80)  # space above ticker tape
    title_x = SAFE_PAD
    # Stack title + subtitle around a vertical center.
    title_bbox = draw.textbbox((0, 0), title, font=f_title)
    sub_bbox = draw.textbbox((0, 0), subtitle, font=f_sub)
    title_h = title_bbox[3] - title_bbox[1]
    sub_h = sub_bbox[3] - sub_bbox[1]
    gap = 16
    block_h = title_h + gap + sub_h
    title_y = (available_h - block_h) // 2

    draw.text((title_x - title_bbox[0], title_y - title_bbox[1]),
              title, font=f_title, fill=TEXT)
    draw.text((title_x - sub_bbox[0],
               title_y + title_h + gap - sub_bbox[1]),
              subtitle, font=f_sub, fill=ACCENT)

    # Capitol dome on the right ~35%.
    dome_cx = int(W * 0.78)
    dome_cy = int(H * 0.40)
    draw_capitol_dome(draw, dome_cx, dome_cy, scale=1.05)

    # Ticker tape across the bottom.
    draw_ticker_tape(img)

    # Output -- both filenames work; brief-canonical is feature-graphic.png
    # under store/google-play/screenshots/.
    out_dir = Path(__file__).resolve().parents[1] / "store" / "google-play" / "screenshots"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / "feature-graphic.png"
    img.save(out, "PNG", optimize=True)
    print(f"Wrote {out}  ({W}x{H})")


if __name__ == "__main__":
    main()
