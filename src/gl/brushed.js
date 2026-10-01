import { DataTexture, RepeatWrapping, LinearMipmapLinearFilter, LinearFilter, RGBAFormat, UnsignedByteType, NoColorSpace } from 'three';

// Mapas del aluminio cepillado (sin costuras): vetas finas a lo largo del perfil
// y microarañazos muy sutiles. Un mosaico representa 40 x 40 mm.
//  - normal: RGB (tangente = a lo ancho de las vetas)
//  - rough:  canal G (multiplica la rugosidad del material)
// Si se pasa una imagen de textura real (aluminio cepillado con vetas
// horizontales), su luminancia sustituye al ruido de las vetas.

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Ruido 1D periódico por octavas (vetas)
function grooveProfile(n, r) {
  const out = new Float32Array(n);
  for (const [cells, amp] of [[n / 2, 0.5], [n / 6, 0.32], [n / 24, 0.2], [n / 96, 0.12]]) {
    const c = Math.max(4, Math.round(cells));
    const v = Array.from({ length: c }, () => r() - 0.5);
    for (let x = 0; x < n; x++) {
      const f = (x / n) * c, i = Math.floor(f), t = f - i;
      const s = t * t * (3 - 2 * t);
      out[x] += (v[i % c] * (1 - s) + v[(i + 1) % c] * s) * amp;
    }
  }
  return out;
}

function lumaField(img, n) {
  // La imagen tiene las vetas en horizontal: se traspone (vetas a lo largo de V)
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, n, n);
  const d = ctx.getImageData(0, 0, n, n).data;
  const h = new Float32Array(n * n);
  let mean = 0;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const o = (x * n + y) * 4; // traspuesta
    const l = (0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2]) / 255;
    h[y * n + x] = l;
    mean += l;
  }
  mean /= n * n;
  let v = 0;
  for (let i = 0; i < h.length; i++) { h[i] -= mean; v += h[i] * h[i]; }
  const sd = Math.sqrt(v / h.length) || 1;
  for (let i = 0; i < h.length; i++) h[i] = (h[i] / sd) * 0.18;
  return h;
}

export function createBrushedMaps(n = 1024, image = null) {
  const r = rng(4021);
  const H = image ? lumaField(image, n) : new Float32Array(n * n);
  const scratch = new Float32Array(n * n);
  if (!image) {
    const g = grooveProfile(n, r);
    const warp = grooveProfile(n, r);
    for (let y = 0; y < n; y++) {
      const off = Math.round(warp[y] * 6);
      for (let x = 0; x < n; x++) H[y * n + x] = g[(x + off + n) % n] * 0.22;
    }
  }

  // Microarañazos: casi todos en la dirección del cepillado, unos pocos al azar
  const line = (x0, y0, ang, len, depth) => {
    const dx = Math.sin(ang), dy = Math.cos(ang);
    const steps = Math.ceil(len);
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const fade = Math.sin(Math.PI * t); // los extremos se afinan
      const px = x0 + dx * i, py = y0 + dy * i;
      const ix = Math.floor(px), fx = px - ix;
      for (const [ox, w] of [[0, 1 - fx], [1, fx]]) {
        const xx = ((ix + ox) % n + n) % n, yy = ((Math.round(py)) % n + n) % n;
        const k = yy * n + xx;
        scratch[k] = Math.max(scratch[k], depth * w * fade);
      }
    }
  };
  const S = n / 1024;
  for (let i = 0; i < 70; i++) line(r() * n, r() * n, (r() - 0.5) * 0.12, (60 + r() * 360) * S, 0.15 + r() * 0.35);
  for (let i = 0; i < 16; i++) line(r() * n, r() * n, r() * Math.PI, (20 + r() * 90) * S, 0.2 + r() * 0.4);

  const normal = new Uint8Array(n * n * 4);
  const rough = new Uint8Array(n * n * 4);
  const h = (x, y) => {
    const k = ((y + n) % n) * n + ((x + n) % n);
    return H[k] - scratch[k] * 0.9;
  };
  const strength = 1.6;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const ddx = (h(x + 1, y) - h(x - 1, y)) * strength;
    const ddy = (h(x, y + 1) - h(x, y - 1)) * strength;
    const l = Math.hypot(ddx, ddy, 1);
    const o = (y * n + x) * 4;
    normal[o] = Math.round((-ddx / l * 0.5 + 0.5) * 255);
    normal[o + 1] = Math.round((-ddy / l * 0.5 + 0.5) * 255);
    normal[o + 2] = Math.round((1 / l * 0.5 + 0.5) * 255);
    normal[o + 3] = 255;
    const k = y * n + x;
    const rv = Math.min(1, Math.max(0, 0.92 + H[k] * 0.18 - scratch[k] * 0.12));
    rough[o] = rough[o + 1] = rough[o + 2] = Math.round(rv * 255);
    rough[o + 3] = 255;
  }
  const tex = (data) => {
    const t = new DataTexture(data, n, n, RGBAFormat, UnsignedByteType);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.minFilter = LinearMipmapLinearFilter;
    t.magFilter = LinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    t.colorSpace = NoColorSpace;
    t.repeat.set(1 / 40, 1 / 40); // UV en mm
    t.needsUpdate = true;
    return t;
  };
  return { normal: tex(normal), rough: tex(rough) };
}

// Carga opcional de la textura real (assets/texturas/aluminio-cepillado.webp)
export function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
