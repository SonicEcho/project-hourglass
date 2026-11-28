# 段階309（docs/milestones/M3_explore_feel.md の 16-6）：新しい1-2 の入口を、地面の絵＋店の部品（右向き。右側は左右を返す）＋張り出す物で組んだ写し。
# 置き場所はマス（x は真ん中、y は下の端、w は幅）。区画に組む時に src/data へ移す
# 使い方：python3 scripts/a12_kit_preview.py 出力.png
import sys
from PIL import Image

T = 32
P = 'public/assets/sprites/parts/'
SHOP_W = 5.0
# 左の列（上から。y は店の下の端のマス）。地面の絵の脇道（9〜10行）の上に2軒、下に2軒。右の列は左右を返す。
# 店は細長いので、高さを縮めて（SHOP_SY）上下に詰め、店先の帯が見えるようにする
SHOP_SY = 0.62
LEFT = [('a12s_fish', 4.6), ('a12s_yaoya', 9.0), ('a12s_candy', 14.4), ('a12s_books', 18.0)]
RIGHT = [('a12s_rice', 4.6), ('a12s_clock', 9.0), ('a12s_hardware', 13.5), ('a12s_tv', 18.0)]
OVER = [
    ('a12_lanterns_red', 12, 2.6, 9.0),
    ('a12_lanterns_white', 12, 11.6, 9.0),
    ('a12_gate', 12, 18.9, 7.6),
]


def place(im, name, x, y, w, flip=False, sy=1.0):
    p = Image.open(P + name + '.webp').convert('RGBA')
    if flip:
        p = p.transpose(Image.FLIP_LEFT_RIGHT)
    pw = int(w * T)
    p = p.resize((pw, int(pw * p.height / p.width * sy)), Image.LANCZOS)
    im.alpha_composite(p, (int(x * T - pw / 2), int(y * T - p.height)))


def build(people=()):
    im = Image.open('public/assets/maps/a12g_gate_kit.webp').convert('RGBA')
    items = [(y, n, 4.9, False) for n, y in LEFT] + [(y, n, 19.1, True) for n, y in RIGHT]
    for (f, x, y) in people:
        items.append((y, f, x, None))
    for y, n, x, flip in sorted(items, key=lambda a: a[0]):
        if flip is None:
            p = Image.open(n).convert('RGBA')
            p = p.resize((48, int(48 * p.height / p.width)))
            im.alpha_composite(p, (int(x * T - 24), int(y * T - p.height)))
        else:
            place(im, n, x, y, SHOP_W, flip, SHOP_SY)
    for (n, x, y, w) in OVER:
        place(im, n, x, y, w, sy=0.72 if n == 'a12_gate' else 1.0)
    return im


if __name__ == '__main__':
    build([('public/assets/sprites/people/c_girls.webp', 12, 17.6), ('public/assets/sprites/people/c_father.webp', 10.6, 8)]).convert('RGB').save(sys.argv[1])
