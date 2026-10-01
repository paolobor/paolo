import { Group, Mesh, ExtrudeGeometry, CylinderGeometry, Vector3, Quaternion } from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { profileGeometry, addExtrusionTangents, PROFILE, MM } from '../gl/geometry/profile.js';
import {
  CONNECTOR, capGeometry, rimGeometry, neckGeometry, plateGeometry, rodGeometry,
  screwHeadGeometry, screwSocketGeometry, screwShankGeometry, tNutGeometry,
} from '../gl/geometry/connector.js';
import {
  angleBracketGeometry, footPadGeometry, footDiscGeometry, footStudGeometry, footNutGeometry, footPlateGeometry,
  robotPlateGeometry, roundedCylinder, capDisc, gripperBodyGeometry, gripperFingerGeometry,
} from '../gl/geometry/bench.js';
import { flattenCaps, filletPolygon, roundedRectPts, shapeFromPts, pathFromPts, circlePts } from '../gl/geometry/shapes.js';
import glyphData from '../assets/saira-glyphs.json';
import { BRAND, BRAND_FACE, brandArmDirs, armQuaternion } from './brand.js';
import brandGlyphs from '../assets/archivo-glyphs.json';

// Modelo 3D de FDI MODULAR (unidades: 1 = 10 mm, eje Y arriba).
// "montaje": escuadra cúbica + perfiles 40x40 ranura 10 + tornillería,
//            origen en el centro de la cara superior de la tapa.
// "rotulo":  letras cromadas FDI MODULAR, base en y=0, mirando a +Z.
// "bancada": bancada para cobot 800x800x750 cuya esquina 0 coincide con el montaje.

export const LAYOUT = { lengthH: 12, lengthV: 10, gap: 0.05 };
export const BENCH = { W: 76, D: 76, floor: -74, footH: 4.5, stretcherY: -56 };

const s = MM;
const gap = LAYOUT.gap;
const topOfH = -(CONNECTOR.plateT + 0.12) * s; // las pletinas apoyan sobre los perfiles
const hy = topOfH - PROFILE / 2;
const vTop = CONNECTOR.neckBottom * s;
const sx = CONNECTOR.screwX * s;

const named = (mesh, name) => { mesh.name = name; return mesh; };

// Geometrías compartidas (una sola copia en el .glb aunque se repitan las piezas)
let G = null;
function geos() {
  if (G) return G;
  G = {
    cap: capGeometry(), rim: rimGeometry(), neck: neckGeometry(), plate: plateGeometry(),
    rod: rodGeometry(-CONNECTOR.capH - CONNECTOR.rimH - CONNECTOR.neckBottom, 2.25),
    head: screwHeadGeometry(), socket: screwSocketGeometry(),
    shankLong: screwShankGeometry(16), shankShort: screwShankGeometry(10), nut: tNutGeometry(20),
  };
  return G;
}

function makeConnector(m, name = 'escuadra') {
  const g = geos();
  const connector = new Group();
  connector.name = name;
  const plateZ = named(new Mesh(g.plate, m.steel), `${name}-pletina-z`);
  plateZ.rotation.y = -Math.PI / 2;
  connector.add(
    named(new Mesh(g.cap, m.steel), `${name}-tapa`),
    named(new Mesh(g.rim, m.orange), `${name}-filo-naranja`),
    named(new Mesh(g.neck, m.steel), `${name}-cuello`),
    named(new Mesh(g.plate, m.steel), `${name}-pletina-x`),
    plateZ,
  );
  const off = (CONNECTOR.neck / 2 - CONNECTOR.notch / 2) * s;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, z], i) => {
    const rod = named(new Mesh(g.rod, m.rod), `${name}-varilla-${i + 1}`);
    rod.position.set(x * off, vTop, z * off);
    connector.add(rod);
  });
  return connector;
}

// Tornillo Allen DIN 7984 M6. "giro" rota alrededor del eje del tornillo (Y local).
function makeScrew(m, name, long = true) {
  const g = geos();
  const screw = new Group();
  screw.name = name;
  const spin = new Group();
  spin.name = `${name}-giro`;
  spin.add(
    named(new Mesh(g.head, m.screw), `${name}-cabeza`),
    named(new Mesh(g.socket, m.socket), `${name}-hexagono`),
    named(new Mesh(long ? g.shankLong : g.shankShort, m.screw), `${name}-rosca`),
  );
  screw.add(spin);
  return screw;
}

