"""砂の底を掘る二頭身の絵（4行×3列）を、ゲームで使う形にする（段階210。docs/ART_QUEUE.md の T）。

使い方: python3 scripts/dig_sprite.py 入力.png 出力.webp [--color]（髪が明るい人は --color。段階211）
必要なもの: pip install pillow numpy scipy

- 白い背景を抜く（scripts/cutout_white.py と同じ考え方：広い白を背景とみなし、縁は白からの割り戻しで半透明に）
- 届いた絵は、コマごとに体の位置と足もとの高さが少しずつずれている。そのままだと足踏みで揺れるので、
  コマごとに髪（いちばん暗い所）の真ん中を HEAD_X に、足もと（いちばん下）を FOOT_Y にそろえる。
  跳んでいるコマ（AIRBORNE）は、同じ行のほかのコマと同じだけ動かす（宙に浮いたまま）
- 1コマ CELL 画素の正方形に並べ直して WebP で書き出す。ゲーム（src/scenes/digArt.ts）は HEAD_X・FOOT_Y の割合を足もとの位置に使う
"""

import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROWS, COLS = 4, 3
CELL = 192
HEAD_X = 0.45
FOOT_Y = 0.93
WHITE = 236
MIN_AREA = 300
# 跳んでいるコマ（行, 列）：4行目の真ん中（上へ跳ぶ）
AIRBORNE = {(3, 1)}
# 頭の真ん中を、色の濃さで見る（--color を付けた時）。付けなければ暗い所（ハルトの黒髪）
HEAD_BY_COLOR = '--color' in sys.argv


def cutout(rgb: np.ndarray) -> np.ndarray:
    near_white = rgb.min(axis=2) >= WHITE
    lab, _ = ndimage.label(near_white)
    sizes = ndimage.sum(near_white, lab, range(lab.max() + 1))
    bg = near_white & (sizes[lab] >= MIN_AREA)
    c = np.clip(rgb * 255.0 / 248.0, 0, 255)
    soft = 1.0 - c.min(axis=2) / 255.0
    a = np.where(bg, soft, 1.0)
    # 背景に接する縁だけ割り戻しで半透明に。残りの背景は透明
    edge = ndimage.binary_dilation(~bg, iterations=2) & bg
    a = np.where(bg & ~edge, 0.0, a)
    return a


def main(src: str, dst: str) -> None:
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    alpha = cutout(rgb)
    h, w = alpha.shape
    ch, cw = h // ROWS, w // COLS
    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    full = Image.fromarray(rgba, 'RGBA')
    dark = rgb.max(axis=2) < 70
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    sat = ((mx - mn) / np.maximum(mx, 1) > 0.18) | dark
    s = CELL / ch
    out = Image.new('RGBA', (CELL * COLS, CELL * ROWS), (0, 0, 0, 0))
    for r in range(ROWS):
        shifts = {}
        for c in range(COLS):
            a = alpha[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] > 0.5
            ys, xs = np.nonzero(a)
            top, bottom = ys.min(), ys.max()
            # 頭：上のほう（体の高さの 45% まで）の、灰色でない所（スコップの刃を除く）の真ん中。
            # 明るい髪の人（あかり・みお）もいるので、暗さでなく色の濃さで見る（段階211）。ハルトは暗い所（髪が黒い）
            region = sat if HEAD_BY_COLOR else dark
            d = region[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] & a
            d[int(top + (bottom - top) * 0.45):, :] = False
            hx = np.nonzero(d)[1].mean()
            shifts[c] = (HEAD_X * cw - hx, FOOT_Y * ch - bottom)
        ground = [shifts[c][1] for c in range(COLS) if (r, c) not in AIRBORNE]
        for c in range(COLS):
            dx, dy = shifts[c]
            if (r, c) in AIRBORNE:
                dy = sum(ground) / len(ground)
            cell = full.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            moved = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
            moved.paste(cell, (round(dx), round(dy)))
            out.paste(moved.resize((CELL, CELL), Image.LANCZOS), (c * CELL, r * CELL))
            print(f'{r}-{c}: ずらし x {dx:+.0f} y {dy:+.0f}')
    out.save(dst, 'WEBP', quality=90, method=6)
    print(f'{dst}：{out.size[0]}×{out.size[1]}')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    main(args[0], args[1])
