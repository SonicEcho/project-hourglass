"""立ち絵のまばたき・口パクの差分の絵を作る（段階46b。docs/design/dialogue.md の 2.）。

同じ構図で作ってきた表情の絵から、目（閉じた所）・口（開けた所）のまわりだけを楕円に切り抜き、
ふちをぼかした透明な絵にする。会話の画面は、この絵を表情の絵の上に重ねて、まばたき・口パクに使う。
絵の大きさは元の立ち絵と同じ（重ねる位置を合わせるため）。透明な所が多いので、ファイルは小さい。

使い方: python3 scripts/portrait_parts.py
（pip install pillow。作った絵は public/assets/portraits/parts/ に入る。台帳は src/data/assets.ts）
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/assets/portraits"
OUT = SRC / "parts"

# 出す絵の名前 → (元にする表情の絵, 切り抜く楕円 (左, 上, 右, 下), ぼかし, 縦の縮め)
PARTS = {
    # あかりの閉じた目：「大笑い」の目。眉の下から頬の上まで
    "akari_blink": ("akari_laugh", (280, 250, 565, 355), 5, 1.0),
    # あかりの開いた口：「心配」の小さく開いた口
    "akari_talk": ("akari_worried", (385, 385, 475, 435), 6, 1.0),
    # ハルトの開いた口：「驚き」の口
    "hero_talk": ("hero_surprised", (400, 398, 466, 446), 6, 1.0),
    # りくの開いた口：「驚き」の口（大きく開いているので、縦を縮めて話す口の大きさにする）
    "riku_talk": ("riku_surprised", (398, 370, 484, 420), 6, 0.75),
    # ハルトの閉じた目：Gemini で「通常」から目だけ閉じた絵（hero_blink_src）。眉の下から頬の上まで
    "hero_blink": ("hero_blink_src", (290, 290, 580, 362), 5, 1.0),
    # りくの閉じた目：Gemini で「通常」から目を閉じた絵（riku_blink_src。笑った目になった）。眉の下から頬の上まで
    "riku_blink": ("riku_blink_src", (265, 246, 585, 330), 5, 1.0),
}


def make(name: str, src: str, box: tuple[int, int, int, int], feather: int, squash: float) -> None:
    im = Image.open(SRC / f"{src}.webp").convert("RGBA")
    if squash != 1.0:
        # 楕円の中ほどを中心に、縦だけ縮める（周りの肌ごと縮めるので、ふちのぼかしでなじむ）
        cy = (box[1] + box[3]) / 2
        part = im.crop((0, box[1] - 20, im.width, box[3] + 20))
        h = round(part.height * squash)
        part = part.resize((im.width, h), Image.LANCZOS)
        im = im.copy()
        im.paste(part, (0, round(cy - h / 2)))
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).ellipse(box, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather))
    # 色は元のまま、透明度だけをぼかす（黒い透明に貼ると、ふちが暗い輪になるため）
    out = im.copy()
    out.putalpha(ImageChops.multiply(im.getchannel("A"), mask))
    OUT.mkdir(exist_ok=True)
    out.save(OUT / f"{name}.webp", quality=88, method=6)
    print(f"{name}.webp ← {src}")


if __name__ == "__main__":
    for name, (src, box, feather, squash) in PARTS.items():
        make(name, src, box, feather, squash)