// Los cuatro tornillos de una esquina (posiciones locales de la escuadra)
function cornerScrews(m, prefix) {
  const plateTop = -0.12 * s;
  const face = (CONNECTOR.neck / 2) * s;
  const sideY = CONNECTOR.sideScrewY * s;
  const sX = makeScrew(m, `${prefix}-x`);
  sX.position.set(sx, plateTop, 0);
  const sZ = makeScrew(m, `${prefix}-z`);
  sZ.position.set(0, plateTop, sx);
  const sNX = makeScrew(m, `${prefix}-nx`, false);
  sNX.rotation.z = Math.PI / 2; // eje -> -X
  sNX.position.set(-face, sideY, 0);
  const sNZ = makeScrew(m, `${prefix}-nz`, false);
  sNZ.rotation.x = -Math.PI / 2; // eje -> -Z
  sNZ.position.set(0, sideY, -face);
  return [sX, sZ, sNX, sNZ];
}

// Perfil 40x40 ranura 10 dentro de un grupo; la extrusión va por +Z local.
function makeProfile(m, name, length, nutsAt = []) {
  const g = new Group();
  g.name = name;
  g.add(named(new Mesh(profileGeometry(length), [m.aluminiumCut, m.aluminium]), `${name}-perfil-40x40-L${Math.round(length * 10)}`));
  nutsAt.forEach((z, i) => {
    const nut = named(new Mesh(geos().nut, m.nut), `${name}-tuerca-martillo-${i + 1}`);
    nut.position.z = z;
    g.add(nut);
  });
  return g;
}

export function buildAssembly(m, { lengthH = LAYOUT.lengthH, lengthV = LAYOUT.lengthV } = {}) {
  const root = new Group();
  root.name = 'montaje';
  root.add(makeConnector(m, 'escuadra'));

  const nut = sx - (PROFILE / 2 + gap);
  const pV = makeProfile(m, 'perfil-vertical', lengthV);
  pV.rotation.x = Math.PI / 2; // +Z -> -Y
  pV.position.set(0, vTop, 0);
  const pX = makeProfile(m, 'perfil-x', lengthH, [nut]);
  pX.rotation.y = Math.PI / 2; // +Z -> +X
  pX.position.set(PROFILE / 2 + gap, hy, 0);
  const pZ = makeProfile(m, 'perfil-z', lengthH, [nut]);
  pZ.position.set(0, hy, PROFILE / 2 + gap);
  root.add(pV, pX, pZ);

  const [sX, sZ, sNX, sNZ] = cornerScrews(m, 'tornillo');
  root.add(sX, sZ, sNX, sNZ);

  root.userData.meta = { topOfH, hy, vTop, lengthH, lengthV, gap };
  return root;
}

// ---------------------------------------------------------------------------
// Bancada para cobot (800 x 800 x 750 mm) con cobot de 6 ejes

function makeBracket(m, name) {
  const g = new Group();
  g.name = name;
  if (!G.bracket) G.bracket = angleBracketGeometry();
  g.add(named(new Mesh(G.bracket, m.cast), `${name}-cuerpo`));
  // un tornillo por ala, centrado en la ranura
  const a = makeScrew(m, `${name}-tornillo-a`, false);
  a.position.set(2.3, 0.5, 0);
  const b = makeScrew(m, `${name}-tornillo-b`, false);
  b.rotation.z = -Math.PI / 2; // eje -> +X
  b.position.set(0.5, 2.3, 0);
  g.add(a, b);
  return g;
}

