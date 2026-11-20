# 1-1 の新しい配置の見取り図（docs/milestones/M3_explore_feel.md の 5.）。部屋を全体の地図の並びに置き、晩ごとの物を印で描く。
# 使い方：python3 scripts/a11_rework_layouts.py && python3 scripts/a11_rework_sketch.py
from PIL import Image, ImageDraw, ImageFont
C = 18  # 1マスの大きさ
FONT = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 13) if __import__('os').path.exists('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc') else ImageFont.load_default()
SMALL = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 10) if __import__('os').path.exists('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc') else ImageFont.load_default()
# 全体の地図の並び（部屋の単位）。縦長の部屋は2つ分の高さ
POS = {'fest_gate': (1, 3), 'fest_backyard': (0, 2), 'fest_lane': (0, 1), 'festival_night': (1, 1), 'fest_east': (2, 1), 'fest_woods': (1, -1)}
NAMES = {'fest_gate': '縁日の入口', 'fest_backyard': '屋台の裏', 'fest_lane': '屋台の裏通り（新しい部屋）', 'festival_night': '縁日の広場', 'fest_east': '東の屋台', 'fest_woods': '社の森'}
N = {1: (255, 210, 80), 2: (120, 200, 255), 3: (230, 120, 255)}  # 晩ごとの色
# 置く物：(部屋, マス, 種類, 晩, 文字)
ITEMS = [
    # 1晩目（入口・屋台の裏・広場の下）：部屋ごとに砂嵐2、写しの人は入口1・広場2（離して置く）
    ('fest_gate', (11, 20), 'start', 1, 'S'),
    ('fest_gate', (11, 6), 'enemy', 1, '砂'), ('fest_gate', (18, 16), 'chase', 1, '追'), ('fest_gate', (20, 5), 'chest', 1, '箱'), ('fest_gate', (3, 11), 'talk', 1, '人'),
    ('fest_backyard', (10, 21), 'enemy', 1, '砂'), ('fest_backyard', (4, 32), 'flee', 1, '逃'), ('fest_backyard', (19, 5), 'chest', 1, '箱'), ('fest_backyard', (20, 9), 'chest', 2, '箱'),
    ('festival_night', (11, 30), 'cp', 1, 'P'), ('festival_night', (11, 38), 'enemy', 1, '砂'), ('festival_night', (5, 25), 'chase', 1, '追'),
    ('festival_night', (18, 24), 'talk', 1, '人'), ('festival_night', (8, 32), 'talk', 1, '人'),
    # 2晩目（広場の上・裏通り・東の屋台）：砂嵐は広場2・裏通り2・東2（番人を含む）、写しの人は3つの部屋に1人ずつ
    ('festival_night', (4, 12), 'enemy', 2, '砂'), ('festival_night', (20, 17), 'enemy', 2, '砂'), ('festival_night', (19, 12), 'talk', 2, '人'),
    ('fest_lane', (4, 12), 'chase', 2, '追'), ('fest_lane', (13, 3), 'enemy', 2, '砂'), ('fest_lane', (8, 6), 'chest', 2, '箱'), ('fest_lane', (14, 15), 'talk', 2, '人'),
    ('fest_east', (19, 10), 'chase', 2, '追'), ('fest_east', (21, 20), 'guard', 2, '番'), ('fest_east', (12, 11), 'chest', 1, '箱'), ('fest_east', (8, 4), 'talk', 2, '人'),
    # 3晩目（広場の上・社の森）：砂嵐は広場2・森3、写しの人は広場1・森2
    ('festival_night', (11, 8), 'cp', 1, 'P'), ('festival_night', (14, 5), 'enemy', 3, '砂'), ('festival_night', (20, 14), 'chase', 3, '追'), ('festival_night', (3, 6), 'chest', 3, '箱'), ('festival_night', (9, 13), 'talk', 3, '人'),
    ('fest_woods', (5, 26), 'chase', 3, '追'), ('fest_woods', (11, 10), 'enemy', 3, '砂'), ('fest_woods', (18, 24), 'enemy', 3, '砂'), ('fest_woods', (2, 21), 'chest', 3, '箱'), ('fest_woods', (21, 10), 'chest', 3, '箱'), ('fest_woods', (11, 3), 'boss', 3, 'ぬし'),
    ('fest_woods', (7, 30), 'talk', 3, '人'), ('fest_woods', (17, 15), 'talk', 3, '人'),
]
# ノイズの壁：(部屋, x0, x1, y0, y1, 開く晩)
WALLS = [('festival_night', 10, 13, 20, 20, 2), ('festival_night', 10, 13, 3, 3, 3), ('fest_lane', 10, 13, 21, 21, 2), ('fest_lane', 21, 21, 10, 13, 2)]

