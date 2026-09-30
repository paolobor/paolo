// Cobot de 6 ejes estilo FAIRINO (eslabones blancos, anillos naranjas) construido de forma procedural.
// Las dimensiones siguen los parámetros DH aproximados de FR3 / FR5.
import * as THREE from 'three';

export const SPECS = {
  FR5: { d1: 0.152, a2: 0.425, a3: 0.395, d4: 0.102, d5: 0.102, d6: 0.1, r: 0.062, tube: 0.046, label: 'FR5' },
  FR3: { d1: 0.140, a2: 0.280, a3: 0.240, d4: 0.090, d5: 0.090, d6: 0.09, r: 0.052, tube: 0.038, label: 'FR3' },
};

const WHITE = () => new THREE.MeshPhysicalMaterial({ color: 0xf1f1ee, roughness: 0.32, metalness: 0.0, clearcoat: 0.7, clearcoatRoughness: 0.18 });
const ORANGE = () => new THREE.MeshPhysicalMaterial({ color: 0xff5a0a, roughness: 0.35, emissive: 0xff3c00, emissiveIntensity: 0.18, clearcoat: 0.5 });
const CAP = () => new THREE.MeshPhysicalMaterial({ color: 0xcfd0d0, roughness: 0.4, clearcoat: 0.4 });
const DARK = () => new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.45, metalness: 0.5 });
const STEEL = () => new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.3, metalness: 0.9 });

// cilindro con aristas redondeadas (perfil de torno), eje Y
function roundedCyl(r, len, bevel, seg = 48) {
  const pts = [];
  const b = Math.min(bevel, r * 0.5, len * 0.5);
  pts.push(new THREE.Vector2(0, -len / 2));
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI / 2; pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, -len / 2 + b + Math.sin(a) * b)); }
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, len / 2 - b + Math.sin(a) * b)); }
  pts.push(new THREE.Vector2(0, len / 2));
  return new THREE.LatheGeometry(pts, seg);
}

// carcasa de articulación: cilindro blanco + banda naranja + tapa gris, eje local Y
function housing(mats, r, len, { capBoth = true, band = true } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(roundedCyl(r, len, r * 0.18), mats.white); body.castShadow = true; body.receiveShadow = true; g.add(body);
  const ends = capBoth ? [1, -1] : [1];
  for (const s of ends) {
    if (band) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.012, r * 1.012, r * 0.16, 48, 1, true), mats.orange);
      ring.position.y = s * (len / 2 - r * 0.2); g.add(ring);
    }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.004, 48), mats.cap);
    cap.position.y = s * (len / 2 + 0.0005); g.add(cap);
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.22, 0.005, 32), mats.white);
    dot.position.y = s * (len / 2 + 0.001); g.add(dot);
  }
  return g;
}

function tube(mats, r0, r1, len) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 48, 1, true), mats.white);
  m.position.y = len / 2; m.castShadow = true; m.receiveShadow = true;
  return m;
}

