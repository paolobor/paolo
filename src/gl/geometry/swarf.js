import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

// Virutas de aluminio: cintas de sección fina barridas a lo largo de una curva.
// curve(t) -> Vector3, t en [0,1]. La cinta se orienta con su anchura según "up(t)".
function ribbon(curve, { steps = 90, width = 0.3, thick = 0.025, twist = 0, taper = 0.25, cup = 0.03 }) {
  const P = [], T = [], U = [];
  const eps = 1 / (steps * 4);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = curve(t);
    const a = curve(Math.max(0, t - eps)), b = curve(Math.min(1, t + eps));
    const tan = b.clone().sub(a).normalize();
    P.push(p); T.push(tan);
  }
  // Marco de referencia estable (transporte paralelo)
  let ref = Math.abs(T[0].y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  let n = ref.clone().sub(T[0].clone().multiplyScalar(ref.dot(T[0]))).normalize();
  for (let i = 0; i <= steps; i++) {
    if (i > 0) {
      const axis = new Vector3().crossVectors(T[i - 1], T[i]);
      const s = axis.length();
      if (s > 1e-6) {
        axis.divideScalar(s);
        const ang = Math.asin(Math.min(1, s));
        n.applyAxisAngle(axis, ang);
      }
    }
    const tw = twist * (i / steps);
    U.push(n.clone().applyAxisAngle(T[i], tw));
  }

  // Sección: 3 puntos por cara (ligeramente cóncava) + cantos
  const pos = [];
  const idx = [];
  const ring = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const edge = Math.min(1, Math.min(t, 1 - t) / 0.08);
    const w = width * (taper + (1 - taper) * edge) * (0.85 + 0.15 * Math.sin(t * 37.0));
    const th = thick * (0.6 + 0.4 * edge);
    const u = U[i];
    const v = new Vector3().crossVectors(T[i], u).normalize();
    const p = P[i];
    const c = cup * w;
    const pt = (a, b) => p.clone().addScaledVector(u, a).addScaledVector(v, b);
    // cara superior (3), cara inferior (3), canto A (1), canto B (1)
    const hw = w / 2;
    const top = [pt(-hw, th / 2), pt(0, th / 2 - c), pt(hw, th / 2)];
    const bot = [pt(-hw, -th / 2), pt(0, -th / 2 - c), pt(hw, -th / 2)];
    for (const q of [...top, ...bot, pt(-hw - th * 0.3, 0), pt(hw + th * 0.3, 0)]) pos.push(q.x, q.y, q.z);
  }
  const quad = (a, b, c, d) => idx.push(a, b, c, a, c, d);
  for (let i = 0; i < steps; i++) {
    const a = i * ring, b = (i + 1) * ring;
    // superior 0-1-2
    quad(a + 0, b + 0, b + 1, a + 1); quad(a + 1, b + 1, b + 2, a + 2);
    // inferior 3-4-5 (invertida)
    quad(a + 4, b + 4, b + 3, a + 3); quad(a + 5, b + 5, b + 4, a + 4);
    // cantos
    quad(a + 3, b + 3, b + 6, a + 6); quad(a + 6, b + 6, b + 0, a + 0);
    quad(a + 2, b + 2, b + 7, a + 7); quad(a + 7, b + 7, b + 5, a + 5);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.center();
  g.computeBoundingSphere();
  return g;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Espiral helicoidal abierta (viruta de torno), radio y paso irregulares
export function helixChip(seed = 1) {
  const r = rng(seed);
  const turns = 1.8 + r() * 2.6;
  const r0 = 0.2 + r() * 0.16, r1 = r0 * (0.55 + r() * 0.6);
  const pitch = 0.24 + r() * 0.3;
  const wob = 0.015 + r() * 0.03;
  const ph = r() * 6.28;
  return ribbon((t) => {
    const a = t * turns * Math.PI * 2;
    const rad = r0 + (r1 - r0) * t + Math.sin(a * 0.5 + ph) * 0.03;
    const ax = t * turns * pitch * (0.85 + 0.3 * Math.sin(t * 5 + ph));
    return new Vector3(Math.cos(a) * rad + Math.sin(a * 3.1) * wob, ax, Math.sin(a) * rad);
  }, { steps: Math.round(56 * turns), width: 0.07 + r() * 0.06, thick: 0.011, twist: (r() - 0.5) * 2.5, cup: 0.05 });
}

// Viruta larga tipo cinta enrollada (continua)
export function longChip(seed = 21) {
  const r = rng(seed);
  const turns = 4 + r() * 2.5;
  const rad = 0.13 + r() * 0.08;
  const pitch = 0.2 + r() * 0.14;
  return ribbon((t) => {
    const a = t * turns * Math.PI * 2;
    const bend = Math.sin(t * Math.PI) * 0.35;
    return new Vector3(Math.cos(a) * rad + bend, t * turns * pitch, Math.sin(a) * rad);
  }, { steps: Math.round(48 * turns), width: 0.05 + r() * 0.04, thick: 0.01, twist: (r() - 0.5) * 3, cup: 0.04 });
}

// Espiral plana tipo muelle de reloj
export function flatSpiralChip(seed = 7) {
  const r = rng(seed);
  const turns = 1.4 + r() * 1.2;
  const rMax = 0.26 + r() * 0.12;
  return ribbon((t) => {
    const a = t * turns * Math.PI * 2;
    const rad = rMax * (0.25 + 0.75 * t);
    return new Vector3(Math.cos(a) * rad, Math.sin(a * 0.5) * 0.04 + t * 0.06, Math.sin(a) * rad);
  }, { steps: Math.round(70 * turns), width: 0.06 + r() * 0.04, thick: 0.01, twist: 0.4, cup: 0.06 });
}

// Trocito curvado en "C"
export function curlChip(seed = 3) {
  const r = rng(seed);
  const arc = Math.PI * (0.6 + r() * 1.0);
  const rad = 0.13 + r() * 0.12;
  return ribbon((t) => {
    const a = t * arc;
    return new Vector3(Math.cos(a) * rad, t * 0.06, Math.sin(a) * rad);
  }, { steps: 32, width: 0.08 + r() * 0.06, thick: 0.013, twist: (r() - 0.5) * 1.4, taper: 0.45, cup: 0.09 });
}

// Escama pequeña (destellos)
export function flakeChip(seed = 11) {
  const r = rng(seed);
  const len = 0.12 + r() * 0.1;
  return ribbon((t) => new Vector3((t - 0.5) * len, Math.sin(t * Math.PI) * 0.03, 0), {
    steps: 8, width: 0.07 + r() * 0.05, thick: 0.01, twist: (r() - 0.5) * 1.5, taper: 0.6, cup: 0.12,
  });
}
