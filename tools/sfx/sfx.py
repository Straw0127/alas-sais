"""ALAS-SAIS procedural horror sound pack. Pure numpy/scipy synthesis -> WAV -> MP3."""
import numpy as np, os, subprocess
from scipy import signal
from scipy.io import wavfile

SR = 44100
OUT = '/home/claude/sfx/out'
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(1985)

def t_(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi / (SR / 2), 0.99)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def reso(x, f, q=20):
    b, a = signal.iirpeak(f / (SR / 2), q); return signal.lfilter(b, a, x)
def env(n, a, r, shape=1.0):
    e = np.ones(n); ai = max(1, int(a * SR)); ri = max(1, int(r * SR))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri) ** shape; return e
def expdec(n, tau): return np.exp(-np.arange(n) / (tau * SR))
def norm(x, peak=0.9): m = np.max(np.abs(x)) or 1; return x / m * peak
def place(buf, x, at):
    i = max(0, int(at * SR))
    if i >= len(buf): return buf
    j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i]; return buf
def reverb(x, size=1.2, mix=0.3, damp=4000):
    n = int(size * SR); ir = rng.standard_normal(n) * expdec(n, size / 5); ir = lp(ir, damp)
    wet = signal.fftconvolve(x, ir)[:len(x)]; wet = norm(wet, np.max(np.abs(x)) + 1e-9)
    return x * (1 - mix) + wet * mix
def dist(x, k=4): return np.tanh(x * k) / np.tanh(k)
def crush(x, bits=6, down=4):
    y = np.round(x * 2 ** bits) / 2 ** bits; y = np.repeat(y[::down], down)[:len(x)]; return y
def pan(x, p):  # p -1..1
    l = np.cos((p + 1) * np.pi / 4); r = np.sin((p + 1) * np.pi / 4); return np.stack([x * l, x * r], 1)
def stereo(x): return np.stack([x, x], 1) if x.ndim == 1 else x
def loopify(x, fade=1.5):
    f = int(fade * SR); x = x.copy(); head = x[:f].copy()
    w = np.linspace(0, 1, f)
    if x.ndim == 2: w = w[:, None]
    x[-f:] = x[-f:] * (1 - w) + head * w; return x[f:]
def save(name, x, peak=0.9, mp3=True):
    x = norm(stereo(x), peak); p = os.path.join(OUT, name + '.wav')
    wavfile.write(p, SR, (x * 32767).astype(np.int16))
    if mp3:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, '-codec:a', 'libmp3lame', '-q:a', '5', os.path.join(OUT, name + '.mp3')], check=True)
        os.remove(p)

# ---------------------------------------------------------------- building blocks
def creak(d=1.4, f0=900, rate=(18, 70), res=(320, 880, 1900)):
    """Stick-slip creak: impulse train with wandering rate through wood resonances."""
    n = int(d * SR); x = np.zeros(n); t = 0.0
    curve = np.interp(np.linspace(0, 1, 200), [0, 0.3, 0.7, 1], [rate[0], rate[1], rate[0] * 1.5, rate[1] * 0.7])
    while t < d:
        r = curve[min(199, int(t / d * 199))] * rng.uniform(0.8, 1.25)
        i = int(t * SR)
        if i < n: x[i] = rng.uniform(0.5, 1.0)
        t += 1.0 / r
    y = sum(reso(x, f, 25) * g for f, g in zip(res, (1.0, 0.6, 0.3)))
    y = lp(y, 4000) * env(n, 0.05, 0.3)
    return y

def metal_hit(f=2200, d=0.6, inharm=(1, 2.76, 5.4, 8.93), damp=0.15):
    t = t_(d); y = np.zeros_like(t)
    for k, h in enumerate(inharm):
        y += np.sin(2 * np.pi * f * h * t + rng.uniform(0, 6)) * np.exp(-t / (damp / (k + 1))) / (k + 1)
    y += hp(noise(d), 3000) * np.exp(-t / 0.01) * 0.5
    return y

def scuff(d=0.5):
    n = int(d * SR); x = noise(d)
    sweep = np.linspace(1, 0.3, n)
    y = bp(x, 300, 2600) * env(n, 0.08, 0.25) * (0.6 + 0.4 * np.sin(np.linspace(0, 9, n)) ** 2)
    thump = np.sin(2 * np.pi * 70 * t_(d)) * np.exp(-t_(d) / 0.05) * 0.6
    return y * sweep + thump

def breath(d=2.6, inhale=True, wet=True):
    n = int(d * SR); x = noise(d)
    f1, f2 = (600, 1400) if inhale else (450, 1100)
    y = reso(x, f1, 4) * 0.7 + reso(x, f2, 6) * 0.5 + bp(x, 2500, 6000) * 0.2
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    y = y * e
    if wet:
        cr = np.zeros(n)
        for _ in range(int(d * 40)):
            i = rng.integers(0, n - 200); cr[i:i + 60] += hp(noise(60 / SR + 1e-4)[:60], 2000) * rng.uniform(0.2, 0.8)
        y += cr * e * 0.35
    return lp(y, 7000)

def heartbeat(bpm=72, d=6.0):
    n = int(d * SR); y = np.zeros(n); beat = 60 / bpm
    def thump(f, dd, a):
        t = t_(dd); return np.sin(2 * np.pi * f * t * (1 - 0.3 * t / dd)) * np.exp(-t / (dd / 4)) * a
    k = 0.0
    while k < d - 0.4:
        place(y, thump(55, 0.25, 1.0), k); place(y, thump(48, 0.22, 0.7), k + 0.28); k += beat
    return lp(y, 200)

# ---------------------------------------------------------------- ambience loops
def amb_house(d=40):
    n = int(d * SR)
    rain = bp(noise(d), 800, 7000) * 0.18
    drops = np.zeros(n)
    for _ in range(int(d * 140)):
        i = rng.integers(0, n - 2000); f = rng.uniform(1500, 5000)
        drops[i:i + 1500] += np.sin(2 * np.pi * f * t_(1500 / SR)) * np.exp(-t_(1500 / SR) / 0.004) * rng.uniform(0.05, 0.4)
    roof = lp(noise(d), 300) * 0.25 * (0.7 + 0.3 * np.sin(2 * np.pi * t_(d) / 13))
    t = t_(d)
    fan = (np.sin(2 * np.pi * 59.5 * t) * 0.05 + np.sin(2 * np.pi * 119 * t) * 0.03 + lp(noise(d), 500) * 0.05) * (1 + 0.15 * np.sin(2 * np.pi * 0.9 * t))
    drone = (np.sin(2 * np.pi * 41.2 * t) + np.sin(2 * np.pi * 41.9 * t) * 0.8 + np.sin(2 * np.pi * 61.7 * t) * 0.3) * 0.06 * (0.6 + 0.4 * np.sin(2 * np.pi * t / 17) ** 2)
    L = rain + drops + roof + fan + drone
    R = bp(noise(d), 800, 7000) * 0.18 + roof + fan + drone + np.roll(drops, 9000)
    st = np.stack([L, R], 1)
    for at, p in ((6.5, -0.7), (19, 0.5), (31, -0.2)):
        c = reverb(creak(rng.uniform(0.8, 1.6), rate=(12, 45)), 1.0, 0.4) * 0.35
        place(st, pan(c, p), at)
    return loopify(st)

