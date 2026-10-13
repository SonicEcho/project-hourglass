"""魔王魂の曲を、ゲームの仮の BGM に切り出す（2026-10-11。本番の曲（Suno）ができるまでの仮）。

使い方: python3 scripts/maou_bgm.py <魔王魂から落とした mp3 のフォルダ> public/assets/bgm
  （numpy と ffmpeg が要る。曲は https://maou.audio/ の各曲のページから、通常版の mp3 を落とす）

くり返し方は2つ。書き出した後に表示する値を src/data/sounds.ts の BGM_LOOPS に、version と bytes を台帳（src/data/assets.ts）に書く。
- loop：曲の中で同じ部分が繰り返す所（1周の長さ L は、波形を少しずつずらして重ね、一番よく合う所を探した）を使う。
  鳴り始めの少し前から [S+L] までを流し、その後ろに [S, S+1秒) の写しを足す（区間の終わりの先も続きの音にしておく）。
  区間の終わりの直前 60ms は、戻り先 S の直前の音へなめらかに移す（つなぎ目で音が跳ねないように）。くり返すのは S〜S+L
- whole：同じ部分の繰り返しがない曲。鳴り始めから、鳴り終わり＋1.5秒までを切り出し、全体をくり返す
大きさは、どの曲も聞こえ方の大きさ（ラウドネス）を TARGET_LUFS にそろえる（2026-10-11、タイトルだけ小さく他が大きいと開発者から聞いて）。
TARGET_LUFS は、一番小さいタイトルの曲を上げても音が割れない所（最大で約 -1dB）で、自作の仮の縁日の曲とも同じ大きさ
"""
import hashlib
import json
import subprocess
import sys

import numpy as np

SR = 44100
TARGET_LUFS = -17.4
src, out = sys.argv[1], sys.argv[2]

SONGS = [
    # タイトル（ピアノ41）・返す場面（ピアノ24）・ボス戦（ファンタジー03）は、2026-10-13 に Suno の曲（scripts/suno_bgm.py）に替えた
    # 落とした mp3, 書き出すファイル, くり返し方, S（秒）, 1周のサンプル数
    ('maou_bgm_fantasy12', 'maoudamashii_fantasy12.mp3', 'loop', 5.0, 4704000),
    ('maou_bgm_acoustic39', 'maoudamashii_acoustic39.mp3', 'loop', 1.0, 7534373),
    ('maou_bgm_orchestra14', 'maoudamashii_orchestra14.mp3', 'whole', None, None),
]


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def loudness(y):
    """聞こえ方の大きさ（LUFS。ffmpeg の ebur128 で測る）"""
    r = subprocess.run(['ffmpeg', '-nostats', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'ebur128', '-f', 'null', '-'],
                       input=y.astype(np.float32).tobytes(), capture_output=True, check=True).stderr.decode()
    return float(r.split('Integrated loudness:')[1].split('I:')[1].split('LUFS')[0])


def onset(x):
    return int(np.argmax(np.abs(x).max(1) > 1e-3))


def offset(x):
    m = np.abs(x).max(1)
    return len(m) - int(np.argmax(m[::-1] > 1e-3))


result = {}
for name, fname, mode, S, L in SONGS:
    x = decode(f'{src}/{name}.mp3')
    if mode == 'loop':
        s = int(round(S * SR)); e = s + L
        a = max(0, onset(x) - int(0.3 * SR))
        y = np.concatenate([x[a:e], x[s:s + SR]])
        F = int(0.06 * SR); w = np.linspace(0, 1, F)[:, None]
        y[e - a - F:e - a] = (1 - w) * x[e - F:e] + w * x[s - F:s]
        result[fname] = {'start': round((s - a) / SR, 6), 'end': round((e - a) / SR, 6)}
    else:
        a = max(0, onset(x) - int(0.05 * SR)); b = min(len(x), offset(x) + int(1.5 * SR))
        y = x[a:b].copy()
        fin = int(0.01 * SR); y[:fin] *= np.linspace(0, 1, fin)[:, None]
        fo = int(0.8 * SR); y[-fo:] *= np.linspace(1, 0, fo)[:, None]
        result[fname] = {'whole': True, 'sec': round(len(y) / SR, 3)}
    before = loudness(y)
    y = y * 10 ** ((TARGET_LUFS - before) / 20)
    result[fname].update({'lufs': round(before, 1), 'gainDb': round(TARGET_LUFS - before, 1), 'peakDb': round(float(20 * np.log10(np.abs(y).max())), 1)})
    path = f'{out}/{fname}'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-codec:a', 'libmp3lame', '-b:a', '96k', path],
                   input=y.astype(np.float32).tobytes(), check=True)
    data = open(path, 'rb').read()
    result[fname].update({'version': hashlib.sha256(data).hexdigest()[:12], 'bytes': len(data)})
print(json.dumps(result, indent=1, ensure_ascii=False))
