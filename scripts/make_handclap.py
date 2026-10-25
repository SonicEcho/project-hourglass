"""そろった手拍子の効果音を作る（段階114。テストプレイのメモ 30：2-2 の最後のコマ。効果音ラボにそろった手拍子がなかった）。

使い方: python3 scripts/make_handclap.py public/assets/se/handclap.mp3
  （numpy と ffmpeg が要る。乱数の種を決めているので、毎回同じ音になる）

作り方：126 bpm の拍に、64人が少しずつ加わって手をたたく（1人ごとに高さ・大きさ・ずれを変える）。
1回の手拍子は、柔らかく立ち上がる雑音を、1300Hz あたりと手のひらの厚み（280Hz あたり）で強め、3200Hz より上を落とす
（最初の版は高い音が強く、カチカチして聞こえた。2026-10-25 開発者の確認）。全体はだんだん大きくなり、体育館の響きを足す
"""
import subprocess
import sys

import numpy as np

SR = 44100
rng = np.random.default_rng(5)


def clap(bright):
    n = int(SR * 0.16)
    t = np.arange(n) / SR
    env = np.clip(t / 0.0025, 0, 1) * np.exp(-t * rng.uniform(28, 40))
    x = rng.standard_normal(n) * env
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    w = np.exp(-((np.log(f + 1) - np.log(1300 * bright)) ** 2) / 0.7)
    w += 0.35 * np.exp(-((np.log(f + 1) - np.log(280 * bright)) ** 2) / 0.15)
    w *= 1 / (1 + (f / 3200) ** 4)
    return np.fft.irfft(spec * w, n)


def main(path):
    dur = 9.0
    out = np.zeros(int(SR * dur))
    beat = 60 / 126
    people = 64
    for p in range(people):
        start = rng.uniform(0, 4.5) * (p / people)
        gain = rng.uniform(0.4, 1.0)
        bright = rng.uniform(0.75, 1.2)
        lag = rng.normal(0, 0.02)
        tb = 0.25
        while tb < dur - 0.3:
            if tb >= start:
                c = clap(bright) * gain * rng.uniform(0.75, 1.1)
                i = int((tb + lag + rng.normal(0, 0.012)) * SR)
                if 0 <= i < len(out) - len(c):
                    out[i:i + len(c)] += c
            tb += beat
    t = np.arange(len(out)) / SR
    out *= np.clip(0.3 + 0.7 * t / 5.5, 0, 1) * np.clip((dur - t) / 1.2, 0, 1)
    rev = np.zeros_like(out)
    for d in np.linspace(0.02, 0.6, 40):
        k = int(d * SR)
        rev[k:] += out[:-k] * 0.5 * np.exp(-d * 6) * rng.uniform(0.6, 1.0)
    out = out + rev * 0.6
    out /= np.abs(out).max() * 1.15
    pcm = (out * 32767).astype(np.int16)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-b:a', '96k', path], input=pcm.tobytes(), check=True)


if __name__ == '__main__':
    main(sys.argv[1])