def amb_garden(d=40):
    n = int(d * SR); t = t_(d)
    wind = lp(noise(d), 600) * 0.2 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 9) ** 2)
    leaves = bp(noise(d), 2000, 8000) * 0.05 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 7 + 1) ** 2)
    st = np.stack([wind + leaves, wind * 0.9 + np.roll(leaves, 5000)], 1)
    for k in range(9):
        f = rng.uniform(4200, 5200); p = rng.uniform(-1, 1); rate = rng.uniform(2.5, 4.0)
        ch = np.sin(2 * np.pi * f * t) * (np.sin(2 * np.pi * 32 * t) > 0.2) * (np.sin(2 * np.pi * rate * t + k) > 0.4) * 0.05
        st += pan(ch, p)
    for _ in range(14):
        at = rng.uniform(0, d - 1); f = rng.uniform(140, 220)
        tt = t_(0.35); fr = np.sign(np.sin(2 * np.pi * f * tt)) * np.exp(-tt / 0.12) * (np.sin(2 * np.pi * 18 * tt) > 0) * 0.12
        place(st, pan(lp(fr, 900), rng.uniform(-1, 1)), at)
    return loopify(st)

def amb_menu(d=48):
    t = t_(d)
    base = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * a for f, a in ((36.7, .5), (37.1, .4), (55.0, .25), (73.4, .12), (110.3, .05)))
    swell = 0.5 + 0.5 * np.sin(2 * np.pi * t / 24) ** 2
    hiss = bp(noise(d), 200, 1200) * 0.06 * swell
    metal = np.zeros(len(t))
    for at in (5, 17, 29, 41):  # kulintang-like tuned metal, detuned and slowed
        for f, o in ((392, 0), (349, .7), (311, 1.6)):
            place(metal, metal_hit(f, 3.0, (1, 2.0, 3.01, 4.2), 0.8) * 0.18, at + o)
    y = base * 0.5 * swell + hiss + reverb(metal, 3.0, 0.6, 2500)
    return loopify(np.stack([y, np.roll(y, 600)], 1))

# ---------------------------------------------------------------- cues
def door_creak(): return reverb(creak(1.6, rate=(14, 60)), 0.8, 0.25)
def door_slam():
    d = 1.5; t = t_(d)
    y = np.sin(2 * np.pi * 52 * t) * np.exp(-t / 0.12) * 1.2 + bp(noise(d), 100, 1800) * np.exp(-t / 0.06)
    place(y, metal_hit(1300, 0.4, damp=0.05) * 0.2, 0)
    return reverb(dist(y, 2), 1.2, 0.35)
def handle_rattle():
    d = 1.6; y = np.zeros(int(d * SR)); k = 0.0
    while k < d - 0.2:
        place(y, metal_hit(rng.uniform(1800, 2600), 0.15, damp=0.03) * rng.uniform(0.4, 1.0), k); k += rng.uniform(0.04, 0.12)
    y += bp(noise(d), 200, 900) * 0.1 * env(len(y), 0.1, 0.3)
    return reverb(y, 0.6, 0.25)
def scuffs(n=4, gap=1.1, far=False):
    d = n * gap + 0.6; y = np.zeros(int(d * SR))
    for i in range(n): place(y, scuff(rng.uniform(0.4, 0.6)) * rng.uniform(0.7, 1.0), i * gap + rng.uniform(0, 0.15))
    if far: y = lp(y, 1200) * 0.6
    return reverb(y, 1.4, 0.45 if far else 0.25)
def wheeze():
    y = np.concatenate([breath(2.2, True), np.zeros(int(0.3 * SR)), breath(2.8, False)])
    y += lp(noise(len(y) / SR), 180) * 0.15 * np.sin(np.linspace(0, 2 * np.pi, len(y))) ** 2  # throat rumble
    return reverb(y, 0.9, 0.3)
def lullaby_hum():
    notes = [0, 3, 5, 3, 0, -2, 0, 3, -4, -2, 0]  # original minor melody
    y = np.zeros(int(len(notes) * 0.7 * SR + SR))
    for i, s in enumerate(notes):
        f = 196 * 2 ** (s / 12); d = 0.68; t = t_(d)
        vib = 1 + 0.008 * np.sin(2 * np.pi * 5.5 * t)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        v = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * env(len(t), 0.12, 0.25)
        v = reso(v, 500, 3) + reso(v, 900, 4) * 0.5
        place(y, v, i * 0.7)
    y += bp(noise(len(y) / SR), 300, 3000) * 0.02
    return reverb(lp(y, 2500) * 0.6, 2.2, 0.5)
def tv_static(d=12):
    x = hp(noise(d), 400) * 0.6 + np.sin(2 * np.pi * 15734 * t_(d)) * 0.03
    cr = np.zeros(len(x))
    for _ in range(int(d * 25)):
        i = rng.integers(0, len(x) - 400); cr[i:i + 300] += noise(300 / SR + 1e-4)[:300] * rng.uniform(0.5, 1.5)
    return loopify(np.stack([x + cr * 0.4, x * 0.95 + cr * 0.4], 1), 0.5)
def static_swell(d=8.0):
    t = t_(d); e = (t / d) ** 2
    x = hp(noise(d), 300) * e + crush(np.sin(2 * np.pi * 220 * t * (1 + 0.05 * np.sin(2 * np.pi * 0.7 * t))) * 0.2, 5, 6) * e
    return x
def vhs_glitch(d=2.4):
    t = t_(d); wob = 1 + 0.06 * np.sin(2 * np.pi * 3.1 * t) + 0.03 * np.sin(2 * np.pi * 11 * t)
    tone = np.sin(2 * np.pi * np.cumsum(330 * wob) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(495 * wob) / SR)
    y = crush(tone * 0.4, 4, 8) + hp(noise(d), 1500) * 0.25
    # stutter
    seg = int(0.06 * SR); out = y.copy()
    for k in range(0, len(y) - seg * 4, seg * 5):
        if rng.random() > 0.5: out[k:k + seg * 3] = np.tile(y[k:k + seg], 3)
    gate = (np.sin(2 * np.pi * 7 * t) > -0.6).astype(float)
    return out * gate * env(len(out), 0.01, 0.2)
def giggle():
    y = np.zeros(int(1.6 * SR))
    for i in range(6):
        d = 0.12; t = t_(d); f = 520 + i * 25 + rng.uniform(-30, 30)
        v = np.sin(2 * np.pi * f * t + 3 * np.sin(2 * np.pi * 7 * t)) * env(len(t), 0.01, 0.06)
        v += bp(noise(d), 1500, 4000) * 0.3 * env(len(t), 0.01, 0.06)
        place(y, v, i * 0.16)
    return reverb(crush(y, 6, 3), 1.0, 0.4)
