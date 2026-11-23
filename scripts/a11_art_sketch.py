# 段階270（docs/milestones/M3_explore_feel.md の 7.）：新しい1-1 の部屋の絵を頼む時に添付する下絵を作る。
# 使い方：node scripts/a11_art_dump.mjs && python3 scripts/a11_art_sketch.py
#   docs/sketches/a11_art/room_<部屋>.png（1024×1024。絵の AI に添付する）と、確認用の overview.png を作る
# 色：明るい砂色＝歩ける地面、こげ茶＝建物・屋台・木などの歩けない物、青＝出入口、
#     砂色に斜線＝歩ける陰（屋台の軒下・木の下。隠れられる所）、水色＝池（3晩目に飛び石が出る所。絵には飛び石を描く）
import json
from PIL import Image, ImageDraw, ImageFont

D = 'docs/sketches/a11_art/'
data = json.load(open(D + 'rooms.json'))
S = 1024
FLOOR, WALL, SHADE, EXIT, POND = (232, 220, 192), (60, 52, 50), (196, 176, 140), (90, 156, 226), (120, 190, 210)

# 池（社の森の池の霧の扉。歩ける文字のマスだが、絵では池と飛び石）
pond = {tuple(c) for g in data['gates'] if g['look'] == 'water' for c in g['cells']}


T0 = S // 24
HATCH = Image.new('RGB', (T0 + 1, T0 + 1), SHADE)
_hd = ImageDraw.Draw(HATCH)
for k in range(-T0, T0, 10):
    _hd.line([k, 0, k + T0, T0], fill=(150, 130, 100), width=2)


def draw_room(r):
    lay = r['layout']
    rows, cols = len(lay), len(lay[0])
    t = S / cols
    im = Image.new('RGB', (S, S), WALL)
    d = ImageDraw.Draw(im)
    for y, line in enumerate(lay):
        for x, ch in enumerate(line):
            box = [x * t, y * t, (x + 1) * t - 1, (y + 1) * t - 1]
            if ch == '#':
                continue
            if r['id'] == 'fest2_woods' and (x, y) in pond:
                d.rectangle(box, fill=POND)
                continue
            if ch == ':':
                im.paste(HATCH, (int(box[0]), int(box[1])))
            else:
                d.rectangle(box, fill=FLOOR)
    # 出入口：縁の歩けるマス
    for y, line in enumerate(lay):
        for x, ch in enumerate(line):
            if ch == '#':
                continue
            edge = (y == 0 and 'top' in r['exits']) or (y == rows - 1 and 'bottom' in r['exits']) or (x == 0 and 'left' in r['exits']) or (x == cols - 1 and 'right' in r['exits'])
            if edge:
                d.rectangle([x * t, y * t, (x + 1) * t - 1, (y + 1) * t - 1], fill=EXIT)
    # うすいマス目（重ねやすさの目安）
    for k in range(cols + 1):
        d.line([k * t, 0, k * t, S], fill=(0, 0, 0), width=1)
        d.line([0, k * t, S, k * t], fill=(0, 0, 0), width=1)
    return im


ims = []
for r in data['rooms']:
    im = draw_room(r)
    im.save(D + f"room_{r['id']}.png")
    ims.append((r, im))

# 確認用の一覧（名前つき）
font = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', 28)
W = 3 * 520 + 40
ov = Image.new('RGB', (W, 2 * 570 + 40), (20, 22, 30))
od = ImageDraw.Draw(ov)
for i, (r, im) in enumerate(ims):
    x, y = 20 + (i % 3) * 520, 20 + (i // 3) * 570
    od.text((x, y), f"{r['name']}（{r['id']}）", font=font, fill=(230, 230, 230))
    ov.paste(im.resize((500, 500)), (x, y + 44))
ov.save(D + 'overview.png')
print('wrote', len(ims), 'sketches')
