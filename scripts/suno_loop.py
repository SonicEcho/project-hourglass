"""Suno の曲のくり返し区間（S・E）を探す（2026-10-19。段階75。scripts/suno_bgm.py の SONGS に写す値を出す）。

使い方: python3 scripts/suno_loop.py [--min <秒>] <mp3>[@<bpm>] [...]
  （numpy と ffmpeg が要る。--min は1周の短さの下限（書かなければ MIN_LOOP 秒。短い曲や、だんだん大きくなる曲で下げる）。@bpm は指示文のテンポ。付けると、1周の長さを小節（4拍）の区切りに限る。拍のはっきりしない曲には付けない）

探し方：
- 約46ms ごとに、音の特徴（12の音の高さの強さ＝和音、帯ごとの大きさ＝音色、全体の大きさ）を取る
- 2点 S・E（E−S が MIN_LOOP 秒以上）について、そこから前後 WINDOW 秒の特徴がどれだけ似ているかを比べ、一番似た組を選ぶ
  （前後を見るので、拍・小節の頭がそろう所が選ばれる。曲の頭 HEAD 秒と、終わりの TAIL 秒（消えていく所）は使わない）
- @bpm を付けた時は、そのテンポの ±8% で音の立ち上がりが一番よく繰り返す周期を拍とし、1周を小節の数の整数倍（ずれが 1/8 拍まで）に限る
- つなぎ目の前後2秒の大きさが LOUD_DB より違う組は選ばない（静かな前奏の中に戻ると、つなぎ目で急に小さくなるため）
- E を、波形が S の前後と一番そろう位置にサンプル単位で寄せる（±25ms）
似ている度合い（score。1 が同じ）が低い曲（目安 0.9 未満）は、全体をくり返す（whole）にする
"""
import subprocess
import sys

import numpy as np

SR = 44100
HOP = 2048
WINDOW = 8.0
MIN_LOOP = 40.0
HEAD = 4.0
TAIL = 12.0
LOUD_DB = 1.5


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def features(mono):
    n = (len(mono) - 4096) // HOP
    idx = np.arange(4096)[None, :] + HOP * np.arange(n)[:, None]
    spec = np.abs(np.fft.rfft(mono[idx] * np.hanning(4096), axis=1))
    freq = np.fft.rfftfreq(4096, 1 / SR)
    chroma = np.zeros((n, 12))
    ok = (freq > 60) & (freq < 4000)
    pc = (np.round(12 * np.log2(freq[ok] / 440)) % 12).astype(int)
    for k in range(12):
        chroma[:, k] = spec[:, ok][:, pc == k].sum(1)
    chroma /= chroma.sum(1, keepdims=True) + 1e-9
    edges = np.geomspace(60, 16000, 17)
    bands = np.stack([spec[:, (freq >= a) & (freq < b)].sum(1) for a, b in zip(edges[:-1], edges[1:])], 1)
    bands = np.log1p(bands)
    loud = np.log1p(spec.sum(1, keepdims=True))
    f = np.concatenate([chroma * 4, bands / (np.linalg.norm(bands, axis=1, keepdims=True) + 1e-9), loud / (loud.max() + 1e-9)], 1)
    return f / (np.linalg.norm(f, axis=1, keepdims=True) + 1e-9)


def loud_db(mono, sec):
    """各フレームの前後 sec 秒の大きさ（dB）"""
    n = (len(mono) - 4096) // HOP
    p = np.array([float((mono[i * HOP:i * HOP + 4096] ** 2).mean()) for i in range(n)])
    w = max(1, int(sec * SR / HOP))
    c = np.concatenate([[0], np.cumsum(np.pad(p, w, mode='edge'))])
    return 10 * np.log10((c[2 * w + 1:] - c[:-2 * w - 1]) / (2 * w + 1) + 1e-12)


def beat_sec(mono, bpm):
    """指示文のテンポの近くで、音の立ち上がりが一番よく繰り返す周期（秒）"""
    h = 256
    n = len(mono) // h
    fps = SR / h
    en = np.sqrt((mono[:n * h].reshape(n, h) ** 2).mean(1))
    d = np.maximum(0, np.diff(np.log(en + 1e-5)))
    d -= d.mean()
    ac = np.correlate(d, d, 'full')[len(d) - 1:]
    k0 = fps * 60 / bpm
    ks = np.arange(int(k0 * 0.92), int(k0 * 1.08) + 1)
    k = int(ks[np.argmax(ac[ks])])
    y0, y1, y2 = ac[k - 1], ac[k], ac[k + 1]
    return (k + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)) / fps


def find(path, bpm=None):
    x = decode(path)
    mono = x.mean(1)
    f = features(mono)
    db = loud_db(mono, 2.0)
    bar = 4 * beat_sec(mono, bpm) if bpm else None
    n = len(f)
    fps = SR / HOP
    w = int(WINDOW * fps)
    lo, hi = int(HEAD * fps) + w, n - int(TAIL * fps) - w
    best = (-1, 0, 0)
    for lag in range(int(MIN_LOOP * fps), hi - lo):
        if bar:
            bars = lag / fps / bar
            if abs(bars - round(bars)) * 4 > 0.125:
                continue
        sim = (f[lo - w:hi - lag + w] * f[lo - w + lag:hi + w]).sum(1)
        c = np.concatenate([[0], np.cumsum(sim)])
        win = (c[2 * w:] - c[:-2 * w]) / (2 * w)
        ts = np.arange(len(win)) + lo
        win = np.where(np.abs(db[ts] - db[ts + lag]) > LOUD_DB, -1, win)
        t = int(np.argmax(win))
        # 同じくらい似ているなら長い区間を選ぶ（0.002 の差までは長さを優先）
        if win[t] > best[0] + 0.002 or (win[t] > best[0] - 0.002 and lag > best[2] - best[1]):
            best = (float(win[t]), lo + t, lo + t + lag)
    score, s, e = best
    s, e = s * HOP, e * HOP
    # 波形をそろえる：E の前後を、S の前後と一番よく重なる位置へ（±25ms）
    r, k = int(0.025 * SR), 4096
    ref = mono[s - k:s + k]
    cands = [(float(np.dot(ref, mono[e + d - k:e + d + k])), d) for d in range(-r, r + 1)]
    e += max(cands)[1]
    return score, s, e, len(x) / SR, bar


args = sys.argv[1:]
if args[:1] == ['--min']:
    MIN_LOOP = float(args[1])
    args = args[2:]
for arg in args:
    p, _, bpm = arg.partition('@')
    score, s, e, dur, bar = find(p, float(bpm) if bpm else None)
    bars = f'  {(e - s) / SR / bar:.2f} 小節（{4 * 60 / bar:.1f} bpm）' if bar else ''
    print(f'{p}: score {score:.3f}  S {s} ({s / SR:.1f}秒)  E {e} ({e / SR:.1f}秒)  1周 {(e - s) / SR:.1f}秒{bars}  曲 {dur:.1f}秒')
