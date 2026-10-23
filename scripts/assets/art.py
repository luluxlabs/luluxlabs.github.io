#!/usr/bin/env python3
"""
Generate the responsive renditions of every painting listed in
src/data/art.json: AVIF, WebP and JPEG at each width, written to
src/static/assets/img/art/<id>-<width>.<ext>.

    python3 scripts/assets/art.py                 # all paintings
    python3 scripts/assets/art.py hero            # one painting
    python3 scripts/assets/art.py hero=/path.png  # swap the master, then render it

Masters smaller than a target width are upscaled with Lanczos resampling and
a light unsharp mask, which keeps painted strokes crisp. Requires Pillow with
AVIF support (Pillow >= 11.2).
"""
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "src/data/art.json"
OUT = ROOT / "src/static/assets/img/art"

QUALITY = {"avif": 64, "webp": 84, "jpg": 84}


def render(art_id, item, widths):
    src = ROOT / item["source"]
    img = Image.open(src).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    for w in widths:
        h = round(img.height * w / img.width)
        out = img.resize((w, h), Image.LANCZOS)
        if w > img.width:
            out = out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
        for ext, q in QUALITY.items():
            path = OUT / f"{art_id}-{w}.{ext}"
            if ext == "jpg":
                out.save(path, "JPEG", quality=q, optimize=True, progressive=True)
            elif ext == "webp":
                out.save(path, "WEBP", quality=q, method=6)
            else:
                out.save(path, "AVIF", quality=q, speed=4)
        print(f"{art_id}: {w}x{h}")
    return img.size


def main(argv):
    config = json.loads(CONFIG.read_text())
    items = config["items"]
    targets = []
    for arg in argv:
        art_id, _, new_source = arg.partition("=")
        if art_id not in items:
            sys.exit(f"unknown painting '{art_id}', expected one of: {', '.join(items)}")
        if new_source:
            shutil.copyfile(new_source, ROOT / items[art_id]["source"])
            print(f"{art_id}: master replaced from {new_source}")
        targets.append(art_id)
    for art_id in targets or list(items):
        w, h = render(art_id, items[art_id], config["widths"])
        if items[art_id].get("ratio") != [w, h]:
            items[art_id]["ratio"] = [w, h]
    CONFIG.write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main(sys.argv[1:])