def clinks(d=4.0, density=8):
    y = np.zeros(int(d * SR))
    for _ in range(int(d * density)):
        place(y, metal_hit(rng.uniform(1500, 4200), 0.7, damp=0.18) * rng.uniform(0.15, 0.7), rng.uniform(0, d - 0.8))
    return reverb(y, 0.9, 0.3)
def sniff():
    y = np.zeros(int(1.5 * SR))
    for k in range(3): place(y, bp(noise(0.15), 1500, 6000) * env(int(0.15 * SR), 0.02, 0.08), k * 0.22)
    return reverb(y, 0.6, 0.25)
def knife_taps():
    y = np.zeros(int(2.2 * SR))
    for k in range(6): place(y, metal_hit(3100, 0.25, damp=0.04) + np.sin(2 * np.pi * 180 * t_(0.25)) * np.exp(-t_(0.25) / 0.02), k * 0.33)
    return reverb(y, 0.8, 0.3)
def nail_taps():
    y = np.zeros(int(2.4 * SR))
    for k in range(7):
        at = k * 0.3 + rng.uniform(0, 0.05)
        place(y, hp(noise(0.05), 2500) * expdec(int(0.05 * SR), 0.006), at); place(y, metal_hit(5200, 0.12, damp=0.02) * 0.3, at)
    return reverb(y, 0.5, 0.35)
def whisper(d=2.2):
    x = noise(d); n = len(x); y = np.zeros(n); seg = int(0.18 * SR)
    for k in range(0, n - seg, seg):
        f1 = rng.uniform(400, 900); f2 = rng.uniform(1100, 2600)
        part = reso(x[k:k + seg], f1, 6) + reso(x[k:k + seg], f2, 8) * 0.7 + hp(x[k:k + seg], 4000) * 0.3
        y[k:k + seg] += part * np.hanning(seg)
    return reverb(y * env(n, 0.2, 0.5), 1.4, 0.45)
def glass_shatter():
    d = 2.0; y = np.zeros(int(d * SR))
    for _ in range(140): place(y, metal_hit(rng.uniform(3000, 9000), 0.3, (1, 1.7, 2.9), 0.05) * rng.uniform(0.1, 0.6), abs(rng.normal(0.1, 0.25)))
    y += hp(noise(d), 2000) * expdec(len(y), 0.1)
    return reverb(y, 1.2, 0.3)
def bell6():
    d = 7.0; t = t_(d); f = 233
    y = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-t / (dec)) * a for h, a, dec in ((0.5, .6, 4), (1, 1, 3), (1.19, .5, 2.2), (1.5, .4, 1.8), (2.0, .35, 1.4), (2.5, .2, 0.9), (3.0, .15, 0.7)))
    place(y, metal_hit(f * 4, 0.2) * 0.2, 0)
    return reverb(np.concatenate([y, y[:int(SR * 0.0)]]), 3.0, 0.45, 3000)
def light_switch():
    d = 0.3; t = t_(d); return np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.004) + hp(noise(d), 2000) * np.exp(-t / 0.003) + np.sin(2 * np.pi * 120 * t) * np.exp(-t / 0.02) * 0.5
def flashlight_click():
    d = 0.2; t = t_(d); return metal_hit(4200, 0.2, damp=0.015) + np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.005)
def curtain_rings():
    d = 1.6; y = np.zeros(int(d * SR))
    for k in range(10): place(y, metal_hit(rng.uniform(2600, 3300), 0.3, damp=0.05) * 0.5, k * 0.11 + rng.uniform(0, 0.03))
    y += bp(noise(d), 300, 3000) * 0.4 * env(len(y), 0.1, 0.6)
    return reverb(y, 0.7, 0.25)
def stinger_hit():  # low boom used under every jumpscare
    d = 2.0; t = t_(d); f = 60 * np.exp(-t * 2.5) + 28
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.6) * 1.4

# ---------------------------------------------------------------- jumpscares
def scream_voice(d, f0, f1, formants, rough=0.3):
    t = t_(d); f = np.geomspace(f0, f1, len(t)) * (1 + 0.02 * np.sin(2 * np.pi * 7 * t) + rough * 0.02 * noise(d))
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = signal.sawtooth(ph) + 0.5 * signal.sawtooth(ph * 1.007)
    v = sum(reso(saw, fm, 6) * g for fm, g in formants)
    v += bp(noise(d), 1500, 6000) * rough
    return v
def jumpscare(kind):
    d = 1.9; n = int(d * SR); y = np.zeros(n)
    place(y, stinger_hit() * 0.9, 0)
    if kind == 'kumot':
        v = scream_voice(1.6, 380, 900, ((800, 1), (1200, .8), (2600, .5)), 0.5) + scream_voice(1.6, 291, 650, ((700, 1), (1100, .6)), 0.4)
        v = v[::-1] * 0 + v  # forward
        inh = breath(0.35, True)[::-1] * 3
        place(y, inh, 0); place(y, dist(v * env(len(v), 0.02, 0.4), 6) * 0.9, 0.12)
        place(y, door_creak()[:int(0.9 * SR)] * 0.8, 0.0)
    elif kind == 'malikmata':
        v = scream_voice(1.5, 500, 1300, ((900, 1), (1500, .7), (3000, .5)), 0.3)
        v = crush(dist(v, 5), 4, 10)
        st = hp(noise(1.7), 300) * env(int(1.7 * SR), 0.005, 0.5) * 0.8
        place(y, st, 0); place(y, v * env(len(v), 0.01, 0.4), 0.08); place(y, vhs_glitch(1.2) * 0.6, 0.3)
    elif kind == 'kalansing':
        place(y, clinks(1.6, 60) * 1.2, 0)
        v = scream_voice(1.4, 160, 420, ((400, 1), (650, .9), (1100, .4)), 0.8)
        place(y, dist(v * env(len(v), 0.03, 0.4), 8) * 0.9, 0.15)
    elif kind == 'silip':
        place(y, whisper(0.6) * 0.8, 0.0)
        place(y, glass_shatter() * 1.0, 0.45)
        v = scream_voice(1.2, 900, 1800, ((1400, 1), (2400, .8), (3600, .4)), 0.4)
        place(y, dist(v * env(len(v), 0.01, 0.35), 5) * 0.85, 0.45)
        y[:int(0.45 * SR)] *= 0.5
    y = reverb(y, 1.3, 0.25)
    return np.stack([y, np.roll(y, 300)], 1)


