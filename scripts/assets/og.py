#!/usr/bin/env python3
"""
Generate the 1200x630 Open Graph / Twitter images: the home page from its
painting in art-src/ (see src/data/art.json); the product pages, the projects
hub and the download page on white with the flowing light along the bottom
(as on the site) and, for the products, the koko avatar. The original LULUX
logo and the avatar are placed, never altered. Run manually when the art or
titles change:

    python3 scripts/assets/og.py --fonts <dir>

<dir> must contain a Chinese sans (NotoSansSC.ttf, variable) and Inter
(InterVariable.ttf). Requires Pillow. Output: src/static/assets/og/<page>.jpg
"""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src/static/assets/og"
LOGO = ROOT / "src/static/assets/img/brand/lulux-1024.png"
AVATAR = ROOT / "src/static/assets/img/about/koko-512.png"
ART = json.loads((ROOT / "src/data/art.json").read_text())["items"]
W, H = 1200, 630
IVORY = (250, 248, 243)
INK = (11, 11, 12)
SLATE = (74, 99, 120)
MIST = (143, 168, 188)

# Painted page: (painting, horizontal focus, title, Chinese line, English line)
PAINTED = {
    "home": ("hero", 1.0, "LULUX", "不被已知束缚，探追未知。", "Unbound by the known. Chasing the unknown."),
}
# White pages: (title, Chinese line, English line, show the avatar)
WHITE = {
    "eta": ("LULUX ETA", "外贸团队的 AI 工作区", "The AI workspace for trade teams", True),
    "flow": ("DSH工作流", "一个模型，驱动所有 CLI", "DSH-LULUX Flow · unofficial DeepSeek Harness plugin", True),
    "download": ("LULUX ETA", "Windows、macOS、Linux 免费下载", "Download for Windows, macOS and Linux", False),
    "projects": ("LULUX", "全部项目", "All projects: LULUX ETA, DSH-LULUX Flow and more", False),
}


def flowlight(img, top):
    """Still version of the site's flowing light: soft translucent bands with thin bright lines."""
    import math

    from PIL import ImageFilter

    h = H - top
    layer = Image.new("RGBA", (W, h), (255, 255, 255, 0))
    d = ImageDraw.Draw(layer)
    ribbons = [
        (0.42, 0.2, 0.07, 900, (223, 231, 238), 0.9),
        (0.56, 0.18, 0.06, 640, (143, 168, 188), 0.34),
        (0.66, 0.24, 0.08, 1100, (186, 204, 218), 0.5),
        (0.8, 0.22, 0.05, 760, (143, 168, 188), 0.42),
        (0.9, 0.2, 0.04, 520, (223, 231, 238), 0.8),
    ]

    def wave(x, ln, ph):
        k = 2 * math.pi / ln
        return math.sin(k * x + ph) * 0.62 + math.sin(k * 1.9 * x + ph * 1.7) * 0.38

    for i, (y, th, amp, ln, rgb, a) in enumerate(ribbons):
        ph = i * 1.3 + 2.0
        top_pts = [(x, (y + amp * wave(x, ln, ph)) * h) for x in range(-20, W + 21, 10)]
        bot_pts = [(x, (y + th * (0.65 + 0.35 * wave(x, ln * 1.7, ph + 2)) + amp * wave(x, ln, ph + 0.4)) * h) for x in range(W + 20, -21, -10)]
        band = Image.new("RGBA", (W, h), (0, 0, 0, 0))
        ImageDraw.Draw(band).polygon(top_pts + bot_pts, fill=rgb + (int(255 * a),))
        layer = Image.alpha_composite(layer, band)
    layer = layer.filter(ImageFilter.GaussianBlur(3))
    d = ImageDraw.Draw(layer)
    for i, (y, amp, ln, w, rgb, a) in enumerate([(0.5, 0.05, 380, 2, (255, 255, 255), 0.95), (0.62, 0.06, 300, 2, (255, 255, 255), 0.85), (0.84, 0.05, 340, 3, (255, 255, 255), 0.9), (0.72, 0.045, 460, 2, (106, 138, 163), 0.35)]):
        pts = [(x, (y + amp * wave(x, ln, i * 2.1 + 1)) * h) for x in range(-10, W + 11, 6)]
        d.line(pts, fill=rgb + (int(255 * a),), width=w)
    # Fade the top edge into the page, as the mask does on the site.
    fade = Image.new("L", (1, h))
    for yy in range(h):
        fade.putpixel((0, yy), int(255 * min(1, yy / (h * 0.46))))
    alpha = Image.composite(layer.getchannel("A"), Image.new("L", (W, h), 0), fade.resize((W, h)))
    layer.putalpha(alpha)
    base = img.convert("RGBA")
    base.alpha_composite(layer, (0, top))
    return base.convert("RGB")


