"""白い背景の敵の絵から、背景を透明に抜いて WebP で書き出す（2026-10-13）。

使い方: python3 scripts/cutout_white.py 入力.png 出力.webp [大きさ（既定 640）]
必要なもの: pip install pillow numpy scipy

砂とノイズでできた敵（砂嵐）は、rembg（scripts/cutout.py）だと体の大部分を背景とみなして消してしまう。
そこで、白に近い所のうち広いもの（外の背景と、砂の渦の内側の隙間）を背景として抜き、
小さな白（ガラスの光りなど）は残す。背景の縁は、白からの割り戻しで半透明にしてなじませる。
"""

import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

WHITE = 236  # これより明るい（RGB の一番暗い値が上）所を、白に近いとみなす
MIN_AREA = 300  # 白に近い所がこれ以上の広さ（画素）なら背景とみなす（元の 1254×1254 の絵で）


def cutout_white(src: str, dst: str, size: int = 640) -> None:
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    near_white = rgb.min(axis=2) >= WHITE
    lab, _ = ndimage.label(near_white)
    sizes = ndimage.sum(near_white, lab, range(lab.max() + 1))
    bg = near_white & (sizes[lab] >= MIN_AREA)
    # 背景の所は、白い紙の上に半透明の色が乗っていたとして割り戻す（c = a*f + (1-a)*白）
    c = np.clip(rgb * 255.0 / 248.0, 0, 255)
    soft = 1.0 - c.min(axis=2) / 255.0
    a = np.where(bg, soft, 1.0)
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255.0
    safe = np.maximum(a, 1e-3)[..., None]
    f = np.where(bg[..., None], np.clip(255.0 - (255.0 - c) / safe, 0, 255), rgb)
    out = np.dstack([f, a * 255.0]).astype(np.uint8)
    Image.fromarray(out, "RGBA").resize((size, size), Image.LANCZOS).save(dst, "WEBP", quality=88, method=6)


if __name__ == "__main__":
    if len(sys.argv) not in (3, 4):
        print(__doc__)
        sys.exit(1)
    cutout_white(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) == 4 else 640)
