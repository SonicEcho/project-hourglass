"""段階19の仮の BGM を合成する（自作。ループの仕組みを確かめるための音で、本番では Suno の曲に替える）。

使い方: python3 scripts/placeholder_bgm.py public/assets/bgm/title.wav public/assets/bgm/festival.wav
必要なもの: numpy
音を鳴らし終わった余韻は曲の頭に回り込ませて足すので、最後から最初へ切れ目なくつながる。
"""
import numpy as np, wave, sys
SR = 22050
def note_hz(n): return 440.0 * 2 ** ((n - 69) / 12)
def render(length, events):
    buf = np.zeros(int(length * SR))
    N = len(buf)
    for start, dur, fn in events:
        seg = fn(dur)
        i0 = int(start * SR)
        idx = (np.arange(len(seg)) + i0) % N   # ループの頭に回り込ませて、つなぎ目をなくす
        np.add.at(buf, idx, seg)
    buf /= max(1e-6, np.abs(buf).max()) / 0.6
    return buf
def env(n, a, r):
    e = np.ones(n); ai = int(a * SR); ri = int(r * SR)
    e[:ai] = np.linspace(0, 1, ai) if ai else 1
    e[-ri:] *= np.linspace(1, 0, ri)
    return e
def bell(n, vol=0.3, tail=1.6):
    def f(d):
        t = np.arange(int((d + tail) * SR)) / SR; hz = note_hz(n)
        s = np.sin(2*np.pi*hz*t) + 0.3*np.sin(2*np.pi*hz*2*t) + 0.1*np.sin(2*np.pi*hz*3*t)
        return vol * s * np.exp(-t * 2.2)
    return f
def pad(ns, vol=0.12):
    def f(d):
        n = int((d + 0.6) * SR); t = np.arange(n) / SR
        s = sum(np.sin(2*np.pi*note_hz(x)*t) for x in ns)
        return vol * s * env(n, 0.5, 0.8)
    return f
def flute(n, vol=0.25):
    def f(d):
        k = int((d + 0.15) * SR); t = np.arange(k) / SR; hz = note_hz(n)
        s = np.sin(2*np.pi*hz*t + 0.02*np.sin(2*np.pi*5.5*t)*hz/50)
        return vol * s * env(k, 0.04, 0.12)
    return f
def drum(vol=0.5):
    def f(d):
        k = int(0.4 * SR); t = np.arange(k) / SR
        s = np.sin(2*np.pi*(90 - 40*t)*t) * np.exp(-t*12)
        return vol * s
    return f
def write(path, buf):
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((buf * 32767).astype('<i2').tobytes())

# タイトル：76 bpm、4小節。Cmaj7 - Am7 - Fmaj7 - G のアルペジオとパッド
beat = 60 / 76; L = 16 * beat; ev = []
chords = [[48,52,55,59], [45,48,52,55], [41,45,48,52], [43,47,50,55]]
for b, ch in enumerate(chords):
    t0 = b * 4 * beat
    ev.append((t0, 4 * beat, pad([c + 12 for c in ch])))
    arp = [ch[0]+24, ch[1]+24, ch[2]+24, ch[3]+24, ch[2]+24, ch[1]+24, ch[3]+24, ch[2]+24]
    for i, n in enumerate(arp): ev.append((t0 + i * beat / 2, beat / 2, bell(n, 0.22)))
write(sys.argv[1], render(L, ev))

# 縁日：110 bpm、4小節。ヨナ抜きの笛と太鼓
beat = 60 / 110; L = 16 * beat; ev = []
mel = [(74,1),(76,1),(79,1),(76,1),(74,2),(72,2),(74,1),(72,1),(69,2),(72,1),(74,1),(76,4)]
t = 0
for n, d in mel:
    ev.append((t * beat, d * beat * 0.95, flute(n))); t += d
for i in range(16): ev.append((i * beat, 0.3, drum(0.55 if i % 4 == 0 else 0.3)))
for b in range(4): ev.append((b * 4 * beat, 4 * beat, pad([50, 57], 0.08)))
write(sys.argv[2], render(L, ev))