function makeFoot(m, name) {
  if (!G.foot) G.foot = { pad: footPadGeometry(), disc: footDiscGeometry(), stud: footStudGeometry(), nut: footNutGeometry(), plate: footPlateGeometry() };
  const f = G.foot;
  const g = new Group();
  g.name = name;
  const spin = new Group(); // gira al roscarse
  spin.name = `${name}-giro`;
  spin.add(named(new Mesh(f.stud, m.zinc), `${name}-esparrago`), named(new Mesh(f.nut, m.zinc), `${name}-tuerca`));
  g.add(
    named(new Mesh(f.pad, m.rubber), `${name}-goma`),
    named(new Mesh(f.disc, m.zinc), `${name}-plato`),
    named(new Mesh(f.plate, m.zinc), `${name}-placa`),
    spin,
  );
  return g;
}

function cyl(geo, mat, name, axis = 'y') {
  const mesh = named(new Mesh(geo, mat), name);
  if (axis === 'x') mesh.rotation.z = -Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  return mesh;
}

export function buildCobot(m) {
  const W = m.cobotWhite, K = m.cobotGrey;
  const root = new Group();
  root.name = 'cobot';
  const base = cyl(roundedCylinder(75, 105, 8), W, 'cobot-base');
  base.position.y = 0.2;
  root.add(cyl(capDisc(95, 22), K, 'cobot-brida'), base);
  const ring = cyl(capDisc(77, 12), K, 'cobot-anillo-base');
  ring.position.y = 1.2;
  root.add(ring);

  const j1 = new Group(); j1.name = 'cobot-j1'; j1.position.y = 1.32; root.add(j1);
  j1.add(cyl(roundedCylinder(70, 95, 8), W, 'cobot-hombro'));
  const sh = cyl(roundedCylinder(70, 165, 8), W, 'cobot-eje-2', 'x');
  sh.position.set(-0.45, 1.55, 0);
  const shCap = cyl(capDisc(60, 4), K, 'cobot-tapa-2', 'x');
  shCap.position.set(-0.49, 1.55, 0);
  j1.add(sh, shCap);

  const j2 = new Group(); j2.name = 'cobot-j2'; j2.position.set(1.2, 1.55, 0); j1.add(j2);
  const j2h = cyl(roundedCylinder(66, 130, 8), W, 'cobot-carcasa-2', 'x');
  const j2c = cyl(capDisc(56, 4), K, 'cobot-tapa-2b', 'x'); j2c.position.x = 1.3;
  const arm = cyl(roundedCylinder(44, 425, 4), W, 'cobot-brazo'); arm.position.x = 0.65;
  const elbow = cyl(roundedCylinder(60, 120, 8), W, 'cobot-codo', 'x'); elbow.position.set(0.05, 42.5, 0);
  const elbowCap = cyl(capDisc(50, 4), K, 'cobot-tapa-3', 'x'); elbowCap.position.set(1.25, 42.5, 0);
  j2.add(j2h, j2c, arm, elbow, elbowCap);

  const j3 = new Group(); j3.name = 'cobot-j3'; j3.position.set(0.05, 42.5, 0); j2.add(j3);
  const fh = cyl(roundedCylinder(58, 115, 8), W, 'cobot-carcasa-3', 'x'); fh.position.x = -1.15;
  const fc = cyl(capDisc(48, 4), K, 'cobot-tapa-3b', 'x'); fc.position.x = -1.19;
  const fore = cyl(roundedCylinder(37, 392, 4), W, 'cobot-antebrazo'); fore.position.x = -0.575;
  const w1 = cyl(roundedCylinder(46, 105, 6), W, 'cobot-muneca-1', 'x'); w1.position.set(-1.1, 39.2, 0);
  const w1c = cyl(capDisc(38, 4), K, 'cobot-tapa-4', 'x'); w1c.position.set(-1.14, 39.2, 0);
  j3.add(fh, fc, fore, w1, w1c);

  const j4 = new Group(); j4.name = 'cobot-j4'; j4.position.set(-0.575, 39.2, 0); j3.add(j4);
  const w2l = cyl(roundedCylinder(45, 110, 6), W, 'cobot-muneca-2'); w2l.position.y = 0.2;
  const w2 = cyl(roundedCylinder(45, 100, 6), W, 'cobot-carcasa-5', 'z'); w2.position.set(0, 1.3, -0.5);
  const w2c = cyl(capDisc(37, 4), K, 'cobot-tapa-5', 'z'); w2c.position.set(0, 1.3, 0.5);
  j4.add(w2l, w2, w2c);

  const j5 = new Group(); j5.name = 'cobot-j5'; j5.position.set(0, 1.3, 0); j4.add(j5);
  const w3 = cyl(roundedCylinder(43, 95, 6), W, 'cobot-muneca-3');
  w3.position.y = 0.3;
  j5.add(w3);

  const j6 = new Group(); j6.name = 'cobot-j6'; j6.position.set(0, 1.25, 0); j5.add(j6);
  j6.add(cyl(capDisc(32, 12), K, 'cobot-brida-herramienta'));
  const body = named(new Mesh(gripperBodyGeometry(), K), 'pinza-cuerpo'); body.position.y = 0.12;
  const f1 = named(new Mesh(gripperFingerGeometry(), m.aluminium), 'pinza-dedo-1'); f1.position.set(0.24, 0.82, 0);
  const f2 = named(new Mesh(gripperFingerGeometry(), m.aluminium), 'pinza-dedo-2'); f2.position.set(-0.24, 0.82, 0);
  j6.add(body, f1, f2);

  // Postura de trabajo (la web la anima a partir de aquí)
  j1.rotation.y = 2.36;
  j2.rotation.x = 0.25;
  j3.rotation.x = 2.51;
  j4.rotation.x = 0.38; // herramienta vertical, a ~5 cm sobre el plano de la bancada
  return root;
}

