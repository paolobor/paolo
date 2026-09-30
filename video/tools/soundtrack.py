"""Banda sonora sintetizada (129 BPM, re menor) sincronizada con los cortes del montaje.
Salida: assets/audio/soundtrack.wav (48 kHz, estéreo).
Los tiempos se expresan en pulsos (beats); b(n) = n * 60 / 129 segundos, igual que en src/main.js."""
import os
import numpy as np
from scipy import signal

SR = 48000
BPM = 129
B = 60 / BPM
TOTAL = 120 * B + 0.6
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(42)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'audio')
os.makedirs(OUT, exist_ok=True)


def b(n):
    return n * B


def buf():
    return np.zeros((N, 2), np.float32)


def put(dst, x, t, gain=1.0, pan=0.0):
    """Suma la señal x (mono o estéreo) en el instante t (s)."""
    i = int(round(t * SR))
    if i >= N:
        return
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l * 1.414, x * r * 1.414], -1)
    j = min(N, i + len(x))
    if i < 0:
        x = x[-i:]; i = 0
    dst[i:j] += x[: j - i] * gain


def env(n, a=0.002, d=0.2, s=0.0, sus=0.0, r=0.05):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-6), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-6)))
    if sus > 0:
        e = e * (t < sus) + (t >= sus) * e * np.exp(-(t - sus) / max(r, 1e-6))
    return e.astype(np.float32)


def lp(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR / 2 * 0.95), 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0).astype(np.float32)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0).astype(np.float32)


def bp(x, f0, f1, order=2):
    sos = signal.butter(order, [f0, f1], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0).astype(np.float32)


def noise(n):
    return rng.standard_normal(n).astype(np.float32)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def saw(f, n, detune=0.0, phase=None):
    t = np.arange(n) / SR
    ph = rng.random() if phase is None else phase
    return signal.sawtooth(2 * np.pi * f * (1 + detune) * t + ph * 2 * np.pi).astype(np.float32)


# ------------------------------------------------------------------ instrumentos
def kick(dur=0.45, f0=150, f1=44, punch=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / 0.16) + 0.4 * np.tanh(3 * np.sin(ph)) * np.exp(-t / 0.05)
    click = hp(noise(n), 3000) * np.exp(-t / 0.003) * 0.25 * punch
    return np.tanh((x + click) * 1.4).astype(np.float32)


def clap(dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    e = sum(np.exp(-np.clip(t - d, 0, None) / 0.006) * (t >= d) for d in (0, 0.009, 0.019)) + 0.6 * np.exp(-t / 0.09)
    return (bp(noise(n), 900, 5000) * e * 0.5).astype(np.float32)


def hat(dur=0.06, open_=False):
    n = int((0.3 if open_ else dur) * SR); t = np.arange(n) / SR
    return (hp(noise(n), 7000, 4) * np.exp(-t / (0.09 if open_ else 0.018)) * 0.35).astype(np.float32)


def crash(dur=2.5):
    n = int(dur * SR); t = np.arange(n) / SR
    x = hp(noise(n), 4500, 2) * np.exp(-t / 0.9) * 0.35
    return np.stack([x, np.roll(x, 211)], -1).astype(np.float32)


def impact(dur=3.0, big=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 32 + 70 * np.exp(-t / 0.08)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.7 * big))
    body = lp(noise(n), 900) * np.exp(-t / 0.25) * 0.8
    crack = hp(noise(n), 2500) * np.exp(-t / 0.02) * 0.5
    x = np.tanh((boom * 1.6 + body + crack) * 1.2) * 0.9
    return x.astype(np.float32)


def riser(dur, f0=300, f1=6000, tonal=True):
    n = int(dur * SR); t = np.arange(n) / SR; u = t / dur
    nz = noise(n)
    # barrido de paso banda por bloques
    out = np.zeros(n, np.float32); blk = 2048
    for i in range(0, n, blk):
        fc = f0 * (f1 / f0) ** (i / n)
        seg = bp(nz[max(0, i - 512):i + blk], fc * 0.7, min(fc * 1.4, SR / 2 * 0.9))
        out[i:i + blk] = seg[-len(out[i:i + blk]):]
    x = out * (u ** 2) * 0.8
    if tonal:
        f = 110 * 2 ** (u * 3)
        x += 0.18 * np.sin(2 * np.pi * np.cumsum(f) / SR) * u ** 1.5
        x += 0.1 * signal.sawtooth(2 * np.pi * np.cumsum(f * 1.5) / SR) * u ** 2
    return x.astype(np.float32)