def load(n):
    return [l.rstrip('\n') for l in open(f'docs/sketches/a11_rework/{n}.txt')]

def draw():
    UW, UH = 24 * C, 24 * C  # 部屋の単位
    GAP = 34
    xs = [p[0] for p in POS.values()]; ys = [p[1] for p in POS.values()]
    W = (max(xs) - min(xs) + 1) * (UW + GAP) + GAP
    H = (max(ys) - min(ys) + 2) * (UH + GAP) - UH // 2 * 0 + GAP + 60
    img = Image.new('RGB', (W, H + 40), (14, 16, 26)); g = ImageDraw.Draw(img)
    g.text((GAP, 10), '1-1「金魚の名前」新しい配置（案）  色＝晩（黄 1晩目・青 2晩目・紫 3晩目） 砂＝砂嵐 追＝追ってくる 逃＝逃げる 番＝番人 箱＝宝箱 人＝写しの人 P＝チェックポイント ▤＝ノイズの壁', fill=(230, 230, 240), font=SMALL)
    origin = {}
    for n, (px, py) in POS.items():
        L = load(n); rows = len(L)
        ox = GAP + (px - min(xs)) * (UW + GAP); oy = 40 + GAP + (py - min(ys)) * (UH + GAP)
        if rows > 24 and n == 'fest_woods': oy = 40 + GAP + (py - min(ys)) * (UH + GAP)
        origin[n] = (ox, oy)
        for y, row in enumerate(L):
            for x, ch in enumerate(row):
                col = (40, 44, 58) if ch == '#' else (196, 170, 120)
                g.rectangle([ox + x * C, oy + y * C, ox + x * C + C - 1, oy + y * C + C - 1], fill=col)
        g.rectangle([ox - 1, oy - 1, ox + 24 * C, oy + rows * C], outline=(120, 130, 160))
        g.text((ox, oy - 18), NAMES[n], fill=(255, 255, 255), font=FONT)
    for (n, x0, x1, y0, y1, night) in WALLS:
        ox, oy = origin[n]
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                g.rectangle([ox + x * C, oy + y * C, ox + x * C + C - 1, oy + y * C + C - 1], fill=(90, 60, 110))
                g.line([ox + x * C, oy + y * C + C - 1, ox + x * C + C - 1, oy + y * C], fill=(200, 160, 230), width=2)
        g.text((ox + x1 * C + C + 2, oy + y0 * C), f'{night}晩目から', fill=(220, 190, 240), font=SMALL)
    for (n, (x, y), kind, night, t) in ITEMS:
        ox, oy = origin[n]; cx, cy = ox + x * C + C // 2, oy + y * C + C // 2
        col = N[night]
        if kind == 'cp': g.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], outline=(80, 220, 255), width=3); continue
        if kind == 'start': g.rectangle([cx - 7, cy - 7, cx + 7, cy + 7], fill=(255, 240, 0)); g.text((cx - 4, cy - 8), 'S', fill=(0, 0, 0), font=SMALL); continue
        r = 11 if kind == 'boss' else 9
        shape = g.rectangle if kind == 'chest' else g.ellipse
        shape([cx - r, cy - r, cx + r, cy + r], fill=col, outline=(0, 0, 0))
        g.text((cx - (10 if len(t) > 1 else 5), cy - 8), t, fill=(0, 0, 0), font=SMALL)
    img.save('docs/sketches/a11_rework/overview.png')
    print(img.size)

def crowd():
    warn = []
    things = [i for i in ITEMS if i[2] not in ('cp', 'start')]
    for i, a in enumerate(things):
        for b in things[i + 1:]:
            if a[0] != b[0]: continue
            # 晩をまたいで残る物（宝箱）は、出る晩より後でも同じ所にあるので、晩が違っても比べる
            same = a[3] == b[3] or 'chest' in (a[2], b[2])
            d = abs(a[1][0] - b[1][0]) + abs(a[1][1] - b[1][1])
            if same and d < 5: warn.append(f'{a[0]} {a[4]}{a[1]} と {b[4]}{b[1]} が近い（{d}マス）')
    rooms = {}
    for (n, _, kind, night, _) in things: rooms.setdefault((n, night), []).append(kind)
    for k in sorted(rooms): print(k, rooms[k])
    for (n, (x, y), kind, _, t) in ITEMS:
        if load(n)[y][x] == '#': warn.append(f'{n} {t}({x}, {y}) が歩けないマスにある')
    print('近すぎる物・置けない所：', warn or 'なし')

draw()
crowd()