# Jumpscares v2, timed to the animation: 0-0.35 s a quiet "she's there" beat (frames 0-1), the scream and boom land at exactly
# HIT = 0.35 s as the lunge starts (frames 2-7 by 0.62 s), the scream holds and shudders while the face fills the screen, out by 1.9 s.
HIT = 0.35
def jumpscare2(kind):
    d = 2.1; n = int(d * SR); y = np.zeros(n)
    boom = stinger_hit() * 1.1
    crack = bp(noise(0.08), 1500, 9000) * np.exp(-t_(0.08) / 0.012) * 2.0   # transient right on the hit
    place(y, boom, HIT); place(y, crack, HIT)
    def scream(v, att=0.008, rel=0.45, drive=6, trem=11):
        t = np.arange(len(v)) / SR; v = v * (1 + 0.35 * np.sin(2 * np.pi * trem * t))          # shudder, matched by the frame jitter
        return dist(v * env(len(v), att, rel), drive)
    if kind == 'kumot':
        place(y, breath(0.33, True)[::-1] * 2.2, 0.0); place(y, door_creak()[:int(0.3 * SR)] * 0.5, 0.0)
        v = scream_voice(1.45, 420, 980, ((800, 1), (1200, .8), (2600, .5)), 0.5) + scream_voice(1.45, 300, 700, ((700, 1), (1100, .6)), 0.4)
        place(y, scream(v) * 0.95, HIT)
    elif kind == 'malikmata':
        place(y, baby_cry()[:int(0.33 * SR)] * 0.5, 0.0)
        v = crush(scream_voice(1.4, 560, 1400, ((900, 1), (1500, .7), (3000, .5)), 0.3), 4, 10)
        place(y, scream(v, drive=5, trem=13) * 0.9, HIT); place(y, vhs_glitch(1.0) * 0.5, HIT)
    elif kind == 'kalansing':
        place(y, clinks(1.0, 30)[:int(0.33 * SR)] * 0.7, 0.0)
        v = scream_voice(1.4, 170, 460, ((400, 1), (650, .9), (1100, .4)), 0.8)
        place(y, scream(v, drive=8, trem=9) * 0.95, HIT); place(y, clinks(1.2, 70) * 0.8, HIT)
    elif kind == 'silip':
        place(y, whisper(1.0)[:int(0.33 * SR)] * 0.7, 0.0); place(y, wing_flap(2, False)[:int(0.33 * SR)] * 0.6, 0.02)
        v = scream_voice(1.3, 950, 1900, ((1400, 1), (2400, .8), (3600, .4)), 0.4)
        place(y, scream(v, drive=5, trem=14) * 0.9, HIT); place(y, glass_shatter() * 0.6, HIT)
    elif kind == 'barang':
        place(y, beetles(1.5)[:int(0.33 * SR)] * 0.9, 0.0); place(y, aparador_creak()[:int(0.33 * SR)] * 0.6, 0.0)
        v = scream_voice(1.4, 240, 620, ((500, 1), (900, .8), (2200, .5)), 0.7)
        place(y, scream(v, drive=7, trem=10) * 0.95, HIT); place(y, beetle_scatter() * 0.7, HIT)
    y[:int(HIT * SR)] *= 0.45   # the dread beat stays quiet so the hit lands
    y = reverb(y, 1.2, 0.22)
    return np.stack([y, np.roll(y, 300)], 1)


# ---------------------------------------------------------------- pack 2: Filipino night + player sounds
def step_surface(d=0.35, surface='wood', hard=1.0):
    t = t_(d); n = noise(d)
    if surface == 'wood':
        y = bp(n, 150, 1800) * np.exp(-t / 0.04) + np.sin(2 * np.pi * 95 * t) * np.exp(-t / 0.05) * 0.8
        y += reso(n, 420, 15) * np.exp(-t / 0.08) * 0.3
    else:  # cement
        y = bp(n, 800, 6000) * np.exp(-t / 0.025) * 0.8 + np.sin(2 * np.pi * 70 * t) * np.exp(-t / 0.03) * 0.5
    return y * hard
def footsteps(n=8, gap=0.55, surface='wood', run=False):
    d = n * gap + 0.6; y = np.zeros(int(d * SR))
    for i in range(n):
        place(y, step_surface(0.35, surface, 1.4 if run else 1.0) * rng.uniform(0.75, 1.0), i * gap + rng.uniform(-0.02, 0.02))
    if run:
        place(y, breath(d, True, False) * 0.25, 0)
    return reverb(y, 0.7, 0.2)
def tuko():
    """Tokay gecko call: a rising 'tu' then a deep 'ko', repeated."""
    y = np.zeros(int(7.5 * SR)); at = 0.6
    for k in range(6):
        for f0, f1, d in ((300, 520, 0.12), (420, 260, 0.2)):
            t = t_(d); f = np.linspace(f0, f1, len(t)); ph = 2 * np.pi * np.cumsum(f) / SR
            v = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * signal.sawtooth(ph)) * env(len(t), 0.01, 0.06)
            v = reso(v, 700, 3) + v * 0.3
            place(y, v * (1 - k * 0.07), at); at += d + 0.06
        at += 0.55
    return reverb(lp(y, 3000), 1.6, 0.45)