function logoTexture(label) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height);
  x.fillStyle = 'rgba(40,42,46,0.92)';
  x.font = '600 132px Michroma, sans-serif';
  x.textBaseline = 'middle'; x.textAlign = 'center';
  x.save(); x.translate(512, 128); x.scale(1.05, 0.9);
  // letras espaciadas estilo logotipo
  const txt = 'FAIRINO'; let w = 0; const sp = 28;
  for (const ch of txt) w += x.measureText(ch).width + sp;
  let px = -w / 2;
  for (const ch of txt) { const cw = x.measureText(ch).width; x.fillText(ch, px + cw / 2, 0); px += cw + sp; }
  x.restore();
  x.fillStyle = 'rgba(255,90,10,0.95)'; x.fillRect(980, 60, 12, 136);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function createCobot(kind = 'FR5') {
  const S = SPECS[kind];
  const mats = { white: WHITE(), orange: ORANGE(), cap: CAP(), dark: DARK(), steel: STEEL() };
  const root = new THREE.Group();
  const r = S.r, tr = S.tube;

  // base (pie ensanchado) + etiqueta amarilla
  const baseProfile = [new THREE.Vector2(0, 0), new THREE.Vector2(r * 1.55, 0), new THREE.Vector2(r * 1.55, 0.008), new THREE.Vector2(r * 1.35, 0.02),
    new THREE.Vector2(r * 1.08, 0.075), new THREE.Vector2(r * 1.05, 0.09), new THREE.Vector2(0, 0.09)];
  const base = new THREE.Mesh(new THREE.LatheGeometry(baseProfile, 64), mats.white); base.castShadow = true; base.receiveShadow = true; root.add(base);
  const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.07, r * 1.07, 0.012, 64), mats.orange); baseRing.position.y = 0.095; root.add(baseRing);
  const warn = new THREE.Mesh(new THREE.CircleGeometry(r * 0.28, 3), new THREE.MeshStandardMaterial({ color: 0xf5c400, roughness: 0.5, side: THREE.DoubleSide }));
  warn.position.set(0, 0.05, r * 1.23); warn.rotation.set(-0.26, 0, Math.PI / 2 * 0 + Math.PI / 6); root.add(warn);

  // J1: giro vertical
  const j1 = new THREE.Group(); j1.position.y = 0.101; root.add(j1);
  const j1h = new THREE.Mesh(roundedCyl(r, S.d1 - 0.02, r * 0.15), mats.white); j1h.position.y = (S.d1 - 0.02) / 2 - 0.005; j1h.castShadow = true; j1.add(j1h);

  // J2: hombro (eje X)
  const j2 = new THREE.Group(); j2.position.set(0, S.d1 - 0.01, 0); j1.add(j2);
  const sh = housing(mats, r, r * 2.25); sh.rotation.z = Math.PI / 2; sh.position.x = r * 0.55; j2.add(sh);
  const ua = new THREE.Group(); ua.position.x = r * 1.25; j2.add(ua);
  const upper = tube(mats, tr, tr * 0.93, S.a2); ua.add(upper);
  // logotipo a lo largo del brazo
  const logo = new THREE.Mesh(new THREE.CylinderGeometry(tr * 1.004, tr * 1.004, S.a2 * 0.62, 48, 1, true, -0.7, 1.4),
    new THREE.MeshBasicMaterial({ map: logoTexture(), transparent: true, depthWrite: false }));
  logo.position.y = S.a2 * 0.52; logo.rotation.y = Math.PI / 2 + Math.PI;
  logo.material.map.center.set(0.5, 0.5); logo.material.map.rotation = -Math.PI / 2;
  ua.add(logo);

  // J3: codo
  const j3 = new THREE.Group(); j3.position.set(0, S.a2, 0); j2.add(j3);
  const el = housing(mats, r * 0.86, r * 2.1); el.rotation.z = Math.PI / 2; el.position.x = r * 0.5; j3.add(el);
  const fa = new THREE.Group(); fa.position.x = -r * 0.25; j3.add(fa);
  const fore = tube(mats, tr * 0.9, tr * 0.8, S.a3); fa.add(fore);

  // J4: muñeca 1 (eje X)
  const j4 = new THREE.Group(); j4.position.set(0, S.a3, 0); j3.add(j4);
  const w1 = housing(mats, r * 0.68, r * 1.85); w1.rotation.z = Math.PI / 2; w1.position.x = -r * 0.45; j4.add(w1);
  // J5: muñeca 2 (eje Y local, desplazado)
  const j5 = new THREE.Group(); j5.position.set(-r * 1.25, S.d4 * 0.55, 0); j4.add(j5);
  const w2 = housing(mats, r * 0.66, r * 1.8); w2.position.y = 0.0; j5.add(w2);
  const w2link = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, S.d4 * 0.55, 32), mats.white); w2link.position.set(0, -S.d4 * 0.28, 0); j5.add(w2link);
  // J6: brida (eje Z local)
  const j6 = new THREE.Group(); j6.position.set(0, r * 0.2, r * 1.1); j5.add(j6);
  const w3 = housing(mats, r * 0.64, r * 1.3, { capBoth: false }); w3.rotation.x = Math.PI / 2; j6.add(w3);
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, 0.012, 32), mats.steel); flange.rotation.x = Math.PI / 2; flange.position.z = r * 0.7; j6.add(flange);

  // pinza de dos dedos
  const tool = new THREE.Group(); tool.position.z = r * 0.72; j6.add(tool);
  const gb = new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, r * 0.8, r * 1.1), mats.dark); gb.position.z = r * 0.55; gb.castShadow = true; tool.add(gb);
  const gled = new THREE.Mesh(new THREE.BoxGeometry(r * 0.5, r * 0.06, 0.002), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 2.2, 0.8) }));
  gled.position.set(0, 0, r * 0.2); gled.position.y = r * 0.405; gled.rotation.x = -Math.PI / 2; tool.add(gled);
  const fingers = [];
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(r * 0.18, r * 0.5, r * 0.75), mats.dark);
    f.position.set(s * r * 0.3, 0, r * 1.45); f.castShadow = true; tool.add(f); fingers.push({ m: f, s });
  }

  const joints = [j1, j2, j3, j4, j5, j6];
  function setPose(q, grip = 0) {
    j1.rotation.y = q[0]; j2.rotation.x = q[1]; j3.rotation.x = q[2]; j4.rotation.x = q[3]; j5.rotation.y = q[4]; j6.rotation.z = q[5];
    for (const f of fingers) f.m.position.x = f.s * r * (0.78 - 0.33 * grip);
  }
  setPose([0, 0, 0, 0, 0, 0]);

  // puntos de interés para tarjetas
  const anchors = { elbow: j3, wrist: j4, tool, base: root, shoulder: j2 };
  return { root, setPose, joints, anchors, spec: S, mats };
}
