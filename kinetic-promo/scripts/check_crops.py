"""Gera uma folha com todos os recortes de src/crops.json para conferir enquadramento.

Uso: python -I scripts/check_crops.py <saida.png>
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
crops = {k: v for k, v in json.loads((ROOT / "src" / "crops.json").read_text("utf-8")).items() if k != "_"}

W = 520
tiles = []
for name, (_, n, x, y, w, h) in crops.items():
    im = Image.open(ROOT / "public" / "shots" / f"{n}.png").convert("RGB").crop((x, y, x + w, y + h))
    s = W / w if w > W else 1
    im = im.resize((int(w * s), int(h * s)))
    tile = Image.new("RGB", (W, im.height + 22), (200, 40, 40))
    tile.paste(im, (0, 22))
    ImageDraw.Draw(tile).text((4, 4), name, fill="white")
    tiles.append(tile)

cols, gap = 4, 8
rows = [tiles[i:i + cols] for i in range(0, len(tiles), cols)]
H = sum(max(t.height for t in r) + gap for r in rows)
sheet = Image.new("RGB", (cols * (W + gap), H), (90, 90, 90))
yy = 0
for r in rows:
    for i, t in enumerate(r):
        sheet.paste(t, (i * (W + gap), yy))
    yy += max(t.height for t in r) + gap
sheet.save(sys.argv[1])
