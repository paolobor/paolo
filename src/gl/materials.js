import { MeshStandardMaterial, Color, SRGBColorSpace } from 'three';

// Recoge por nombre los materiales del .glb y les añade lo que solo existe
// en la web: barrido de luz del filo naranja y entorno propio del cromo.
export function prepareMaterials(scene, { chromeEnv }) {
  const byName = {};
  scene.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) byName[m.name] = m;
  });
  const need = (n) => {
    if (!byName[n]) throw new Error(`Falta el material "${n}" en el modelo`);
    return byName[n];
  };
  const mats = {
    aluminium: need('aluminio'),
    aluminiumCut: need('aluminio-corte'),
    steel: need('acero'),
    screw: need('tornillo'),
    rod: need('varilla'),
    orange: need('naranja'),
    chrome: need('cromo'),
  };

  // Filo naranja: emisión controlada por el barrido
  const rimUniforms = { uSweep: { value: -0.2 }, uBand: { value: 0 }, uGlow: { value: 0 } };
  const orange = mats.orange;
  orange.emissive = new Color().setStyle('#ff5a0a', SRGBColorSpace);
  orange.emissiveIntensity = 1;
  orange.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, rimUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRimPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRimPos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRimPos;\nuniform float uSweep, uBand, uGlow;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float rimA = atan(vRimPos.z, vRimPos.x) / 6.2831853 + 0.5;
        float rimD = abs(fract(rimA - uSweep + 0.5) - 0.5);
        float rimBand = exp(-rimD * rimD / 0.0018) * uBand;
        totalEmissiveRadiance *= (uGlow + rimBand * 9.0);`);
  };
  orange.customProgramCacheKey = () => 'fdi-orange-rim';

  mats.chrome.envMap = chromeEnv;
  mats.chrome.envMapIntensity = 1;

  // Virutas (solo en la web): aluminio recién cortado, muy brillante
  mats.chip = new MeshStandardMaterial({
    name: 'viruta',
    color: new Color(0.9, 0.91, 0.925),
    metalness: 1,
    roughness: 0.12,
    envMapIntensity: 0.2,
  });
  mats.rimUniforms = rimUniforms;
  return mats;
}
