import { Group, Mesh, ExtrudeGeometry, Vector3 } from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { profileGeometry, PROFILE, MM } from '../gl/geometry/profile.js';
import {
  CONNECTOR, capGeometry, rimGeometry, neckGeometry, plateGeometry, rodGeometry,
  screwHeadGeometry, screwSocketGeometry, screwShankGeometry, tNutGeometry,
} from '../gl/geometry/connector.js';
import { flattenCaps } from '../gl/geometry/shapes.js';
import glyphData from '../assets/saira-glyphs.json';

// Modelo 3D de FDI MODULAR (unidades: 1 = 10 mm, eje Y arriba).
// "montaje": escuadra cúbica + perfiles 40x40 ranura 10 + tornillería,
//            origen en el centro de la cara superior de la tapa.
// "rotulo":  letras cromadas FDI MODULAR, base en y=0, mirando a +Z.

export const LAYOUT = { lengthH: 12, lengthV: 10, gap: 0.05 };

export function buildAssembly(m, { lengthH = LAYOUT.lengthH, lengthV = LAYOUT.lengthV } = {}) {
  const s = MM;
  const gap = LAYOUT.gap;
  const topOfH = -(CONNECTOR.plateT + 0.12) * s; // las pletinas apoyan sobre los perfiles
  const hy = topOfH - PROFILE / 2;
  const vTop = CONNECTOR.neckBottom * s;

  const root = new Group();
  root.name = 'montaje';

  // Escuadra
  const connector = new Group();
  connector.name = 'escuadra';
  const named = (mesh, name) => { mesh.name = name; return mesh; };
  const plateGeo = plateGeometry();
  const plateZ = named(new Mesh(plateGeo, m.steel), 'pletina-z');
  plateZ.rotation.y = -Math.PI / 2;
  connector.add(
    named(new Mesh(capGeometry(), m.steel), 'tapa'),
    named(new Mesh(rimGeometry(), m.orange), 'filo-naranja'),
    named(new Mesh(neckGeometry(), m.steel), 'cuello'),
    named(new Mesh(plateGeo, m.steel), 'pletina-x'),
    plateZ,
  );
  const rodLen = -CONNECTOR.capH - CONNECTOR.rimH - CONNECTOR.neckBottom;
  const rodGeo = rodGeometry(rodLen, 2.25);
  const off = (CONNECTOR.neck / 2 - CONNECTOR.notch / 2) * s;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, z], i) => {
    const rod = named(new Mesh(rodGeo, m.rod), `varilla-${i + 1}`);
    rod.position.set(x * off, vTop, z * off);
    connector.add(rod);
  });
  root.add(connector);

  // Perfiles 40x40 ranura 10 (malla con 2 materiales: corte y laterales)
  const profMats = [m.aluminiumCut, m.aluminium];
  const nutGeo = tNutGeometry(20);
  const sx = CONNECTOR.screwX * s;
  function profile(name, length, withNutAt = null) {
    const g = new Group();
    g.name = name;
    g.add(named(new Mesh(profileGeometry(length), profMats), `perfil-40x40-L${Math.round(length * 10)}`));
    if (withNutAt !== null) {
      const nut = named(new Mesh(nutGeo, m.nut), `tuerca-martillo-${name}`);
      nut.position.z = withNutAt;
      g.add(nut);
    }
    return g;
  }
  const pV = profile('perfil-vertical', lengthV);
  pV.rotation.x = Math.PI / 2; // +Z -> -Y
  pV.position.set(0, vTop, 0);
  const pX = profile('perfil-x', lengthH, sx - (PROFILE / 2 + gap));
  pX.rotation.y = Math.PI / 2; // +Z -> +X
  pX.position.set(PROFILE / 2 + gap, hy, 0);
  const pZ = profile('perfil-z', lengthH, sx - (PROFILE / 2 + gap));
  pZ.position.set(0, hy, PROFILE / 2 + gap);
  root.add(pV, pX, pZ);

  // Tornillos Allen DIN 7984 M6
  const headGeo = screwHeadGeometry();
  const socketGeo = screwSocketGeometry();
  const shankLong = screwShankGeometry(16);
  const shankShort = screwShankGeometry(10);
  function screw(name, shank) {
    const g = new Group();
    g.name = name;
    const spin = new Group();
    spin.name = `${name}-giro`;
    spin.add(
      named(new Mesh(headGeo, m.screw), `${name}-cabeza`),
      named(new Mesh(socketGeo, m.socket), `${name}-hexagono`),
      named(new Mesh(shank, m.screw), `${name}-rosca`),
    );
    g.add(spin);
    return g;
  }
  const plateTop = -0.12 * s;
  const sX = screw('tornillo-x', shankLong);
  sX.position.set(sx, plateTop, 0);
  const sZ = screw('tornillo-z', shankLong);
  sZ.position.set(0, plateTop, sx);
  const sideY = CONNECTOR.sideScrewY * s;
  const face = (CONNECTOR.neck / 2) * s;
  const sNX = screw('tornillo-nx', shankShort);
  sNX.rotation.z = Math.PI / 2; // eje -> -X
  sNX.position.set(-face, sideY, 0);
  const sNZ = screw('tornillo-nz', shankShort);
  sNZ.rotation.x = -Math.PI / 2; // eje -> -Z
  sNZ.position.set(0, sideY, -face);
  root.add(sX, sZ, sNX, sNZ);

  root.userData.meta = { topOfH, hy, vTop, lengthH, lengthV, gap };
  return root;
}

export function buildWordmark(chrome, { capHeight = 2.6, depth = 0.5, tracking = 0.03 } = {}) {
  const font = new Font(glyphData);
  const em = capHeight / (glyphData.capHeight / glyphData.resolution);
  const S = 10; // se modela a x10 para la precisión del suavizado de normales
  const bevelT = 0.07, bevelS = 0.05;
  // Curvatura leve de la cara frontal: el reflejo recorre el horizonte del estudio
  const curve = 0.34;
  const front = (px, py) => new Vector3(0, (curve * (py / S - capHeight * 0.5)) / capHeight, 1).normalize();
  const root = new Group();
  root.name = 'rotulo';
  let x = 0;
  const TEXT = 'FDI MODULAR';
  [...TEXT].forEach((ch, i) => {
    if (ch === ' ') { x += em * 0.28; return; }
    let g = new ExtrudeGeometry(font.generateShapes(ch, em * S), {
      depth: (depth - 2 * bevelT) * S,
      bevelEnabled: true,
      bevelThickness: bevelT * S,
      bevelSize: bevelS * S,
      bevelOffset: -0.012 * S,
      bevelSegments: 3,
      curveSegments: 12,
    });
    g = flattenCaps(toCreasedNormals(g, (40 * Math.PI) / 180), front);
    g.scale(1 / S, 1 / S, 1 / S);
    g.translate(0, 0, bevelT - depth / 2); // caras: trasera -depth/2, frontal +depth/2
    const holder = new Group();
    holder.name = `letra-${i}-${ch}`;
    holder.position.x = x;
    const mesh = new Mesh(g, chrome);
    mesh.name = `letra-${i}-${ch}-cromo`;
    holder.add(mesh);
    root.add(holder);
    x += glyphData.glyphs[ch].ha * (em / glyphData.resolution) + tracking * em;
  });
  root.userData.meta = { width: x - tracking * em, capHeight, em, depth };
  return root;
}
