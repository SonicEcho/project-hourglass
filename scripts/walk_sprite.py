"""探索を一緒に歩く二頭身の絵（4行×3列：前・左・右・後ろ × 立ち・左足・右足）を、ゲームで使う形にする（段階267。docs/ART_QUEUE.md の W）。

使い方: python3 scripts/walk_sprite.py 入力.png 出力.webp
必要なもの: pip install pillow numpy scipy

- 白い背景を抜く（scripts/dig_sprite.py と同じ cutout）
- 届いた絵は、コマごとに体の位置と足もとの高さが少しずつずれている。そのままだと歩く時に揺れるので、
  コマごとに頭（体の上から 40% まで）の真ん中を HEAD_X に、足もと（いちばん下）を FOOT_Y にそろえる
- 1コマ CELL 画素の正方形に並べ直して WebP で書き出す。ゲーム（src/scenes/ExploreScene.ts の walkSheet）は HEAD_X・FOOT_Y を足もとの位置に使う
"""

import sys

import numpy as np
from PIL import Image

sys.path.insert(0, 'scripts')
from dig_sprite import cutout  # noqa: E402

ROWS, COLS = 4, 3
CELL = 192
HEAD_X = 0.5
FOOT_Y = 0.92


def main(src: str, dst: str) -> None:
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    alpha = cutout(rgb)
    h, w = alpha.shape
    ch, cw = h // ROWS, w // COLS
    full = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA')
    out = Image.new('RGBA', (CELL * COLS, CELL * ROWS), (0, 0, 0, 0))
    for r in range(ROWS):
        for c in range(COLS):
            a = alpha[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] > 0.5
            ys, xs = np.nonzero(a)
            top, bottom = ys.min(), ys.max()
            head = a.copy()
            head[int(top + (bottom - top) * 0.4):, :] = False
            hx = np.nonzero(head)[1].mean()
            dx, dy = HEAD_X * cw - hx, FOOT_Y * ch - bottom
            cell = full.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            moved = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
            moved.paste(cell, (round(dx), round(dy)))
            out.paste(moved.resize((CELL, CELL), Image.LANCZOS), (c * CELL, r * CELL))
    out.save(dst, 'WEBP', quality=90, method=6)
    print(f'{dst}：{out.size[0]}×{out.size[1]}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
