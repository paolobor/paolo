import { Vector3, Quaternion, Matrix4 } from 'three';

// Medidas y orientación del símbolo de marca (las comparten el modelo y la web).
// Brazos planos de 40 mm de ancho y 24 de fondo con chaflán; superiores a ~38°
// sobre la horizontal (spread = apertura desde los 45° de los perfiles).
export const BRAND = {
  arm: 7.2, armV: 7.8, armW: 4.0, armD: 2.4, chamfer: 0.45,
  ringR: 3.35, ringr: 1.85, ringT: 1.0, ringOff: 1.73, spread: 7,
  tiltYaw: -5, tiltPitch: -4, // leve giro final para que se lean los cantos (como en el logo)
};
export const BRAND_FACE = new Vector3(0, 1, 0);
export const BRAND_UP = new Vector3(1, 0, 1).normalize(); // arriba en pantalla con la cara de frente

// Dirección final de cada brazo (coordenadas del símbolo)
export function brandArmDirs() {
  const a = (BRAND.spread * Math.PI) / 180;
  return {
    izq: new Vector3(Math.cos(a), 0, -Math.sin(a)),  // perfil +X abierto
    der: new Vector3(-Math.sin(a), 0, Math.cos(a)),  // perfil +Z abierto
    inf: BRAND_UP.clone().negate(),                  // perfil vertical desplegado
  };
}

// Leve giro del símbolo terminado (en sus propios ejes) para que se lea el volumen
export function brandTilt() {
  const right = new Vector3().crossVectors(BRAND_UP, BRAND_FACE).normalize();
  return new Quaternion().setFromAxisAngle(BRAND_UP, (BRAND.tiltYaw * Math.PI) / 180)
    .multiply(new Quaternion().setFromAxisAngle(right, (BRAND.tiltPitch * Math.PI) / 180));
}

// Orientación de un brazo: su eje Z local a lo largo de dir y su Y local hacia el frente
export function armQuaternion(dir) {
  const z = dir.clone().normalize();
  const y = BRAND_FACE.clone().addScaledVector(z, -BRAND_FACE.dot(z)).normalize();
  const x = new Vector3().crossVectors(y, z);
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
}

