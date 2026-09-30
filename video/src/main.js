// EDUCAFAIRINO 2026–2027 — montaje completo. Todo es determinista: renderFrame(i) dibuja el fotograma i.
import * as THREE from 'three';
import { Post } from './post.js';
import { createMap } from './map.js';
import { createWarehouse } from './warehouse.js';
import { createImageShots, createFlatShots } from './imageshot.js';
import { createOverlay } from './overlay.js';
import { robotMotion, pickClose, POSES } from './motion.js';
import { clamp, lerp, smooth, smoother, easeInOutCubic, easeOutCubic, easeOutExpo, easeInOutExpo, range, hash, v3, loadTexture } from './util.js';

export const FPS = 30;
export const BPM = 129;
export const B = 60 / BPM;
const b = (n) => n * B;
const W = 1920, H = 1080;
export const TOTAL_BEATS = 120;
export const DURATION = b(TOTAL_BEATS) + 0.6;

await Promise.all(['Anton', 'Inter', 'Michroma', 'JetBrains Mono'].map((f) => document.fonts.load(`40px "${f}"`)));
await document.fonts.load('700 40px Inter'); await document.fonts.load('600 40px Inter'); await document.fonts.load('500 40px Inter');

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setSize(W, H, false);
const post = new Post(renderer, W, H);
const map = await createMap(W, H);
const wh = createWarehouse(renderer, W, H);
const imgs = createImageShots(renderer, W, H);
const flat = createFlatShots(renderer, W, H);
const ov = createOverlay(document.getElementById('stage'));

const I = {};
for (const n of ['aula_grupo', 'aula_formacion', 'aula_portatiles', 'aula_vision']) {
  I[n] = { img: await loadTexture(`../assets/img/${n}.jpg`), dep: await loadTexture(`../assets/img/${n}_depth.png`, { srgb: false }) };
}

// ------------------------------------------------------------------ gradaciones
const G = {
  intro: { bloom: 0.35, exposure: 0.62, contrast: 1.18, sat: 0.7, lift: [0, 0, 0], gain: [0.95, 1.0, 1.08], warm: 0, vignette: 0.65, grain: 0.055, ca: 0.0015 },
  night: { bloom: 0.38, exposure: 1.0, contrast: 1.12, sat: 1.0, lift: [0, 0, 0], gain: [1, 1, 1], warm: 0.25, vignette: 0.5, grain: 0.045, ca: 0.0014 },
  wh: { bloom: 0.55, exposure: 1.05, contrast: 1.12, sat: 1.05, lift: [0, 0, 0], gain: [1, 1, 1], warm: 0.12, vignette: 0.52, grain: 0.045, ca: 0.0013 },
  img: { bloom: 0.32, exposure: 1.0, contrast: 1.16, sat: 0.92, lift: [0, 0, 0], gain: [1.02, 0.97, 0.9], warm: 0.35, vignette: 0.62, grain: 0.06, ca: 0.0016 },
  burst: { bloom: 0.9, exposure: 1.0, contrast: 1.05, sat: 1.0, lift: [0, 0, 0], gain: [1, 1, 1], warm: 0.1, vignette: 0.35, grain: 0.04, ca: 0.002 },
  white: { bloom: 0.0, exposure: 1.0, contrast: 1.0, sat: 1.0, lift: [0, 0, 0], gain: [1, 1, 1], warm: 0, vignette: 0, grain: 0.012, ca: 0.0 },
  black: { bloom: 0, exposure: 1, contrast: 1, sat: 1, lift: [0, 0, 0], gain: [1, 1, 1], warm: 0, vignette: 0, grain: 0.03, ca: 0 },
};

// ------------------------------------------------------------------ cobots: movimiento
const RM = (k, t, speed = 1, phase = 0) => robotMotion(k, t, speed, phase);

// ------------------------------------------------------------------ mapa: cámaras
const centers = map.centers;
const MADRID = { x: 0.62, z: -1.45 };
const OVERVIEW = { pos: v3(0.35, 14.8, 3.6), target: v3(0.35, 0, 0.25) };
const FLY0 = b(58), FLY_STEP = b(2), TRAVEL = 0.34;
const AZ = [-0.35, 0.3, -0.25, 0.35, -0.3, 0.25, -0.35, 0.3, -0.25, 0.3];

