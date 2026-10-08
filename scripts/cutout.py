"""立ち絵の白い背景を透明に抜いて、WebP で書き出す（段階18a）。

使い方: python3 scripts/cutout.py 入力.jpg 出力.webp
必要なもの: Pillow と numpy（pip install pillow numpy）

白に近く色の薄い部分を、絵のふちからたどって透明にする（服の白など、背景とつながっていない白は残る）。
髪のすき間などに閉じこめられた背景は、背景と同じ色・同じ平らさで、絵の左右の外側（SIDE より外）にあるものだけ透明にする
（真ん中の白い歯やシャツを抜かないため。キャラが真ん中に立っている絵を前提にしている）。
ふちは少しぼかし、背景の白が混ざった色を戻して、白いふちが残らないようにする。
"""

import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

# 背景とみなす色：明るく（どの色も BRIGHT 以上）、色が薄い（最大と最小の差が FLAT 未満）
BRIGHT = 215
FLAT = 14
# 閉じこめられた背景を探す範囲（左右それぞれ、幅のこの割合より外側）
SIDE = 0.3
# 外周を切り落とす幅（ピクセル）
EDGE = 3
# 白っぽいにじみに背景を広げる回数（ピクセル）
GROW = 4


def cutout(src: str, dst: str) -> None:
    # 絵の外周の数ピクセルは、圧縮の名残で色がずれていることがあるので切り落とす
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)[EDGE:-EDGE, EDGE:-EDGE]
    h, w, _ = rgb.shape
    candidate = (rgb.min(axis=2) >= BRIGHT) & ((rgb.max(axis=2) - rgb.min(axis=2)) < FLAT)

    # 絵のふちから、背景の候補をたどる
    bg = np.zeros((h, w), dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if candidate[y, x] and not bg[y, x]:
                bg[y, x] = True
                queue.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if candidate[y, x] and not bg[y, x]:
                bg[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and candidate[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                queue.append((ny, nx))

    # 背景の色（抜いた部分の平均）
    bg_color = rgb[bg].mean(axis=0) if bg.any() else np.array([245.0, 245.0, 240.0])

    # 髪のすき間などに閉じこめられた背景
    seen = bg.copy()
    for sy in range(h):
        for sx in range(w):
            if not candidate[sy, sx] or seen[sy, sx]:
                continue
            seen[sy, sx] = True
            comp = [(sy, sx)]
            queue.append((sy, sx))
            while queue:
                y, x = queue.popleft()
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < h and 0 <= nx < w and candidate[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        comp.append((ny, nx))
                        queue.append((ny, nx))
            ys = np.fromiter((p[0] for p in comp), int)
            xs = np.fromiter((p[1] for p in comp), int)
            cx = (xs.min() + xs.max()) / 2 / w
            colors = rgb[ys, xs]
            same = np.abs(colors.mean(axis=0) - bg_color).max() < 10 and colors.std(axis=0).mean() < 8
            if same and (cx < SIDE or cx > 1 - SIDE):
                bg[ys, xs] = True

    # 背景のまわりの白っぽいにじみ（圧縮の名残）にも、背景を数ピクセル広げる（白いふちを残さない）
    whitish = (rgb.min(axis=2) >= 185) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 32)
    for step in range(GROW + 1):
        grown = bg.copy()
        grown[1:, :] |= bg[:-1, :]
        grown[:-1, :] |= bg[1:, :]
        grown[:, 1:] |= bg[:, :-1]
        grown[:, :-1] |= bg[:, 1:]
        # 最後の1回は、白っぽくなくても1ピクセルだけ広げる
        bg = grown if step == GROW else bg | (grown & whitish)
    alpha_img = Image.fromarray(((~bg) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    alpha = np.asarray(alpha_img).astype(np.float32) / 255.0
    alpha[~bg & (alpha < 1)] = np.maximum(alpha[~bg & (alpha < 1)], 0.5)

    # 背景の白が混ざった色を戻す（白いふちを消す）
    a = np.clip(alpha, 1e-3, 1.0)[..., None]
    restored = np.clip((rgb - (1 - a) * bg_color) / a, 0, 255)
    out = np.dstack([restored, alpha * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst, "WEBP", quality=88, method=6)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    cutout(sys.argv[1], sys.argv[2])
