import { MeshStandardMaterial, MeshPhysicalMaterial, Color, SRGBColorSpace } from 'three';

// Recoge por nombre los materiales del .glb y les añade lo que solo existe
// en la web: barrido de luz del filo naranja y entorno propio del cromo.
export function prepareMaterials(scene, { chromeEnv, maps }) {
  // El cargador glTF clona un material para las mallas sin tangentes, así que
  // un mismo nombre puede tener varias instancias: se guardan todas.
  const byName = new Map(); // nombre -> Map(material -> usado con tangentes)
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const t = !!o.geometry.attributes.tangent;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!byName.has(m.name)) byName.set(m.name, new Map());
      const list = byName.get(m.name);
      list.set(m, list.get(m) || t);
    }
  });
  // El glTF sin extensiones llega como MeshStandardMaterial, que no admite
  // anisotropía: el aluminio cepillado se pasa a MeshPhysicalMaterial.
  const swap = new Map();
  for (const n of ['aluminio', 'aluminio-marca']) {
    for (const std of byName.get(n)?.keys() || []) {
      const phys = new MeshPhysicalMaterial();
      MeshStandardMaterial.prototype.copy.call(phys, std);
      phys.defines = { STANDARD: '', PHYSICAL: '' };
      swap.set(std, phys);
    }
  }
  if (swap.size) {
    scene.traverse((o) => {
      if (!o.isMesh) return;
      if (Array.isArray(o.material)) o.material = o.material.map((m) => swap.get(m) || m);
      else if (swap.has(o.material)) o.material = swap.get(o.material);
    });
    for (const list of byName.values()) {
      for (const [m, t] of [...list]) if (swap.has(m)) { list.delete(m); list.set(swap.get(m), t); }
    }
  }
  const all = (n) => [...(byName.get(n)?.entries() || [])];
  const need = (n) => {
    const list = all(n);
    if (!list.length) throw new Error(`Falta el material "${n}" en el modelo`);
    return (list.find(([, t]) => t) || list[0])[0];
  };
  const mats = {
    aluminium: need('aluminio'),
    aluminiumCut: need('aluminio-corte'),
    steel: need('acero'),
    screw: need('tornillo'),
    rod: need('varilla'),
    orange: need('naranja'),
    chrome: need('cromo'),
    socket: need('hexagono'),
    brandMetal: need('aluminio-marca'),
    brandOrange: need('naranja-anillo'),
    brandChrome: need('cromo-marca'),
  };

  // Filo naranja: emisión controlada por el barrido
  const rimUniforms = { uSweep: { value: -0.2 }, uBand: { value: 0 }, uGlow: { value: 0 } };
  for (const [orange] of all('naranja')) {
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
  }

  // Aluminio cepillado: vetas + microarañazos y anisotropía física. Las mallas
  // traen tangentes explícitas (a lo ancho de las vetas), así el brillo se
  // estira en la dirección correcta sin depender de derivadas de UV; las copias
  // sin tangentes van sin anisotropía (evita píxeles NaN).
  const brushed = [
    ['aluminio', { aniso: 0.15, ns: 0.22, rough: 0.4, color: [0.86, 0.87, 0.885], env: 0.82 }],
    // Marca: caras planas de frente a la cámara, satinado claro sin quemarse
    ['aluminio-marca', { aniso: 0.12, ns: 0.16, rough: 0.4, color: [0.94, 0.945, 0.955], env: 0.85 }],
  ];
  for (const [name, o] of brushed) {
    for (const [m, tangents] of all(name)) {
      m.normalMap = maps.normal;
      m.roughnessMap = maps.rough;
      m.normalScale.set(o.ns, tangents ? o.ns : -o.ns);
      m.anisotropy = tangents ? o.aniso : 0;
      m.anisotropyRotation = 0;
      m.roughness = o.rough;
      m.color.setRGB(...o.color);
      m.envMapIntensity = o.env;
    }
  }
  for (const [m] of all('aluminio-corte')) m.roughnessMap = maps.rough;

  for (const n of ['cromo', 'cromo-marca']) {
    for (const [m] of all(n)) {
      m.envMap = chromeEnv;
      m.envMapIntensity = 1;
    }
  }

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
