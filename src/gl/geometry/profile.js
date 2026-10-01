import { ExtrudeGeometry, Vector2, Float32BufferAttribute } from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { shapeFromPts, pathFromPts, flattenCaps } from './shapes.js';
import section from '../../assets/profile-40x40.json';

// Unidades de escena: 1 = 10 mm. Perfil 40x40 ranura 10 (familia 40).
export const MM = 0.1;
export const PROFILE = 40 * MM;

// Sección real del perfil FDI MODULAR 40x40, extraída de la cara de corte del
// CAD "Perfil básico 40x40.STEP" (mm, centrada en el eje del perfil).
// Ranura: 10 mm bajo el labio (x = ±5) con entrada achaflanada de 12 mm.
export const SECTION = {
  slotHalf: 5,     // media ranura (10 mm)
  mouthHalf: 6,    // media entrada (12 mm)
  lipUnder: 14,    // cara inferior del labio
  lipStep: 18.5,   // escalón de la entrada
  chamberHalf: 10, // media cámara bajo el labio
  coreTop: 7.625,  // cara exterior del núcleo central
};

let cachedShape = null;
export function profileShape() {
  if (cachedShape) return cachedShape;
  const v = (l) => l.map(([x, y]) => new Vector2(x, y));
  const shape = shapeFromPts(v(section.outer));
  for (const h of section.holes) shape.holes.push(pathFromPts(v(h)));
  cachedShape = shape;
  return shape;
}

// Tangentes explícitas (vec4). En las paredes la tangente recorre el contorno
// de la sección (perpendicular al cepillado, que va a lo largo del perfil), así
// la anisotropía estira el brillo como en un perfil extruido real y no depende
// de derivadas de UV, que en los biseles son degeneradas.
export function addExtrusionTangents(g) {
  const n = g.attributes.normal;
  const t = new Float32Array(n.count * 4);
  for (let i = 0; i < n.count; i++) {
    const nx = n.getX(i), ny = n.getY(i);
    let tx = -ny, ty = nx;
    const l = Math.hypot(tx, ty);
    if (l < 1e-3) { tx = 1; ty = 0; } else { tx /= l; ty /= l; }
    t[i * 4] = tx; t[i * 4 + 1] = ty; t[i * 4 + 2] = 0; t[i * 4 + 3] = 1;
  }
  g.setAttribute('tangent', new Float32BufferAttribute(t, 4));
  return g;
}

// Sección extruida a lo largo de +Z, de z=0 a z=length.
// Grupos: 0 = caras de corte (extremos), 1 = paredes laterales.
const geoCache = new Map();
export function profileGeometry(length) {
  const key = length.toFixed(3);
  if (geoCache.has(key)) return geoCache.get(key);
  const b = 0.2; // rebaba/chaflán del corte de sierra en mm
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
  addExtrusionTangents(g);
  g.scale(MM, MM, MM); // UV quedan en mm (útil para el cepillado)
  g.computeBoundingBox();
  g.computeBoundingSphere();
  geoCache.set(key, g);
  return g;
}
