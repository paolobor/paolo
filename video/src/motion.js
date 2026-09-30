// Pick & place de los cobots. Poses resueltas por cinemática inversa numérica (tools: test/ik.mjs):
// A = cubo en su sitio, B = zona de depósito, aA/aB = aproximación 17 cm por encima.
import { lerp, easeInOutCubic, smooth, clamp } from './util.js';

export const POSES = {
  FR5: { A: [1.793, 0.517, 2.317, -0.771, 0.052, 0], aA: [1.782, -0.083, 2.377, -0.553, 0.071, 0], B: [0.625, 0.478, 2.467, -1.1, -0.197, 0], aB: [0.57, -0.176, 2.5, -0.801, -0.127, 0] },
  FR3: { A: [1.798, 0.785, 2.065, -0.772, 0.057, 0], aA: [1.781, 0.132, 2.209, -0.581, 0.088, 0], B: [0.592, 0.762, 2.231, -1.12, -0.183, 0], aB: [0.527, 0.065, 2.356, -0.886, -0.106, 0] },
};

// [tiempo, pose, pinza] de medio ciclo: de F (from) a T (to)
const KEYS = [[0, 'aF', 0], [0.55, 'F', 0], [0.85, 'F', 1], [1.35, 'aF', 1], [2.25, 'aT', 1], [2.8, 'T', 1], [3.1, 'T', 0], [3.6, 'aT', 0]];
const HALF = 3.6, UNIT = 0.6;

export function robotMotion(k, t, speed = 1, phase = 0) {
  const P = POSES[k];
  let u = ((t + phase) * speed) / UNIT;
  const h = Math.floor(u / HALF);
  let x = u - h * HALF;
  const F = h % 2 === 0 ? 'A' : 'B', T = F === 'A' ? 'B' : 'A';
  const name = (n) => P[n.replace('F', F).replace('T', T)];
  let i = 0; while (i < KEYS.length - 2 && x >= KEYS[i + 1][0]) i++;
  const [t0, p0, g0] = KEYS[i], [t1, p1, g1] = KEYS[i + 1];
  const f = clamp((x - t0) / (t1 - t0));
  const e = easeInOutCubic(f);
  const q = name(p0).map((v, j) => lerp(v, name(p1)[j], e));
  const grip = lerp(g0, g1, smooth(f));
  const carried = x >= 0.7 && x < 2.95;
  return { q, grip, piece: { carried, at: x < 0.7 ? F : T } };
}

// bajada y cierre de pinza (plano corto EXPERIMENTAR)
export function pickClose(k, u) {
  const P = POSES[k];
  const e = easeInOutCubic(clamp(u / 0.62));
  return { q: P.aA.map((v, j) => lerp(v, P.A[j], e)), grip: smooth(clamp((u - 0.62) / 0.3)), piece: { carried: false, at: 'A' } };
}
