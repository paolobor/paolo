import { Vector3, Plane } from 'three';

// Borde incandescente en el plano de "mecanizado" que revela la escuadra.
function addScanEdge(material, uniforms) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, r) => {
    if (prev) prev(shader, r);
    shader.uniforms.uScanY = uniforms.uScanY;
    shader.uniforms.uScanGain = uniforms.uScanGain;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vScanY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvScanY = (modelMatrix * vec4(transformed, 1.0)).y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vScanY;\nuniform float uScanY, uScanGain;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float scanD = max(vScanY - uScanY, 0.0);
        totalEmissiveRadiance += vec3(1.0, 0.93, 0.85) * (exp(-scanD * 60.0) * 4.0 + exp(-scanD * 9.0) * 0.25) * uScanGain;`);
  };
  const key = material.customProgramCacheKey ? material.customProgramCacheKey() : material.name;
  material.customProgramCacheKey = () => `${key}-scan`;
}

// Prepara el montaje cargado del .glb (escuadra + perfiles + tornillería)
// para el guion de animación: piezas por nombre, cotas y efecto de mecanizado.
export function setupAssembly(root, mats, { shadows = false } = {}) {
  const meta = root.userData.meta;
  const get = (n) => {
    const o = root.getObjectByName(n);
    if (!o) throw new Error(`Falta la pieza "${n}" en el modelo`);
    return o;
  };
  const parts = {
    connector: get('escuadra'),
    pV: get('perfil-vertical'),
    pX: get('perfil-x'),
    pZ: get('perfil-z'),
    screwX: get('tornillo-x'),
    screwZ: get('tornillo-z'),
    screwNX: get('tornillo-nx'),
    screwNZ: get('tornillo-nz'),
  };
  const screws = [parts.screwX, parts.screwZ, parts.screwNX, parts.screwNZ];
  for (const s of screws) s.userData.spin = get(`${s.name}-giro`);
  for (const p of Object.values(parts)) p.userData.final = p.position.clone();

  const scan = { uScanY: { value: 1000 }, uScanGain: { value: 0 } };
  const scanPlane = new Plane(new Vector3(0, 1, 0), 1000);
  for (const m of [mats.steel, mats.orange, mats.rod]) {
    addScanEdge(m, scan);
    m.clippingPlanes = [scanPlane];
  }

  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = shadows;
      o.receiveShadow = shadows;
    }
  });

  // Cotas (coordenadas locales del montaje)
  const half = 2; // medio perfil de 40 mm (1 unidad = 10 mm)
  const { topOfH, hy, vTop, lengthH, gap } = meta;
  const dims = {
    width40: {
      a: new Vector3(-half, vTop - 3.4, -half),
      b: new Vector3(half, vTop - 3.4, -half),
      offset: new Vector3(0, 0, -1.1),
      label: '40 mm',
    },
    slot10: {
      a: new Vector3(half + gap + lengthH - 1.6, topOfH, -0.505),
      b: new Vector3(half + gap + lengthH - 1.6, topOfH, 0.505),
      offset: new Vector3(0, 1.5, 0),
      label: 'Ranura 10',
    },
    height40: {
      a: new Vector3(half + gap + lengthH * 0.62, hy - half, -half),
      b: new Vector3(half + gap + lengthH * 0.62, hy + half, -half),
      offset: new Vector3(0, 0, -1.2),
      label: '40 mm',
    },
  };

  const anchors = { scanTop: 0.35, scanBottom: vTop - 0.3 };
  return { root, parts, screws, scan, scanPlane, dims, anchors, meta };
}