def whoosh(dur=0.5, up=True):
    n = int(dur * SR); t = np.arange(n) / SR; u = t / dur
    nz = noise(n); out = np.zeros(n, np.float32); blk = 1024
    for i in range(0, n, blk):
        v = i / n
        fc = 400 * 12 ** (v if up else 1 - v) if True else 0
        seg = bp(nz[max(0, i - 512):i + blk], fc * 0.6, min(fc * 1.8, 20000))
        out[i:i + blk] = seg[-len(out[i:i + blk]):]
    e = np.sin(np.pi * u) ** 2
    x = out * e * 1.2
    pan = np.clip(u * 2 - 1, -1, 1)
    L = x * np.cos((pan + 1) * np.pi / 4) * 1.414; R = x * np.sin((pan + 1) * np.pi / 4) * 1.414
    return np.stack([L, R], -1).astype(np.float32)


def glitch(dur=0.28, seed=0):
    r = np.random.default_rng(seed)
    n = int(dur * SR); x = np.zeros(n, np.float32); i = 0
    while i < n:
        L = int(r.uniform(0.008, 0.04) * SR)
        kind = r.integers(0, 4)
        t = np.arange(L) / SR
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * r.uniform(200, 2400) * t))
        elif kind == 1:
            s = np.round(noise(L) * 3) / 3
        elif kind == 2:
            s = signal.sawtooth(2 * np.pi * r.uniform(60, 400) * t)
        else:
            s = np.zeros(L)
        s = s * r.uniform(0.3, 1.0)
        x[i:i + L] = s[: len(x[i:i + L])]
        i += L
    x = lp(x, 9000) * np.linspace(1, 0.3, n)
    return (x * 0.35).astype(np.float32)


def ping(f, dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (d)) for m, a, d in ((1, 1, 0.5), (2.01, 0.4, 0.25), (3.02, 0.2, 0.12), (4.1, 0.1, 0.07)))
    return (x * np.minimum(1, t / 0.002) * 0.35).astype(np.float32)


def pluck(f, dur=0.35, bright=3000):
    n = int(dur * SR); t = np.arange(n) / SR
    x = saw(f, n, phase=0) + 0.6 * saw(f, n, 0.006, 0.3)
    x = lp(x * np.exp(-t / 0.12), bright)
    return (x * 0.18).astype(np.float32)


def reverb(x, dur=2.2, mix=0.25, pre=0.02):
    n = int(dur * SR); t = np.arange(n) / SR
    irL = noise(n) * np.exp(-t / (dur / 6.9)); irR = noise(n) * np.exp(-t / (dur / 6.9))
    irL = lp(irL, 6000); irR = lp(irR, 6000)
    irL /= np.sqrt((irL ** 2).sum()); irR /= np.sqrt((irR ** 2).sum())
    p = int(pre * SR)
    wl = signal.fftconvolve(x[:, 0], irL)[:N]; wr = signal.fftconvolve(x[:, 1], irR)[:N]
    wet = np.zeros_like(x); wet[p:, 0] = wl[: N - p]; wet[p:, 1] = wr[: N - p]
    return (x * (1 - mix) + wet * mix * 1.6).astype(np.float32)


# ------------------------------------------------------------------ estructura
# acordes (re menor): Dm - Bb - F - C, 8 pulsos cada uno
CH = [[50, 53, 57], [46, 50, 53], [41, 45, 48], [48, 52, 55]]
ROOT = [38, 34, 41, 36]


def chord_at(beat):
    return int(np.floor(max(beat - 12, 0) / 8)) % 4


drums, bass, pad, arp, sfx, hits = buf(), buf(), buf(), buf(), buf(), buf()

# secciones con ritmo completo (pulsos)
GROOVE = [(12, 46), (49, 54), (58, 78), (82, 100), (103, 106)]
HALF = [(78, 82)]
KICK_ONLY = [(100, 103)]
HEART = [(8, 12)]


def in_(beat, secs):
    return any(a <= beat < c for a, c in secs)


kicks = []
for beat in range(0, 120):
    if in_(beat, GROOVE) or in_(beat, KICK_ONLY):
        put(drums, kick(), b(beat), 0.95); kicks.append(b(beat))
    elif in_(beat, HALF) and beat % 2 == 0:
        put(drums, kick(0.6, 120, 40), b(beat), 0.9); kicks.append(b(beat))
    elif in_(beat, HEART):
        put(drums, kick(0.5, 90, 38, 0.3), b(beat), 0.75)
        put(drums, kick(0.4, 90, 38, 0.3), b(beat) + 0.16, 0.45)
    if in_(beat, GROOVE):
        if beat % 2 == 1:
            put(drums, clap(), b(beat), 0.55, 0.05)
        for s16 in range(4):
            acc = 1.0 if s16 == 2 else 0.55
            put(drums, hat(), b(beat + s16 / 4), 0.62 * acc, 0.25 if s16 % 2 else -0.2)
        if beat % 4 == 3:
            put(drums, hat(open_=True), b(beat + 0.5), 0.35, 0.3)
    if in_(beat, HALF):
        put(drums, hat(), b(beat + 0.5), 0.35, 0.2)
        if beat % 2 == 1:
            put(drums, clap(0.5), b(beat), 0.5)
