"""小物の一覧の絵（白い背景に、マス目に並べた絵）から、1つずつ背景を抜いて切り出す（段階271。docs/milestones/M3_explore_feel.md の 7.）。

必要なもの: pip install pillow numpy scipy "rembg[cpu]"（物の内側のすき間を見分けるのに、背景を抜く AI を使う）
使い方: python3 scripts/props_cut.py 一覧の絵.png 行 列 名前1,名前2,... [出力先（既定 public/assets/sprites/props）]
  名前は左上から右へ、行ごとに。名前を - にしたマスは飛ばす。出力は <名前>.webp（長い辺 256）
白い背景の抜き方は scripts/cutout_white.py と同じ（広い白を背景にし、縁は白からの割り戻しで半透明に）。
足もとの影（白い紙に落ちた薄い影）は、暗い半透明の影にする（段階273）
"""

import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

WHITE = 236
MIN_AREA = 300


def alpha_cut(rgb, soft_shadow=False, rows=1, cols=1):
    near_white = rgb.min(axis=2) >= WHITE
    lab, _ = ndimage.label(near_white)
    sizes = ndimage.sum(near_white, lab, range(lab.max() + 1))
    # 外の背景：絵の縁につながる白だけ（広さだけで決めると、提灯の真ん中の白い光まで背景になった）。内側の白は inner_holes で見分ける
    edge_labels = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = near_white & np.isin(lab, edge_labels[edge_labels > 0]) & (sizes[lab] >= MIN_AREA)
    outer = bg.copy()
    c = np.clip(rgb * 255.0 / 248.0, 0, 255)
    soft = 1.0 - c.min(axis=2) / 255.0
    a = np.where(bg, soft, 1.0)
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255.0
    safe = np.maximum(a, 1e-3)[..., None]
    f = np.where(bg[..., None], np.clip(255.0 - (255.0 - c) / safe, 0, 255), rgb)
    shadow = np.zeros(bg.shape, bool)
    if soft_shadow:
        # 部品（段階273）：足もとの影（白い紙に落ちた、色の薄い暖かい灰色）を見分け、白い背景とつながる所だけ、黒っぽい半透明の影にする
        # （そのままだと、影が白っぽいふちになって地面の上で浮いた）
        mx, mn = rgb.max(axis=2), rgb.min(axis=2)
        sat = (mx - mn) / np.maximum(mx, 1)
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        # 影は物の足もと：マスの下 4 割だけで探す（上の方の、色の薄い光った所を影にしないため）
        h = rgb.shape[0]
        ycell = (np.arange(h) % (h / rows)) / (h / rows)
        low = (ycell >= 0.6)[:, None]
        cand = (((r >= g) & (g >= b - 6) & (sat <= 0.42)) | (sat <= 0.22)) & (mx >= 140) & ~bg & low
        lab2, _ = ndimage.label(cand | outer)
        keep = np.unique(lab2[outer])
        shadow = cand & np.isin(lab2, keep[keep > 0])
        sa = np.clip((1.0 - mx / 255.0) * 1.5, 0.06, 0.55)
        a = np.where(shadow, sa, a)
        f = np.where(shadow[..., None], np.array([46.0, 32.0, 28.0]), f)
    # 背景から明るい色だけでつながる所（白い紙の上の薄い影・光のにじみ）：白からの割り戻しで透明にする（2026-11-23 開発者：白地が残る）。
    # 物の白い所（クーラーのふた・お面）は暗い輪郭で囲まれていて、背景とつながらないので残る
    mx0, mn0 = rgb.max(axis=2), rgb.min(axis=2)
    pale = (mn0 >= 165) & ((mx0 - mn0) <= 100)
    # つながりは外の白い背景からだけ見る（物の内側のすき間から広げると、お面の白い顔まで透けた）
    labp, _ = ndimage.label(pale | outer)
    keepp = np.unique(labp[outer])
    ai = ai_mask(rgb, rows, cols)
    # 光のにじみ（提灯の光など）は、AI が物と見た所を残す（提灯の真ん中の白い光まで透けた）
    halo = pale & np.isin(labp, keepp[keepp > 0]) & ~bg & ~shadow & (ai < 0.5)
    a_h = np.clip((255.0 - mn0) / (255.0 - 120.0), 0.0, 1.0) * 0.9
    a = np.where(halo, np.minimum(a, a_h), a)
    safe_h = np.maximum(a, 1e-3)[..., None]
    f = np.where(halo[..., None], np.clip(255.0 - (255.0 - rgb) / safe_h, 0, 255), f)
    bg = bg | halo
    # 物の内側のすき間（縄の輪・コードの輪・ケースの取っ手の穴）：外の背景とつながらない明るい所のうち、
    # 背景を抜く AI（rembg の isnet-general-use）が「物ではない」と見た所だけ透明にする（2026-11-23 開発者）。
    # 色だけで見分けると、提灯の光・お面の白・宝箱の紅白の紐まで透けた
    holes = inner_holes(rgb, outer, ai)
    if holes.any():
        a_k = np.clip((255.0 - mn0) / (255.0 - 120.0), 0.0, 1.0) * 0.9
        a = np.where(holes, np.minimum(a, a_k), a)
        safe_k = np.maximum(a, 1e-3)[..., None]
        f = np.where(holes[..., None], np.clip(255.0 - (255.0 - rgb) / safe_k, 0, 255), f)
        bg = bg | holes
    # 輪郭のふち（白い背景から3ドットまで）：白と混ざった薄い色が不透明のまま残り、白いふちに見えた（2026-11-23 開発者）。
    # ここも白からの割り戻しで、混ざった白の分だけ透明にする（暗い線はそのまま残る）
    dist = ndimage.distance_transform_edt(~bg)
    edge = (dist <= 3) & ~bg
    if soft_shadow:
        edge &= ~shadow
    mn_e = rgb.min(axis=2)
    a_edge = np.clip((255.0 - mn_e) / (255.0 - 70.0), 0.0, 1.0)
    a = np.where(edge, np.minimum(a, a_edge), a)
    safe2 = np.maximum(a, 1e-3)[..., None]
    f = np.where(edge[..., None], np.clip(255.0 - (255.0 - rgb) / safe2, 0, 255), f)
    # ほぼ透明な所の色は、暗い影の色にしておく（ゲームが縮めて描く時に、透明な所の白がにじんで白いふちになった）
    f = np.where((a < 0.08)[..., None], np.array([46.0, 32.0, 28.0]), f)
    return np.dstack([f, a * 255.0]).astype(np.uint8)