function holdPose(i, u) {
  const c = centers[i];
  const T = v3(c.x, c.y + 0.05, c.z);
  const az = AZ[i] + 0.12 * u, el = 0.95, d = 1.25 * (1 - 0.08 * u);
  const pos = v3(T.x + Math.sin(az) * Math.cos(el) * d, T.y + Math.sin(el) * d, T.z + Math.cos(az) * Math.cos(el) * d);
  return { pos, target: T.clone().add(v3(0, 0.07, 0)) };
}

function mapFlightPose(t) {
  // t: tiempo global dentro del vuelo
  const k = (t - FLY0) / FLY_STEP;
  const i = clamp(Math.floor(k), 0, 9);
  const lt = t - (FLY0 + i * FLY_STEP);
  let pose;
  if (lt < TRAVEL) {
    const u = easeInOutCubic(lt / TRAVEL);
    const A = i === 0 ? OVERVIEW : holdPose(i - 1, 1);
    const Bp = holdPose(i, 0);
    const target = new THREE.Vector3().lerpVectors(A.target, Bp.target, u);
    const pos = new THREE.Vector3().lerpVectors(A.pos, Bp.pos, u);
    const dist = A.target.distanceTo(Bp.target);
    pos.y += Math.sin(Math.PI * u) * (0.25 + dist * 0.35) * (i === 0 ? 0 : 1);
    pose = { pos, target, travel: true };
  } else {
    const u = (lt - TRAVEL) / (FLY_STEP - TRAVEL);
    pose = { ...holdPose(i, u), travel: false };
  }
  pose.i = i; pose.lt = lt;
  return pose;
}

function mapCentersState(t, allOn = false) {
  const st = [];
  for (let i = 0; i < 10; i++) {
    const arrive = FLY0 + i * FLY_STEP + TRAVEL * 0.7;
    const a = allOn ? 1 : easeOutCubic(range(t, arrive - 0.05, arrive + 0.25));
    const cur = !allOn && t >= FLY0 + i * FLY_STEP && t < FLY0 + (i + 1) * FLY_STEP;
    st.push({ act: a, beamGain: cur || allOn ? 1 : 0.55, pulse: (t - arrive) / 0.9, hl: cur ? easeOutCubic(range(t, arrive, arrive + 0.2)) * 0.95 : 0, beamH: allOn ? 0.5 : 0.55 });
  }
  return st;
}

// ------------------------------------------------------------------ planos
function mapShot(poseFn, extra = {}) {
  return { render: (rt, t) => map.render(renderer, rt, { ...extra, ...poseFn(t) }) };
}
function whShot(stateFn) { return { render: (rt, t) => wh.render(rt, stateFn(t)), state: stateFn }; }
function imgShot(name, moveFn) { return { render: (rt, t) => imgs.render(rt, { ...I[name], ...moveFn(t), time: t }) }; }
function flatShot(fn) { return { render: (rt, t) => flat.render(rt, fn(t)) }; }

const lin = (a, c, u) => a.map((v, k) => lerp(v, c[k], u));

// Cada plano: [inicio, fin] en pulsos, render(t global), gradación, transición de entrada
const SHOTS = [];
function add(b0, b1, shot, opt = {}) { SHOTS.push({ t0: b(b0), t1: b(b1), shot, grade: G.night, samples: () => 1, ...opt }); }

