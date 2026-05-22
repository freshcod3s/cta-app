"""
CTA-App-1-10 designed-mockup screenshot generator.

Produces preliminary marketing-style screenshots at both stores' required
dimensions (iOS 6.7" 1290x2796 and Android phone 1080x1920) following
the 8-shot sequence in screenshots-brief.md, with caption strips baked in
per the brief's caption-text overlays.

These are DESIGNED MOCKUPS, not real-device captures. Joe-side real
captures from a production EAS build can swap over them later if higher
fidelity is desired. Per Apple/Play guidelines both stores accept
designed screenshots as long as they accurately represent the app
surfaces.

Run from repo root:
    python store/_generate_screenshots.py
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Brand tokens (mirror lib/theme/tokens.ts and tailwind.config.js).
ACCENT = (99, 102, 241)         # #6366f1 cta-accent (indigo)
ACCENT_DEEP = (76, 79, 215)     # darker shade for shadows/depth
NAVY = (11, 18, 32)             # #0b1220 dark canvas
NAVY_2 = (15, 23, 42)           # slightly lighter card bg
NAVY_3 = (22, 33, 56)           # row hover / divider
TEXT = (243, 244, 246)
TEXT_DIM = (156, 163, 175)
TEXT_MUTED = (107, 114, 128)
BUY = (16, 185, 129)            # #10b981
SELL = (239, 68, 68)            # #ef4444
LATE = (245, 158, 11)           # #f59e0b
DEM = (59, 130, 246)
REP = (239, 68, 68)
WHITE = (255, 255, 255)
DIVIDER = (39, 51, 75)

# Caption-strip height = 22% of total canvas; status bar/app chrome
# scales relative to remainder.
CAPTION_FRACTION = 0.22

# ---------------------------------------------------------------------
# Font resolution. Windows 11 ships Segoe UI Variable (.ttf at
# C:\Windows\Fonts\SegoeUIVF.ttf) but ImageFont.truetype prefers
# explicit static files. Try a small ranked list and fall back.
# ---------------------------------------------------------------------

FONT_CANDIDATES = [
    "C:/Windows/Fonts/segoeuib.ttf",   # Segoe UI Bold
    "C:/Windows/Fonts/segoeui.ttf",    # Segoe UI Regular
    "C:/Windows/Fonts/arialbd.ttf",    # Arial Bold
    "C:/Windows/Fonts/arial.ttf",      # Arial
]
BOLD_CANDIDATES = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]

_font_cache: dict[tuple[str, int], ImageFont.FreeTypeFont] = {}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = BOLD_CANDIDATES if bold else FONT_CANDIDATES
    for path in candidates:
        if Path(path).exists():
            key = (path, size)
            if key not in _font_cache:
                _font_cache[key] = ImageFont.truetype(path, size)
            return _font_cache[key]
    return ImageFont.load_default()


# ---------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------


def rounded_rect(draw: ImageDraw.ImageDraw, xy, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def text_centered(draw, xy_box, text, font_, fill):
    x0, y0, x1, y1 = xy_box
    bbox = draw.textbbox((0, 0), text, font=font_)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    cx = (x0 + x1) / 2 - tw / 2 - bbox[0]
    cy = (y0 + y1) / 2 - th / 2 - bbox[1]
    draw.text((cx, cy), text, font=font_, fill=fill)


def text_wrap(draw, text, font_, max_width):
    """Greedy word-wrap to width."""
    words = text.split()
    lines, line = [], ""
    for w in words:
        test = (line + " " + w).strip()
        bbox = draw.textbbox((0, 0), test, font=font_)
        if bbox[2] - bbox[0] <= max_width:
            line = test
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def draw_caption_strip(img: Image.Image, caption: str, accent: bool = True):
    """Top strip with the marketing caption baked in."""
    W, H = img.size
    strip_h = int(H * CAPTION_FRACTION)
    draw = ImageDraw.Draw(img)
    bg = ACCENT if accent else NAVY_2
    draw.rectangle([0, 0, W, strip_h], fill=bg)
    # Subtle accent underline at the bottom of the strip.
    underline = WHITE if accent else ACCENT
    draw.rectangle([0, strip_h - max(2, H // 600), W, strip_h], fill=underline)

    # Caption text wraps to fit.
    cap_font = font(int(W * 0.075), bold=True)
    pad = int(W * 0.07)
    lines = text_wrap(draw, caption, cap_font, W - 2 * pad)

    # Vertical centering.
    line_h_bbox = draw.textbbox((0, 0), "Ag", font=cap_font)
    line_h = (line_h_bbox[3] - line_h_bbox[1]) * 1.2
    total_h = line_h * len(lines)
    y = (strip_h - total_h) / 2
    for ln in lines:
        bbox = draw.textbbox((0, 0), ln, font=cap_font)
        tw = bbox[2] - bbox[0]
        x = (W - tw) / 2 - bbox[0]
        draw.text((x, y), ln, font=cap_font, fill=WHITE)
        y += line_h


def draw_status_bar(img: Image.Image, top_offset: int):
    """Fake iOS-style status bar with 9:41 + battery."""
    W = img.size[0]
    draw = ImageDraw.Draw(img)
    bar_h = int(W * 0.07)
    draw.rectangle([0, top_offset, W, top_offset + bar_h], fill=NAVY)
    f = font(int(W * 0.034), bold=True)
    draw.text((int(W * 0.07), top_offset + bar_h * 0.28), "9:41", font=f, fill=TEXT)
    # Battery + signal box on the right.
    box_w = int(W * 0.075)
    box_h = int(bar_h * 0.42)
    bx0 = W - int(W * 0.07) - box_w
    by0 = top_offset + (bar_h - box_h) // 2
    draw.rounded_rectangle([bx0, by0, bx0 + box_w, by0 + box_h], radius=int(box_h * 0.3), outline=TEXT, width=2)
    # Fill 90%.
    fill_pad = 4
    fw = int((box_w - 2 * fill_pad) * 0.9)
    draw.rectangle([bx0 + fill_pad, by0 + fill_pad, bx0 + fill_pad + fw, by0 + box_h - fill_pad], fill=TEXT)
    # Tip on right edge.
    tip_w = max(2, box_w // 18)
    draw.rectangle([bx0 + box_w, by0 + box_h // 3, bx0 + box_w + tip_w, by0 + 2 * box_h // 3], fill=TEXT)
    return top_offset + bar_h


def draw_app_header(img: Image.Image, top_offset: int, title: str, with_hamburger: bool = True):
    W = img.size[0]
    draw = ImageDraw.Draw(img)
    h = int(W * 0.13)
    draw.rectangle([0, top_offset, W, top_offset + h], fill=NAVY)
    # Bottom divider
    draw.rectangle([0, top_offset + h - 1, W, top_offset + h], fill=DIVIDER)
    # Hamburger icon (3 lines)
    if with_hamburger:
        hx = int(W * 0.06)
        hy = top_offset + h // 2
        for i in range(3):
            yy = hy - int(W * 0.022) + i * int(W * 0.022)
            draw.rectangle([hx, yy, hx + int(W * 0.06), yy + max(2, W // 360)], fill=TEXT)
    # Title
    f = font(int(W * 0.05), bold=True)
    bbox = draw.textbbox((0, 0), title, font=f)
    tx = (W - (bbox[2] - bbox[0])) // 2 - bbox[0]
    ty = top_offset + (h - (bbox[3] - bbox[1])) // 2 - bbox[1]
    draw.text((tx, ty), title, font=f, fill=TEXT)
    return top_offset + h


def avatar(draw, x, y, r, color, initials_text):
    draw.ellipse([x - r, y - r, x + r, y + r], fill=color)
    f = font(int(r * 0.85), bold=True)
    bbox = draw.textbbox((0, 0), initials_text, font=f)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x - tw / 2 - bbox[0], y - th / 2 - bbox[1]), initials_text, font=f, fill=WHITE)


def pill(draw, xy, text, bg, fg=WHITE, font_size_frac=0.034, W=1290, radius=999):
    x0, y0, x1, y1 = xy
    rounded_rect(draw, xy, radius=radius, fill=bg)
    f = font(int(W * font_size_frac), bold=True)
    text_centered(draw, xy, text, f, fg)


# ---------------------------------------------------------------------
# Surface mockups - one function per shot type
# ---------------------------------------------------------------------


def surface_feed(img: Image.Image, content_top: int, with_alert_badge: bool = True):
    W, H = img.size
    draw = ImageDraw.Draw(img)
    # Stats banner (header card).
    pad = int(W * 0.05)
    banner_h = int(W * 0.18)
    rounded_rect(draw, [pad, content_top + pad, W - pad, content_top + pad + banner_h],
                 radius=int(W * 0.025), fill=NAVY_2)
    # 3 stat columns.
    stats = [("Today", "47"), ("This week", "312"), ("Late", "8")]
    col_w = (W - 2 * pad) / 3
    for i, (label, val) in enumerate(stats):
        cx = pad + col_w * (i + 0.5)
        f1 = font(int(W * 0.034))
        f2 = font(int(W * 0.062), bold=True)
        bbox1 = draw.textbbox((0, 0), label, font=f1)
        bbox2 = draw.textbbox((0, 0), val, font=f2)
        draw.text((cx - (bbox1[2] - bbox1[0]) / 2 - bbox1[0],
                   content_top + pad + banner_h * 0.18), label, font=f1, fill=TEXT_DIM)
        draw.text((cx - (bbox2[2] - bbox2[0]) / 2 - bbox2[0],
                   content_top + pad + banner_h * 0.45), val, font=f2, fill=ACCENT if i == 2 else TEXT)

    # Trade rows.
    rows = [
        ("Nancy Pelosi",        "NP", DEM, "NVDA",  "NVIDIA Corp",        "BUY",  "$1M-$5M",   False),
        ("Tommy Tuberville",    "TT", REP, "AAPL",  "Apple Inc",          "SELL", "$50K-$100K", True),
        ("Dan Crenshaw",        "DC", REP, "TSLA",  "Tesla Inc",          "BUY",  "$15K-$50K", False),
        ("Josh Gottheimer",     "JG", DEM, "MSFT",  "Microsoft Corp",     "BUY",  "$100K-$250K", False),
        ("Susie Lee",           "SL", DEM, "GOOGL", "Alphabet Inc",       "SELL", "$15K-$50K", False),
        ("Marjorie Taylor Greene", "MG", REP, "AMD", "Advanced Micro Devices", "BUY", "$1K-$15K", False),
    ]
    row_h = int(W * 0.165)
    y = content_top + pad * 2 + banner_h
    for i, (name, init, party, ticker, asset, side, amount, late) in enumerate(rows):
        if y + row_h > H - pad:
            break
        # Avatar
        ax = pad + int(W * 0.045)
        ay = y + row_h // 2
        avatar(draw, ax, ay, int(W * 0.045), party, init)
        # Name
        f_name = font(int(W * 0.038), bold=True)
        draw.text((ax + int(W * 0.075), y + int(W * 0.025)), name, font=f_name, fill=TEXT)
        # Ticker + asset
        f_ticker = font(int(W * 0.034), bold=True)
        f_asset = font(int(W * 0.03))
        draw.text((ax + int(W * 0.075), y + int(W * 0.075)), ticker, font=f_ticker, fill=ACCENT)
        tw = draw.textbbox((0, 0), ticker, font=f_ticker)[2]
        draw.text((ax + int(W * 0.075) + tw + 16, y + int(W * 0.078)), asset, font=f_asset, fill=TEXT_DIM)
        # Right column: pill + amount + LATE
        side_color = BUY if side == "BUY" else SELL
        pill_w = int(W * 0.13)
        pill_h = int(W * 0.05)
        px1 = W - pad
        px0 = px1 - pill_w
        pill(draw, [px0, y + int(W * 0.024), px1, y + int(W * 0.024) + pill_h],
             side, side_color, W=W, font_size_frac=0.026)
        # Amount
        f_amt = font(int(W * 0.028))
        amt_bbox = draw.textbbox((0, 0), amount, font=f_amt)
        draw.text((W - pad - (amt_bbox[2] - amt_bbox[0]), y + int(W * 0.082)),
                  amount, font=f_amt, fill=TEXT_DIM)
        if late:
            late_w = int(W * 0.075)
            late_h = int(W * 0.04)
            lx1 = W - pad
            lx0 = lx1 - late_w
            ly0 = y + int(W * 0.118)
            pill(draw, [lx0, ly0, lx1, ly0 + late_h], "LATE", LATE, W=W, font_size_frac=0.022)
        # Divider
        draw.rectangle([ax + int(W * 0.075), y + row_h - 1, W - pad, y + row_h], fill=DIVIDER)
        # Alert badge on first row.
        if i == 0 and with_alert_badge:
            badge_r = int(W * 0.018)
            bx = ax + int(W * 0.038)
            by = ay - int(W * 0.038)
            draw.ellipse([bx - badge_r, by - badge_r, bx + badge_r, by + badge_r], fill=ACCENT, outline=NAVY, width=4)
        y += row_h

    # Search FAB bottom-right.
    fab_r = int(W * 0.07)
    fcx = W - pad - fab_r
    fcy = H - pad - fab_r
    draw.ellipse([fcx - fab_r, fcy - fab_r, fcx + fab_r, fcy + fab_r], fill=ACCENT)
    # Magnifier glass.
    gr = fab_r // 2
    draw.ellipse([fcx - gr - 4, fcy - gr - 4, fcx + gr - 4, fcy + gr - 4],
                 outline=WHITE, width=max(3, W // 400))
    draw.line([fcx + gr - 8, fcy + gr - 8, fcx + gr + 6, fcy + gr + 6],
              fill=WHITE, width=max(3, W // 400))


def surface_trade_detail(img: Image.Image, content_top: int, subscribed: bool, late_emphasis: bool = False):
    W, H = img.size
    draw = ImageDraw.Draw(img)
    pad = int(W * 0.05)
    # Member header card
    card_top = content_top + pad
    card_h = int(W * 0.32)
    rounded_rect(draw, [pad, card_top, W - pad, card_top + card_h],
                 radius=int(W * 0.025), fill=NAVY_2)
    # Avatar
    ar = int(W * 0.075)
    ax = pad + ar + int(W * 0.04)
    ay = card_top + card_h // 2
    avatar(draw, ax, ay, ar, DEM, "NP")
    # Name + role
    f_name = font(int(W * 0.052), bold=True)
    f_role = font(int(W * 0.034))
    draw.text((ax + ar + int(W * 0.04), card_top + int(W * 0.05)), "Nancy Pelosi",
              font=f_name, fill=TEXT)
    draw.text((ax + ar + int(W * 0.04), card_top + int(W * 0.115)), "Rep. (D-CA-11)",
              font=f_role, fill=TEXT_DIM)
    draw.text((ax + ar + int(W * 0.04), card_top + int(W * 0.165)), "House Financial Services",
              font=f_role, fill=TEXT_DIM)

    # Transaction hero
    hero_top = card_top + card_h + pad
    hero_h = int(W * 0.42)
    rounded_rect(draw, [pad, hero_top, W - pad, hero_top + hero_h],
                 radius=int(W * 0.025), fill=NAVY_2)
    # Ticker headline
    f_tick = font(int(W * 0.105), bold=True)
    draw.text((pad + int(W * 0.05), hero_top + int(W * 0.04)), "NVDA",
              font=f_tick, fill=ACCENT)
    f_asset = font(int(W * 0.04))
    draw.text((pad + int(W * 0.05), hero_top + int(W * 0.165)), "NVIDIA Corp",
              font=f_asset, fill=TEXT_DIM)
    # BUY pill
    pill_w = int(W * 0.18)
    pill_h = int(W * 0.07)
    px1 = W - pad - int(W * 0.05)
    px0 = px1 - pill_w
    pill(draw, [px0, hero_top + int(W * 0.045), px1, hero_top + int(W * 0.045) + pill_h],
         "BUY", BUY, W=W, font_size_frac=0.04)
    # Amount block
    f_amt = font(int(W * 0.044), bold=True)
    f_amt_label = font(int(W * 0.028))
    draw.text((pad + int(W * 0.05), hero_top + int(W * 0.245)), "Amount range",
              font=f_amt_label, fill=TEXT_MUTED)
    draw.text((pad + int(W * 0.05), hero_top + int(W * 0.295)), "$1,000,001 - $5,000,000",
              font=f_amt, fill=TEXT)

    # LATE chip - either compact or emphasis variant.
    if late_emphasis:
        late_top = hero_top + hero_h + pad
        late_h = int(W * 0.14)
        rounded_rect(draw, [pad, late_top, W - pad, late_top + late_h],
                     radius=int(W * 0.025), fill=(74, 50, 12))
        # Yellow vertical accent bar
        draw.rectangle([pad, late_top, pad + int(W * 0.012), late_top + late_h], fill=LATE)
        f_l1 = font(int(W * 0.04), bold=True)
        f_l2 = font(int(W * 0.03))
        draw.text((pad + int(W * 0.05), late_top + int(W * 0.025)),
                  "Filed late", font=f_l1, fill=LATE)
        draw.text((pad + int(W * 0.05), late_top + int(W * 0.075)),
                  "63 days after transaction (STOCK Act limit: 45 days)",
                  font=f_l2, fill=TEXT_DIM)
        body_top = late_top + late_h + pad
    else:
        body_top = hero_top + hero_h + pad
        # Small LATE chip in hero corner if not emphasizing.
        late_w = int(W * 0.115)
        late_h2 = int(W * 0.05)
        lx1 = px1
        lx0 = lx1 - late_w
        ly0 = hero_top + int(W * 0.145)
        pill(draw, [lx0, ly0, lx1, ly0 + late_h2], "LATE", LATE, W=W, font_size_frac=0.026)

    # Subscribe pill (filled when subscribed, outline when not).
    sub_top = body_top
    sub_h = int(W * 0.105)
    sub_w = int(W * 0.62)
    sx0 = (W - sub_w) // 2
    sx1 = sx0 + sub_w
    if subscribed:
        rounded_rect(draw, [sx0, sub_top, sx1, sub_top + sub_h],
                     radius=int(sub_h / 2), fill=ACCENT)
        f_sub = font(int(W * 0.038), bold=True)
        text_centered(draw, [sx0, sub_top, sx1, sub_top + sub_h],
                      "Subscribed - alerts on", f_sub, WHITE)
    else:
        rounded_rect(draw, [sx0, sub_top, sx1, sub_top + sub_h],
                     radius=int(sub_h / 2), fill=NAVY_2, outline=ACCENT, width=max(3, W // 400))
        f_sub = font(int(W * 0.038), bold=True)
        text_centered(draw, [sx0, sub_top, sx1, sub_top + sub_h],
                      "Subscribe to alerts", f_sub, ACCENT)

    # Timeline section preview
    tl_top = sub_top + sub_h + pad
    f_h = font(int(W * 0.04), bold=True)
    draw.text((pad + int(W * 0.04), tl_top), "Timeline", font=f_h, fill=TEXT)
    rows = [
        ("Transaction", "Mar 4, 2026"),
        ("Filed",       "May 6, 2026"),
        ("Disclosed",   "May 6, 2026"),
    ]
    f_lab = font(int(W * 0.032))
    f_val = font(int(W * 0.034), bold=True)
    yy = tl_top + int(W * 0.07)
    for label, val in rows:
        if yy + int(W * 0.07) > H - pad:
            break
        draw.text((pad + int(W * 0.04), yy), label, font=f_lab, fill=TEXT_DIM)
        bbox = draw.textbbox((0, 0), val, font=f_val)
        draw.text((W - pad - (bbox[2] - bbox[0]) - int(W * 0.04), yy),
                  val, font=f_val, fill=TEXT)
        draw.rectangle([pad + int(W * 0.04), yy + int(W * 0.05), W - pad - int(W * 0.04),
                        yy + int(W * 0.05) + 1], fill=DIVIDER)
        yy += int(W * 0.07)


def surface_settings(img: Image.Image, content_top: int):
    W, H = img.size
    draw = ImageDraw.Draw(img)
    pad = int(W * 0.05)

    rows = [
        ("Push notifications",        "Get alerts when members you follow file new disclosures.", True,  True),
        ("Theme",                     "System default",                                            False, False),
        ("Methodology",               "How we source and process disclosures",                      False, False),
        ("About",                     "Privacy, contact, version",                                  False, False),
    ]
    y = content_top + pad
    for label, sub, is_toggle, on in rows:
        row_h = int(W * 0.155)
        rounded_rect(draw, [pad, y, W - pad, y + row_h],
                     radius=int(W * 0.025), fill=NAVY_2)
        f_lab = font(int(W * 0.04), bold=True)
        f_sub = font(int(W * 0.03))
        draw.text((pad + int(W * 0.04), y + int(W * 0.025)), label, font=f_lab, fill=TEXT)
        # Wrap sub if needed
        sub_lines = text_wrap(draw, sub, f_sub, W - 2 * pad - int(W * 0.2))
        sy = y + int(W * 0.075)
        for ln in sub_lines[:2]:
            draw.text((pad + int(W * 0.04), sy), ln, font=f_sub, fill=TEXT_DIM)
            sy += int(W * 0.04)
        if is_toggle:
            tw = int(W * 0.13)
            th = int(W * 0.07)
            tx1 = W - pad - int(W * 0.04)
            tx0 = tx1 - tw
            ty0 = y + (row_h - th) // 2
            ty1 = ty0 + th
            track_color = ACCENT if on else (60, 70, 90)
            rounded_rect(draw, [tx0, ty0, tx1, ty1], radius=int(th / 2), fill=track_color)
            knob_r = int(th * 0.4)
            kx = tx1 - knob_r - 6 if on else tx0 + knob_r + 6
            ky = (ty0 + ty1) // 2
            draw.ellipse([kx - knob_r, ky - knob_r, kx + knob_r, ky + knob_r], fill=WHITE)
        else:
            # Chevron
            cx = W - pad - int(W * 0.05)
            cy = y + row_h // 2
            ch_w = int(W * 0.018)
            draw.line([cx - ch_w, cy - ch_w, cx, cy], fill=TEXT_DIM, width=max(3, W // 360))
            draw.line([cx, cy, cx - ch_w, cy + ch_w], fill=TEXT_DIM, width=max(3, W // 360))
        y += row_h + int(W * 0.025)


def surface_methodology(img: Image.Image, content_top: int):
    W, H = img.size
    draw = ImageDraw.Draw(img)
    pad = int(W * 0.05)
    sections = [
        ("Where the data comes from",
         "We pull every transaction from the official US House Clerk Periodic Transaction Reports (PTR) and the US Senate Office of Public Records (Senate EFD)."),
        ("How often we refresh",
         "Every 30 minutes from the source filings. New disclosures hit the feed within minutes of being posted publicly."),
        ("How we flag late filings",
         "The STOCK Act requires disclosure within 45 days of the transaction. If the filing date exceeds 45 days from the trade date, we surface a LATE chip on the row and the detail page."),
        ("What we don't do",
         "We do not editorialize. We do not score, rank, or rate trades. The data is the data. Read the full Methodology page on the web for sourcing footnotes."),
    ]
    y = content_top + pad
    for header, body in sections:
        f_h = font(int(W * 0.044), bold=True)
        f_b = font(int(W * 0.032))
        draw.text((pad, y), header, font=f_h, fill=ACCENT)
        y += int(W * 0.062)
        for ln in text_wrap(draw, body, f_b, W - 2 * pad):
            if y + int(W * 0.045) > H - pad:
                break
            draw.text((pad, y), ln, font=f_b, fill=TEXT)
            y += int(W * 0.045)
        y += int(W * 0.04)


def surface_about(img: Image.Image, content_top: int):
    W, H = img.size
    draw = ImageDraw.Draw(img)
    pad = int(W * 0.05)
    # App icon stub (rounded square with "CTA")
    icon_size = int(W * 0.18)
    ix = (W - icon_size) // 2
    iy = content_top + pad
    rounded_rect(draw, [ix, iy, ix + icon_size, iy + icon_size],
                 radius=int(icon_size * 0.22), fill=ACCENT)
    f_ic = font(int(icon_size * 0.42), bold=True)
    text_centered(draw, [ix, iy, ix + icon_size, iy + icon_size], "CTA", f_ic, WHITE)
    # Title + version
    f_title = font(int(W * 0.052), bold=True)
    f_ver = font(int(W * 0.03))
    title = "Congress Trade Alerts"
    bbox = draw.textbbox((0, 0), title, font=f_title)
    draw.text(((W - (bbox[2] - bbox[0])) / 2, iy + icon_size + pad // 2),
              title, font=f_title, fill=TEXT)
    ver = "Version 1.0.0"
    bbox = draw.textbbox((0, 0), ver, font=f_ver)
    draw.text(((W - (bbox[2] - bbox[0])) / 2, iy + icon_size + pad // 2 + int(W * 0.07)),
              ver, font=f_ver, fill=TEXT_DIM)

    # Privacy section.
    y = iy + icon_size + pad * 2 + int(W * 0.05)
    f_h = font(int(W * 0.044), bold=True)
    draw.text((pad, y), "Privacy", font=f_h, fill=TEXT)
    y += int(W * 0.062)
    body = ("v1 has no user accounts and no analytics. Push tokens are anonymous: "
            "the server stores the token, the platform, and your subscription preferences. "
            "No email, no name, no device identifier.")
    f_b = font(int(W * 0.032))
    for ln in text_wrap(draw, body, f_b, W - 2 * pad):
        draw.text((pad, y), ln, font=f_b, fill=TEXT_DIM)
        y += int(W * 0.045)

    # Open source section.
    y += int(W * 0.04)
    draw.text((pad, y), "Open source", font=f_h, fill=TEXT)
    y += int(W * 0.062)
    draw.text((pad, y), "The mobile app is open source on GitHub.",
              font=f_b, fill=TEXT_DIM)
    y += int(W * 0.05)
    link = "github.com/freshcod3s/cta-app"
    f_link = font(int(W * 0.034), bold=True)
    draw.text((pad, y), link, font=f_link, fill=ACCENT)
    # Underline
    bbox = draw.textbbox((pad, y), link, font=f_link)
    draw.line([bbox[0], bbox[3] + 2, bbox[2], bbox[3] + 2], fill=ACCENT, width=max(2, W // 540))


def surface_drawer(img: Image.Image, content_top: int):
    W, H = img.size
    draw = ImageDraw.Draw(img)
    # Dim the right portion to simulate drawer overlay.
    drawer_w = int(W * 0.78)
    overlay_x = drawer_w
    overlay = Image.new("RGBA", (W - overlay_x, H - content_top), (0, 0, 0, 130))
    img.paste(overlay, (overlay_x, content_top), overlay)
    # Drawer panel.
    draw.rectangle([0, content_top, drawer_w, H], fill=NAVY_2)
    pad = int(W * 0.05)
    # User header section.
    head_h = int(W * 0.22)
    draw.rectangle([0, content_top, drawer_w, content_top + head_h], fill=NAVY_3)
    # Brand label
    f_brand = font(int(W * 0.044), bold=True)
    draw.text((pad, content_top + pad), "Congress Trade Alerts",
              font=f_brand, fill=TEXT)
    f_tag = font(int(W * 0.028))
    draw.text((pad, content_top + pad + int(W * 0.06)),
              "STOCK Act compliance tracker",
              font=f_tag, fill=TEXT_DIM)
    # Menu rows.
    items = [
        ("Feed",          True),
        ("Settings",      False),
        ("Methodology",   False),
        ("About",         False),
    ]
    y = content_top + head_h + pad
    f_item = font(int(W * 0.04), bold=True)
    f_item_in = font(int(W * 0.04))
    for label, active in items:
        row_h = int(W * 0.105)
        if active:
            draw.rectangle([0, y, drawer_w, y + row_h], fill=NAVY_3)
            draw.rectangle([0, y, int(W * 0.012), y + row_h], fill=ACCENT)
            draw.text((pad, y + (row_h - int(W * 0.05)) // 2), label,
                      font=f_item, fill=ACCENT)
        else:
            draw.text((pad, y + (row_h - int(W * 0.05)) // 2), label,
                      font=f_item_in, fill=TEXT)
        y += row_h


# ---------------------------------------------------------------------
# Compose one screenshot
# ---------------------------------------------------------------------


def compose(W: int, H: int, caption: str, header_title: str, surface_fn, accent_caption=True):
    img = Image.new("RGB", (W, H), NAVY)
    draw_caption_strip(img, caption, accent=accent_caption)
    strip_h = int(H * CAPTION_FRACTION)
    after_status = draw_status_bar(img, strip_h)
    after_header = draw_app_header(img, after_status, header_title)
    surface_fn(img, after_header)
    return img


SHOTS = [
    # (n, caption, header, surface_fn, kwargs)
    (1, "Every congressional stock trade. Live.",     "Feed",         "feed_with_alert", True),
    (2, "Subscribe to any member.",                   "Trade",        "trade_unsub",     True),
    (3, "Push alerts the moment they file.",          "Trade",        "trade_sub",       True),
    (4, "You control what you hear about.",           "Settings",     "settings",        True),
    (5, "See exactly where the data comes from.",     "Methodology",  "methodology",     True),
    (6, "No accounts. No tracking. Open source.",     "About",        "about",           True),
    (7, "Late filings flagged automatically.",        "Trade",        "trade_late",      True),
    (8, "Built for journalists and civic watchers.",  "Feed",         "drawer",          True),
]


def render_surface(name: str):
    if name == "feed_with_alert":
        return lambda img, top: surface_feed(img, top, with_alert_badge=True)
    if name == "trade_unsub":
        return lambda img, top: surface_trade_detail(img, top, subscribed=False)
    if name == "trade_sub":
        return lambda img, top: surface_trade_detail(img, top, subscribed=True)
    if name == "trade_late":
        return lambda img, top: surface_trade_detail(img, top, subscribed=True, late_emphasis=True)
    if name == "settings":
        return surface_settings
    if name == "methodology":
        return surface_methodology
    if name == "about":
        return surface_about
    if name == "drawer":
        return lambda img, top: (surface_feed(img, top, with_alert_badge=False), surface_drawer(img, top))[1]
    raise ValueError(name)


SLUGS = {
    "feed_with_alert": "feed",
    "trade_unsub":     "trade-detail-unsubscribed",
    "trade_sub":       "trade-detail-subscribed",
    "settings":        "settings",
    "methodology":     "methodology",
    "about":           "about",
    "trade_late":      "late-filing-chip",
    "drawer":          "drawer",
}


def render_set(W: int, H: int, out_dir: Path, store_label: str):
    out_dir.mkdir(parents=True, exist_ok=True)
    for n, caption, header, surface_name, accent in SHOTS:
        fn = render_surface(surface_name)
        img = compose(W, H, caption, header, fn, accent_caption=accent)
        slug = SLUGS[surface_name]
        path = out_dir / f"{n:02d}-{slug}.png"
        img.save(path, "PNG", optimize=True)
        print(f"  {store_label}: {path.name}  ({W}x{H})")


def main():
    repo_root = Path(__file__).resolve().parents[1]
    print("Generating App Store 6.7\" iPhone screenshots (1290 x 2796)...")
    render_set(1290, 2796, repo_root / "store" / "app-store" / "screenshots", "iOS")
    print("Generating Google Play phone screenshots (1080 x 1920)...")
    render_set(1080, 1920, repo_root / "store" / "google-play" / "screenshots", "Play")
    print("Done.")


if __name__ == "__main__":
    main()