export function buildBench(m) {
  geos();
  const { W, D, floor, footH, stretcherY } = BENCH;
  const root = new Group();
  root.name = 'bancada';
  const corners = [[0, 0, 0], [W, 0, -Math.PI / 2], [W, D, Math.PI], [0, D, Math.PI / 2]];

  // Esquinas: escuadra cúbica + 4 tornillos, girada hacia el interior
  corners.forEach(([x, z, rot], k) => {
    const c = new Group();
    c.name = `esquina-${k}`;
    c.position.set(x, 0, z);
    c.rotation.y = rot;
    c.add(makeConnector(m, `esquina-${k}-escuadra`), ...cornerScrews(m, `esquina-${k}-tornillo`));
    root.add(c);
  });

  const L = W - PROFILE - 2 * gap; // vigas entre escuadras
  const nutA = sx - (PROFILE / 2 + gap);
  const beam = (name, x, y, z, alongX, nuts = []) => {
    const p = makeProfile(m, name, L, nuts);
    if (alongX) p.rotation.y = Math.PI / 2;
    p.position.set(x, y, z);
    root.add(p);
    return p;
  };
  const h0 = PROFILE / 2 + gap;
  beam('viga-x-0', h0, hy, 0, true, [nutA, L - nutA]);
  beam('viga-x-1', h0, hy, D, true, [nutA, L - nutA]);
  beam('viga-z-0', 0, hy, h0, false, [nutA, L - nutA]);
  beam('viga-z-1', W, hy, h0, false, [nutA, L - nutA]);

  // Patas y pies niveladores
  const legLen = vTop - (floor + footH);
  corners.forEach(([x, z], k) => {
    const leg = makeProfile(m, `pata-${k}`, legLen);
    leg.rotation.x = Math.PI / 2;
    leg.position.set(x, vTop, z);
    const foot = makeFoot(m, `pie-${k}`);
    foot.position.set(x, floor, z);
    root.add(leg, foot);
  });

  // Travesaños inferiores con escuadras angulares
  beam('travesano-x-0', h0, stretcherY, 0, true);
  beam('travesano-x-1', h0, stretcherY, D, true);
  beam('travesano-z-0', 0, stretcherY, h0, false);
  beam('travesano-z-1', W, stretcherY, h0, false);
  const top = stretcherY + PROFILE / 2;
  const br = [];
  const bracket = (name, x, y, z, ry = 0, rx = 0, rz = 0) => {
    const b = makeBracket(m, name);
    b.position.set(x, y, z);
    b.rotation.set(rx, ry, rz, 'YXZ');
    root.add(b);
    br.push(b);
  };
  let n = 0;
  for (const z of [0, D]) {
    bracket(`escuadra-angular-${n++}`, PROFILE / 2, top, z, 0);
    bracket(`escuadra-angular-${n++}`, W - PROFILE / 2, top, z, Math.PI);
  }
  for (const x of [0, W]) {
    bracket(`escuadra-angular-${n++}`, x, top, PROFILE / 2, -Math.PI / 2);
    bracket(`escuadra-angular-${n++}`, x, top, D - PROFILE / 2, Math.PI / 2);
  }

  // Vigas de apoyo de la placa del robot (unidas por debajo con escuadras)
  const plateHalf = 12.8;
  const zs = [D / 2 - plateHalf, D / 2 + plateHalf];
  zs.forEach((z, i) => {
    beam(`viga-robot-${i}`, h0, hy, z, true, [W / 2 - plateHalf - h0, W / 2 + plateHalf - h0]);
    bracket(`escuadra-angular-${n++}`, PROFILE / 2, hy - PROFILE / 2, z, 0, Math.PI);
    bracket(`escuadra-angular-${n++}`, W - PROFILE / 2, hy - PROFILE / 2, z, 0, 0, Math.PI);
  });

  // Placa de anclaje del robot con sus tornillos
  const plate = new Group();
  plate.name = 'placa-robot';
  plate.position.set(W / 2, topOfH, D / 2);
  plate.add(named(new Mesh(robotPlateGeometry(), m.blackAlu), 'placa-robot-cuerpo'));
  let t = 0;
  for (const dx of [-plateHalf, plateHalf]) for (const dz of [-plateHalf, plateHalf]) {
    const sc = makeScrew(m, `placa-robot-tornillo-${t++}`, true);
    sc.position.set(dx, 2.0, dz);
    plate.add(sc);
  }
  root.add(plate);

  const cobot = buildCobot(m);
  cobot.position.set(W / 2, topOfH + 2.0, D / 2);
  root.add(cobot);

  root.userData.meta = { W, D, floor, footH, stretcherY, legLen, beamLength: L, topOfH, hy, vTop, plateTop: topOfH + 2.0 };
  return root;
}

