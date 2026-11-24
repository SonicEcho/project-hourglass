# 段階276（docs/milestones/M3_explore_feel.md の 9.）：案3の部屋の作りの下書き（道と屋台の島）。地面の絵を頼む前に開発者と形を決めるための絵
# 使い方：python3 scripts/a11_v3_sketch.py → docs/sketches/a11_v3/<部屋>_plan.png
from PIL import Image, ImageDraw, ImageFont

T = 34
F = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', 15)
FB = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', 22)
C = {'#': (34, 58, 34), '.': (196, 150, 98), 's': (168, 160, 150), 'g': (92, 128, 70), 'F': (226, 92, 70), 'B': (150, 120, 90), 'x': (74, 150, 222), 'o': (120, 96, 70), 'h': (150, 90, 190), 'y': (214, 170, 110), 'd': (120, 70, 50)}


def plan(name, title, rows, labels, legend):
    w = 24 * T
    im = Image.new('RGB', (w + 330, w + 50), (20, 22, 30))
    d = ImageDraw.Draw(im)
    d.text((10, 10), title, font=FB, fill=(240, 240, 240))
    for y, line in enumerate(rows):
        for x, ch in enumerate(line):
            d.rectangle([x * T, 46 + y * T, (x + 1) * T - 1, 46 + (y + 1) * T - 1], fill=C.get(ch, (0, 0, 0)))
    for k in range(25):
        d.line([k * T, 46, k * T, 46 + w], fill=(0, 0, 0))
        d.line([0, 46 + k * T, w, 46 + k * T], fill=(0, 0, 0))
    for (x, y, t) in labels:
        d.text((x * T + 2, 46 + y * T + 4), t, font=F, fill=(255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0))
    ly = 60
    for ch, t in legend:
        d.rectangle([w + 20, ly, w + 44, ly + 24], fill=C[ch])
        d.text((w + 52, ly + 2), t, font=F, fill=(230, 230, 230))
        ly += 36
    im.save(f'docs/sketches/a11_v3/{name}_plan.png')


GATE = [
    '##########xxxx##########',
    '#.....BBB#ssss#BBB.....#',
    '#.oo..BBB#ssss#BBB..oo.#',
    '#.....###.ssss.###.....#',
    '###FFF###.ssss.###FFF###',
    '##FFFFFFFF.ss.FFFFFFFF##',
    '##FFFFFFFF.ss.FFFFFFFF##',
    'x.......................',
    'x.......................',
    'x...........FFFF........',
    'x...........FFFF........',
    '##BBBBBBB...BBBB...BBBB#',
    '##BBBBBBB.........BBBBB#',
    '##gggggggg.ssss.ggggggg#',
    '##gggggggg.ssss.ggggggg#',
    '##gggogggg.ssss.gggoggg#',
    '###ggggggg.ssss.gggggg##',
    '###gggggg..ssss..ggggg##',
    '###sssssssssssssssssss##',
    '###sssssssssssssssssss##',
    '###sssssssssssssssssss##',
    '###sssssssssssssssssss##',
    '########################',
    '########################',
]
plan('gate', '入口（案3）：屋台は横に走る通りに。通りの上は表、下は裏', GATE,
     [(9, 18, '鳥居（参道の上）'), (1, 8, '←屋台の裏へ'), (10, 0, '↑広場へ'), (3, 5, '屋台の表（南を向く）'), (14, 5, '屋台の表'),
      (12, 9, '島：表'), (2, 11, '屋台の裏（北を向く屋台）'), (18, 11, '屋台の裏'), (3, 14, '庭（木・灯籠・狛犬）'), (17, 14, '庭'),
      (1, 2, '奥の物置（宝箱）'), (19, 2, '奥の物置'), (6, 20, '着いた所（石畳の広場）')],
     [('.', '土の通り（歩ける）'), ('s', '石畳（歩ける）'), ('F', '屋台の表（売り場が見える）'), ('B', '屋台の裏（裏側が見える）'), ('g', '庭・植え込み（歩けない）'), ('o', '荷物・石灯籠'), ('#', '木・塀（歩けない）'), ('x', '出入口')])


EAST = [
    '########################',
    '########################',
    '########################',
    '###################hhh##',
    '#hhhhhhhhhhhhhhhhhhhhh##',
    '#.FFFFFFFFFFFFFFFFFFoo##',
    '#.FFFFFFFFFFFFFFFFFFoo##',
    '#......................#',
    'x......................#',
    'x......................#',
    'x......................#',
    'x......................#',
    '#..BBBBBBBBddBBBBBBBB..#',
    '#..BBBBBBB#yyyy#BBBBB..#',
    '#..ggggggg#yyyy#ggggg..#',
    '#..FFFFFF##yyyy#FFFFF..#',
    '#..FFFFFF#######FFFFF..#',
    '#......................#',
    '#......................#',
    '#......................#',
    '#################....###',
    '#################....###',
    '########################',
    '########################',
]
plan('east', '東の屋台（案3）：上の屋台の列の裏に隠し通路（紫）', EAST,
     [(3, 5, 'お面屋3軒（表）・おもちゃ'), (20, 5, '自販機'), (2, 4, '隠し通路（屋台の裏。誘導なし）'), (19, 3, '奥（宝箱）'), (1, 6, '入口'), (1, 9, '←広場へ'),
      (5, 9, '表の通り'), (3, 12, '屋台の裏'), (11, 12, '板'), (11, 14, '隠れた庭'), (3, 15, '射的（表は下向き）'), (16, 15, '金魚すくい'),
      (5, 18, '下の通り（ぐるっと回る）'), (17, 20, '番人の行き止まり'), (3, 14, '植え込み')],
     [('.', '土の通り（歩ける）'), ('h', '隠し通路（歩ける。屋台の絵の裏）'), ('y', '隠れた庭（歩ける）'), ('d', '板のかべ（仕掛け）'), ('F', '屋台の表'), ('B', '屋台の裏'), ('g', '植え込み'), ('o', '自販機'), ('#', '家・塀・木'), ('x', '出入口')])
print('ok')

