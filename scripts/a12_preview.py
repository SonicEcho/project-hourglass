# 段階308（docs/milestones/M3_explore_feel.md の 16-5）：新しい1-2 の部屋に、通りの上にかかる部品（門・提灯のひも・のぼり）を置いた写し。
# 置き場所はマス（x は真ん中、y は下の端、w は幅、sy は縦の縮め。門は柱の間を通りの幅に合わせ、高さを人の3倍ほどにおさえる）。区画に組む時に src/data へ移す
# 使い方：python3 scripts/a12_preview.py 出力.png
import sys
from PIL import Image

T = 32
P = 'public/assets/sprites/parts/'
OVER = {
    'gate': [
        ('a12_lanterns_red', 12, 3.0, 8.4, 1),
        ('a12_nobori_red', 7.0, 10.4, 0.9, 1),
        ('a12_nobori_blue', 16.6, 9.6, 0.9, 1),
        ('a12_lanterns_white', 12, 11.2, 8.4, 1),
        ('a12_nobori_yellow', 7.0, 15.6, 0.9, 1),
        ('a12_gate', 12, 18.4, 8.6, 0.72),
    ],
}


def overhead(room, im, people=()):
    for (f, x, y) in people:
        p = Image.open(f).convert('RGBA')
        p = p.resize((48, int(48 * p.height / p.width)))
        im.alpha_composite(p, (int(x * T - 24), int(y * T - p.height)))
    for (name, x, y, w, sy) in OVER[room]:
        p = Image.open(P + name + '.webp').convert('RGBA')
        pw = int(w * T)
        p = p.resize((pw, int(pw * p.height / p.width * sy)), Image.LANCZOS)
        im.alpha_composite(p, (int(x * T - pw / 2), int(y * T - p.height)))
    return im


if __name__ == '__main__':
    g = Image.open('public/assets/maps/a12g_gate_ground.webp').convert('RGBA')
    old = Image.alpha_composite(g, Image.open('public/assets/maps/a12g_gate_over.webp').convert('RGBA'))
    new = overhead('gate', g.copy(), [('public/assets/sprites/people/c_girls.webp', 12, 17.4), ('public/assets/sprites/people/c_father.webp', 10.5, 11)])
    o = Image.new('RGB', (1556, 768), (20, 22, 30))
    o.paste(old.convert('RGB'), (0, 0))
    o.paste(new.convert('RGB'), (788, 0))
    o.save(sys.argv[1])
