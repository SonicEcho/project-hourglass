# 2026-11-28 新しい1-2 の商店街の小物（parts_a12_street_props.png）を、1つずつ枠を決めて切り出す（マス目で割ると、上の行の物がはみ出した）。
# 使い方：python3 scripts/a12_props_cut.py 一覧の絵.png（保冷箱の中の白だけ、背景と見なさず戻す）
import sys, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, 'scripts'); import props_cut
src = Image.open(sys.argv[1]).convert('RGB')
B = {
 'lamp_flower': (555, 0, 790, 335), 'post': (1050, 70, 1225, 340),
 'phone': (140, 365, 305, 635), 'vending': (575, 360, 805, 640), 'sign_bench': (925, 435, 1325, 625),
 'pots': (50, 655, 400, 910), 'bikes': (425, 685, 925, 915), 'crates': (955, 695, 1305, 905),
 'kakigori': (55, 940, 355, 1162), 'pennants': (440, 1005, 905, 1075), 'streamers': (900, 995, 1348, 1155),
}
FILL = {'crates'}
for n, box in B.items():
    rgb = np.asarray(src.crop(box)).astype(np.float32)
    a = props_cut.alpha_cut(rgb, soft_shadow=True, rows=1, cols=1)
    solid = a[..., 3] > 24
    holes = ndimage.binary_fill_holes(solid) & ~solid
    # 物の内側の白（保冷箱の中など）は背景ではないので戻す（小さすぎる穴＝すき間は残す）
    lab, k = ndimage.label(holes)
    for i in range(1, k + 1):
        m = lab == i
        if n in FILL and m.sum() > 400: a[m, :3] = rgb[m].astype(np.uint8); a[m, 3] = 255
    ys, xs = np.nonzero(a[..., 3] > 24)
    im = Image.fromarray(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 'RGBA')
    k2 = 320 / max(im.size)
    im = im.resize((round(im.width * k2), round(im.height * k2)), Image.LANCZOS)
    im.save(f'public/assets/sprites/parts/a12p_{n}.webp', 'WEBP', quality=90, method=6)
    print(n, im.size)