# intro: tictac tenue de 8vas
for i in range(0, 14):
    put(drums, hat(0.03), b(i * 0.5), 0.12 + 0.1 * (i % 2), 0.4 if i % 2 else -0.4)
# redobles de caja antes de los estallidos
for a, c in [(10, 12), (44, 46), (56, 58), (104.5, 106)]:
    k = int((c - a) * 4)
    for i in range(k):
        u = i / k
        put(drums, clap(0.15), b(a + i / 4), 0.15 + 0.45 * u)

# bajo: 8vas en sección de ritmo, sub largo en intro/rupturas
for beat8 in np.arange(0, 120, 0.5):
    ci = chord_at(beat8)
    f = hz(ROOT[ci])
    if in_(beat8, GROOVE) or in_(beat8, HEART):
        n = int(b(0.5) * SR); t = np.arange(n) / SR
        x = saw(f, n, phase=0) * 0.6 + np.sin(2 * np.pi * f * t) * 0.8
        x = lp(x, 380 if beat8 % 1 else 250) * env(n, 0.004, 0.18, 0.4, b(0.42), 0.02)
        put(bass, x, b(beat8), 0.55 if in_(beat8, GROOVE) else 0.35)
for a, c, midi in [(0, 7, 26), (54, 58, 26), (78, 82, 29), (106, 120, 26)]:
    n = int(b(c - a) * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * hz(midi) * t) * 0.7 + 0.2 * np.sin(2 * np.pi * hz(midi) * 2 * t)
    x *= np.minimum(1, t / 0.8) * np.minimum(1, (t[-1] - t) / 0.5)
    put(bass, x.astype(np.float32), b(a), 0.35)

# pad: acordes con sierras desafinadas
for a, c in [(0, 7), (8, 46), (49, 120)]:
    beat = a
    while beat < c:
        seg_end = min(c, (np.floor((beat - 12) / 8) + 1) * 8 + 12 if beat >= 12 else 12)
        seg_end = min(seg_end, c)
        ci = chord_at(beat) if beat >= 12 else 0
        n = int(b(seg_end - beat) * SR)
        if n > 0:
            x = np.zeros(n, np.float32)
            for m in CH[ci]:
                for dt in (-0.004, 0.0, 0.005):
                    x += saw(hz(m + 12), n, dt) * 0.08
            t = np.arange(n) / SR
            x = lp(x, 1400 if beat >= 12 else 700) * np.minimum(1, t / 0.25) * np.minimum(1, (t[-1] - t) / 0.12 + 0.02)
            st = np.stack([x, np.roll(x, 480)], -1)
            put(pad, st, b(beat), 0.55 if beat >= 12 else 0.4)
        beat = seg_end

# arpegio de 16avos en las secciones de ritmo (desde 16)
for beat16 in np.arange(16, 106, 0.25):
    if not in_(beat16, [(16, 46), (49, 54), (58, 78), (82, 100), (103, 106)]):
        continue
    ci = chord_at(beat16)
    notes = CH[ci] + [CH[ci][0] + 12]
    step = int(round(beat16 * 4))
    m = notes[[0, 1, 2, 3, 2, 1, 3, 2][step % 8]] + 12
    put(arp, pluck(hz(m), 0.3, 2400 + 1500 * ((step % 16) / 16)), b(beat16), 0.5, 0.35 * np.sin(step * 0.7))

# ------------------------------------------------------------------ efectos sincronizados
put(sfx, riser(b(3)), b(4), 0.45)
put(sfx, riser(b(2), 400, 8000), b(10), 0.55)
put(sfx, riser(b(2), 400, 9000), b(44), 0.5)
put(sfx, riser(b(4), 200, 7000), b(54), 0.5)
put(sfx, riser(b(3), 300, 9000), b(103), 0.5)
# succión inversa hacia el negro
rv = impact(1.2)[::-1] * np.linspace(0, 1, int(1.2 * SR)) ** 2
put(sfx, rv[-int(b(1) * SR):].astype(np.float32), b(7), 0.35)

for t0, big, g in [(b(12), 1.4, 1.0), (b(49), 1.0, 0.8), (b(58), 0.8, 0.5), (b(78), 1.2, 0.8), (b(100), 1.0, 0.8), (b(103), 1.3, 0.95), (b(106), 1.8, 1.0)]:
    put(hits, impact(3.5, big), t0, g)
    put(hits, crash(), t0, 0.5 * g)
