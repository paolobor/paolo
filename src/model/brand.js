import { Vector3, Quaternion, Matrix4 } from 'three';

// Medidas y orientación del símbolo de marca (las comparten el modelo y la web).
export const BRAND = { arm: 9.5, armV: 11.5, ringR: 4.4, ringr: 2.35, ringT: 1.2, ringOff: 3.7, spread: 10 };
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

// Orientación de un brazo: su eje Z local a lo largo de dir y su Y local hacia el frente
export function armQuaternion(dir) {
  const z = dir.clone().normalize();
  const y = BRAND_FACE.clone().addScaledVector(z, -BRAND_FACE.dot(z)).normalize();
  const x = new Vector3().crossVectors(y, z);
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
}