def cover(img, focus_x):
    scale = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    x = max(0, min(img.width - W, round((img.width - W) * focus_x)))
    y = (img.height - H) // 2
    return img.crop((x, y, x + W, y + H))


def veil(strength):
    g = Image.new("L", (W, 1))
    for x in range(W):
        t = x / W
        a = strength if t < 0.3 else max(0, int(strength * (1 - (t - 0.3) / 0.35)))
        g.putpixel((x, 0), a)
    return g.resize((W, H))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fonts", required=True)
    a = ap.parse_args()
    fonts = Path(a.fonts)

    def cjk(size, weight="Bold"):
        f = ImageFont.truetype(str(fonts / "NotoSansSC.ttf"), size)
        f.set_variation_by_name(weight)
        return f

    def latin(size, weight="Bold"):
        f = ImageFont.truetype(str(fonts / "InterVariable.ttf"), size)
        f.set_variation_by_name(weight)
        return f

    logo = Image.open(LOGO).convert("RGBA").resize((72, 72), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (art, fx, title, zh, en) in PAINTED.items():
        base = cover(Image.open(ROOT / ART[art]["source"]).convert("RGB"), fx)
        img = Image.composite(Image.new("RGB", (W, H), INK), base, veil(220))
        d = ImageDraw.Draw(img)
        img.paste(logo, (72, 64), logo)
        d.text((72, 220), title, font=latin(80), fill=IVORY)
        d.text((72, 336), zh, font=cjk(38), fill=IVORY)
        d.text((72, 396), en, font=latin(24, "Regular"), fill=MIST)
        img.save(OUT / f"{name}.jpg", quality=86, optimize=True, progressive=True)
        print("wrote", OUT / f"{name}.jpg")

    av = Image.open(AVATAR).convert("RGBA").resize((340, 340), Image.LANCZOS)
    for name, (title, zh, en, avatar) in WHITE.items():
        img = flowlight(Image.new("RGB", (W, H), (255, 255, 255)), 440)
        if avatar:
            img.paste(av, (W - 340 - 110, 92), av)
        d = ImageDraw.Draw(img)
        img.paste(logo, (72, 64), logo)
        title_font = cjk(80) if any(ord(c) > 0x2E80 for c in title) else latin(80)
        d.text((72, 196), title, font=title_font, fill=INK)
        d.text((72, 312), zh, font=cjk(38), fill=INK)
        d.text((72, 372), en, font=latin(24, "Regular"), fill=SLATE)
        img.save(OUT / f"{name}.jpg", quality=86, optimize=True, progressive=True)
        print("wrote", OUT / f"{name}.jpg")

    # About: the avatar on ivory.
    img = Image.new("RGB", (W, H), IVORY)
    av = Image.open(AVATAR).convert("RGBA").resize((360, 360), Image.LANCZOS)
    img.paste(av, (W - 360 - 120, (H - 360) // 2), av)
    d = ImageDraw.Draw(img)
    img.paste(logo, (72, 64), logo)
    d.text((72, 220), "koko", font=latin(96), fill=INK)
    d.text((72, 350), "不被已知束缚，探追未知。", font=cjk(34), fill=INK)
    d.text((72, 404), "Unbound by the known. Chasing the unknown.", font=latin(24, "Regular"), fill=SLATE)
    img.save(OUT / "about.jpg", quality=86, optimize=True, progressive=True)
    print("wrote", OUT / "about.jpg")


if __name__ == "__main__":
    main()
