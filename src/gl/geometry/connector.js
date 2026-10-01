import { ExtrudeGeometry, LatheGeometry, ShapeGeometry, Shape, BufferGeometry, Float32BufferAttribute, Vector2 } from 'three';
import { toCreasedNormals, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { filletPolygon, roundedRectPts, shapeFromPts, pathFromPts, circlePts, flattenCaps } from './shapes.js';
import { MM } from './profile.js';

// Todas las piezas se modelan en mm y se escalan a unidades de escena (1 = 10 mm).
const DEG = Math.PI / 180;

function finish(g, crease = 40) {
  g = toCreasedNormals(g, crease * DEG);
  g.scale(MM, MM, MM);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

// Extruye una forma del plano XY hacia +Y (pasa a ser horizontal), de y0 a y1 (mm).
function slab(shape, y0, y1, bevel, segs = 4, crease = 40) {
  const h = y1 - y0;
  const g = new ExtrudeGeometry(shape, {
    depth: Math.max(0.01, h - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: segs,
    curveSegments: 10,
  });
  g.translate(0, 0, bevel);
  let out = flattenCaps(toCreasedNormals(g, crease * DEG));
  out.rotateX(-Math.PI / 2); // z -> y, y -> -z
  out.translate(0, y0, 0);
  out.scale(MM, MM, MM);
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

// Cotas de la escuadra (mm). Origen = centro de la cara superior de la tapa.
export const CONNECTOR = {
  cap: 36,
  capR: 5.5,
  capH: 6.2,
  rimH: 1.35,
  neck: 26,
  notch: 6.2,
  neckBottom: -26, // cara superior del perfil vertical
  plateW: 13,
  plateT: 4.2,
  plateFrom: 15.5,
  plateTo: 43.5,
  screwX: 35.2,
  sideScrewY: -16.6,
};

export function capGeometry() {
  const c = CONNECTOR;
  return slab(shapeFromPts(filletPolygon(roundedRectPts(c.cap, c.cap, c.capR), 10)), -c.capH, 0, 0.9, 5);
}

export function rimGeometry() {
  const c = CONNECTOR;
  const s = c.cap - 0.35;
  return slab(shapeFromPts(filletPolygon(roundedRectPts(s, s, c.capR - 0.2), 10)), -c.capH - c.rimH, -c.capH + 0.05, 0.28, 2);
}

export function neckGeometry() {
  const c = CONNECTOR;
  const h = c.neck / 2, n = c.notch;
  const r = 0.5;
  // Cuadrado con una muesca en cada esquina (deja ver la varilla roscada)
  const pts = [];
  const quad = [
    { x: h, y: -(h - n), r },
    { x: h, y: h - n, r },
    { x: h - n, y: h - n, r: 0.3 },
    { x: h - n, y: h, r },
  ];
  for (let k = 0; k < 4; k++) {
    for (const p of quad) {
      let { x, y } = p;
      for (let i = 0; i < k; i++) [x, y] = [-y, x];
      pts.push({ x, y, r: p.r });
    }
  }
  return slab(shapeFromPts(filletPolygon(pts, 3)), c.neckBottom, -c.capH - c.rimH + 0.2, 0.35, 2);
}

export function plateGeometry() {
  const c = CONNECTOR;
  const w = c.plateW / 2;
  const pts = [
    { x: c.plateFrom, y: -w, r: 0 },
    { x: c.plateTo, y: -w, r: 3.2 },
    { x: c.plateTo, y: w, r: 3.2 },
    { x: c.plateFrom, y: w, r: 0 },
  ];
  return slab(shapeFromPts(filletPolygon(pts, 6)), -c.plateT - 0.12, -0.12, 0.55, 3);
}

// Varilla roscada (visible en las muescas del cuello)
export function rodGeometry(length = 18.4, r = 2.3) {
  const pts = [new Vector2(0, 0)];
  const pitch = 0.9;
  pts.push(new Vector2(r - 0.4, 0));
  for (let y = 0.3; y < length - 0.3; y += pitch) {
    pts.push(new Vector2(r, y));
    pts.push(new Vector2(r - 0.38, y + pitch / 2));
  }
  pts.push(new Vector2(r - 0.4, length));
  pts.push(new Vector2(0, length));
  const g = new LatheGeometry(pts, 18);
  return finish(g, 70);
}

// Tornillo Allen de cabeza baja (DIN 7984 M6): cabeza Ø10 x 4, hexágono interior 4
export const SCREW = { R: 5, H: 4, hexR: 4 / Math.sqrt(3), socketDepth: 2.6 };
export function screwHeadGeometry() {
  // Cabeza torneada: chaflán superior, cara plana y avellanado de entrada al hexágono
  const { R, H, hexR } = SCREW;
  const rcs = hexR + 0.38;
  const pts = [
    new Vector2(2.9, 0), new Vector2(R - 0.15, 0), new Vector2(R, 0.15),
    new Vector2(R, H - 0.62), new Vector2(R - 0.12, H - 0.42), new Vector2(R - 0.55, H - 0.04),
    new Vector2(R - 0.7, H), new Vector2(rcs, H), new Vector2(hexR + 0.015, H - 0.36),
  ];
  const lathe = new LatheGeometry(pts, 48);
  // Corona plana entre el avellanado y el hexágono (aristas vivas)
  const ring = new Shape();
  ring.setFromPoints(circlePts(hexR + 0.015, 48));
  const hex = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    hex.push(new Vector2(Math.cos(a) * hexR, Math.sin(a) * hexR));
  }
  ring.holes.push(pathFromPts(hex));
  const cap = new ShapeGeometry(ring);
  cap.rotateX(-Math.PI / 2);
  cap.translate(0, H - 0.36, 0);
  const g = mergeGeometries([lathe.toNonIndexed(), cap.toNonIndexed()]);
  return finish(g, 40);
}

export function screwSocketGeometry() {
  // Hexágono interior de 4 mm: seis paredes planas y fondo cónico de taladro
  const { H, hexR, socketDepth } = SCREW;
  const top = H - 0.36, bot = H - socketDepth;
  const pos = [], nor = [];
  const v = (i) => { const a = (i / 6) * Math.PI * 2; return [Math.cos(a) * hexR, Math.sin(a) * hexR]; };
  for (let i = 0; i < 6; i++) {
    const [x0, z0] = v(i), [x1, z1] = v(i + 1);
    const mx = -(x0 + x1) / 2, mz = -(z0 + z1) / 2, l = Math.hypot(mx, mz);
    const n = [mx / l, 0, mz / l];
    // pared vista desde el eje (normal hacia dentro)
    pos.push(x0, top, z0, x1, bot, z1, x1, top, z1, x0, top, z0, x0, bot, z0, x1, bot, z1);
    for (let k = 0; k < 6; k++) nor.push(...n);
    // fondo cónico (punta de 118°)
    const depth = hexR * 0.6;
    pos.push(x0, bot, z0, 0, bot - depth, 0, x1, bot, z1);
    const e = [x1 - x0, 0, z1 - z0], f = [-x0, -depth, -z0];
    const c = [e[1] * f[2] - e[2] * f[1], e[2] * f[0] - e[0] * f[2], e[0] * f[1] - e[1] * f[0]];
    const cl = Math.hypot(...c) * (c[1] > 0 ? 1 : -1);
    for (let k = 0; k < 3; k++) nor.push(c[0] / cl, c[1] / cl, c[2] / cl);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.scale(MM, MM, MM);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

export function screwShankGeometry(length = 14, r = 3) {
  const pts = [new Vector2(0, -length)];
  pts.push(new Vector2(r - 0.6, -length));
  pts.push(new Vector2(r - 0.2, -length + 0.5));
  const pitch = 1;
  for (let y = -length + 0.8; y < -0.6; y += pitch) {
    pts.push(new Vector2(r, y));
    pts.push(new Vector2(r - 0.45, y + pitch / 2));
  }
  pts.push(new Vector2(r - 0.3, 0.2));
  pts.push(new Vector2(0, 0.2));
  const g = new LatheGeometry(pts, 20);
  return finish(g, 70);
}

// Tuerca martillo para ranura 10 (M6). Sección en XY (ranura superior del
// perfil, coordenadas de la sección en mm) extruida a lo largo de Z.
export function tNutGeometry(length = 20) {
  const pts = [
    // Encaja en la cámara del perfil FDI 40x40 (labio a 14 mm, ranura de 10)
    { x: -9.5, y: 13.8, r: 0.4 },
    { x: -9.5, y: 11.8, r: 0.6 },
    { x: -6.4, y: 8.7, r: 0.8 },
    { x: 6.4, y: 8.7, r: 0.8 },
    { x: 9.5, y: 11.8, r: 0.6 },
    { x: 9.5, y: 13.8, r: 0.4 },
    { x: 4.7, y: 13.8, r: 0.3 },
    { x: 4.7, y: 17.6, r: 0.5 },
    { x: -4.7, y: 17.6, r: 0.5 },
    { x: -4.7, y: 13.8, r: 0.3 },
  ];
  const b = 0.4;
  const g = new ExtrudeGeometry(shapeFromPts(filletPolygon(pts, 3)), {
    depth: length - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 2,
  });
  g.translate(0, 0, -length / 2 + b);
  const out = flattenCaps(toCreasedNormals(g, 40 * DEG));
  out.scale(MM, MM, MM);
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}