// 1 · Intro rasante sobre el relieve nocturno
add(0, 7, mapShot((t) => {
  const u = t / b(7);
  return { pos: v3(...lin([-0.78, 0.17, -0.5], [-0.62, 0.15, -0.86], u)), target: v3(...lin([-0.25, 0.04, -2.7], [-0.05, 0.04, -3.0], u)),
    mood: 0, lightGain: 0, sky: 1, borders: 0.3, fogNear: 2.5, fogFar: 14 };
}), { grade: G.intro, letterbox: 1 });
// 2 · negro
add(7, 8, flatShot(() => ({ mode: 0 })), { grade: G.black, letterbox: 1 });
// 3 · cenital oscuro con punto pulsante
add(8, 12, mapShot((t) => {
  const u = (t - b(8)) / b(4);
  return { pos: v3(MADRID.x + 0.05, 1.45 - 0.3 * u, MADRID.z + 0.28), target: v3(MADRID.x, 0, MADRID.z), roll: 0.05 * u,
    mood: 0, lightGain: 0.0, sky: 0, borders: 0.6, dot: { x: MADRID.x, z: MADRID.z, a: 1, pulse: (t - b(8)) / 0.9, size: 0.09 } };
}), { grade: { ...G.intro, exposure: 0.75 }, letterbox: 1 });
// 4 · estallido «A LA ENSEÑANZA»
add(12, 16, flatShot((t) => {
  const lt = t - b(12);
  return { mode: 1, t: lt, r: 0.06 + 0.5 * easeOutExpo(lt / 0.9) + lt * 0.03, amt: 1 - 0.55 * range(lt, 0.6, b(4)) };
}), { grade: G.burst, trans: { kind: 3, dur: 0.18 } });
// 5 · TU AULA (aula de formación)
add(16, 24, imgShot('aula_formacion', (t) => {
  const u = smooth((t - b(16)) / b(8));
  return { center: lin([0.52, 0.5], [0.5, 0.47], u), zoom: lerp(1.04, 1.16, u), par: lin([-0.012, 0.004], [0.014, -0.004], u), d0: 0.6,
    flare: 0.9, flarePos: lin([0.12, 0.28], [0.36, 0.3], u), leak: 0.25 * (1 - u), leakPos: [0.05, 0.1], sweep: lerp(-0.9, 0.9, u), exposure: 0.85, orange: 0.65 };
}), { grade: G.img, trans: { kind: 1, dur: 0.3, dir: [1, 0] } });
// 6 · macro del brazo FR5 (la cámara sube a lo largo del brazo)
add(24, 28, whShot((t) => {
  const u = (t - b(24)) / b(4);
  const q = [1.95 - 0.3 * u, -0.28 + 0.08 * u, 2.1, -0.6, 0.05, 0.3 * u];
  const rb = wh.robots.FR5; rb.setPose(q, 0); rb.root.updateMatrixWorld(true);
  const sh = rb.anchors.shoulder.getWorldPosition(v3()), el = rb.anchors.elbow.getWorldPosition(v3());
  const mid = sh.clone().lerp(el, 0.05 + 0.85 * smooth(u));
  const pos = mid.clone().add(v3(0.3, 0.03 - 0.06 * u, 0.24));
  return { t, pos, target: mid, fov: 30, aperture: 0.05, maxR: 0.03, focus: pos.distanceTo(mid),
    robots: { FR5: { q }, FR3: RM('FR3', t, 0.8) } };
}), { grade: G.wh, trans: { kind: 1, dur: 0.3, dir: [0, -1] } });
// 7 · plano general FR3 + FR5
add(28, 34, whShot((t) => {
  const u = smooth((t - b(28)) / b(6));
  return { t, pos: v3(...lin([0.15, 1.4, 3.4], [0.0, 1.3, 2.8], u)), target: v3(-0.08, 1.02, 0.05), fov: 32, aperture: 0.02,
    robots: { FR5: RM('FR5', t, 0.9), FR3: RM('FR3', t, 0.9, 1.7) } };
}), { grade: G.wh, trans: { kind: 1, dur: 0.28, dir: [1, 0] } });
// 8 · FR3 en órbita
const C3 = v3(-0.75, 1.02, 0.15), C5 = v3(0.55, 1.12, 0.0);
add(34, 40, whShot((t) => {
  const u = smooth((t - b(34)) / b(6));
  const a = lerp(-0.62, -0.12, u), R = lerp(1.45, 1.3, u);
  return { t, pos: v3(C3.x + Math.sin(a) * R, 1.28, C3.z + Math.cos(a) * R), target: C3.clone().add(v3(0.12, 0, 0)), fov: 32, aperture: 0.028,
    robots: { FR3: RM('FR3', t, 0.85), FR5: RM('FR5', t, 0.8, 2.2) }, reach: { FR3: { p: easeOutCubic(range(t, b(36.5), b(37.8))), a: range(t, b(36.5), b(36.8)) * (1 - range(t, b(39.6), b(40))) } } };
}), { grade: G.wh, trans: { kind: 1, dur: 0.28, dir: [-1, 0] } });
// 9 · FR5 en órbita
add(40, 46, whShot((t) => {
  const u = smooth((t - b(40)) / b(6));
  const a = lerp(0.55, 0.08, u), R = lerp(1.95, 1.75, u);
  return { t, pos: v3(C5.x + Math.sin(a) * R, 1.42, C5.z + Math.cos(a) * R), target: C5.clone().add(v3(-0.12, 0, 0)), fov: 32, aperture: 0.028,
    robots: { FR5: RM('FR5', t, 0.85, 0.6), FR3: RM('FR3', t, 0.8) }, reach: { FR5: { p: easeOutCubic(range(t, b(42.5), b(43.8))), a: range(t, b(42.5), b(42.8)) * (1 - range(t, b(45.6), b(46))) } } };
}), { grade: G.wh, trans: { kind: 1, dur: 0.28, dir: [1, 0] } });
// 10 · PROGRAMAR / INTEGRAR / EXPERIMENTAR (cortes secos)
add(46, 47, imgShot('aula_portatiles', (t) => {
  const u = (t - b(46)) / b(1);
  return { center: [0.3, 0.3], zoom: lerp(2.2, 2.45, u), par: [0.012 * u, 0], d0: 0.9, exposure: 0.95, orange: 0.55, flare: 0.5, flarePos: [0.8, 0.2] };
}), { grade: G.img, cut: 'glitch', samples: () => 3 });
add(47, 48, imgShot('aula_vision', (t) => {
  const u = (t - b(47)) / b(1);
  return { center: [0.52, 0.55], zoom: lerp(2.0, 2.3, u), rot: 0.03, par: [-0.012 * u, 0], d0: 0.6, exposure: 0.95, orange: 0.55, flare: 0.5, flarePos: [0.2, 0.25] };
}), { grade: G.img, cut: 'glitch', samples: () => 3 });
add(48, 49, whShot((t) => {
  const u = (t - b(48)) / b(1);
  return { t, pos: v3(...lin([1.2, 0.93, 0.36], [1.15, 0.92, 0.32], u)), target: v3(0.85, 0.87, 0.0), fov: 30, aperture: 0.05, maxR: 0.03,
    robots: { FR5: pickClose('FR5', u), FR3: RM('FR3', t) } };
}), { grade: G.wh, cut: 'glitch' });
// 11 · APRENDER HACIENDO
add(49, 54, imgShot('aula_grupo', (t) => {
  const u = smooth((t - b(49)) / b(5));
  return { center: lin([0.6, 0.47], [0.62, 0.45], u), zoom: lerp(1.5, 1.72, u), par: lin([0.01, 0], [-0.016, 0.004], u), d0: 0.6,
    flare: 0.7, flarePos: lin([0.72, 0.18], [0.6, 0.2], u), exposure: 0.85, orange: 0.7, sweep: lerp(-0.8, 0.8, u) };
}), { grade: G.img, cut: 'flash' });
// 12 · Mapa: título
add(54, 58, mapShot((t) => {
  const u = (t - b(54)) / b(4);
  return { pos: OVERVIEW.pos.clone().add(v3(0.3 * (1 - u), 1.4 * (1 - u), 0.6 * (1 - u))), target: OVERVIEW.target, lightGain: 1, mood: 1, borders: 1 };
}), { grade: G.night, trans: { kind: 4, dur: 0.35 }, blur: (t) => 26 * (1 - range(t, b(57.2), b(58))) });
// 13 · Vuelo por los 10 centros
add(58, 78, mapShot((t) => ({ ...mapFlightPose(t), centers: mapCentersState(t), lightGain: 1, mood: 1, borders: 1 })), {
  grade: G.night, samples: (t) => { const p = mapFlightPose(t); return p.travel ? 8 : 1; }, shutter: () => 0.28,
});
// 14 · Vista general con los 10 haces
function overviewPose(t) {
  const lt = t - b(78);
  const k = easeOutExpo(clamp(lt / 0.7)), d = smooth(clamp(lt / b(4)));
  const pos = OVERVIEW.pos.clone().add(v3(1.0 + 0.2 * d, -1.2 + 2.4 * (1 - k) - 0.3 * d, -0.5 + 1.2 * (1 - k)));
  return { pos, target: OVERVIEW.target.clone().add(v3(0.9, 0, 0.1)) };
}
add(78, 82, mapShot((t) => ({ ...overviewPose(t), centers: mapCentersState(t, true), lightGain: 1, mood: 1, borders: 1 })),
  { grade: G.night, trans: { kind: 4, dur: 0.3 }, samples: (t) => (t - b(78) < 0.4 ? 4 : 1) });
