# 쇼츠 오디오: 목소리 분석·믹스 (효과음·배경음은 직접 합성 — 저작권 걱정 없음)
#   python mix.py analyze voice.wav env.json      → 목소리 끝 시각(초)을 출력, 30fps 음량 envelope 저장
#   python mix.py mix voice.wav out.wav DUR FULL   → 목소리(음량 맞춤) + 아주 작은 배경음(목소리 나오면 더 줄임) + FULL 전환 '휙'
import json, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def read(f):
    w = wave.open(f)
    assert w.getframerate() == SR and w.getnchannels() == 1, 'voice must be 48k mono'
    return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768


def lp(x, a):  # 1극 로우패스 (a: 상수 또는 샘플별 배열)
    try:
        from scipy.signal import lfilter
        if np.isscalar(a):
            return lfilter([a], [1, a - 1], x)
    except ImportError:
        pass
    y = np.zeros_like(x); s = 0.0; a = np.broadcast_to(a, x.shape)
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    return y


def envelope(v):
    f = SR // 30
    r = np.array([np.sqrt((v[i * f:(i + 1) * f] ** 2).mean()) for i in range(len(v) // f)])
    r = np.clip(r / (np.percentile(r, 98) + 1e-9), 0, 1)
    return np.convolve(r, [.25, .5, .25], 'same')


def analyze(voice, out):
    e = envelope(read(voice))
    json.dump([round(float(x), 3) for x in e], open(out, 'w'))
    on = np.where(e > .12)[0]
    print(json.dumps({'speechEnd': round(float(on[-1] + 1) / 30, 2) if len(on) else 0, 'frames': len(e)}))


def whoosh(d=.3, g=.15):
    t = np.arange(int(d * SR)) / SR; n = rng.standard_normal(len(t)); ph = t / d
    a = .02 + .25 * np.sin(np.pi * ph) ** 2
    y = lp(n, a) - lp(n, a * .15)
    return g * y * np.sin(np.pi * ph) ** 1.5 / (np.abs(y).max() + 1e-9)


def mix(voice, out, dur, full):
    v = read(voice)
    N = int(dur * SR)
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    # 목소리: 말하는 구간 평균을 -15 dBFS 로
    f = SR // 30
    fr = np.array([np.sqrt((v[i * f:(i + 1) * f] ** 2).mean()) for i in range(N // f)])
    act = fr[fr > fr.max() * .2]
    v *= 10 ** ((-15 - 20 * np.log10(np.sqrt((act ** 2).mean()) + 1e-9)) / 20)
    # 배경음: Am-F-C-G 패드, 아주 작게, 목소리 나오면 더 줄임, 끝 0.6초 페이드
    t = np.arange(N) / SR; bar = 2.0
    chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [130.8, 196, 261.6], [196, 246.9, 293.7]]
    bgm = np.zeros(N)
    for k in range(int(np.ceil(dur / bar))):
        s, e = int(k * bar * SR), min(N, int((k + 1) * bar * SR)); tt = np.arange(e - s) / SR
        env = np.minimum(1, tt / .25) * np.minimum(1, (bar - tt) / .25)
        for fq in chords[k % 4]:
            bgm[s:e] += (np.sin(2 * np.pi * fq * tt) + .3 * np.sin(4 * np.pi * fq * tt + .5)) * env
    bgm = lp(bgm / np.abs(bgm).max(), .08)
    venv = np.convolve(np.abs(v), np.ones(4800) / 4800, 'same')
    duck = 1 - .6 * np.clip(venv / (venv.max() * .3 + 1e-9), 0, 1)
    vol = 10 ** (-15 / 20) * .32  # 목소리보다 약 20 dB 아래
    bgm *= vol * duck * np.minimum(1, (N - np.arange(N)) / (.6 * SR))
    sfx = np.zeros(N); w = whoosh(); i = int((full - .05) * SR); sfx[i:i + len(w)] += w[:N - i]
    m = v + bgm + sfx
    m /= max(1, np.abs(m).max() / .98)
    o = wave.open(out, 'wb'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR)
    o.writeframes((m * 32767).astype(np.int16).tobytes()); o.close()
    print(json.dumps({'ok': True, 'dur': dur}))


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'analyze':
        analyze(sys.argv[2], sys.argv[3])
    else:
        mix(sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5]))
