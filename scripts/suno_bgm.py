"""Suno で作った曲を、ゲームの BGM に切り出す（2026-10-13。開発者が Suno の有料の版（Pro）で作った曲）。

使い方: python3 scripts/suno_bgm.py <Suno から落とした mp3 のフォルダ> public/assets/bgm
  （numpy と ffmpeg が要る。mp3 は Suno の曲の名前のまま落とす）

切り方は scripts/maou_bgm.py と同じ2つ。書き出した後に表示する値を src/data/sounds.ts の BGM_LOOPS に、version と bytes を台帳（src/data/assets.ts）に書く。
- loop：Suno の曲は同じ部分がそっくり繰り返すわけではないので、拍ごとの音の特徴（和音・音色・大きさ）が前後16拍で一番よく似た2点 S・E を探した
  （テンポの差が1%未満の所だけ。拍を合わせた後、波形が一番そろう位置にサンプル単位で寄せた）。鳴り始めの少し前から E までを流し、
  その後ろに [S, S+1秒) の写しを足す。E の直前 60ms は、戻り先 S の直前の音へなめらかに移す。くり返すのは S〜E
- whole：鳴り始めから、鳴り終わり＋1.5秒までを切り出し、全体をくり返す
大きさは、ほかの BGM と同じ TARGET_LUFS にそろえる
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
    # 落とした mp3, 書き出すファイル, くり返し方, S（サンプル）, E（サンプル）
    # タイトルと返す場面は、メインテーマ（Paper Umbrella）を Cover した曲。落とした時の名前は NoTitle・ReturnTheMemory
    ('NoTitle', 'suno_title.mp3', 'whole', None, None),
    ('ReturnTheMemory', 'suno_return.mp3', 'whole', None, None),
    # 日常：67.2秒 → 153.5秒（約86秒）
    ('ArcadeAfternoon', 'suno_daily.mp3', 'loop', 2962432, 6767566),
    # プロローグの祭り：35.6秒 → 120.4秒（約85秒）
    ('TimePassesMemory', 'suno_prologue.mp3', 'loop', 1571840, 5308938),
    # 縁日（1-1。プロローグの曲を Cover した）：31.3秒 → 108.9秒（約78秒）
    ('LostFair', 'suno_festival.mp3', 'loop', 1380352, 4801388),
    # レストピア：拍のはっきりしない曲で、よく似た2点が見つからなかったので全体をくり返す
    ('RESTOPIA', 'suno_library.mp3', 'whole', None, None),
    # ふだんの戦闘：23.4秒 → 57.0秒（約34秒）
    ('AttackAndStrike', 'suno_battle.mp3', 'loop', 1030144, 2511759),
    # ボス戦（1-1）：97.3秒 → 161.5秒（約64秒）
    ('FirstCombat', 'suno_boss_1_1.mp3', 'loop', 4290560, 7123129),
    # 2026-10-13 の最初の版のボス戦（Paper Umbrella を Cover した和風メタル。81.2秒 → 170.2秒）は、ラスボスの候補として残し、ゲームからは外した
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
for name, fname, mode, s, e in SONGS:
    x = decode(f'{src}/{name}.mp3')
    if mode == 'loop':
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