// ---------------------------------------------------------------------------

// Rótulo extruido letra a letra. Cada letra va en "letra-i-X" con su malla "-cromo".
function wordmark(mat, o) {
  const font = new Font(o.glyphs);
  const em = o.capHeight / (o.glyphs.capHeight / o.glyphs.resolution);
  const S = 10; // se modela a x10 para la precisión del suavizado de normales
  const { capHeight, depth, bevelT, bevelS, tracking } = o;
  // Curvatura leve de la cara frontal: el reflejo recorre el horizonte del estudio
  const front = (px, py) => new Vector3(0, (o.curve * (py / S - capHeight * 0.5)) / capHeight, 1).normalize();
  const root = new Group();
  root.name = o.name;
  let x = 0;
  [...'FDI MODULAR'].forEach((ch, i) => {
    if (ch === ' ') { x += em * o.space; return; }
    let g = new ExtrudeGeometry(font.generateShapes(ch, em * S), {
      depth: (depth - 2 * bevelT) * S,
      bevelEnabled: true,
      bevelThickness: bevelT * S,
      bevelSize: bevelS * S,
      bevelOffset: o.bevelOffset * S,
      bevelSegments: o.bevelSegments,
      curveSegments: 12,
    });
    g = flattenCaps(toCreasedNormals(g, (o.crease * Math.PI) / 180), front);
    g.scale(1 / S, 1 / S, 1 / S);
    g.translate(0, 0, bevelT - depth / 2); // caras: trasera -depth/2, frontal +depth/2
    const holder = new Group();
    holder.name = `letra-${i}-${ch}`;
    holder.position.x = x;
    const mesh = new Mesh(g, mat);
    mesh.name = `letra-${i}-${ch}-cromo`;
    holder.add(mesh);
    root.add(holder);
    x += o.glyphs.glyphs[ch].ha * (em / o.glyphs.resolution) + tracking * em;
  });
  root.userData.meta = { width: x - tracking * em, capHeight, em, depth };
  return root;
}

