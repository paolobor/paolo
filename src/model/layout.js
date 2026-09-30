import { Vector3, Matrix4, Quaternion } from 'three';

const D2R = Math.PI / 180;
export const FINAL_AZ = 225;

// Base de cámara para una vista esférica (az alrededor de Y, el sobre el horizonte)
export function basis(az, el) {
  const a = az * D2R, e = el * D2R;
  const back = new Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));
  const right = new Vector3(Math.cos(a), 0, -Math.sin(a));
  const up = new Vector3().crossVectors(back, right);
  return { back, right, up };
}

// Extensión proyectada de un objeto sobre el plano de cámara (right/up)
export function projectedExtents(object, right, up) {
  object.updateMatrixWorld(true);
  let minR = Infinity, maxR = -Infinity, minU = Infinity, maxU = -Infinity;
  const v = new Vector3();
  object.traverse((o) => {
    if (!o.isMesh) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox;
    for (let i = 0; i < 8; i++) {
      v.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(o.matrixWorld);
      const r = v.dot(right), u = v.dot(up);
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (u < minU) minU = u; if (u > maxU) maxU = u;
    }
  });
  return { minR, maxR, minU, maxU };
}

// Composición del logo: montaje a la izquierda y rótulo a la derecha (horizontal)
// o rótulo debajo (vertical). Devuelve la pose final de cámara y la
// transformación del rótulo, que siempre mira a la cámara final.
export function composeLogo({ extents, textWidth, textCap, aspect, fov }) {
  const portrait = aspect < 0.95;
  const el = portrait ? 27 : 30;
  const { back, right, up } = basis(FINAL_AZ, el);
  const { minR, maxR, minU, maxU } = extents;
  const asmW = maxR - minR, asmH = maxU - minU;
  let cap, textLeft, baseline, compR, compU, totalW, totalH;
  if (!portrait) {
    cap = asmH * 0.19;
    const tw = (textWidth / textCap) * cap;
    const gap = asmW * 0.035;
    textLeft = maxR + gap;
    baseline = (minU + maxU) / 2 - asmH * 0.07 - cap / 2;
    totalW = asmW + gap + tw;
    totalH = asmH;
    compR = (minR + textLeft + tw) / 2;
    compU = (minU + maxU) / 2 - asmH * 0.03;
  } else {
    const tw0 = Math.max(asmW * 1.05, 1);
    cap = Math.min(asmH * 0.16, (tw0 / textWidth) * textCap);
    const tw = (textWidth / textCap) * cap;
    const gap = cap * 0.9;
    textLeft = (minR + maxR) / 2 - tw / 2;
    baseline = minU - gap - cap;
    totalW = Math.max(asmW, tw);
    totalH = asmH + gap + cap * 2.2;
    compR = (minR + maxR) / 2;
    compU = (maxU + baseline - cap * 1.2) / 2;
  }
  const vfov = fov * D2R;
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
  const dist = Math.max((totalW * 1.14) / 2 / Math.tan(hfov / 2), (totalH * 1.2) / 2 / Math.tan(vfov / 2));
  const target = new Vector3().addScaledVector(right, compR).addScaledVector(up, compU);
  const quaternion = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, back));
  const textPosition = new Vector3().addScaledVector(right, textLeft).addScaledVector(up, baseline);
  return {
    portrait,
    pose: { az: FINAL_AZ, el, dist, target },
    text: { position: textPosition, quaternion, scale: cap / textCap },
  };
}