def dog_howl():
    d = 4.0; t = t_(d)
    f = 520 + 220 * np.sin(np.pi * t / d) - 60 * (t / d) ** 2 + 8 * np.sin(2 * np.pi * 5 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    v = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * env(len(t), 0.4, 1.2)
    v += bp(noise(d), 600, 2500) * 0.08 * env(len(t), 0.4, 1.2)
    return reverb(lp(v, 2200) * 0.5, 2.8, 0.6)
def tricycle_far(d=9.0):
    t = t_(d); rpm = 38 + 6 * np.sin(2 * np.pi * t / d)
    ph = 2 * np.pi * np.cumsum(rpm) / SR
    eng = (signal.sawtooth(ph) + 0.6 * signal.square(ph * 2)) * 0.3
    v = lp(eng, 500) * np.sin(np.pi * t / d) ** 2
    return reverb(v * 0.4, 2.5, 0.5)
def rooster():
    y = np.zeros(int(3.2 * SR)); at = 0.2
    for f0, f1, d in ((700, 900, 0.18), (900, 1150, 0.22), (1150, 950, 0.35), (950, 600, 0.9)):
        t = t_(d); f = np.linspace(f0, f1, len(t)) * (1 + 0.03 * np.sin(2 * np.pi * 30 * t))
        ph = 2 * np.pi * np.cumsum(f) / SR
        v = signal.sawtooth(ph) * env(len(t), 0.02, 0.08)
        v = reso(v, 1200, 4) + reso(v, 2600, 5) * 0.5
        place(y, v, at); at += d
    return reverb(dist(y * 0.6, 2) * 0.6, 2.0, 0.5)
def phone_text():
    y = np.zeros(int(1.0 * SR))
    for k, f in enumerate((1318, 1760)):
        t = t_(0.12); place(y, np.sin(2 * np.pi * f * t) * env(len(t), 0.005, 0.08) * 0.6, k * 0.14)
    vib = signal.square(2 * np.pi * 180 * t_(0.5)) * 0.15 * env(int(0.5 * SR), 0.02, 0.1)
    place(y, lp(vib, 400), 0.35)
    return y
def efan(d=8.0):
    """an old stand fan on high: motor hum, the blades chopping air (3 blades at ~19 rev/s), a loose cage rattling now and then"""
    t = t_(d)
    motor = np.sin(2 * np.pi * 60 * t) * 0.12 + np.sin(2 * np.pi * 120 * t) * 0.06 + np.sin(2 * np.pi * 180 * t) * 0.02
    air = lp(noise(d), 1400) * 0.55 + bp(noise(d), 300, 2200) * 0.25
    chop = 0.75 + 0.25 * np.sin(2 * np.pi * 57 * t)              # blade pass frequency
    wob = 0.9 + 0.1 * np.sin(2 * np.pi * 0.31 * t)                # slow oscillation of the head
    y = (motor + air * chop) * wob
    for _ in range(5):                                          # the cage ticks against the guard
        place(y, metal_hit(rng.uniform(2600, 3400), 0.04, damp=0.01) * 0.12, rng.uniform(0.2, d - 0.3))
    return loopify(np.stack([y, np.roll(y, 300) * 0.96], 1), 0.6)
def efan_click():
    """the fan's piano-key switch: a plastic clack, then the motor starting / dying"""
    y = np.zeros(int(0.9 * SR)); place(y, metal_hit(1800, 0.05, damp=0.02) * 0.9, 0.0); place(y, lp(noise(0.06), 3000) * env(int(0.06 * SR), 0.001, 0.03) * 0.6, 0.0)
    t = t_(0.8); place(y, (np.sin(2 * np.pi * (40 + 40 * t) * t) * 0.15 * env(len(t), 0.05, 0.4)), 0.05)
    return y
def yawn():
    """you, worn out: a long breathy yawn"""
    d = 2.2; t = t_(d); f0 = 180 + 60 * np.sin(np.pi * t / d)
    v = bp(noise(d), 300, 1600) * 0.5 + np.sin(2 * np.pi * np.cumsum(f0) / SR) * 0.12
    return reverb(v * env(len(t), 0.4, 0.9), 0.4, 0.1)
def fluorescent(d=10.0):
    t = t_(d); hum = (np.sin(2 * np.pi * 120 * t) * 0.2 + np.sin(2 * np.pi * 240 * t) * 0.1 + hp(noise(d), 6000) * 0.03)
    flick = np.ones(len(t))
    for _ in range(6):
        i = rng.integers(0, len(t) - 6000); flick[i:i + rng.integers(800, 5000)] = 0.1
        place(hum, metal_hit(3800, 0.05, damp=0.01) * 0.3, i / SR)
    return loopify(np.stack([hum * flick, hum * flick], 1), 0.5)
def clock_tick(d=8.0):
    y = np.zeros(int(d * SR))
    for k in range(int(d)):
        place(y, metal_hit(2600 if k % 2 else 2200, 0.08, damp=0.01) * 0.6, k + 0.0)
    return reverb(y, 0.8, 0.3)
def power_down():
    d = 2.5; t = t_(d); f = 120 * np.exp(-t * 1.4) + 20
    v = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9) * 0.6
    y = lp(v, 900); place(y, light_switch() * 1.5, 0)
    return reverb(y, 1.5, 0.3)
def bulb_flicker():
    """the light stuttering: two filament ticks with a short mains buzz, the second weaker"""
    d = 0.55; y = np.zeros(int(d * SR))
    for at, amp, ln in ((0.0, 1.0, 0.09), (0.17, 0.7, 0.06), (0.26, 0.45, 0.05)):
        t = t_(ln); bz = (signal.square(2 * np.pi * 120 * t) * 0.25 + np.sin(2 * np.pi * 240 * t) * 0.2 + hp(noise(ln), 3000) * 0.25) * env(len(t), 0.003, 0.02)
        place(y, bz * amp, at); place(y, metal_hit(4200, 0.03, damp=0.01) * 0.5 * amp, at)
    return reverb(y, 0.7, 0.2)
def breaker():
    d = 0.6; t = t_(d); y = np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.03) + hp(noise(d), 1500) * np.exp(-t / 0.01) * 1.2
    place(y, metal_hit(2000, 0.3, damp=0.03) * 0.4, 0)
    return reverb(y, 0.6, 0.25)
def cabinet_door(open_=True):
    c = creak(0.7, rate=(30, 90), res=(500, 1300, 2600)) * 0.7
    t = t_(0.3); thud = np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.03)
    y = np.zeros(int(1.1 * SR)); place(y, c, 0); place(y, thud, 0.72 if not open_ else 0.0)
    return reverb(y, 0.5, 0.2)
def plastic_crinkle(d=1.2):
    y = np.zeros(int(d * SR))
    for _ in range(int(d * 90)):
        place(y, hp(noise(0.01), 2500)[:int(0.01 * SR)] * rng.uniform(0.1, 1.0), rng.uniform(0, d - 0.02))
    return reverb(y * env(len(y), 0.05, 0.3), 0.4, 0.2)
def breath_hold():
    y = np.zeros(int(9.0 * SR)); place(y, breath(0.8, True, False) * 0.8, 0)
    t = t_(7.0); strain = bp(noise(7.0), 200, 900) * 0.05 * (t / 7.0) ** 2
    place(y, strain, 0.9); place(y, heartbeat(80, 7.0) * 0.6, 0.9)
    place(y, breath(0.6, False, True) * 1.4, 8.1)  # gasp
    return y
def distant_scream():
    v = scream_voice(2.0, 600, 420, ((900, 1), (1500, .6)), 0.3) * env(int(2.0 * SR), 0.2, 0.9)
    return reverb(lp(v, 1500) * 0.35, 3.0, 0.7)
def rain_heavy(d=30):
    n = int(d * SR)
    r = bp(noise(d), 400, 9000) * 0.35 + lp(noise(d), 250) * 0.3
    st = np.stack([r, bp(noise(d), 400, 9000) * 0.35 + lp(noise(d), 250) * 0.3], 1)
    for at in (7, 21):
        t = t_(4.0); th = lp(noise(4.0), 120) * np.exp(-t / 1.5) * 2.5
        place(st, pan(th, rng.uniform(-0.6, 0.6)), at)
    return loopify(st)
def kulambo_rustle():
    y = bp(noise(1.0), 1500, 7000) * env(int(SR), 0.1, 0.5) * (0.5 + 0.5 * np.sin(np.linspace(0, 12, SR)) ** 2)
    return y * 0.5

def baby_cry(d=3.2):
    """Tiyanak lure: a baby's cry, slightly wrong (pitch wobble, bit-crushed through TV static)."""
    y = np.zeros(int(d * SR)); at = 0.1
    for k in range(3):
        L = rng.uniform(0.7, 0.95); t = t_(L)
        f = 430 + 120 * np.sin(np.pi * t / L) + 25 * np.sin(2 * np.pi * 9 * t)
        ph = 2 * np.pi * np.cumsum(f) / SR
        v = (signal.sawtooth(ph) * 0.6 + np.sin(2 * ph) * 0.3) * env(len(t), 0.05, 0.25)
        v = reso(v, 1100, 4) + reso(v, 2400, 5) * 0.6 + reso(v, 3600, 6) * 0.3
        place(y, v, at); at += L + rng.uniform(0.15, 0.3)
    y = crush(lp(y, 4500) * 0.7, 6, 3) + hp(noise(d), 1500) * 0.03
    return reverb(y, 1.0, 0.35)