# PROGRAMAR / INTEGRAR / EXPERIMENTAR: golpes secos con acorde
for i, beat in enumerate((46, 47, 48)):
    put(hits, impact(1.2, 0.6), b(beat), 0.85)
    put(hits, kick(0.5, 180, 45), b(beat), 0.9)
    n = int(0.4 * SR); t = np.arange(n) / SR
    st = sum(saw(hz(m + 12 + i * 2), n, 0.004) for m in CH[0]) * np.exp(-t / 0.12) * 0.12
    put(hits, lp(st.astype(np.float32), 3000), b(beat), 0.9)
    put(sfx, glitch(0.22, 100 + i), b(beat), 0.7)
# cierre: «TRAED A VUESTROS ALUMNOS.» y «OS ESPERAMOS.»
put(hits, kick(0.5, 160, 45), b(106) + 0.05 + 0.93, 0.6)
put(hits, impact(3.5, 1.5), b(106) + 0.05 + 1.86, 0.9)
put(hits, crash(3.0), b(106) + 0.05 + 1.86, 0.4)
# nota final larga (piano sintético)
for m, a in ((50, 0.5), (57, 0.35), (62, 0.3), (65, 0.25)):
    n = int(5.5 * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * hz(m) * h * t) * np.exp(-t * (0.6 + h * 0.5)) / h for h in (1, 2, 3, 4))
    put(hits, (x * a * 0.25).astype(np.float32), b(106) + 0.05 + 1.86, 1.0)

# barridos en las transiciones
for beat in (16, 24, 28, 34, 40, 54, 82, 88, 94, 100, 103):
    put(sfx, whoosh(0.55, up=beat % 2 == 0), b(beat) - 0.3, 0.55)
# glitch en la entrada de cada titular
for i, t0 in enumerate([b(1), b(2.5), b(8.2), b(12), b(16.5), b(18), b(28.4), b(30), b(49.05), b(54.4), b(55.4), b(100.25), b(103.15)]):
    put(sfx, glitch(0.25, i), t0, 0.55, 0.2 * np.sin(i))
# pings en cada centro del mapa (pentatónica ascendente) + barrido de viaje
PENT = [62, 64, 67, 69, 72, 74, 76, 79, 81, 84]
FLY0, STEP, TRAVEL = b(58), b(2), 0.34
for i in range(10):
    ta = FLY0 + i * STEP + TRAVEL
    put(sfx, ping(hz(PENT[i])), ta - 0.02, 0.5, -0.3 + 0.06 * i)
    put(sfx, whoosh(0.4), FLY0 + i * STEP - 0.03, 0.35)
    put(sfx, glitch(0.08, 300 + i), ta - 0.04, 0.25)
# vista general: tics de la leyenda
for i in range(10):
    put(sfx, hat(0.02), b(78) + 0.6 + i * 0.045, 0.3)
# fichas técnicas
for t0 in (b(35), b(36.5), b(41), b(42.5)):
    put(sfx, ping(hz(86), 0.4), t0, 0.18)
    put(sfx, glitch(0.1, int(t0 * 10)), t0, 0.3)

# ------------------------------------------------------------------ mezcla
kicks = np.array(kicks)
tt = np.arange(N) / SR
duck = np.ones(N, np.float32)
for k in kicks:
    i = int(k * SR); L = int(0.22 * SR)
    seg = 1 - 0.7 * np.exp(-np.arange(L) / SR / 0.07)
    duck[i:i + L] = np.minimum(duck[i:i + L], seg[: len(duck[i:i + L])])
duck = duck[:, None]

# filtro de la ruptura del mapa (54-58): pad y arpegio apagados
music = bass * duck * 0.8 + hp(pad, 180) * duck * 0.4 + arp * duck * 0.62
music = reverb(music, 1.8, 0.16)
drums_r = reverb(drums, 1.0, 0.12)
fx = reverb(sfx, 2.6, 0.3) + reverb(hits, 3.2, 0.3)
mix = drums_r * 0.85 + music + fx * 0.9
# final: fundido
fade0 = TOTAL - 3.0
g = np.clip((TOTAL - tt) / 3.0, 0, 1) ** 1.5
g[tt < fade0] = 1
mix *= g[:, None]
mix = hp(mix, 28)
# compresor simple + limitador suave
rms = np.sqrt(np.maximum(signal.fftconvolve((mix ** 2).mean(1), np.ones(2400) / 2400, mode='same'), 0) + 1e-9)
gain = np.minimum(1, (0.2 / rms) ** 0.3)
mix *= gain[:, None]
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix /= np.abs(mix).max() / 0.9
mix *= 10 ** (-2.5 / 20)  # calibrado a -14 LUFS integrados (igual que el vídeo de colaboradores)
mix = mix[: int(TOTAL * SR)]

import wave
with wave.open(os.path.join(OUT, 'soundtrack.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print('ok', TOTAL, 'rms dB', 20 * np.log10(np.sqrt((mix ** 2).mean())))
