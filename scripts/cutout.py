"""立ち絵の背景を透明に抜いて、WebP で書き出す（段階18a）。

使い方: python3 scripts/cutout.py 入力.jpg 出力.webp
必要なもの: pip install "rembg[cpu]"（初回に、背景を抜く AI のモデル isnet-anime（約180MB）を自動で取ってくる）

アニメ調の絵に向いた背景を抜く AI（rembg の isnet-anime）で、キャラ以外を透明にする。
髪のすき間に閉じこめられた背景も抜け、白いシャツや歯は残る。
道具は開発の時だけ使い、配布物には入らない（rembg は MIT、isnet-anime は Apache-2.0）。
"""

import sys

from PIL import Image
from rembg import new_session, remove


def cutout(src: str, dst: str) -> None:
    session = new_session("isnet-anime")
    out = remove(Image.open(src).convert("RGB"), session=session)
    out.save(dst, "WEBP", quality=88, method=6)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    cutout(sys.argv[1], sys.argv[2])