// 15 · Universidad de Sevilla
add(82, 88, imgShot('aula_portatiles', (t) => {
  const u = smooth((t - b(82)) / b(6));
  return { center: lin([0.47, 0.5], [0.52, 0.47], u), zoom: lerp(1.04, 1.16, u), par: lin([-0.016, 0.006], [0.016, -0.004], u), d0: 0.55,
    flare: 0.8, flarePos: lin([0.18, 0.2], [0.3, 0.22], u), leak: 0.2, leakPos: [0.0, 0.8], sweep: lerp(0.9, -0.9, u), exposure: 0.8, orange: 0.6 };
}), { grade: G.img, trans: { kind: 1, dur: 0.3, dir: [1, 0] } });
// 16 · IES San Blas
add(88, 94, imgShot('aula_vision', (t) => {
  const u = smooth((t - b(88)) / b(6));
  return { center: lin([0.5, 0.48], [0.47, 0.5], u), zoom: lerp(1.16, 1.04, u), par: lin([0.014, -0.004], [-0.014, 0.004], u), d0: 0.62,
    flare: 0.8, flarePos: lin([0.75, 0.3], [0.62, 0.28], u), sweep: lerp(-0.9, 0.9, u), exposure: 0.82, orange: 0.6 };
}), { grade: G.img, trans: { kind: 1, dur: 0.3, dir: [-1, 0] } });
// 17 · Aula FAIRINO España
add(94, 100, imgShot('aula_grupo', (t) => {
  const u = smooth((t - b(94)) / b(6));
  return { center: lin([0.5, 0.5], [0.53, 0.48], u), zoom: lerp(1.03, 1.15, u), par: lin([-0.014, 0.004], [0.016, -0.004], u), d0: 0.6,
    flare: 0.85, flarePos: lin([0.86, 0.14], [0.78, 0.16], u), leak: 0.18, leakPos: [1.0, 0.9], exposure: 0.8, orange: 0.62 };
}), { grade: G.img, trans: { kind: 1, dur: 0.3, dir: [1, 0] } });
// 18 · DEL AULA
add(100, 103, imgShot('aula_formacion', (t) => {
  const u = smooth((t - b(100)) / b(3));
  return { center: lin([0.46, 0.46], [0.5, 0.5], u), zoom: lerp(1.35, 1.1, u), par: lin([0.02, 0], [-0.01, 0], u), d0: 0.6,
    flare: 0.8, flarePos: [0.3, 0.3], exposure: 0.7, orange: 0.7 };
}), { grade: G.img, trans: { kind: 1, dur: 0.3, dir: [0, 1] } });
// 19 · A LA INDUSTRIA
add(103, 106, whShot((t) => {
  const u = smooth((t - b(103)) / b(3));
  return { t, pos: v3(...lin([1.3, 0.72, 1.1], [1.02, 0.78, 0.88], u)), target: v3(0.42, 1.15, 0.0), fov: 34, aperture: 0.025,
    robots: { FR5: RM('FR5', t, 1.3, 0.3), FR3: RM('FR3', t, 1.2, 1.1) } };
}), { grade: { ...G.wh, exposure: 1.1 }, trans: { kind: 1, dur: 0.28, dir: [1, 0] }, samples: () => 4 });
// 20 · Cierre en blanco
add(106, 124, flatShot(() => ({ mode: 2 })), { grade: G.white, trans: { kind: 3, dur: 0.22 } });

