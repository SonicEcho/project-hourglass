#!/usr/bin/env python3
"""地図の調整（段階117）の書き出しの文を、src/data に入れる。

使い方：python3 scripts/apply_map_edits.py 書き出しの文.txt
- rooms：rooms.ts の、その部屋の文字の地図の定数を、書き出しの文字の地図に置き換える（式で作っていた定数も、文字の並びにする）。exitAt は部屋の行に書く
- things：areas.ts の、その区画の物の位置を書き換える（敵は見回りの道ごとずらす）
- patrols：areas.ts の、敵の見回りの道を書き換える（段階119）
入れた後は npx vitest run で checkArea のテストを通すこと
"""
import json
import re
import sys

ROOMS = 'src/data/rooms.ts'
AREAS = 'src/data/areas.ts'


def load(path):
    text = open(path, encoding='utf-8').read()
    return json.loads(text[text.index('{'):])


def layout_literal(name, rows, comment):
    body = '\n'.join(f"  '{r}'," for r in rows)
    return f'// {comment}\nconst {name} = [\n{body}\n];'


def apply_rooms(src, rooms):
    for rid, patch in rooms.items():
        m = re.search(rf"^  {rid}: \{{ id: '{rid}', layout: (\w+),.*$", src, re.M)
        if not m:
            sys.exit(f'部屋 {rid} の行が rooms.ts にない')
        const = m.group(1)
        if 'layout' in patch:
            d = re.search(rf'^(// [^\n]*\n)?const {const} = ', src, re.M)
            if not d:
                sys.exit(f'定数 {const} が rooms.ts にない')
            # 定義の終わり：行の頭の「];」か「]);」まで
            end = re.compile(r'^\]\)?;[ \t]*$', re.M).search(src, d.end())
            if not end:
                sys.exit(f'定数 {const} の終わりが見つからない')
            new = layout_literal(const, patch['layout'], '2026-10-26 段階117：開発者が地図の調整で直した形')
            src = src[: d.start()] + new + src[end.end():]
        if 'exitAt' in patch:
            line_now = re.search(rf"^  {rid}: \{{ id: '{rid}'.*$", src, re.M).group(0)
            old = re.search(r'exitAt: \{([^}]*)\}', line_now)
            at = {}
            if old:
                for k, v in re.findall(r'(\w+): (\d+)', old.group(1)):
                    at[k] = int(v)
            at.update(patch['exitAt'])
            text = 'exitAt: { ' + ', '.join(f'{k}: {v}' for k, v in at.items()) + ' }'
            if old:
                new_line = line_now.replace(old.group(0), text)
            else:
                new_line = re.sub(r' \},?$', lambda mm: f', {text}' + mm.group(0), line_now)
            src = src.replace(line_now, new_line)
    return src


def apply_things(src, things):
    for key, cell in things.items():
        area, kind, tid = key.split('/')
        if kind in ('start', 'exit', 'trigger'):
            sys.exit(f'{key}：晩の始め・帰り口・会話の位置は、手で入れる')
        if kind == 'boss':
            pat = re.compile(rf"(boss: \{{ id: '{tid}'[^\n]*?cell: )\[\d+, \d+\]")
        else:
            pat = re.compile(rf"(\{{ id: '{tid}'[^\n]*?cell: )\[\d+, \d+\]")
        if kind == 'enemy':
            m = re.search(rf"\{{ id: '{tid}'[^\n]*?patrol: (\[\[[^\n]*?\]\])", src)
            if not m:
                sys.exit(f'{key} が areas.ts にない')
            pts = json.loads(m.group(1))
            dc, dr = cell[0] - pts[0][0], cell[1] - pts[0][1]
            moved = '[' + ', '.join(f'[{x + dc}, {y + dr}]' for x, y in pts) + ']'
            src = src[: m.start(1)] + moved + src[m.end(1):]
            continue
        m = pat.search(src)
        if not m:
            sys.exit(f'{key} が areas.ts にない')
        src = src[: m.start()] + m.group(1) + f'[{cell[0]}, {cell[1]}]' + src[m.end():]
    return src


def apply_patrols(src, patrols):
    """敵の見回りの道の引き直し（段階119）：patrol を、書き出しの折り返しの点の全部に置き換える"""
    for key, route in patrols.items():
        _, _, tid = key.split('/')
        m = re.search(rf"\{{ id: '{tid}'[^\n]*?patrol: (\[\[[^\n]*?\]\])", src)
        if not m:
            sys.exit(f'{key} が areas.ts にない')
        new = '[' + ', '.join(f'[{x}, {y}]' for x, y in route) + ']'
        src = src[: m.start(1)] + new + src[m.end(1):]
    return src


def main():
    edits = load(sys.argv[1])
    rooms = open(ROOMS, encoding='utf-8').read()
    open(ROOMS, 'w', encoding='utf-8').write(apply_rooms(rooms, edits.get('rooms', {})))
    areas = open(AREAS, encoding='utf-8').read()
    areas = apply_things(areas, edits.get('things', {}))
    open(AREAS, 'w', encoding='utf-8').write(apply_patrols(areas, edits.get('patrols', {})))
    print(f"部屋 {len(edits.get('rooms', {}))}・物 {len(edits.get('things', {}))}・敵の道 {len(edits.get('patrols', {}))} を入れた")


if __name__ == '__main__':
    main()
