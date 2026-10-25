"""そろった手拍子の効果音を作る（段階114。テストプレイのメモ 30：2-2 の最後のコマ。効果音ラボにそろった手拍子がなかった）。

使い方: python3 scripts/make_handclap.py <拍手単音の mp3> public/assets/se/handclap.mp3
  （numpy と ffmpeg が要る。拍手単音はポケットサウンドの hakusyuone.mp3。乱数の種を決めているので、毎回同じ音になる）

作り方：本物の拍手1回の音（ポケットサウンド「拍手単音」）を、126 bpm の拍に、48人が少しずつ加わってたたく形に重ねる。
1人ごとに、音の高さ（再生の速さ 0.85〜1.15 倍）・大きさ・こもり方（遠い人ほど高い音を落とす）・拍とのずれを変える。全体はだんだん大きくなる。
3人に1人は高い拍手（再生の速さ 1.2〜1.38 倍。子どもや手の小さい人の音。2026-10-25 開発者の頼み）。
最初の版（雑音から作った音）はカチカチし、次の版（雑音の音＋作った響き）は電子音のような響きが目立った（2026-10-25 開発者の確認）ので、本物の音を重ねる形にした。響きは足さない
"""
import subprocess
import sys

import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def resample(x, rate):
    idx = np.arange(0, len(x) - 1, rate)
    return np.interp(idx, np.arange(len(x)), x)


def soften(x, amount):
    """遠い人ほど高い音を落とす（1次のローパス。amount 0〜0.85）"""
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = acc * amount + v * (1 - amount)
        y[i] = acc
    return y


def main(src, path):
    one = decode(src)
    one = one[np.argmax(np.abs(one) > 0.02 * np.abs(one).max()):]
    rates = (0.86, 0.93, 1.0, 1.07, 1.14, 1.2, 1.28, 1.38)
    variants = [soften(resample(one, r), a) for r in rates for a in (0.0, 0.45, 0.7)]
    dur = 9.0
    out = np.zeros(int(SR * dur) + SR)
    beat = 60 / 126
    people = 48
    for p in range(people):
        start = rng.uniform(0, 4.5) * (p / people)
        gain = rng.uniform(0.35, 1.0)
        far = rng.integers(0, 3)
        high = p % 3 == 0
        lag = rng.normal(0, 0.018)
        tb = 0.25
        while tb < dur - 0.3:
            if tb >= start:
                k = rng.integers(5, 8) if high else rng.integers(0, 5)
                v = variants[k * 3 + far] * gain * rng.uniform(0.8, 1.1)
                i = int((tb + lag + rng.normal(0, 0.01)) * SR)
                if i >= 0:
                    out[i:i + len(v)] += v[: len(out) - i]
            tb += beat
    out = out[: int(SR * dur)]
    t = np.arange(len(out)) / SR
    out *= np.clip(0.3 + 0.7 * t / 5.5, 0, 1) * np.clip((dur - t) / 1.2, 0, 1)
    out /= np.abs(out).max() * 1.15
    pcm = (out * 32767).astype(np.int16)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-b:a', '96k', path], input=pcm.tobytes(), check=True)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
