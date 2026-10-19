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

# りくの口のまわり：鼻の下にかからない高さから、あごの上まで
RIKU_MOUTH = [(352, 364, 520, 436)]
# 通常・得意げ・にやりは右の口角が上がっているので、その端も覆う
RIKU_GRIN_CORNER = [(462, 338, 520, 380)]

# 出す絵の名前 → (元にする表情の絵, 切り抜く楕円 (左, 上, 右, 下)（いくつか重ねる時は並べる）, ぼかし, 縦の縮め)
PARTS = {
    # あかりの閉じた目：「大笑い」の目。眉の下から頬の上まで
    "akari_blink": ("akari_laugh", (280, 250, 565, 355), 5, 1.0),
    # あかりの開いた口：「心配」の小さく開いた口
    "akari_talk": ("akari_worried", (385, 385, 475, 435), 6, 1.0),
    # ハルトの開いた口：「驚き」の口
    "hero_talk": ("hero_surprised", (400, 398, 466, 446), 6, 1.0),
    # りくの開いた口：表情ごとに、Gemini でその表情から口だけ開けた絵（riku_talk_<表情>_src）を作り、口のまわりを切り抜く
    # （1つの口をどの表情にも重ねると、顔の傾きが違う表情で口の線や鼻がずれたため。2026-10-11）
    **{
        f"riku_talk_{face}": (f"riku_talk_{face}_src", RIKU_MOUTH + (RIKU_GRIN_CORNER if face in ("normal", "proud", "smirk") else []), 6, 1.0)
        for face in ("normal", "proud", "serious", "sad", "smirk", "flustered")
    },
    # ハルトの閉じた目：Gemini で「通常」から目だけ閉じた絵（hero_blink_src）。眉の下から頬の上まで
    "hero_blink": ("hero_blink_src", (290, 290, 580, 362), 5, 1.0),
    # りくの閉じた目：Gemini で「通常」から目を閉じた絵（riku_blink_src。笑った目になった）。眉の下から頬の上まで
    "riku_blink": ("riku_blink_src", (265, 246, 585, 330), 5, 1.0),
    # 1-1・1-2 の人たち（2026-10-19）。Gemini で「通常」から目だけ閉じた絵・口だけ開けた絵（<人>_blink_src・<人>_talk_src。843×1264）
    "yuma_blink": ("yuma_blink_src", (290, 255, 538, 340), 5, 1.0),
    "yuma_talk": ("yuma_talk_src", (360, 382, 500, 470), 6, 1.0),
    "fumi_blink": ("fumi_blink_src", (272, 300, 578, 404), 5, 1.0),
    "fumi_talk": ("fumi_talk_src", (372, 442, 504, 524), 6, 1.0),
    # 子りくは顔が傾いていて、左右の目の高さが違うので、目ごとに楕円を分けた
    "young_riku_blink": ("young_riku_blink_src", [(250, 340, 396, 486), (418, 288, 590, 444)], 6, 1.0),
    "young_riku_talk": ("young_riku_talk_src", (366, 490, 520, 575), 6, 1.0),
    "past_yuma_blink": ("past_yuma_blink_src", (266, 292, 554, 410), 5, 1.0),
    "past_yuma_talk": ("past_yuma_talk_src", (370, 450, 486, 512), 6, 1.0),
    "past_kiyoshi_blink": ("past_kiyoshi_blink_src", (287, 268, 543, 345), 5, 1.0),
    "past_kiyoshi_talk": ("past_kiyoshi_talk_src", (350, 418, 500, 482), 6, 1.0),
}

# 基本の1枚（ChatGPT。1024×1536）に重ねる分：Gemini の絵（843×1264）から作った差分を、基本の1枚の大きさに広げたものも作る（<名前>_l）。
# 差分の絵は重ねる表情の絵と同じ大きさでないと、位置がずれる（会話の画面は、差分を表情の絵と同じ倍率で出すため）
LARGE = {"yuma_blink", "fumi_blink", "fumi_talk", "young_riku_blink", "past_yuma_blink", "past_kiyoshi_blink", "past_kiyoshi_talk"}
LARGE_SIZE = (1024, 1536)


def make(name: str, src: str, box: tuple[int, int, int, int] | list[tuple[int, int, int, int]], feather: int, squash: float) -> None:
    boxes = box if isinstance(box, list) else [box]
    box = boxes[0]
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
    for b in boxes:
        ImageDraw.Draw(mask).ellipse(b, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather))
    # 色は元のまま、透明度だけをぼかす（黒い透明に貼ると、ふちが暗い輪になるため）
    out = im.copy()
    out.putalpha(ImageChops.multiply(im.getchannel("A"), mask))
    OUT.mkdir(exist_ok=True)
    out.save(OUT / f"{name}.webp", quality=88, method=6)
    print(f"{name}.webp ← {src}")
    if name in LARGE:
        out.resize(LARGE_SIZE, Image.LANCZOS).save(OUT / f"{name}_l.webp", quality=88, method=6)
        print(f"{name}_l.webp ← {src}（{LARGE_SIZE[0]}×{LARGE_SIZE[1]} に広げた）")


if __name__ == "__main__":
    for name, (src, box, feather, squash) in PARTS.items():
        make(name, src, box, feather, squash)
