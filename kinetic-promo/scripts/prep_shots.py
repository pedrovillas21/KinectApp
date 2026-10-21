"""Prints do celular: apaga o botão flutuante de dev (engrenagem) e amplia 2x com nitidez.

Uso: python -I scripts/prep_shots.py  (lê public/shots/N.png, grava public/shots/pN.png)
"""
from pathlib import Path

import cv2
import numpy as np

SHOTS = Path(__file__).resolve().parent.parent / "public" / "shots"

# Centro da engrenagem em cada print do app (medido nos PNGs originais).
GEAR = {1: (340, 78), 2: (334, 85), 3: (336, 83), 4: (344, 81), 5: (331, 92),
        6: (339, 48), 7: (334, 55), 8: (336, 48), 9: (342, 54), 10: (336, 50)}
R = 31  # disco + sombra

for n, (cx, cy) in GEAR.items():
    im = cv2.imread(str(SHOTS / f"{n}.png"), cv2.IMREAD_COLOR)
    mask = np.zeros(im.shape[:2], np.uint8)
    cv2.circle(mask, (cx, cy), R, 255, -1)
    im = cv2.inpaint(im, mask, 9, cv2.INPAINT_TELEA)
    big = cv2.resize(im, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)
    blur = cv2.GaussianBlur(big, (0, 0), 1.6)
    big = cv2.addWeighted(big, 1.7, blur, -0.7, 0)
    cv2.imwrite(str(SHOTS / f"p{n}.png"), big)
