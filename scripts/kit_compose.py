# 段階292（docs/milestones/M3_explore_feel.md の 14.）：下敷きの模様と貼る物から、部屋の地面の絵（768×768、1マス32）を合成する。
# 使い方：node scripts/kit_compose.mjs x.json && python3 scripts/kit_compose.py x.json
import json, sys
import numpy as np
from PIL import Image, ImageFilter

T = 32
N = 24
SRC = 'art/kit_lane/'


def tiled(tex, tile):
    t = Image.open(SRC + tex + '.webp').convert('RGB').resize((tile * T, tile * T), Image.LANCZOS)
    out = Image.new('RGB', (N * T, N * T))
    for y in range(0, N * T, tile * T):
        for x in range(0, N * T, tile * T):
            out.paste(t, (x, y))
    return out


def soft_mask(boxes, seed):
    m = Image.new('L', (N * T, N * T), 0)
    a = np.zeros((N * T, N * T), np.float32)
    for (c0, r0, c1, r1) in boxes:
        a[max(0, int(r0 * T)):int(r1 * T), max(0, int(c0 * T)):int(c1 * T)] = 1
    # 縁を、少しでこぼこにしてからぼかす（四角が見えないように）
    rng = np.random.default_rng(seed)
    noise = Image.fromarray((rng.random((N * T // 16, N * T // 16)) * 255).astype(np.uint8)).resize((N * T, N * T), Image.BICUBIC)
    m = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))
    mm = np.asarray(m, np.float32) / 255 + (np.asarray(noise, np.float32) / 255 - 0.5) * 0.5
    mm = np.clip((mm - 0.35) / 0.3, 0, 1)
    return Image.fromarray((mm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))


def light(im, lights):
    # 明かりのたまり（暖かい色を足す）と、縁を少し暗く（一枚絵のような光のむらを出す）
    a = np.asarray(im, np.float32)
    yy, xx = np.mgrid[0:N * T, 0:N * T] / T
    glow = np.zeros((N * T, N * T), np.float32)
    for L in lights:
        d = np.sqrt((xx - L['x']) ** 2 + (yy - L['y']) ** 2) / L['r']
        glow += L['a'] * np.clip(1 - d, 0, 1) ** 2
    warm = np.array([255, 190, 110], np.float32)
    a = a + glow[..., None] * (warm - a * 0.6) * 0.6
    cx = np.abs(xx - N / 2) / (N / 2); cy = np.abs(yy - N / 2) / (N / 2)
    vig = 1 - 0.28 * np.clip(np.maximum(cx, cy) - 0.55, 0, 1) / 0.45
    a = a * vig[..., None] * 0.94
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def compose(g):
    im = tiled(g['base'], g['tile'])
    for i, f in enumerate(g['fills']):
        im = Image.composite(tiled(f['tex'], g['tile']), im, soft_mask(f['boxes'], i + 1))
    im = im.convert('RGBA')
    for d in g['decals']:
        p = Image.open(SRC + d['image'] + '.webp').convert('RGBA')
        if d.get('flip'):
            p = p.transpose(Image.FLIP_LEFT_RIGHT)
        w = int(d['w'] * T)
        h = int(d['h'] * T) if d.get('h') else int(w * p.height / p.width)
        p = p.resize((w, h), Image.LANCZOS)
        if d.get('alpha') is not None:
            p.putalpha(p.getchannel('A').point(lambda v: int(v * d['alpha'])))
        im.alpha_composite(p, (int(d['x'] * T - w / 2), int(d['y'] * T - h / 2)))
    im = light(im.convert('RGB'), g.get('lights', []))
    im.save('public/' + g['file'], quality=86)
    print('public/' + g['file'])


for g in json.load(open(sys.argv[1])):
    compose(g)
