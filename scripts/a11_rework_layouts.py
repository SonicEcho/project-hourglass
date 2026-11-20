# 1-1 の新しい配置（docs/milestones/M3_explore_feel.md の 5.）。四角を掘って文字の地図を作り、つながりを確かめる。
# 使い方：python3 scripts/a11_rework_layouts.py （docs/sketches/a11_rework/<部屋>.txt に文字の地図を書く）
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

# ---- 縁日の入口（24×24。上：広場へ、左：屋台の裏へ）：参道と、右の林の脇道（輪）、脇道の奥の行き止まり（宝箱） ----
ROOMS['fest_gate'] = (24, 24, ['top', 'left'], {}, room(24, 24, [
    (3, 19, 20, 21),     # 下の道（出発点）
    (10, 0, 13, 18),     # 参道（鳥居をくぐって広場へ）
    (0, 10, 9, 13),      # 左の灯籠の道（屋台の裏へ）
    (5, 14, 6, 18),      # 灯籠の道から下の道へ（左の輪）
    (17, 4, 18, 18),     # 右の林の脇道
    (14, 13, 16, 14),    # 脇道から参道へ（右の輪）
    (17, 4, 21, 6),      # 脇道の奥（行き止まり。自販機の裏の宝箱）
], {(11, 20): 'S'}, shades=[(17, 7, 18, 18), (5, 14, 6, 18)]))

# ---- 屋台の裏（24×43。右：入口へ、上：裏通りへ）：テントと木箱の迷路。真ん中の裏の広場、輪になる路地、行き止まり2つ ----
ROOMS['fest_backyard'] = (24, 43, ['right', 'top'], {}, room(24, 43, [
    (14, 19, 23, 22),    # 右の出入口から
    (7, 17, 15, 25),     # 裏の広場（発電機と水のポリタンク）
    (10, 0, 13, 4),      # 上の出入口へ
    (3, 4, 13, 6),       # 上の横の路地
    (3, 4, 5, 16),       # 左の縦の路地（上）
    (3, 14, 8, 16),      # 左から広場へ
    (11, 7, 13, 16),     # 真ん中の縦の路地（輪の右）
    (16, 4, 20, 6),      # 上の右の行き止まり（宝箱）
    (14, 4, 15, 5),
    (7, 26, 9, 37),      # 広場から下へ（左の路地）
    (7, 35, 19, 37),     # 下の横の路地
    (17, 26, 19, 37),    # 右の縦の路地（下の輪）
    (15, 24, 19, 26),
    (2, 31, 6, 34),      # 下の左の行き止まり（逃げる砂嵐を追いこむ所）
    (19, 8, 21, 16),     # 右上の物置の裏（宝箱を持つ寄り道）
    (14, 12, 18, 13),
], {}, shades=[(3, 7, 5, 13), (11, 7, 13, 11)]))

# ---- 屋台の裏通り（新しい部屋。24×24。下：屋台の裏へ、右：広場へ）：板塀と屋台の背中のあいだ。ジグザグの細道、ノイズの壁（2晩目から） ----
ROOMS['fest_lane'] = (24, 24, ['bottom', 'right'], {}, room(24, 24, [
    (10, 17, 13, 23),    # 下の出入口から
    (3, 17, 13, 19),     # 下の横の道
    (3, 8, 5, 19),       # 左の縦の道
    (3, 8, 15, 10),      # 真ん中の横の道
    (13, 10, 15, 16),    # 真ん中の縦（くぼみ）
    (13, 14, 19, 16),
    (17, 3, 19, 16),     # 右の縦の道
    (17, 10, 23, 13),    # 右の出入口へ
    (7, 2, 19, 4),       # 上の道（行き止まりの宝箱）
    (7, 2, 9, 7),
], {}, shades=[(17, 5, 19, 9), (13, 10, 15, 13)]))