// Rótulo cromado del montaje (Saira Expanded ExtraBold, bisel redondeado)
export function buildWordmark(chrome) {
  return wordmark(chrome, {
    glyphs: glyphData, name: 'rotulo', capHeight: 2.6, depth: 0.5, tracking: 0.03, space: 0.28,
    bevelT: 0.07, bevelS: 0.05, bevelOffset: -0.012, bevelSegments: 3, crease: 40, curve: 0.34,
  });
}

// Rótulo del logotipo de marca (Archivo Black, letras en bloque con chaflán a 45°)
export function buildBrandWordmark(mat) {
  return wordmark(mat, {
    glyphs: brandGlyphs, name: 'rotulo-marca', capHeight: 2.6, depth: 0.62, tracking: 0.045, space: 0.3,
    bevelT: 0.12, bevelS: 0.1, bevelOffset: -0.1, bevelSegments: 1, crease: 30, curve: 0.22,
  });
}

// ---------------------------------------------------------------------------
// Símbolo de marca: la "Y" del logotipo es el propio montaje mirando de frente.
// Coordenadas del montaje con origen en el cruce de los ejes de los perfiles:
// el anillo naranja mira por +Y (donde estaba la cara cuadrada de la escuadra),
// los brazos superiores siguen a los perfiles horizontales (+X y +Z, abiertos
// unos grados para dar la "Y") y el inferior es el perfil vertical desplegado
// hacia abajo en el plano. Cada barra va girada 45° sobre su eje (se ven dos caras).
function barGeometry(lengthMm) {
  // Barra de sección 40x40 con aristas redondeadas, desde el centro del símbolo
  const b = 1.1;
  let g = new ExtrudeGeometry(shapeFromPts(filletPolygon(roundedRectPts(40, 40, 4.5), 6)), {
    depth: lengthMm - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 3, steps: 1,
  });
  g.translate(0, 0, b);
  g = flattenCaps(toCreasedNormals(g, (40 * Math.PI) / 180));
  addExtrusionTangents(g);
  g.scale(MM, MM, MM);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

function ringGeometry() {
  const { ringR, ringr, ringT } = BRAND;
  const b = 0.32 / MM;
  const shape = shapeFromPts(circlePts(ringR / MM - b, 120));
  shape.holes.push(pathFromPts(circlePts(ringr / MM + b, 96)));
  let g = new ExtrudeGeometry(shape, {
    depth: ringT / MM - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: 0, bevelSegments: 6, curveSegments: 1,
  });
  g.translate(0, 0, -ringT / MM / 2 + b);
  g = toCreasedNormals(g, (60 * Math.PI) / 180);
  g.scale(MM, MM, MM);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

export function buildBrandMark(m) {
  const root = new Group();
  root.name = 'marca';
  const bars = new Group();
  bars.name = 'marca-barras';
  const dirs = brandArmDirs();
  for (const [k, len] of [['izq', BRAND.arm], ['der', BRAND.arm], ['inf', BRAND.armV]]) {
    const g = new Group();
    g.name = `marca-brazo-${k}`;
    g.quaternion.copy(armQuaternion(dirs[k]));
    const roll = new Group(); // giro de 45° sobre el eje de la barra
    roll.name = `marca-brazo-${k}-giro`;
    roll.rotation.z = Math.PI / 4;
    roll.add(named(new Mesh(barGeometry(len / MM), m.brandMetal), `marca-brazo-${k}-barra`));
    g.add(roll);
    bars.add(g);
  }
  const ring = new Group();
  ring.name = 'marca-anillo';
  ring.add(named(new Mesh(ringGeometry(), m.brandOrange), 'marca-anillo-naranja'));
  // Disco metálico que se ve por el hueco del anillo
  const disc = named(new Mesh(new CylinderGeometry(BRAND.ringr + 0.12, BRAND.ringr + 0.12, 0.3, 72), m.brandMetal), 'marca-anillo-centro');
  disc.rotation.x = Math.PI / 2; // eje del cilindro (Y) -> Z del anillo
  disc.position.z = -0.42;
  ring.add(disc);
  ring.position.copy(BRAND_FACE).multiplyScalar(BRAND.ringOff);
  ring.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), BRAND_FACE));
  root.add(bars, ring);
  root.userData.meta = { ...BRAND };
  return root;
}