// ------------------------------------------------------------------ textos
ov.headline({ t0: b(1), t1: b(6.8), lines: [{ text: 'EDUCAFAIRINO', at: 0 }, { text: '2026–2027', at: b(1.5) }], size: 128 });
ov.headline({ t0: b(8.2), t1: b(15.8), lines: [{ text: 'APOYAMOS', at: 0 }, { text: 'A LA *ENSEÑANZA*.', at: b(3.8) }], size: 130, y: 520 });
ov.headline({ t0: b(16.5), t1: b(23.8), lines: [{ text: 'ROBÓTICA INDUSTRIAL.', at: 0 }, { text: 'AL ALCANCE DE *TU AULA*.', at: b(1.5) }], size: 112 });
ov.headline({ t0: b(28.4), t1: b(33.8), lines: [{ text: 'FR3 Y FR5.', at: 0 }, { text: 'CONDICIONES ESPECIALES PARA *EDUCACIÓN*.', at: b(1.6) }], size: 100 });
ov.caption({ t0: b(34.35), t1: b(39.85), logo: true, lines: ['FR3.', 'COMPACTO PARA EMPEZAR.'] });
ov.caption({ t0: b(40.35), t1: b(45.85), logo: true, lines: ['FR5.', 'MÁS ALCANCE PARA CRECER.'] });
ov.headline({ t0: b(46), t1: b(47), lines: [{ text: 'PROGRAMAR.' }], size: 210, outGlitch: false });
ov.headline({ t0: b(47), t1: b(48), lines: [{ text: 'INTEGRAR.' }], size: 210, outGlitch: false });
ov.headline({ t0: b(48), t1: b(49), lines: [{ text: 'EXPERIMENTAR.' }], size: 210, outGlitch: false });
ov.headline({ t0: b(49.05), t1: b(53.8), lines: [{ text: 'APRENDER *HACIENDO*.' }], size: 160 });
ov.headline({ t0: b(54.4), t1: b(57.6), lines: [{ text: 'CENTROS DE FORMACIÓN', at: 0 }, { text: 'Y UNIVERSIDADES.', at: b(1) }], size: 112 });
ov.caption({ t0: b(82.3), t1: b(87.85), label: 'UNIVERSIDAD DE SEVILLA', lines: ['APRENDER AUTOMATIZACIÓN.'] });
ov.caption({ t0: b(88.3), t1: b(93.85), label: 'IES SAN BLAS · MADRID', lines: ['ROBÓTICA Y VISIÓN ARTIFICIAL.'] });
ov.caption({ t0: b(94.3), t1: b(99.85), label: 'AULA FAIRINO ESPAÑA', lines: ['TECNOLOGÍA Y EXPERIENCIA', 'A TU DISPOSICIÓN.'] });
ov.headline({ t0: b(100.25), t1: b(102.9), lines: [{ text: 'DEL AULA' }], size: 150 });
ov.headline({ t0: b(103.15), t1: b(105.9), lines: [{ text: 'A LA *INDUSTRIA*.' }], size: 150 });
for (const [a, c] of [[16, 24], [46, 48], [49, 54], [82, 103]]) ov.tagItem({ t0: b(a), t1: b(c) });
ov.endCard({ t0: b(106) + 0.05, t1: 999 });