# ---------------------------------------------------------------- pack 3: player actions
def fabric_swish(d=0.8, lo=600, hi=5000):
    n = int(d * SR); x = bp(noise(d), lo, hi)
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.3
    flutter = 0.6 + 0.4 * np.abs(np.sin(np.linspace(0, d * 38, n)))
    return x * e * flutter
def latch_click(d=0.25):
    t = t_(d); return metal_hit(2900, d, damp=0.02) * 0.6 + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.015) * 0.5
def door_open_slow():
    y = np.zeros(int(2.6 * SR)); place(y, latch_click() * 0.8, 0.0)
    place(y, creak(2.0, f0=700, rate=(10, 45), res=(260, 700, 1500)) * 0.9, 0.18)
    place(y, bp(noise(1.8), 80, 400) * env(int(1.8 * SR), 0.4, 0.8) * 0.15, 0.3)  # air moving
    return reverb(y, 1.0, 0.3)
def door_close_shut():
    y = np.zeros(int(2.0 * SR))
    place(y, creak(0.6, rate=(30, 80), res=(300, 820, 1700)) * 0.6, 0.0)
    t = t_(0.9); thud = np.sin(2 * np.pi * 60 * t) * np.exp(-t / 0.09) * 1.1 + bp(noise(0.9), 120, 1500) * np.exp(-t / 0.04)
    place(y, dist(thud, 2), 0.5); place(y, latch_click() * 0.9, 0.56)
    return reverb(y, 1.1, 0.3)
def door_push_strain():
    """Body against the door: wood groaning under load, hands on the frame. Loop-friendly 4 s."""
    d = 4.0; y = creak(d, rate=(6, 22), res=(180, 520, 1200)) * 0.8
    y += bp(noise(d), 60, 300) * 0.25 * (0.6 + 0.4 * np.sin(np.linspace(0, 9, int(d * SR))))
    return loopify(reverb(y, 0.6, 0.2), 0.6)
def curtain_open_pull():
    y = np.zeros(int(1.6 * SR))
    for k in range(7): place(y, metal_hit(rng.uniform(2700, 3400), 0.25, damp=0.04) * 0.45, 0.05 + k * 0.07 + rng.uniform(0, 0.02))
    place(y, fabric_swish(0.9, 500, 6000) * 0.9, 0.0)
    place(y, lp(noise(1.2), 300) * env(int(1.2 * SR), 0.05, 0.9) * 0.25, 0.2)  # night air rushing in
    return reverb(y, 0.8, 0.25)
def curtain_close_pull():
    y = np.zeros(int(1.4 * SR))
    place(y, fabric_swish(0.7, 700, 6500) * 1.0, 0.0)
    for k in range(6): place(y, metal_hit(rng.uniform(2500, 3100), 0.25, damp=0.04) * 0.5, 0.12 + k * 0.06 + rng.uniform(0, 0.02))
    t = t_(0.3); place(y, bp(noise(0.3), 200, 1200) * np.exp(-t / 0.05) * 0.6, 0.55)  # fabric slaps the frame
    return reverb(y, 0.7, 0.22)
def curtain_grip():
    """Fists bunched in the curtain, fabric strained. Loop 4 s."""
    d = 4.0; n = int(d * SR)
    y = bp(noise(d), 800, 5000) * 0.25 * (0.5 + 0.5 * np.abs(np.sin(np.linspace(0, 14, n))) ** 3)
    for k in range(5): place(y, metal_hit(rng.uniform(2800, 3200), 0.2, damp=0.03) * 0.12, rng.uniform(0.2, d - 0.3))
    return loopify(reverb(y, 0.5, 0.2), 0.6)
def hide_bed():
    """Drop to the floor, slide under the bed: knees thump, cloth drags on wood, bed slats creak."""
    y = np.zeros(int(2.2 * SR)); t = t_(0.4)
    knee = np.sin(2 * np.pi * 85 * t) * np.exp(-t / 0.05)
    place(y, knee * 0.9, 0.0); place(y, knee * 0.7, 0.18)
    drag = bp(noise(1.1), 250, 2200) * env(int(1.1 * SR), 0.1, 0.4) * (0.5 + 0.5 * np.sin(np.linspace(0, 20, int(1.1 * SR))) ** 2)
    place(y, drag * 0.8, 0.3)
    place(y, creak(0.7, rate=(25, 70), res=(380, 950, 2100)) * 0.35, 0.9)
    place(y, kulambo_rustle() * 0.6, 0.35)
    return reverb(y, 0.6, 0.2)
def unhide_bed():
    y = np.zeros(int(1.8 * SR))
    drag = bp(noise(0.9), 250, 2400) * env(int(0.9 * SR), 0.1, 0.3)
    place(y, drag * 0.7, 0.0); place(y, creak(0.5, rate=(30, 80), res=(380, 950, 2100)) * 0.3, 0.1)
    t = t_(0.3); place(y, np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.05) * 0.5, 0.9)
    return reverb(y, 0.6, 0.2)
def hide_cabinet():
    y = np.zeros(int(2.0 * SR))
    place(y, cabinet_door(True) * 0.8, 0.0)
    t = t_(0.5); place(y, np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.06) * 0.6, 0.45)  # knees on plywood
    place(y, bp(noise(0.6), 400, 3000) * env(int(0.6 * SR), 0.05, 0.3) * 0.4, 0.5)
    for k in range(4): place(y, metal_hit(rng.uniform(1500, 2400), 0.2, damp=0.04) * 0.15, 0.55 + k * 0.05)  # pots shift
    place(y, cabinet_door(False) * 0.7, 0.95)
    return reverb(y, 0.4, 0.15)
def hide_sofa():
    y = np.zeros(int(1.6 * SR))
    t = t_(0.5); place(y, lp(noise(0.5), 400) * np.exp(-t / 0.08) * 0.8, 0.0)  # cushion thump
    place(y, plastic_crinkle(1.0) * 0.8, 0.15)
    return y
def turn_whoosh():
    d = 0.5; n = int(d * SR); y = bp(noise(d), 200, 1500) * np.sin(np.linspace(0, np.pi, n)) ** 2
    return y * 0.6 + fabric_swish(0.5, 1500, 6000) * 0.3
def run_pant(d=4.0):
    """Ragged panting while running (loopable)."""
    y = np.zeros(int(d * SR)); at = 0.0
    while at < d - 0.4:
        place(y, breath(0.28, True, False) * 0.7, at); place(y, breath(0.3, False, True) * 0.9, at + 0.3); at += rng.uniform(0.6, 0.72)
    return loopify(lp(y, 5000), 0.4)
def nervous_breath(d=6.0):
    y = np.zeros(int(d * SR)); at = 0.1
    while at < d - 1.4:
        place(y, breath(0.9, True, False) * 0.5, at); place(y, breath(1.1, False, False) * 0.4, at + 1.0); at += rng.uniform(2.2, 2.8)
    return loopify(y, 0.6)
def floor_creak():
    return reverb(creak(0.6, rate=(20, 50), res=(250, 600, 1400)) * 0.7, 0.8, 0.25)
def steps_run_cement():
    return footsteps(12, 0.28, 'cement', True)
