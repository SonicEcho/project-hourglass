# 1-1 の小さく濃い配置の見取り図（段階268。docs/milestones/M3_explore_feel.md の 6-1）。部屋を全体の地図の並びに置き、晩ごとの物を印で描く。
# 使い方：python3 scripts/a11_compact_layouts.py && python3 scripts/a11_compact_sketch.py
from PIL import Image, ImageDraw, ImageFont
C = 18  # 1マスの大きさ
FONT = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 13) if __import__('os').path.exists('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc') else ImageFont.load_default()
SMALL = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 10) if __import__('os').path.exists('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc') else ImageFont.load_default()
# 全体の地図の並び（部屋の単位）。縦長の部屋は2つ分の高さ
POS = {'fest_gate': (1, 2), 'fest_backyard': (0, 2), 'fest_lane': (0, 1), 'festival_night': (1, 1), 'fest_east': (2, 1), 'fest_woods': (1, 0)}
NAMES = {'fest_gate': '縁日の入口', 'fest_backyard': '屋台の裏', 'fest_lane': '屋台の裏通り', 'festival_night': '縁日の広場', 'fest_east': '東の屋台', 'fest_woods': '社の森'}
N = {1: (255, 210, 80), 2: (120, 200, 255), 3: (230, 120, 255)}  # 晩ごとの色
# 置く物：(部屋, マス, 種類, 晩, 文字)
ITEMS = [
    # ---- 1晩目（入口・屋台の裏・広場の下） ----
    ('fest_gate', (11, 20), 'start', 1, 'S'),
    ('fest_gate', (20, 5), 'chest', 1, '箱'), ('fest_gate', (3, 11), 'talk', 1, '人'), ('fest_gate', (13, 11), 'photo', 1, '写'), ('fest_gate', (16, 14), 'show', 1, '★'),
    ('fest_backyard', (3, 3), 'key', 1, '箱?'), ('fest_backyard', (6, 3), 'key', 1, '箱?'), ('fest_backyard', (8, 4), 'key', 1, '箱?'),
    ('fest_backyard', (11, 10), 'puzzle', 1, '発'), ('fest_backyard', (18, 19), 'chest', 1, '箱'), ('fest_backyard', (2, 20), 'later', 1, '直'), ('fest_backyard', (11, 17), 'show', 1, '★'),
    ('festival_night', (11, 19), 'cp', 1, 'P'), ('festival_night', (18, 18), 'ability', 1, '歌'), ('festival_night', (21, 18), 'photo', 1, '写'),
    ('festival_night', (7, 18), 'talk', 1, '人'), ('festival_night', (16, 12), 'talk', 1, '人'),
    # ---- 2晩目（広場の上・裏通り・東の屋台） ----
    ('festival_night', (18, 4), 'talk', 2, '人'),
    ('fest_lane', (4, 6), 'puzzle', 2, '車'), ('fest_lane', (21, 6), 'key', 2, '面'), ('fest_lane', (13, 12), 'talk', 2, '人'), ('fest_lane', (4, 14), 'show', 2, '★'),
    ('fest_east', (8, 1), 'puzzle', 2, '屋'), ('fest_east', (12, 1), 'puzzle', 2, '屋'), ('fest_east', (16, 1), 'puzzle', 2, '屋'),
    ('fest_east', (12, 11), 'chest', 2, '箱'), ('fest_east', (11, 10), 'photo', 2, '写'), ('fest_east', (8, 19), 'talk', 2, '人'), ('fest_east', (19, 1), 'later', 2, '雷'), ('fest_east', (19, 18), 'show', 2, '★'),
    # ---- 3晩目（広場の上・社の森） ----
    ('festival_night', (11, 5), 'cp', 1, 'P'), ('festival_night', (3, 5), 'chest', 3, '箱'), ('festival_night', (8, 7), 'talk', 3, '人'),
    ('festival_night', (6, 12), 'puzzle', 3, '赤'), ('festival_night', (17, 12), 'puzzle', 3, '白'), ('festival_night', (11, 18), 'puzzle', 3, '青'), ('festival_night', (11, 13), 'chest', 3, 'ス'),
    ('fest_woods', (11, 14), 'ability', 3, 'カ'), ('fest_woods', (12, 10), 'photo', 3, '写'), ('fest_woods', (21, 9), 'chest', 3, '箱'), ('fest_woods', (2, 9), 'later', 3, '刀'), ('fest_woods', (11, 2), 'boss', 3, 'ぬし'),
    ('fest_woods', (7, 18), 'talk', 3, '人'), ('fest_woods', (16, 17), 'talk', 3, '人'), ('fest_woods', (11, 17), 'show', 3, '★'),
]
ENEMIES = [
    ('fest_gate', [(11, 4), (11, 16)], 'patrol', 1, True), ('fest_gate', [(15, 13), (16, 13)], 'chase', 1, False),
    ('fest_backyard', [(8, 8), (14, 8), (14, 13), (8, 13)], 'patrol', 1, False), ('fest_backyard', [(4, 19)], 'flee', 1, False),
    ('festival_night', [(11, 21), (11, 22)], 'patrol', 1, True), ('festival_night', [(5, 13), (5, 17)], 'chase', 1, True),
    ('festival_night', [(6, 6), (17, 6)], 'patrol', 2, True), ('fest_lane', [(18, 5), (18, 15)], 'chase', 2, False), ('fest_lane', [(6, 3), (15, 3)], 'patrol', 2, True),
    ('fest_east', [(18, 5), (18, 12)], 'chase', 2, False), ('fest_east', [(16, 19), (10, 19)], 'patrol', 2, False), ('fest_east', [(21, 20)], 'guard', 2, True),
    ('festival_night', [(9, 4), (14, 4)], 'patrol', 3, False), ('festival_night', [(18, 13), (18, 17)], 'chase', 3, False),
    ('fest_woods', [(18, 13), (18, 16)], 'chase', 3, False), ('fest_woods', [(14, 4), (19, 4)], 'patrol', 3, True),
]
GATES = [
    ('fest_backyard', 2, 21, 17, 21, '停電で真っ暗（発電機を直すと入れる）'),
    ('fest_lane', 3, 5, 15, 15, '板塀（荷車を上から押すと突き破る）'),
    ('festival_night', 19, 19, 16, 20, '人混み（あかりが歌う）'),
    ('fest_east', 8, 9, 11, 12, '射的の裏（お面を持ち主に届けると）'),
    ('fest_woods', 11, 12, 6, 14, '池の飛び石（カメラで写す）'),
    ('fest_woods', 9, 14, 9, 11, ''),
]
# ノイズの壁：(部屋, x0, x1, y0, y1, 開く晩)
WALLS = [('festival_night', 10, 13, 9, 9, 2), ('festival_night', 19, 19, 10, 13, 2), ('festival_night', 10, 13, 3, 3, 3), ('fest_lane', 10, 13, 21, 21, 2), ('fest_lane', 21, 21, 10, 13, 2)]

