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
    # ---- 1晩目（入口・屋台の裏・広場の下） ----
    ('fest_gate', (11, 20), 'start', 1, 'S'),
    ('fest_gate', (20, 5), 'chest', 1, '箱'), ('fest_gate', (3, 11), 'talk', 1, '人'), ('fest_gate', (13, 11), 'photo', 1, '写'),
    ('fest_backyard', (11, 21), 'puzzle', 1, '仕'), ('fest_backyard', (4, 5), 'key', 1, '品'), ('fest_backyard', (13, 36), 'chest', 1, '箱'), ('fest_backyard', (20, 9), 'chest', 2, '箱'), ('fest_backyard', (2, 31), 'later', 1, '直'),
    ('festival_night', (11, 30), 'cp', 1, 'P'), ('festival_night', (19, 29), 'ability', 1, '歌'), ('festival_night', (21, 29), 'photo', 1, '写'),
    ('festival_night', (18, 24), 'talk', 1, '人'), ('festival_night', (8, 32), 'talk', 1, '人'),
    # ---- 2晩目（広場の上・裏通り・東の屋台） ----
    ('festival_night', (19, 12), 'talk', 2, '人'),
    ('fest_lane', (4, 15), 'puzzle', 2, '仕'), ('fest_lane', (8, 6), 'key', 2, '品'), ('fest_lane', (18, 3), 'chest', 2, '箱'), ('fest_lane', (14, 15), 'talk', 2, '人'),
    ('fest_east', (12, 4), 'puzzle', 2, '仕'), ('fest_east', (12, 11), 'chest', 2, '箱'), ('fest_east', (11, 13), 'photo', 2, '写'), ('fest_east', (8, 19), 'talk', 2, '人'), ('fest_east', (20, 3), 'later', 2, '雷'),
    # ---- 3晩目（広場の上・社の森） ----
    ('festival_night', (11, 8), 'cp', 1, 'P'), ('festival_night', (3, 6), 'chest', 3, '箱'), ('festival_night', (9, 13), 'talk', 3, '人'),
    ('festival_night', (6, 24), 'puzzle', 3, '灯'), ('festival_night', (17, 24), 'puzzle', 3, '灯'), ('festival_night', (11, 32), 'puzzle', 3, '灯'), ('festival_night', (11, 25), 'chest', 3, '箱'),
    ('fest_woods', (11, 15), 'ability', 3, 'カ'), ('fest_woods', (11, 22), 'photo', 3, '写'), ('fest_woods', (21, 10), 'chest', 3, '箱'), ('fest_woods', (2, 22), 'later', 3, '刀'), ('fest_woods', (11, 3), 'boss', 3, 'ぬし'),
    ('fest_woods', (7, 30), 'talk', 3, '人'), ('fest_woods', (17, 15), 'talk', 3, '人'),
]
# 砂嵐：(部屋, 見回りの点, 動き, 晩, コマを持つか)。追ってくる物は、気づく範囲（4マス）を丸で描く
ENEMIES = [
    ('fest_gate', [(11, 4), (11, 16)], 'patrol', 1, True), ('fest_gate', [(20, 20), (16, 20)], 'chase', 1, False),
    ('fest_backyard', [(8, 18), (14, 18), (14, 24), (8, 24)], 'patrol', 1, False), ('fest_backyard', [(4, 32)], 'flee', 1, False),
    ('festival_night', [(11, 35), (11, 40)], 'patrol', 1, True), ('festival_night', [(5, 24), (5, 30)], 'chase', 1, True),
    ('festival_night', [(3, 12), (20, 12)], 'patrol', 2, True), ('festival_night', [(20, 15), (20, 17)], 'patrol', 2, False),
    ('fest_lane', [(4, 9), (4, 12)], 'chase', 2, False), ('fest_lane', [(8, 3), (16, 3)], 'patrol', 2, True),
    ('fest_east', [(19, 11), (19, 17)], 'chase', 2, False), ('fest_east', [(21, 20)], 'guard', 2, True),
    ('festival_night', [(9, 5), (14, 5)], 'patrol', 3, False), ('festival_night', [(20, 13), (20, 17)], 'chase', 3, False),
    ('fest_woods', [(18, 20), (18, 27)], 'chase', 3, False), ('fest_woods', [(11, 7), (11, 13)], 'patrol', 3, True),
]
# 仕掛けや力で開く所：(部屋, x0, x1, y0, y1, 名前)
GATES = [
    ('fest_backyard', 7, 19, 27, 37, '停電で真っ暗（発電機を直すと入れる）'),
    ('fest_lane', 3, 5, 16, 16, '荷車（上から押すと近道）'),
    ('festival_night', 20, 20, 27, 30, '人混み（あかりが歌うと道をあける）'),
    ('fest_east', 7, 9, 11, 12, '射的の裏のすき間（お面を届けると）'),
    ('fest_woods', 11, 12, 17, 27, '池の飛び石（カメラで写すと見える）'),
    ('fest_woods', 9, 14, 21, 23, ''),
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
    g.text((GAP, 6), '1-1「金魚の名前」新しい配置（案2：仕掛け・仲間の力・出し抜く）  色＝晩（黄 1晩目・青 2晩目・紫 3晩目）', fill=(230, 230, 240), font=FONT)
    g.text((GAP, 24), '赤丸＝砂嵐（金の縁＝コマを持つ。後ろから触れても戦う）　線と三角＝見回りの道と見つかる範囲　大きな丸＝追ってくる砂嵐が気づく範囲　緑のマス＝陰（隠れられる）　茶の斜線＝仕掛け・力で開く所', fill=(230, 230, 240), font=SMALL)
    g.text((GAP, 38), 'ひし形＝仕掛け（仕・灯）・仲間の力（歌＝あかり、カ＝ハルトのカメラ）　橙の四角＝仕掛けに使う品　白丸＝思い出の一枚　灰丸＝後で来る所（雷＝みお・刀＝小夜子・直＝早瀬）　箱＝宝箱　人＝写しの人　P＝チェックポイント　紫の斜線＝ノイズの壁', fill=(230, 230, 240), font=SMALL)
    origin = {}
    for n, (px, py) in POS.items():
        L = load(n); rows = len(L)
        ox = GAP + (px - min(xs)) * (UW + GAP); oy = 60 + GAP + (py - min(ys)) * (UH + GAP)
        if rows > 24 and n == 'fest_woods': oy = 60 + GAP + (py - min(ys)) * (UH + GAP)
        origin[n] = (ox, oy)
        for y, row in enumerate(L):
            for x, ch in enumerate(row):
                col = (40, 44, 58) if ch == '#' else (120, 150, 110) if ch == ':' else (196, 170, 120)
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
    for (n, x0, x1, y0, y1, label) in GATES:
        ox, oy = origin[n]
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if load(n)[y][x] == '#': continue
                gx, gy = ox + x * C, oy + y * C
                g.rectangle([gx, gy, gx + C - 1, gy + C - 1], fill=(150, 95, 60))
                g.line([gx, gy, gx + C - 1, gy + C - 1], fill=(230, 170, 120), width=2)
        if label: g.text((ox + x0 * C, oy + y1 * C + C + 1), label, fill=(255, 200, 150), font=SMALL)
    for (n, pts, move, night, koma) in ENEMIES:
        ox, oy = origin[n]
        P = [(ox + x * C + C // 2, oy + y * C + C // 2) for (x, y) in pts]
        col = N[night]
        if len(P) > 1:
            g.line(P + ([P[0]] if len(P) > 2 else []), fill=col, width=2)
            (ax, ay), (bx, by) = P[0], P[1]
            dx, dy = (bx > ax) - (bx < ax), (by > ay) - (by < ay)
            # 見つかる範囲（見回りの向きに3マス先まで、広がる三角）
            tip = (ax + dx * C * 3.5, ay + dy * C * 3.5); side = (-dy * C * 1.5, dx * C * 1.5)
            g.polygon([(ax, ay), (tip[0] + side[0], tip[1] + side[1]), (tip[0] - side[0], tip[1] - side[1])], outline=col)
        if move == 'chase':
            cx, cy = P[0]; g.ellipse([cx - C * 4, cy - C * 4, cx + C * 4, cy + C * 4], outline=col)
        cx, cy = P[0]; r = 10
        g.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(235, 80, 80), outline=(255, 215, 0) if koma else (0, 0, 0), width=3 if koma else 1)
        t = {'patrol': '砂', 'chase': '追', 'flee': '逃', 'guard': '番'}[move]
        g.text((cx - 5, cy - 8), t, fill=(0, 0, 0), font=SMALL)
    for (n, (x, y), kind, night, t) in ITEMS:
        ox, oy = origin[n]; cx, cy = ox + x * C + C // 2, oy + y * C + C // 2
        col = N[night]
        if kind == 'cp': g.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], outline=(80, 220, 255), width=3); continue
        if kind == 'start': g.rectangle([cx - 7, cy - 7, cx + 7, cy + 7], fill=(255, 240, 0)); g.text((cx - 4, cy - 8), 'S', fill=(0, 0, 0), font=SMALL); continue
        r = 11 if kind == 'boss' else 9
        fill = {'photo': (255, 255, 255), 'later': (110, 110, 120), 'key': (255, 160, 60)}.get(kind, col)
        if kind in ('puzzle', 'ability'): g.polygon([(cx, cy - r - 3), (cx + r + 3, cy), (cx, cy + r + 3), (cx - r - 3, cy)], fill=fill, outline=(0, 0, 0))
        elif kind in ('chest', 'key'): g.rectangle([cx - r, cy - r, cx + r, cy + r], fill=fill, outline=(0, 0, 0))
        else: g.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill, outline=(0, 0, 0))
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
            pair = {a[2], b[2]}
            # 力・仕掛けと、その先のごほうび（思い出の一枚・宝箱）は並べて置く
            if pair <= {'ability', 'photo', 'chest', 'puzzle'} and 'photo' in pair or pair == {'puzzle', 'chest'}: continue
            if same and d < 5: warn.append(f'{a[0]} {a[4]}{a[1]} と {b[4]}{b[1]} が近い（{d}マス）')
    rooms = {}
    for (n, _, kind, night, _) in things: rooms.setdefault((n, night), []).append(kind)
    for k in sorted(rooms): print(k, rooms[k])
    for (n, (x, y), kind, _, t) in ITEMS:
        if load(n)[y][x] == '#': warn.append(f'{n} {t}({x}, {y}) が歩けないマスにある')
    for (n, pts, move, _, _) in ENEMIES:
        L = load(n)
        for (x, y) in pts:
            if L[y][x] == '#': warn.append(f'{n} 砂嵐の点 ({x}, {y}) が歩けないマス')
        for (a, b) in zip(pts, pts[1:] + pts[:1] if len(pts) > 2 else pts[1:]):
            for t in range(0, 101):
                x = round(a[0] + (b[0] - a[0]) * t / 100); y = round(a[1] + (b[1] - a[1]) * t / 100)
                if L[y][x] == ':': warn.append(f'{n} 砂嵐の道 {a}→{b} が陰（{x}, {y}）を通る'); break
    print('近すぎる物・置けない所：', warn or 'なし')

draw()
crowd()
