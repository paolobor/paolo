import { ExtrudeGeometry } from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { filletPolygon, rot90, shapeFromPts, pathFromPts, circlePts, flattenCaps } from './shapes.js';

// Unidades de escena: 1 = 10 mm. Perfil 40x40 ranura 10 (familia 40).
export const MM = 0.1;
export const PROFILE = 40 * MM;

// Medidas reales de la sección (mm)
const A = 20;          // semilado
const SLOT = 5.05;     // media apertura de ranura (10,1 mm)
const LIP = 15.8;      // cara inferior del labio (espesor de labio 4,2 mm)
const CAV = 10.4;      // media anchura de la cámara bajo el labio
const BOTTOM = 7.9;    // fondo de la ranura
const BORE = 4.25;     // taladro central Ø8,5

function sidePoints() {
  // Lado con normal +Y, recorrido de +X a -X (sentido antihorario global)
  return [
    { x: A, y: A, r: 1.5 },
    { x: SLOT + 0.55, y: A, r: 0.2 },
    { x: SLOT, y: A - 0.55, r: 0.2 },
    { x: SLOT, y: LIP, r: 0.35 },
    { x: CAV, y: LIP, r: 0.5 },
    { x: CAV, y: 14.0, r: 0.8 },
    { x: 5.2, y: BOTTOM, r: 1.0 },
    { x: -5.2, y: BOTTOM, r: 1.0 },
    { x: -CAV, y: 14.0, r: 0.8 },
    { x: -CAV, y: LIP, r: 0.5 },
    { x: -SLOT, y: LIP, r: 0.35 },
    { x: -SLOT, y: A - 0.55, r: 0.2 },
    { x: -(SLOT + 0.55), y: A, r: 0.2 },
  ];
}

function cornerVoid() {
  // Cámara hueca de esquina (cuadrante +X +Y), paredes de ~1,8-1,9 mm
  return [
    { x: 12.2, y: 18.1, r: 0.5 },
    { x: 18.1, y: 18.1, r: 0.7 },
    { x: 18.1, y: 12.2, r: 0.5 },
    { x: 14.7, y: 12.2, r: 0.45 },
    { x: 12.2, y: 14.7, r: 0.45 },
  ];
}

let cachedShape = null;
export function profileShape() {
  if (cachedShape) return cachedShape;
  const outer = [];
  for (let k = 0; k < 4; k++) outer.push(...sidePoints().map((p) => rot90(p, k)));
  // La sección se construye en mm; la geometría se escala al final.
  const shape = shapeFromPts(filletPolygon(outer, 4));
  for (let k = 0; k < 4; k++) {
    const v = cornerVoid().map((p) => rot90(p, k));
    shape.holes.push(pathFromPts(filletPolygon(v, 3)));
  }
  shape.holes.push(pathFromPts(circlePts(BORE, 40)));
  cachedShape = shape;
  return shape;
}

// Sección extruida a lo largo de +Z, de z=0 a z=length.
// Grupos: 0 = caras de corte (extremos), 1 = paredes laterales.
const geoCache = new Map();
export function profileGeometry(length) {
  const key = length.toFixed(3);
  if (geoCache.has(key)) return geoCache.get(key);
  const b = 0.22; // chaflán de corte en mm
  let g = new ExtrudeGeometry(profileShape(), {
    depth: length / MM - 2 * b,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: -b,
    bevelSegments: 2,
    steps: 1,
  });
  g.translate(0, 0, b);
  g = flattenCaps(toCreasedNormals(g, (34 * Math.PI) / 180));
  g.scale(MM, MM, MM); // UV quedan en mm (útil para el cepillado)
  g.computeBoundingBox();
  g.computeBoundingSphere();
  geoCache.set(key, g);
  return g;
}
