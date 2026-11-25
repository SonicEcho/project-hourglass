# 段階274：新しい1-1 の部屋を、地面の絵・部品・小物で組み立てた1枚の絵にし、歩けるマスの枠を重ねる（確かめる用）。
# 使い方：node scripts/a11_room_preview.mjs x.json && python3 scripts/a11_room_preview.py x.json 出力.png
import json, sys
from PIL import Image, ImageDraw, ImageFont
rooms = json.load(open(sys.argv[1]))
T = 32
font = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', 22)
tiles = []
for r in rooms:
    if not r['ground']:
        continue
    im = Image.open('public/' + r['ground']).convert('RGBA').resize((24 * T, 24 * T))
    items = []
    for p in r['parts']:
        if p['file']:
            items.append(((p['cell'][1] + 1) * T, p['file'], (p['cell'][0] + p['w'] / 2) * T, (p['cell'][1] + 1) * T, (p.get('sw') or p['w']) * T, bool(p.get('flip'))))
    for g in r['gadgets']:
        if g['file']:
            items.append(((g['cell'][1] + 1) * T, g['file'], (g['cell'][0] + 0.5) * T, (g['cell'][1] + 0.95) * T, g['w'] * T, False))
    for c in r['chests']:
        items.append(((c[1] + 1) * T, 'assets/sprites/props/chest_closed.webp', (c[0] + 0.5) * T, (c[1] + 0.95) * T, 1.1 * T, False))
    for _, f, cx, by, w, flip in sorted(items, key=lambda x: x[0]):
        pi = Image.open('public/' + f).convert('RGBA')
        if flip:
            pi = pi.transpose(Image.FLIP_LEFT_RIGHT)
        h = int(w * pi.height / pi.width)
        pi = pi.resize((int(w), h))
        im.alpha_composite(pi, (int(cx - w / 2), int(by - h)))
    for dcr in r['decor']:
        pi = Image.open('public/' + dcr['file']).convert('RGBA')
        w = int(dcr['w'] * T); h = int(w * pi.height / pi.width)
        im.alpha_composite(pi.resize((w, h)), (int(dcr['x'] * T), int(dcr['y'] * T)))
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); o = ImageDraw.Draw(ov)
    for y, line in enumerate(r['layout']):
        for x, ch in enumerate(line):
            if ch != '#':
                o.rectangle([x * T + 2, y * T + 2, (x + 1) * T - 2, (y + 1) * T - 2], outline=(80, 255, 140, 170) if ch != ':' else (90, 150, 255, 200), width=2)
    for pts in r['enemies']:
        for (x, y) in pts:
            o.ellipse([x * T + 8, y * T + 8, x * T + 24, y * T + 24], fill=(255, 60, 60, 200))
    for (x, y) in r['talkers']:
        o.ellipse([x * T + 8, y * T + 8, x * T + 24, y * T + 24], fill=(230, 230, 255, 220))
    im = Image.alpha_composite(im, ov)
    tiles.append((r['id'], im))
W = Image.new('RGB', (3 * 790, 2 * 810), (20, 22, 30)); d = ImageDraw.Draw(W)
for i, (n, im) in enumerate(tiles):
    x, y = 10 + (i % 3) * 790, 10 + (i // 3) * 810
    d.text((x, y), n, font=font, fill=(240, 240, 240)); W.paste(im.convert('RGB'), (x, y + 32))
W.save(sys.argv[2])