_SESSION = None


def ai_mask(rgb, rows, cols):
    """背景を抜く AI の「物らしさ」（0〜1）。マスごとにかける"""
    global _SESSION
    from rembg import new_session, remove
    if _SESSION is None:
        _SESSION = new_session('isnet-general-use')
    h, w = rgb.shape[:2]
    ai = np.ones((h, w), np.float32)
    for r in range(rows):
        for c in range(cols):
            y0, y1, x0, x1 = r * h // rows, (r + 1) * h // rows, c * w // cols, (c + 1) * w // cols
            m = remove(Image.fromarray(rgb[y0:y1, x0:x1].astype(np.uint8)), session=_SESSION, only_mask=True)
            ai[y0:y1, x0:x1] = np.asarray(m, np.float32) / 255.0
    return ai


def inner_holes(rgb, outer, ai):
    """外の背景とつながらない明るい所のうち、AI が背景と見た所。ほとんど紙の白の所は、AI が少し迷っていても背景にする"""
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    light = (mn >= 165) & ((mx - mn) <= 100)
    labp, _ = ndimage.label(light | outer)
    keep = np.unique(labp[outer])
    enclosed = light & ~np.isin(labp, keep[keep > 0])
    lab, n = ndimage.label(enclosed)
    if n == 0:
        return enclosed
    idx = range(n + 1)
    mean_ai = ndimage.mean(ai, lab, idx)
    paper = ((mn >= 244) & ((mx - mn) <= 10)).astype(np.float32)
    frac = ndimage.mean(paper, lab, idx)
    # まわりの明るさ：光（提灯の真ん中）は明るい色に囲まれ、すき間（ケースの取っ手）は暗い縁に囲まれる
    ring = ndimage.binary_dilation(enclosed, iterations=3) & ~enclosed
    near, ind = ndimage.distance_transform_edt(~ring, return_indices=True)
    ring_v = mx[ind[0], ind[1]]
    mean_rv = ndimage.mean(ring_v, lab, idx)
    size = ndimage.sum(np.ones_like(mn), lab, idx)
    hole = (((mean_ai < 0.35) & (mean_rv < 235)) | ((frac >= 0.5) & (mean_rv < 225))) & (size >= 40)
    return enclosed & hole[lab]

def cut(src, rows, cols, names, out='public/assets/sprites/props', longest=256):
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    rgba = alpha_cut(rgb, soft_shadow=True, rows=rows, cols=cols)
    h, w = rgba.shape[:2]
    for i, name in enumerate(names):
        if name == '-':
            continue
        r, c = divmod(i, cols)
        cell = rgba[r * h // rows:(r + 1) * h // rows, c * w // cols:(c + 1) * w // cols].copy()
        # 離れた小さなかけら（となりのマスからはみ出した葉など）は消す（2026-11-23）
        solid = cell[..., 3] > 24
        labc, nc = ndimage.label(ndimage.binary_dilation(solid, iterations=4))
        if nc > 1:
            sz = ndimage.sum(solid, labc, range(nc + 1))
            keep_c = sz >= sz.max() * 0.03
            keep_c[0] = False
            cell[~keep_c[labc]] = 0
        ys, xs = np.nonzero(cell[..., 3] > 24)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        im = Image.fromarray(cell[y0:y1, x0:x1], 'RGBA')
        k = longest / max(im.size)
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        im.save(f'{out}/{name}.webp', 'WEBP', quality=90, method=6)
        print(name, im.size)


if __name__ == '__main__':
    if len(sys.argv) not in (5, 6):
        print(__doc__)
        sys.exit(1)
    cut(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4].split(','), *(sys.argv[5:]))