def load(n):
    return [l.rstrip('\n') for l in open(f'docs/sketches/a11_compact/{n}.txt')]

def draw():
    UW, UH = 24 * C, 24 * C  # 部屋の単位
    GAP = 34
    xs = [p[0] for p in POS.values()]; ys = [p[1] for p in POS.values()]
    W = (max(xs) - min(xs) + 1) * (UW + GAP) + GAP
    H = (max(ys) - min(ys) + 2) * (UH + GAP) - UH // 2 * 0 + GAP + 60
    img = Image.new('RGB', (W, H + 40), (14, 16, 26)); g = ImageDraw.Draw(img)
    g.text((GAP, 6), '1-1「金魚の名前」小さく濃い配置（案3：6部屋とも 24×24。1部屋に1つ見せ場）  色＝晩（黄 1晩目・青 2晩目・紫 3晩目）  桃の★＝見せ場（地図の出来事）', fill=(230, 230, 240), font=FONT)
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
        fill = {'photo': (255, 255, 255), 'later': (110, 110, 120), 'key': (255, 160, 60), 'show': (255, 90, 160)}.get(kind, col)
        if kind in ('puzzle', 'ability'): g.polygon([(cx, cy - r - 3), (cx + r + 3, cy), (cx, cy + r + 3), (cx - r - 3, cy)], fill=fill, outline=(0, 0, 0))
        elif kind in ('chest', 'key'): g.rectangle([cx - r, cy - r, cx + r, cy + r], fill=fill, outline=(0, 0, 0))
        else: g.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill, outline=(0, 0, 0))
        g.text((cx - (10 if len(t) > 1 else 5), cy - 8), t, fill=(0, 0, 0), font=SMALL)
    img.save('docs/sketches/a11_compact/overview.png')
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
            if a[2] == b[2] and a[2] in ('key', 'puzzle') or {a[2], b[2]} in ({'ability', 'show'}, {'puzzle', 'later'}): continue
            if same and d < 5: warn.append(f'{a[0]} {a[4]}{a[1]} と {b[4]}{b[1]} が近い（{d}マス）')
    rooms = {}
    for (n, _, kind, night, _) in things: rooms.setdefault((n, night), []).append(kind)
    for k in sorted(rooms): print(k, rooms[k])
    for (n, (x, y), kind, _, t) in ITEMS:
        L = load(n)
        side = any(0 <= y + dy < len(L) and 0 <= x + dx < 24 and L[y + dy][x + dx] != '#' for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        # 屋台や物置の中に置く物（仕掛け・後で来る所）は、隣のマスから使えればよい
        if L[y][x] == '#' and not (kind in ('puzzle', 'later') and side): warn.append(f'{n} {t}({x}, {y}) が歩けないマスにある')
    for (n, pts, move, _, _) in ENEMIES:
        L = load(n)
        for (x, y) in pts:
            if L[y][x] == '#': warn.append(f'{n} 砂嵐の点 ({x}, {y}) が歩けないマス')
        for (a, b) in zip(pts, pts[1:] + pts[:1] if len(pts) > 2 else pts[1:]):
            for t in range(0, 101):
                x = round(a[0] + (b[0] - a[0]) * t / 100); y = round(a[1] + (b[1] - a[1]) * t / 100)
                if L[y][x] == ':': warn.append(f'{n} 砂嵐の道 {a}→{b} が陰（{x}, {y}）を通る'); break
    for (n, pts, move, night, _) in ENEMIES:
        for (m, (x, y), kind, nt, t) in ITEMS:
            if m == n and nt == night and kind not in ('cp', 'start', 'show') and min(abs(x - px) + abs(y - py) for (px, py) in pts) < 2: warn.append(f'{n} 砂嵐の道 {pts} が {t}({x}, {y}) に近い')
    print('近すぎる物・置けない所：', warn or 'なし')

draw()
crowd()