def flashlight_on():
    d = 0.35; t = t_(d); y = flashlight_click() 
    z = np.zeros(int(d * SR)); place(z, y, 0); z += np.sin(2 * np.pi * 15000 * t) * 0.01 * (t > 0.03)
    return z
def salt_throw():
    y = np.zeros(int(1.4 * SR))
    place(y, fabric_swish(0.3, 1500, 7000) * 0.6, 0.0)
    for _ in range(260): place(y, hp(noise(0.006), 3500)[:int(0.006 * SR)] * rng.uniform(0.05, 0.6), 0.25 + rng.exponential(0.18))
    return reverb(y, 0.5, 0.2)
def tv_click_off():
    d = 0.9; t = t_(d)
    y = light_switch() 
    z = np.zeros(int(d * SR)); place(z, y, 0)
    z += np.sin(2 * np.pi * 15734 * t) * 0.05 * np.exp(-t / 0.3) + lp(noise(d), 200) * np.exp(-t / 0.08) * 0.4
    return z

# ---------------------------------------------------------------- pack 4: phone call
def ringtone(d=6.0):
    """Cheap feature-phone ring: original square-wave motif, buzz of the vibrate motor under it."""
    y = np.zeros(int(d * SR)); notes = [988, 1319, 988, 1175, 988, 1319, 1480, 1319]
    def tone(f, L):
        t = t_(L); return signal.square(2 * np.pi * f * t, 0.35) * 0.35 * env(len(t), 0.005, 0.02)
    at = 0.0
    while at < d - 1.4:
        for k, f in enumerate(notes): place(y, tone(f, 0.11), at + k * 0.13)
        at += 2.0
    t = t_(d); buzz = signal.sawtooth(2 * np.pi * 180 * t) * 0.08 * ((np.sin(2 * np.pi * 0.5 * t) > 0) * 1.0)
    y = lp(y, 5000) + lp(buzz, 900)
    return reverb(y, 0.4, 0.15)
def phone_pickup():
    d = 0.8; t = t_(d); y = metal_hit(3000, 0.2, damp=0.01) * 0.5
    z = np.zeros(int(d * SR)); place(z, y, 0); z += bp(noise(d), 300, 3400) * 0.08 * (t > 0.08) * np.exp(-(t - 0.08).clip(0) / 0.5)
    return z
def phone_hangup():
    d = 1.6; y = np.zeros(int(d * SR)); t = t_(0.2)
    for k in range(3): place(y, np.sin(2 * np.pi * 425 * t) * 0.5 * env(len(t), 0.005, 0.02), 0.1 + k * 0.45)
    return y
def line_static(d=8.0):
    n = int(d * SR); y = bp(noise(d), 300, 3400) * 0.12
    cr = np.zeros(n)
    for _ in range(int(d * 6)): place(cr, hp(noise(0.02), 1500) * rng.uniform(0.1, 0.6), rng.uniform(0, d - 0.05))
    return loopify(y + cr * 0.3, 0.5)

# ---------------------------------------------------------------- pack 5: chapter 1 + single synced footsteps + menu theme
def step_one(surface='wood', run=False, room=0.25, seed=0):
    global rng
    r0 = rng; rng = np.random.default_rng(seed)
    y = step_surface(0.3, surface, 1.35 if run else 1.0) * (0.9 if run else 0.75)
    rng = r0
    return reverb(y, 0.35 + room, 0.12 + room * 0.3)
def wing_flap(n=5, far=False):
    d = n * 0.32 + 0.6; y = np.zeros(int(d * SR))
    for i in range(n):
        L = 0.22; t = t_(L)
        w = bp(noise(L), 120 if far else 90, 900 if far else 1800) * np.sin(np.pi * t / L) ** 2
        w += lp(noise(L), 120) * np.exp(-t / 0.05) * 0.8
        place(y, w * rng.uniform(0.7, 1.0), i * 0.32 + rng.uniform(-0.02, 0.02))
    y = lp(y, 900) if far else y
    return reverb(y, 1.4 if far else 0.7, 0.35 if far else 0.2)
def wind_gust():
    d = 3.2; n = int(d * SR); t = t_(d)
    y = bp(noise(d), 200, 1600) * np.sin(np.pi * t / d) ** 1.5 * (0.7 + 0.3 * np.sin(2 * np.pi * 1.3 * t))
    z = np.zeros(n); place(z, curtain_open_pull() * 0.45, 0.9)
    return y * 0.8 + z
def beetles(d=6.0):
    """Many small legs on wood inside the aparador (loop)."""
    n = int(d * SR); y = np.zeros(n)
    for _ in range(int(d * 260)):
        L = 0.004; c = hp(noise(L), 2500)[:int(L * SR)] * rng.uniform(0.05, 0.35)
        place(y, c, rng.uniform(0, d - 0.01))
    y = bp(y, 1500, 9000) + lp(noise(d), 300) * 0.04
    return loopify(reverb(y, 0.25, 0.15), 0.4)
def beetle_scatter():
    d = 1.4; y = np.zeros(int(d * SR))
    for _ in range(420):
        L = 0.004; place(y, hp(noise(L), 2500)[:int(L * SR)] * rng.uniform(0.1, 0.5), rng.exponential(0.35))
    y = bp(y, 1500, 9000) * env(len(y), 0.01, 0.8)
    return reverb(y, 0.3, 0.15)
def aparador_creak():
    return reverb(creak(1.6, f0=520, rate=(6, 26), res=(200, 600, 1300)) * 0.9, 0.6, 0.25)
def kumot_breath(d=6.0):
    """Slow wet breathing right behind the door (loop)."""
    y = np.zeros(int(d * SR)); at = 0.0
    while at < d - 2.2:
        place(y, breath(1.2, True, True) * 0.8, at); place(y, breath(1.5, False, True) * 0.9, at + 1.3); at += rng.uniform(2.7, 3.1)
    return loopify(lp(y, 2400), 0.5)
