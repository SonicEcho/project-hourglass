# 1-1 の小さく濃い配置（段階268。docs/milestones/M3_explore_feel.md の 6-1）。四角を掘って文字の地図を作り、つながりを確かめる。
# 使い方：python3 scripts/a11_compact_layouts.py （docs/sketches/a11_compact/<部屋>.txt に文字の地図を書く）
import sys
from collections import deque

def room(cols, rows, carves, marks=None, blocks=(), shades=()):
    g = [['#'] * cols for _ in range(rows)]
    for (x0, y0, x1, y1) in carves:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                g[y][x] = '.'
    for (x0, y0, x1, y1) in blocks:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                g[y][x] = '#'
    # 陰（段階121 の ':'。歩けて、隠れられる所。段階3の出し抜く）
    for (x0, y0, x1, y1) in shades:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if g[y][x] == '.': g[y][x] = ':'
    for (x, y), ch in (marks or {}).items():
        g[y][x] = ch
    return [''.join(r) for r in g]

def exits(cols, rows, sides, at=None):
    at = at or {}
    out = {}
    for s in sides:
        n = cols if s in ('top', 'bottom') else rows
        f = at.get(s, n // 2 - 2)
        if s == 'top': out[s] = [(f + i, 0) for i in range(4)]
        if s == 'bottom': out[s] = [(f + i, rows - 1) for i in range(4)]
        if s == 'left': out[s] = [(0, f + i) for i in range(4)]
        if s == 'right': out[s] = [(cols - 1, f + i) for i in range(4)]
    return out

ROOMS = {}

# 段階268（docs/milestones/M3_explore_feel.md の 6-1）：小さく濃い1-1。6部屋とも 24×24。1部屋に1つ、地図の出来事つきの見せ場

# ---- 縁日の入口（上：広場、左：屋台の裏）：待ち伏せ。参道と林の脇道の2通り。脇道の奥に自販機の裏 ----
ROOMS['fest_gate'] = (24, 24, ['top', 'left'], {}, room(24, 24, [
    (3, 19, 20, 21), (10, 0, 13, 18), (0, 10, 9, 13), (5, 14, 6, 18), (17, 4, 18, 18), (14, 13, 16, 14), (17, 4, 21, 6),
], {(11, 20): 'S'}, shades=[(17, 7, 18, 18), (5, 14, 6, 18)]))

# ---- 屋台の裏（右：入口、上：裏通り）：停電。左上の木箱の山（3つ。1つにつまみ）、真ん中の発電機、下の停電の路地 ----
ROOMS['fest_backyard'] = (24, 24, ['right', 'top'], {}, room(24, 24, [
    (15, 10, 23, 13),    # 右の出入口から
    (7, 7, 15, 14),      # 裏の広場（発電機）
    (10, 0, 13, 6),      # 上の出入口へ
    (2, 2, 9, 5),        # 左上の木箱の山
    (2, 2, 4, 9), (2, 8, 7, 9),
    (10, 15, 13, 16),    # 広場から下の路地へ
    (2, 17, 21, 21),     # 下の停電の路地（輪）
], {}, blocks=[(6, 18, 17, 20)], shades=[(2, 6, 4, 9)]))

# ---- 屋台の裏通り（下：屋台の裏、右：広場）：坂の上の荷車。上から押すと転がって板塀を突き破り、近道になる ----
ROOMS['fest_lane'] = (24, 24, ['bottom', 'right'], {}, room(24, 24, [
    (17, 10, 23, 13),    # 右の出入口から
    (17, 2, 19, 16),     # 右の縦の道
    (3, 2, 19, 4),       # 上の道
    (3, 2, 5, 19),       # 左の坂（荷車が転がる）
    (3, 17, 13, 19),     # 下の道
    (10, 17, 13, 23),    # 下の出入口へ
    (20, 5, 21, 8),      # 右上の行き止まり（お面）
    (8, 7, 14, 13),      # 真ん中の物置の前（陰）
    (6, 9, 7, 10),
], {}, shades=[(8, 7, 14, 9)]))

# ---- 縁日の広場（下：入口、左：裏通り、右：東の屋台、上：社の森）：やぐらを回る輪。右下の人混みの奥のくぼみ。上の石段の下 ----
ROOMS['festival_night'] = (24, 24, ['bottom', 'left', 'right', 'top'], {}, room(24, 24, [
    (10, 19, 13, 23),    # 下の参道
    (5, 12, 18, 18),     # やぐらの広場（やぐらを回る輪）
    (0, 10, 6, 13),      # 左の出入口から（裏通りへ）
    (17, 10, 23, 13),    # 右の出入口から（東の屋台へ。2晩目から）
    (10, 8, 13, 11),     # 上の石段の下へ（行9 にノイズの壁。2晩目から）
    (5, 4, 18, 7),       # 石段の下（チェックポイント）
    (10, 0, 13, 3),      # 石段（行3 にノイズの壁。3晩目から）
    (2, 4, 4, 8),        # 左上の、射的の裏の行き止まり
    (19, 16, 22, 20),    # 右下の人混みの奥のくぼみ
], {(11, 19): 'P', (11, 5): 'P'}, blocks=[(9, 14, 14, 16)], shades=[(2, 4, 4, 8), (8, 13, 8, 17), (15, 13, 15, 17)]))

# ---- 東の屋台（左：広場）：屋台の島を回る通り。上の通りにお面屋が3軒。島の真ん中（射的の裏）。奥の金魚すくい（水槽が割れる） ----
ROOMS['fest_east'] = (24, 24, ['left'], {}, room(24, 24, [
    (0, 10, 6, 13),      # 左の出入口から
    (5, 2, 7, 20), (5, 2, 19, 4), (17, 2, 19, 20), (5, 18, 19, 20),   # 島を回る通り
    (10, 9, 14, 13), (8, 11, 9, 12),   # 島の真ん中（射的の裏のすき間から）
    (20, 17, 22, 21),    # 奥の金魚すくい（番人）
], {}, shades=[(5, 5, 7, 8), (17, 14, 19, 17)]))

# ---- 社の森（下：広場）：石段を上ると花火。池を回る道、池の飛び石と小島、左右の祠、いちばん上の社（ぬし） ----
ROOMS['fest_woods'] = (24, 24, ['bottom'], {}, room(24, 24, [
    (10, 18, 13, 23),    # 石段の上
    (4, 15, 19, 19),     # 森の入口の広場
    (4, 4, 6, 15), (17, 4, 19, 15),   # 池の左右の道
    (4, 3, 19, 5),       # 池の上の道
    (8, 1, 15, 3),       # 社の前
    (1, 8, 3, 10),       # 左の祠（竹やぶ）
    (20, 8, 22, 10),     # 右の祠
    (11, 6, 12, 14), (9, 9, 14, 11),   # 池の飛び石と小島（カメラで写すと見える）
], {}, shades=[(4, 6, 6, 12)]))

def check(name, cols, rows, sides, at, g):
    errs = []
    if len(g) != rows or any(len(r) != cols for r in g): errs.append('大きさ')
    walk = {(x, y) for y in range(rows) for x in range(cols) if g[y][x] != '#'}
    ex = exits(cols, rows, sides, at)
    for s, cells in ex.items():
        inward = {'top': (0, 1), 'bottom': (0, -1), 'left': (1, 0), 'right': (-1, 0)}[s]
        for (x, y) in cells:
            if (x, y) not in walk or (x + inward[0], y + inward[1]) not in walk: errs.append(f'{s} の出入口がふさがっている {x},{y}')
    start = next(iter(walk))
    seen = {start}; q = deque([start])
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if n in walk and n not in seen: seen.add(n); q.append(n)
    if seen != walk: errs.append(f'つながっていない所 {len(walk - seen)} マス')
    # 行き止まりと分かれ道の数（目安）
    return errs, len(walk)

ok = True
for name, (cols, rows, sides, at, g) in ROOMS.items():
    errs, n = check(name, cols, rows, sides, at, g)
    ok &= not errs
    with open(f'docs/sketches/a11_compact/{name}.txt', 'w') as f: f.write('\n'.join(g) + '\n')
    print(f'== {name} {cols}x{rows} 歩ける {n} マス {sides} {"OK" if not errs else errs}')
    if '-v' in sys.argv: print('\n'.join(g))
sys.exit(0 if ok else 1)