// tarjetas del mapa y rótulos mini
const cards = centers.map((c) => ov.mapCard(c));
const BADGE_OFF = [[0, -40], [42, -34], [-6, -48], [-50, -16], [18, 40], [30, 32], [46, -12], [0, -40], [0, -40], [0, -40]];
const minis = centers.map((c, i) => ov.miniLabel(c, BADGE_OFF[i]));
const legend = ov.legend(centers);
const coordEls = centers.map((c) => { const e = document.createElement('div'); e.className = 'coord'; e.textContent = c.coord; ov.ov.appendChild(e); return e; });

// fichas técnicas
const specs = {
  FR3: { ...ov.specCard({ model: 'FR3', rows: [{ v: '3', u: 'kg', k: 'CARGA' }, { v: '622', u: 'mm', k: 'ALCANCE' }] }), t0: b(35), t1: b(39.85), rb: 'FR3' },
  FR5: { ...ov.specCard({ model: 'FR5', rows: [{ v: '5', u: 'kg', k: 'CARGA' }, { v: '922', u: 'mm', k: 'ALCANCE' }] }), t0: b(41), t1: b(45.85), rb: 'FR5' },
};

function shotAt(t) {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].t0) return i;
  return 0;
}

function updateMapUI(t, si) {
  const s = SHOTS[si];
  const inFlight = t >= b(58) && t < b(78);
  const inAll = t >= b(78) && t < b(82);
  for (let i = 0; i < 10; i++) {
    const cd = cards[i];
    let show = false;
    if (inFlight) {
      const pose = mapFlightPose(t);
      const arrive = FLY0 + i * FLY_STEP + TRAVEL;
      const leave = FLY0 + (i + 1) * FLY_STEP;
      if (t >= arrive - 0.07 && t < leave + 0.02) {
        show = true;
        const pin = map.project(centers[i].pos, pose);
        const k = easeOutExpo(range(t, arrive - 0.07, arrive + 0.2));
        const out = range(t, leave - 0.06, leave + 0.02);
        const cx = pin.x, cy = pin.y - 250;
        cd.el.style.left = cx + 'px'; cd.el.style.top = (cy - 190) + 'px';
        cd.el.style.opacity = k * (1 - out);
        const f = Math.floor(t * FPS);
        const jit = t - arrive < 0.1 ? (hash(f + i) - 0.5) * 16 : 0;
        cd.el.style.transform = `translateX(calc(-50% + ${jit}px)) scale(${0.86 + 0.14 * k}) translateY(${(1 - k) * 18}px)`;
        cd.el.style.filter = out > 0 ? `blur(${out * 10}px)` : '';
        // línea de la tarjeta al pin
        const lx = cx, ly = cy + 2, len = Math.max(0, pin.y - ly);
        cd.line.style.left = lx + 'px'; cd.line.style.top = ly + 'px'; cd.line.style.height = len * k + 'px'; cd.line.style.opacity = k * (1 - out);
        coordEls[i].style.display = ''; coordEls[i].style.left = (pin.x + 22) + 'px'; coordEls[i].style.top = (pin.y + 14) + 'px';
        coordEls[i].style.opacity = range(t, arrive + 0.12, arrive + 0.3) * (1 - out);
      }
    }
    cd.el.style.display = show ? '' : 'none'; cd.line.style.display = show ? '' : 'none';
    if (!show) coordEls[i].style.display = 'none';
    // números de cada centro en la vista general
    const m = minis[i];
    if (inAll) {
      const p = map.project(centers[i].pos, overviewPose(t));
      const k = easeOutCubic(range(t, b(78) + 0.45 + i * 0.045, b(78) + 0.65 + i * 0.045)) * (1 - range(t, b(82) - 0.15, b(82)));
      m.set(p, k);
    } else m.set(null, 0);
  }
  legend.update(t, b(78) + 0.5, b(82));
}