def theme_menu(d=72.0):
    """Original menu theme: a detuned toy-piano lullaby in A minor over a low drone, tape wobble, distant choir swells."""
    n = int(d * SR); t = np.arange(n) / SR
    wob = 1 + 0.004 * np.sin(2 * np.pi * 0.35 * t) + 0.002 * np.sin(2 * np.pi * 2.1 * t)
    drone = (np.sin(2 * np.pi * 55 * np.cumsum(wob) / SR) * 0.18 + np.sin(2 * np.pi * 82.4 * np.cumsum(wob) / SR) * 0.08)
    drone *= 0.6 + 0.4 * np.sin(2 * np.pi * t / 16) ** 2
    y = drone.copy()
    # melody (original): note numbers relative to A4=440, one note per 0.75 s, phrases with rests (None)
    mel = [0, 3, 7, 5, 3, None, 2, 3, 0, None, -2, 0, 3, 2, None, None,
           0, 3, 7, 8, 7, None, 5, 3, 2, None, 3, 2, -2, 0, None, None,
           12, 10, 8, 7, None, 5, 7, 3, None, 2, 0, -2, -5, None, -4, -5]
    def toy(f, L=1.6):
        tt = t_(L); ph = 2 * np.pi * f * tt * (1 + 0.003 * np.sin(2 * np.pi * 5 * tt))
        x = (np.sin(ph) + 0.35 * np.sin(2.01 * ph) + 0.15 * np.sin(4.2 * ph) + 0.08 * np.sin(6.9 * ph)) * np.exp(-tt / 0.55)
        return x * 0.22
    beat = 0.75; at = 2.0; i = 0
    while at < d - 3:
        m = mel[i % len(mel)]
        if m is not None:
            f = 440 * 2 ** (m / 12) * 0.5 * (1 + rng.uniform(-0.004, 0.004))
            place(y, toy(f) * rng.uniform(0.75, 1.0), at)
            if i % 4 == 0: place(y, toy(f / 2, 2.2) * 0.4, at)
        at += beat * (1.0 + (0.25 if i % 16 == 15 else 0)); i += 1
    # choir swells (formant-filtered noise chords), every ~18 s
    for c0 in np.arange(6, d - 8, 18):
        L = 7.0; tt = t_(L); sw = np.sin(np.pi * tt / L) ** 2
        ch = sum(np.sin(2 * np.pi * f * tt) for f in (220, 261.6, 329.6)) * 0.05
        ch = bp(ch + bp(noise(L), 400, 1200) * 0.08, 200, 2200) * sw
        place(y, ch, c0)
    y = reverb(y, 3.5, 0.45)
    y = lp(y, 7000)
    return loopify(y * 0.8, 2.0)

if __name__ == '__main__':
    jobs = {
        'amb_house': (amb_house, 0.7), 'amb_garden': (amb_garden, 0.6), 'amb_menu': (amb_menu, 0.7),
        'door_creak': (door_creak, 0.8), 'door_slam': (door_slam, 0.95), 'handle_rattle': (handle_rattle, 0.85),
        'scuffs_far': (lambda: scuffs(4, 1.2, True), 0.5), 'scuffs_near': (lambda: scuffs(4, 1.0, False), 0.8),
        'wheeze': (wheeze, 0.8), 'lullaby_hum': (lullaby_hum, 0.6), 'heartbeat': (heartbeat, 0.9),
        'tv_static': (tv_static, 0.5), 'static_swell': (static_swell, 0.7), 'vhs_glitch': (vhs_glitch, 0.7), 'giggle': (giggle, 0.7),
        'clinks': (clinks, 0.7), 'sniff': (sniff, 0.6), 'knife_taps': (knife_taps, 0.7), 'nail_taps': (nail_taps, 0.6),
        'whisper': (whisper, 0.6), 'glass_shatter': (glass_shatter, 0.9), 'bell_6am': (bell6, 0.85),
        'light_switch': (light_switch, 0.7), 'bulb_flicker': (bulb_flicker, 0.6), 'flashlight_click': (flashlight_click, 0.6), 'curtain_rings': (curtain_rings, 0.7),
        'jumpscare_kumot': (lambda: jumpscare2('kumot'), 0.98), 'jumpscare_malikmata': (lambda: jumpscare2('malikmata'), 0.98),
        'jumpscare_kalansing': (lambda: jumpscare2('kalansing'), 0.98), 'jumpscare_silip': (lambda: jumpscare2('silip'), 0.98),
        'jumpscare_barang': (lambda: jumpscare2('barang'), 0.98),
        'steps_walk_wood': (lambda: footsteps(8, 0.55, 'wood'), 0.8), 'steps_run_wood': (lambda: footsteps(12, 0.3, 'wood', True), 0.9),
        'steps_walk_cement': (lambda: footsteps(8, 0.55, 'cement'), 0.8), 'tuko_gecko': (tuko, 0.75), 'dog_howl': (dog_howl, 0.7),
        'tricycle_far': (tricycle_far, 0.5), 'rooster_dawn': (rooster, 0.8), 'phone_text': (phone_text, 0.7),
        'fluorescent_hum': (fluorescent, 0.5), 'efan': (efan, 0.55), 'efan_click': (efan_click, 0.7), 'yawn': (yawn, 0.6), 'clock_tick': (clock_tick, 0.6), 'power_down': (power_down, 0.85),
        'breaker': (breaker, 0.85), 'cabinet_open': (lambda: cabinet_door(True), 0.75), 'cabinet_close': (lambda: cabinet_door(False), 0.8),
        'plastic_crinkle': (plastic_crinkle, 0.6), 'breath_hold_gasp': (breath_hold, 0.85), 'distant_scream': (distant_scream, 0.6),
        'rain_heavy': (rain_heavy, 0.75),
        'wing_flap': (lambda: wing_flap(5, False), 0.7), 'wing_flap_far': (lambda: wing_flap(4, True), 0.5), 'wind_gust': (wind_gust, 0.7),
        'beetles': (beetles, 0.5), 'beetle_scatter': (beetle_scatter, 0.7), 'aparador_creak': (aparador_creak, 0.7), 'kumot_breath': (kumot_breath, 0.95),
        'theme_menu': (theme_menu, 0.6),
        'step_w1': (lambda: step_one('wood', False, 0.25, 1), 0.55), 'step_w2': (lambda: step_one('wood', False, 0.25, 2), 0.55), 'step_w3': (lambda: step_one('wood', False, 0.25, 3), 0.55),
        'step_c1': (lambda: step_one('cement', False, 0.35, 4), 0.55), 'step_c2': (lambda: step_one('cement', False, 0.35, 5), 0.55), 'step_c3': (lambda: step_one('cement', False, 0.35, 6), 0.55),
        'ringtone': (ringtone, 0.7), 'phone_pickup': (phone_pickup, 0.6), 'phone_hangup': (phone_hangup, 0.6), 'line_static': (line_static, 0.4),
        'door_open_slow': (door_open_slow, 0.85), 'door_close_shut': (door_close_shut, 0.95), 'door_push_strain': (door_push_strain, 0.6),
        'curtain_open_pull': (curtain_open_pull, 0.8), 'curtain_close_pull': (curtain_close_pull, 0.85), 'curtain_grip': (curtain_grip, 0.5),
        'hide_bed': (hide_bed, 0.85), 'unhide_bed': (unhide_bed, 0.75), 'hide_cabinet': (hide_cabinet, 0.8), 'hide_sofa': (hide_sofa, 0.7),
        'turn_whoosh': (turn_whoosh, 0.5), 'run_pant': (run_pant, 0.6), 'nervous_breath': (nervous_breath, 0.45), 'floor_creak': (floor_creak, 0.6),
        'steps_run_cement': (steps_run_cement, 0.9), 'flashlight_on': (flashlight_on, 0.6), 'salt_throw': (salt_throw, 0.7), 'tv_click_off': (tv_click_off, 0.7), 'kulambo_rustle': (kulambo_rustle, 0.6), 'baby_cry': (baby_cry, 0.6),
    }
    import sys as _s
    if len(_s.argv) > 1:
        jobs = {k: v for k, v in jobs.items() if k in _s.argv[1:]}
    for name, (fn, pk) in jobs.items():
        save(name, fn(), pk); print('ok', name)
