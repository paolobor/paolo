import { CanvasTexture, RepeatWrapping, MeshPhysicalMaterial, MeshStandardMaterial, Color, SRGBColorSpace, NoColorSpace, Vector2 } from 'three';

// Materiales PBR del modelo 3D (compatibles con glTF 2.0).
// Se exportan al .glb y la web los reutiliza al cargarlo.

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvasTex(w, h, fill, colorSpace = NoColorSpace) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  fill(img.data, w, h);
  ctx.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = colorSpace;
  t.flipY = false;
  return t;
}

// Perfil de vetas del cepillado (varía solo a lo ancho, U)
function brushProfile(w) {
  const r = rng(42);
  const col = new Float32Array(w);
  for (let x = 0; x < w; x++) col[x] = r();
  const sm = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    let a = 0;
    for (let k = -2; k <= 2; k++) a += col[(x + k + w) % w] * (3 - Math.abs(k));
    sm[x] = a / 9 - 0.5;
  }
  for (let i = 0; i < 30; i++) sm[Math.floor(r() * w)] += (r() - 0.5) * 0.8;
  return sm;
}

export function createModelMaterials() {
  const W = 512, H = 32;
  const prof = brushProfile(W);

  // Rugosidad cepillada (canal G) — valores cerca de 1 para no abrillantar de más
  const brushedRough = canvasTex(W, H, (d, w, h) => {
    const r = rng(9);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = Math.max(0, Math.min(1, 0.9 + prof[x] * 0.22 + (r() - 0.5) * 0.03));
      const o = (y * w + x) * 4;
      d[o] = d[o + 1] = d[o + 2] = Math.round(v * 255);
      d[o + 3] = 255;
    }
  });
  // Mapa de normales de las vetas (pendiente en U)
  const brushedNormal = canvasTex(W, H, (d, w, h) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dh = (prof[(x + 1) % w] - prof[(x - 1 + w) % w]) * 0.5;
      const n = new Vector2(-dh * 2.2, 0);
      const nz = Math.sqrt(Math.max(0, 1 - n.x * n.x));
      const o = (y * w + x) * 4;
      d[o] = Math.round((n.x * 0.5 + 0.5) * 255);
      d[o + 1] = 128;
      d[o + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      d[o + 3] = 255;
    }
  });
  for (const t of [brushedRough, brushedNormal]) t.repeat.set(1 / 22, 1 / 60); // UV en mm

  // Satinado (microgranallado) del inoxidable
  const satin = canvasTex(128, 128, (d) => {
    const r = rng(7);
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i + 1] = d[i + 2] = Math.round((0.9 + (r() - 0.5) * 0.18) * 255);
      d[i + 3] = 255;
    }
  });
  satin.repeat.set(1 / 6, 1 / 6);

  const aluminium = new MeshPhysicalMaterial({
    name: 'aluminio',
    color: new Color(0.84, 0.855, 0.87),
    metalness: 1,
    roughness: 0.46,
    roughnessMap: brushedRough,
    normalMap: brushedNormal,
    normalScale: new Vector2(0.35, 0.35),
    anisotropy: 0.25,
  });
  const aluminiumCut = new MeshPhysicalMaterial({
    name: 'aluminio-corte',
    color: new Color(0.87, 0.875, 0.885),
    metalness: 1,
    roughness: 0.5,
    roughnessMap: brushedRough,
  });
  const steel = new MeshPhysicalMaterial({
    name: 'acero',
    color: new Color(0.8, 0.79, 0.775),
    metalness: 1,
    roughness: 0.34,
    roughnessMap: satin,
  });
  const screw = new MeshStandardMaterial({ name: 'tornillo', color: new Color(0.86, 0.86, 0.87), metalness: 1, roughness: 0.2 });
  const socket = new MeshStandardMaterial({ name: 'hexagono', color: new Color(0.02, 0.02, 0.02), metalness: 0.4, roughness: 0.65 });
  const rod = new MeshStandardMaterial({ name: 'varilla', color: new Color(0.42, 0.42, 0.43), metalness: 1, roughness: 0.38 });
  const nut = new MeshStandardMaterial({ name: 'tuerca', color: new Color(0.62, 0.62, 0.63), metalness: 1, roughness: 0.35 });
  const orange = new MeshPhysicalMaterial({
    name: 'naranja',
    color: new Color().setStyle('#ff6a10', SRGBColorSpace),
    metalness: 0.75,
    roughness: 0.26,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    emissive: new Color().setStyle('#ff5a0a', SRGBColorSpace).multiplyScalar(0.35),
    emissiveIntensity: 1,
  });
  const chrome = new MeshStandardMaterial({ name: 'cromo', color: new Color(0.96, 0.965, 0.975), metalness: 1, roughness: 0.075 });

  return { aluminium, aluminiumCut, steel, screw, socket, rod, nut, orange, chrome };
}