function updateSpecUI(t, si) {
  for (const k of ['FR3', 'FR5']) {
    const sp = specs[k];
    const vis = t >= sp.t0 && t < sp.t1;
    for (const e of [sp.el, sp.lead, sp.dot]) e.style.display = vis ? '' : 'none';
    if (!vis) continue;
    const whState = SHOTS[si].shot.state?.(t);
    if (!whState) { for (const e of [sp.el, sp.lead, sp.dot]) e.style.display = 'none'; continue; }
    const anchor = wh.project(wh.robots[k].anchors.wrist, whState);
    const baseP = wh.project(wh.robots[k].anchors.base, whState, v3(0, 0.45, 0));
    const cx = clamp(baseP.x + 360, 980, 1560), cy = clamp(baseP.y - 430, 120, 560);
    const kIn = easeOutExpo(range(t, sp.t0, sp.t0 + 0.3));
    const out = range(t, sp.t1 - 0.15, sp.t1);
    sp.el.style.left = cx + 'px'; sp.el.style.top = cy + 'px';
    sp.el.style.opacity = kIn * (1 - out);
    sp.el.style.transform = `translateX(${(1 - kIn) * 30}px)`;
    sp.rows.forEach((r, j) => {
      const kr = easeOutExpo(range(t, sp.t0 + 0.15 + j * b(1.5), sp.t0 + 0.4 + j * b(1.5)));
      r.style.opacity = kr; r.style.transform = `translateY(${(1 - kr) * -12}px)`;
    });
    // línea guía desde la ficha hasta la muñeca del robot
    const x0 = cx, y0 = cy + 44;
    const dx = anchor.x - x0, dy = anchor.y - y0;
    const L = Math.hypot(dx, dy) * easeOutCubic(range(t, sp.t0 + 0.1, sp.t0 + 0.45));
    sp.lead.style.left = x0 + 'px'; sp.lead.style.top = y0 + 'px'; sp.lead.style.width = L + 'px';
    sp.lead.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`; sp.lead.style.opacity = 1 - out;
    sp.dot.style.left = anchor.x + 'px'; sp.dot.style.top = anchor.y + 'px'; sp.dot.style.opacity = range(t, sp.t0 + 0.4, sp.t0 + 0.5) * (1 - out);
  }
}

// ------------------------------------------------------------------ fotograma
function frameParams(t) {
  const si = shotAt(t);
  const S = SHOTS[si];
  const f = { a: { shot: S.shot, t, samples: S.samples(t) }, shutter: (S.shutter ? S.shutter(t) : 0.5) / FPS, blur: S.blur ? S.blur(t) : 0, seed: Math.floor(t * FPS) + 0.5,
    letterbox: S.letterbox || 0, flash: 0, glitch: 0, white: 0, fade: 1, grade: S.grade };
  // transición de entrada del plano actual (primera mitad) o del siguiente (segunda mitad)
  const nxt = SHOTS[si + 1];
  const tryTrans = (from, to) => {
    if (!to || !to.trans) return false;
    const d = to.trans.dur, c = to.t0;
    if (t >= c - d / 2 && t < c + d / 2) {
      const p = (t - (c - d / 2)) / d;
      f.a = { shot: from.shot, t, samples: 1 };
      f.b = { shot: to.shot, t, samples: 1 };
      f.trans = { kind: to.trans.kind, p, dir: to.trans.dir || [1, 0] };
      f.grade = p < 0.5 ? from.grade : to.grade;
      f.letterbox = p < 0.5 ? (from.letterbox || 0) : (to.letterbox || 0);
      return true;
    }
    return false;
  };
  if (!tryTrans(S, nxt) && si > 0) tryTrans(SHOTS[si - 1], S);
  // cortes con glitch/destello
  if (S.cut) {
    const lt = t - S.t0;
    if (lt < 0.1) {
      if (S.cut === 'glitch') { f.glitch = 1 - lt / 0.1; f.flash = 0.35 * (1 - lt / 0.07); }
      if (S.cut === 'flash') f.flash = 0.8 * (1 - lt / 0.1);
    }
  }
  // intro: fundido desde negro y letterbox que se abre en el estallido
  if (t < b(5)) f.fade = smooth(range(t, b(2.5), b(5)));
  if (t >= b(12) && t < b(12) + 0.25) f.letterbox = 1 - easeOutExpo((t - b(12)) / 0.25);
  if (t >= b(12) && t < b(12) + 0.12) f.flash = 1 - (t - b(12)) / 0.12;
  // glitch breve con cada titular
  const hlStarts = [b(1), b(8.2), b(16.5), b(28.4), b(49.05), b(54.4), b(100.25), b(103.15)];
  for (const h of hlStarts) if (t >= h && t < h + 0.07) f.glitch = Math.max(f.glitch, 0.35);
  // fin: fundido a negro muy al final
  if (t > DURATION - 0.5) f.fade = 1 - (t - (DURATION - 0.5)) / 0.5;
  return { f, si };
}

window.renderFrame = (frame) => {
  const t = frame / FPS;
  const { f, si } = frameParams(t);
  post.frame(f);
  ov.update(t, FPS);
  updateMapUI(t, si);
  updateSpecUI(t, si);
  const gl = renderer.getContext(); const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); // sincroniza la GPU
  return t;
};
window.info = { FPS, DURATION, frames: Math.ceil(DURATION * FPS), B };
window.__dbg = { wh, map, POSES, THREE };
window.ready = true;
