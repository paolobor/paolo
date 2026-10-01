import { ExtrudeGeometry, LatheGeometry, CylinderGeometry, BoxGeometry, Vector2 } from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { filletPolygon, roundedRectPts, shapeFromPts, pathFromPts, circlePts, flattenCaps } from './shapes.js';
import { MM } from './profile.js';

// Piezas de la bancada para cobot. Se modelan en mm y se escalan (1 = 10 mm).
const DEG = Math.PI / 180;

function done(g, crease = 40) {
  g = toCreasedNormals(g, crease * DEG);
  g.scale(MM, MM, MM);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

function extrudeZ(shape, depth, bevel, segs = 2, crease = 40) {
  const g = new ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelOffset: -bevel, bevelSegments: segs, curveSegments: 12,
  });
  g.translate(0, 0, -depth / 2 + bevel);
  const out = flattenCaps(toCreasedNormals(g, crease * DEG));
  out.scale(MM, MM, MM);
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

// Escuadra de unión angular reforzada para perfil 40 (fundición de aluminio).
// Esquina en el origen; ala A sobre +X (horizontal), ala B sobre +Y (vertical).
export function angleBracketGeometry() {
  const L = 38, t = 5;
  const pts = [
    { x: 0, y: 0, r: 1.2 },
    { x: L, y: 0, r: 1.5 },
    { x: L, y: t, r: 1.5 },
    { x: t, y: t, r: 13 },
    { x: t, y: L, r: 1.5 },
    { x: 0, y: L, r: 1.5 },
  ];
  return extrudeZ(shapeFromPts(filletPolygon(pts, 10)), 36, 0.8, 2, 38);
}

// Pie nivelador: plato con base de goma, rótula, espárrago M16, tuerca y placa base.
// Origen en el suelo; la placa superior termina en y = 45 mm.
export function footPadGeometry() {
  const p = [new Vector2(0, 0), new Vector2(36, 0), new Vector2(37.5, 1.2), new Vector2(37.5, 3.2), new Vector2(36.5, 3.5), new Vector2(0, 3.5)];
  return done(new LatheGeometry(p, 48), 50);
}
export function footDiscGeometry() {
  const p = [
    new Vector2(0, 3.5), new Vector2(39, 3.5), new Vector2(40, 4.5), new Vector2(40, 6.5), new Vector2(38.5, 7.5),
    new Vector2(22, 10), new Vector2(15, 12.2), new Vector2(13, 14.5), new Vector2(10, 16.2), new Vector2(0, 16.6),
  ];
  return done(new LatheGeometry(p, 48), 35);
}
export function footStudGeometry() {
  const pts = [new Vector2(0, 14)];
  const r = 8;
  for (let y = 14; y < 39; y += 2) { pts.push(new Vector2(r, y)); pts.push(new Vector2(r - 0.9, y + 1)); }
  pts.push(new Vector2(r - 0.5, 39.5), new Vector2(0, 39.5));
  return done(new LatheGeometry(pts, 20), 70);
}
export function footNutGeometry() {
  const g = new CylinderGeometry(13.8, 13.8, 13, 6, 1);
  g.translate(0, 25 + 6.5, 0);
  return done(g, 30);
}
export function footPlateGeometry() {
  const shape = shapeFromPts(filletPolygon(roundedRectPts(40, 40, 3), 6));
  const g = new ExtrudeGeometry(shape, { depth: 5.2, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelOffset: -0.4, bevelSegments: 2 });
  g.translate(0, 0, 0.4);
  const out = flattenCaps(toCreasedNormals(g, 40 * DEG));
  out.rotateX(-Math.PI / 2);
  out.translate(0, 39, 0);
  out.scale(MM, MM, MM);
  out.computeBoundingBox();
  return out;
}

// Placa de anclaje del robot (aluminio anodizado negro, 300x300x20 con taladros)
export function robotPlateGeometry(size = 300, thick = 20) {
  const shape = shapeFromPts(filletPolygon(roundedRectPts(size, size, 10), 8));
  const h = size / 2 - 22;
  for (const [x, y] of [[h, h], [-h, h], [-h, -h], [h, -h]]) shape.holes.push(pathFromPts(circlePts(5.5, 24, x, y).reverse()));
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    shape.holes.push(pathFromPts(circlePts(4.4, 20, Math.cos(a) * 63, Math.sin(a) * 63).reverse()));
  }
  shape.holes.push(pathFromPts(circlePts(16, 32).reverse()));
  const b = 1.2;
  const g = new ExtrudeGeometry(shape, { depth: thick - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 2, curveSegments: 16 });
  g.translate(0, 0, b);
  const out = flattenCaps(toCreasedNormals(g, 40 * DEG));
  out.rotateX(-Math.PI / 2);
  out.scale(MM, MM, MM);
  out.computeBoundingBox();
  return out;
}

// --- Cobot genérico de 6 ejes (proporciones de un cobot de 5 kg, alcance ~850 mm)
// Cilindro de cantos redondeados a lo largo de Y (de y=0 a y=h), en mm.
export function roundedCylinder(r, h, bevel = 6, segs = 40) {
  const p = [new Vector2(0, 0)];
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * (Math.PI / 2);
    p.push(new Vector2(r - bevel + Math.cos(a) * bevel, bevel + Math.sin(a) * bevel));
  }
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    p.push(new Vector2(r - bevel + Math.cos(a) * bevel, h - bevel + Math.sin(a) * bevel));
  }
  p.push(new Vector2(0, h));
  return done(new LatheGeometry(p, segs), 30);
}

export function capDisc(r, h = 3) {
  return roundedCylinder(r, h, 1, 40);
}

export function gripperBodyGeometry() {
  const g = new BoxGeometry(90, 70, 56, 1, 1, 1);
  g.translate(0, 35, 0);
  return done(g, 30);
}

export function gripperFingerGeometry() {
  const shape = shapeFromPts(filletPolygon(roundedRectPts(14, 62, 2.5), 4));
  const g = new ExtrudeGeometry(shape, { depth: 24, bevelEnabled: true, bevelThickness: 1, bevelSize: 1, bevelOffset: -1, bevelSegments: 2 });
  g.translate(0, 31, -12);
  return done(g, 40);
}
