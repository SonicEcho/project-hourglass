"""小物の一覧の絵（白い背景に、マス目に並べた絵）から、1つずつ背景を抜いて切り出す（段階271。docs/milestones/M3_explore_feel.md の 7.）。

使い方: python3 scripts/props_cut.py 一覧の絵.png 行 列 名前1,名前2,... [出力先（既定 public/assets/sprites/props）]
  名前は左上から右へ、行ごとに。名前を - にしたマスは飛ばす。出力は <名前>.webp（長い辺 256）
白い背景の抜き方は scripts/cutout_white.py と同じ（広い白を背景にし、縁は白からの割り戻しで半透明に）
"""

import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

WHITE = 236
MIN_AREA = 300


def alpha_cut(rgb):
    near_white = rgb.min(axis=2) >= WHITE
    lab, _ = ndimage.label(near_white)
    sizes = ndimage.sum(near_white, lab, range(lab.max() + 1))
    bg = near_white & (sizes[lab] >= MIN_AREA)
    c = np.clip(rgb * 255.0 / 248.0, 0, 255)
    soft = 1.0 - c.min(axis=2) / 255.0
    a = np.where(bg, soft, 1.0)
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255.0
    safe = np.maximum(a, 1e-3)[..., None]
    f = np.where(bg[..., None], np.clip(255.0 - (255.0 - c) / safe, 0, 255), rgb)
    return np.dstack([f, a * 255.0]).astype(np.uint8)


def cut(src, rows, cols, names, out='public/assets/sprites/props', longest=256):
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    rgba = alpha_cut(rgb)
    h, w = rgba.shape[:2]
    for i, name in enumerate(names):
        if name == '-':
            continue
        r, c = divmod(i, cols)
        cell = rgba[r * h // rows:(r + 1) * h // rows, c * w // cols:(c + 1) * w // cols]
        ys, xs = np.nonzero(cell[..., 3] > 24)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        im = Image.fromarray(cell[y0:y1, x0:x1], 'RGBA')
        k = longest / max(im.size)
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        im.save(f'{out}/{name}.webp', 'WEBP', quality=90, method=6)
        print(name, im.size)


if __name__ == '__main__':
    if len(sys.argv) not in (5, 6):
        print(__doc__)
        sys.exit(1)
    cut(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4].split(','), *(sys.argv[5:]))
