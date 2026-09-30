"""Textura de detalle de relieve periódica (sin costuras) generada por síntesis espectral.
RGB = normal (espacio tangente), A = altura. Se muestrea a varias escalas en el shader del terreno."""
import os
import numpy as np
from PIL import Image
N = 1024
fx = np.fft.fftfreq(N)[:, None] * N; fy = np.fft.fftfreq(N)[None, :] * N
f = np.sqrt(fx ** 2 + fy ** 2); f[0, 0] = 1e-6

def fbm(beta, fmin, seed):
    r = np.random.default_rng(seed)
    ph = np.exp(2j * np.pi * r.random((N, N)))
    amp = f ** (-beta / 2) * (f >= fmin)
    n = np.real(np.fft.ifft2(amp * ph))
    return n / n.std()

ii, jj = np.meshgrid(np.arange(N, dtype=np.float64), np.arange(N, dtype=np.float64), indexing='ij')
def samp(a, y, x):
    y0 = np.floor(y).astype(int); x0 = np.floor(x).astype(int)
    ty = y - y0; tx = x - x0; y0 %= N; x0 %= N; y1 = (y0 + 1) % N; x1 = (x0 + 1) % N
    return (a[y0, x0] * (1 - tx) + a[y0, x1] * tx) * (1 - ty) + (a[y1, x0] * (1 - tx) + a[y1, x1] * tx) * ty

base = fbm(3.0, 3, 1)
wx = fbm(3.4, 2, 2) * 22; wy = fbm(3.4, 2, 3) * 22
h = samp(base, ii + wy, jj + wx)
# crestas finas solo en altura
fine = fbm(2.4, 24, 4)
h = h + 0.35 * (1 - np.abs(np.clip(fine / 2.2, -1, 1))) ** 2 * np.clip(h * 0.5 + 0.6, 0, 1.2)
lo, hi = np.percentile(h, [0.3, 99.7])
h = np.clip((h - lo) / (hi - lo), 0, 1)
gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5 * N / 40
gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5 * N / 40
nrm = np.stack([-gx, -gy, np.ones_like(h)], -1)
nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
img = np.concatenate([nrm * 0.5 + 0.5, h[..., None]], -1)
Image.fromarray((img * 255).astype(np.uint8), 'RGBA').save(os.path.join(os.path.dirname(__file__), '..', 'assets', 'map', 'detail.png'))
L = np.clip(nrm @ np.array([-0.6, -0.4, 0.5]) / 0.88, 0, 1)
Image.fromarray((L * 255).astype(np.uint8)).resize((512, 512)).save('/tmp/detail_h.png')
print('ok', h.mean())