# ---- 縁日の広場（24×43。下：入口、左：裏通り、右：東の屋台、上：社の森）：やぐらを回る輪、屋台の列のあいだの通路、上の通りと石段 ----
ROOMS['festival_night'] = (24, 43, ['bottom', 'left', 'right', 'top'], {'right': 15}, room(24, 43, [
    (10, 34, 13, 42),    # 下の参道
    (4, 23, 19, 33),     # やぐらの広場（やぐらの周りを回れる）
    (0, 19, 6, 22),      # 左の出入口から（裏通りへ）
    (4, 19, 6, 23),
    (10, 13, 13, 22),    # 広場から上の通りへ（行20 にノイズの壁。2晩目から）
    (2, 11, 21, 14),     # 上の通り
    (2, 5, 4, 14),       # 上の通りの左（射的の裏の行き止まり）
    (17, 15, 23, 18),    # 右の出入口へ（東の屋台）
    (19, 11, 21, 18),
    (8, 4, 15, 10),      # 石段の下（チェックポイント）
    (10, 0, 13, 4),      # 石段（行5 にノイズの壁。3晩目から）
    (20, 27, 22, 30),    # 右下の人混みの奥のくぼみ（あかりが歌うと、写しの人が道をあける）
], {(11, 30): 'P', (11, 8): 'P'}, blocks=[(9, 26, 14, 29), (4, 31, 6, 33), (17, 31, 19, 33)], shades=[(8, 25, 8, 30), (15, 25, 15, 30), (2, 5, 4, 10)]))

# ---- 東の屋台（24×24。左：広場へ）：射的と金魚すくいの通り。屋台の島を回る輪、奥の金魚すくい（番人）、射的の裏のすき間 ----
ROOMS['fest_east'] = (24, 24, ['left'], {}, room(24, 24, [
    (0, 10, 6, 13),      # 左の出入口から
    (4, 3, 6, 20),       # 左の縦の通り
    (4, 3, 20, 5),       # 上の通り
    (18, 3, 20, 20),     # 右の縦の通り
    (4, 18, 20, 20),     # 下の通り（屋台の島を回る輪）
    (10, 9, 14, 14),     # 島の真ん中の広場（射的の裏のすき間から入る）
    (7, 11, 9, 12),
    (20, 18, 22, 22),    # 奥の金魚すくい（番人）
], {(21, 21): '.'}, shades=[(4, 6, 6, 9), (18, 6, 20, 8)]))

# ---- 社の森（24×43。下：広場へ）：石段から森の奥へ。池と大木を回る輪、小さな祠の行き止まり2つ、いちばん上の社（ぬし） ----
ROOMS['fest_woods'] = (24, 43, ['bottom'], {}, room(24, 43, [
    (10, 33, 13, 42),    # 石段の上
    (4, 28, 19, 32),     # 森の入口の広場
    (4, 16, 6, 28),      # 左の道（池の左）
    (17, 16, 19, 28),    # 右の道（大木の右）
    (4, 14, 19, 16),     # 池の上の道（輪）
    (10, 4, 13, 14),     # 社への参道
    (6, 2, 17, 5),       # 社の前
    (1, 20, 3, 23),      # 左の祠（行き止まり）
    (20, 9, 22, 18),     # 右の祠への道（行き止まり）
    (20, 9, 22, 11),
    (11, 17, 12, 27),    # 池の飛び石（カメラで写すと見える）
    (9, 21, 14, 23),     # 池の中の小島（思い出の一枚）
], {}, shades=[(4, 17, 6, 23), (13, 14, 16, 16)]))

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
    with open(f'docs/sketches/a11_rework/{name}.txt', 'w') as f: f.write('\n'.join(g) + '\n')
    print(f'== {name} {cols}x{rows} 歩ける {n} マス {sides} {"OK" if not errs else errs}')
    if '-v' in sys.argv: print('\n'.join(g))
sys.exit(0 if ok else 1)
