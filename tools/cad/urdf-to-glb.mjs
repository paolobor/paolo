// Convierte los modelos oficiales de FAIRINO (URDF + STL del repositorio FAIR-INNOVATION/frcobot_ros2)
// en GLB articulados y comprimidos para la web.
//
//   node tools/cad/urdf-to-glb.mjs <ruta a frcobot_ros2/fairino_description> [modelo…]
//
// Cada articulación queda como un nodo "<joint>_rot" que gira sobre su eje (guardado en extras),
// así la web puede mover el robot con la cinemática real.
import { readFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { weld, simplify, quantize, meshopt, dedup, prune } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'public', 'models');

// slug de la web → nombre del URDF oficial
const MODELS = {
  fr3: 'fairino3_v6',
  fr3wms: 'FR3WMS',
  fr3wml: 'FR3WML',
  fr5: 'fairino5_v6',
  fr10: 'fairino10_v6',
  fr16: 'fairino16_v6',
  fr20: 'fairino20_v6',
  fr30: 'fairino30_v6',
};

const [descDir, ...only] = process.argv.slice(2);
if (!descDir) {
  console.error('Uso: node tools/cad/urdf-to-glb.mjs <fairino_description> [fr5 …]');
  process.exit(1);
}

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

const num = (s) => s.trim().split(/\s+/).map(Number);
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

function parseUrdf(xml) {
  const links = new Map();
  for (const m of xml.matchAll(/<link\s+name="([^"]+)"\s*>([\s\S]*?)<\/link>/g)) {
    const visual = m[2].match(/<visual>([\s\S]*?)<\/visual>/)?.[1];
    if (!visual) continue;
    const collision = m[2].match(/<collision>([\s\S]*?)<\/collision>/)?.[1] ?? '';
    const origin = visual.match(/<origin[^>]*>/)?.[0] ?? '';
    const visualMesh = attr(visual.match(/<mesh[^>]*>/)?.[0] ?? '', 'filename');
    const collisionMesh = attr(collision.match(/<mesh[^>]*>/)?.[0] ?? '', 'filename');
    links.set(m[1], {
      name: m[1],
      xyz: num(attr(origin, 'xyz') ?? '0 0 0'),
      rpy: num(attr(origin, 'rpy') ?? '0 0 0'),
      // Algunos modelos traen la malla visual en Collada; la de colisión (STL) es la misma geometría.
      meshes: [visualMesh, collisionMesh].filter((f) => /\.stl$/i.test(f ?? '')),
      rgba: num(attr(visual.match(/<color[^>]*>/)?.[0] ?? '', 'rgba') ?? '0.9 0.92 0.93 1'),
    });
  }
  const joints = [];
  for (const m of xml.matchAll(/<joint\s+name="([^"]+)"\s+type="([^"]+)"\s*>([\s\S]*?)<\/joint>/g)) {
    const b = m[3];
    const origin = b.match(/<origin[^>]*>/)?.[0] ?? '';
    const limit = b.match(/<limit[^>]*>/)?.[0] ?? '';
    joints.push({
      name: m[1],
      type: m[2],
      parent: attr(b.match(/<parent[^>]*>/)[0], 'link'),
      child: attr(b.match(/<child[^>]*>/)[0], 'link'),
      xyz: num(attr(origin, 'xyz') ?? '0 0 0'),
      rpy: num(attr(origin, 'rpy') ?? '0 0 0'),
      axis: num(attr(b.match(/<axis[^>]*>/)?.[0] ?? '', 'xyz') ?? '0 0 1'),
      lower: Number(attr(limit, 'lower') ?? -Math.PI),
      upper: Number(attr(limit, 'upper') ?? Math.PI),
    });
  }
  return { links, joints };
}

// URDF rpy (ejes fijos X, Y, Z) → cuaternión [x, y, z, w].
function rpyToQuat([r, p, y]) {
  const cr = Math.cos(r / 2), sr = Math.sin(r / 2);
  const cp = Math.cos(p / 2), sp = Math.sin(p / 2);
  const cy = Math.cos(y / 2), sy = Math.sin(y / 2);
  return [sr * cp * cy - cr * sp * sy, cr * sp * cy + sr * cp * sy, cr * cp * sy - sr * sp * cy, cr * cp * cy + sr * sp * sy];
}

function readStl(file) {
  const buf = readFileSync(file);
  const n = buf.readUInt32LE(80);
  if (84 + n * 50 !== buf.length) throw new Error(`STL no binario o corrupto: ${file}`);
  const pos = new Float32Array(n * 9);
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50 + 12;
    for (let k = 0; k < 9; k++) pos[i * 9 + k] = buf.readFloatLE(o + k * 4);
  }
  return pos;
}

// Normales suavizadas con ángulo de pliegue: superficies curvas lisas y aristas mecánicas vivas.
function creaseNormals(pos, creaseDeg = 32) {
  const tri = pos.length / 9;
  const fn = new Float32Array(tri * 3);
  for (let t = 0; t < tri; t++) {
    const o = t * 9;
    const ax = pos[o + 3] - pos[o], ay = pos[o + 4] - pos[o + 1], az = pos[o + 5] - pos[o + 2];
    const bx = pos[o + 6] - pos[o], by = pos[o + 7] - pos[o + 1], bz = pos[o + 8] - pos[o + 2];
    // Sin normalizar: el módulo pondera por área.
    fn[t * 3] = ay * bz - az * by;
    fn[t * 3 + 1] = az * bx - ax * bz;
    fn[t * 3 + 2] = ax * by - ay * bx;
  }
  const key = (i) => `${Math.round(pos[i] * 1e5)},${Math.round(pos[i + 1] * 1e5)},${Math.round(pos[i + 2] * 1e5)}`;
  const byVertex = new Map();
  for (let t = 0; t < tri; t++) for (let c = 0; c < 3; c++) {
    const k = key(t * 9 + c * 3);
    let list = byVertex.get(k);
    if (!list) byVertex.set(k, (list = []));
    list.push(t);
  }
  const cos = Math.cos((creaseDeg * Math.PI) / 180);
  const unit = (t) => {
    const x = fn[t * 3], y = fn[t * 3 + 1], z = fn[t * 3 + 2];
    const l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
  };
  const nor = new Float32Array(pos.length);
  for (let t = 0; t < tri; t++) {
    const nt = unit(t);
    for (let c = 0; c < 3; c++) {
      let sx = 0, sy = 0, sz = 0;
      for (const u of byVertex.get(key(t * 9 + c * 3))) {
        const nu = unit(u);
        if (nu[0] * nt[0] + nu[1] * nt[1] + nu[2] * nt[2] >= cos) {
          sx += fn[u * 3]; sy += fn[u * 3 + 1]; sz += fn[u * 3 + 2];
        }
      }
      const l = Math.hypot(sx, sy, sz) || 1;
      nor[t * 9 + c * 3] = sx / l; nor[t * 9 + c * 3 + 1] = sy / l; nor[t * 9 + c * 3 + 2] = sz / l;
    }
  }
  return nor;
}

async function convert(slug, urdfName) {
  const urdfPath = join(descDir, 'urdf', `${urdfName}.urdf`);
  const { links, joints } = parseUrdf(readFileSync(urdfPath, 'utf8'));
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(slug);
  // URDF es Z-arriba; glTF es Y-arriba.
  const root = doc.createNode(`${slug}_root`).setRotation(rpyToQuat([-Math.PI / 2, 0, 0]));
  scene.addChild(root);

  const materials = new Map();
  const materialFor = (rgba) => {
    const k = rgba.join(',');
    if (!materials.has(k)) {
      materials.set(k, doc.createMaterial('pintura').setBaseColorFactor(rgba).setMetallicFactor(0).setRoughnessFactor(0.42));
    }
    return materials.get(k);
  };

  let triangles = 0;
  const linkNode = (name) => {
    const link = links.get(name);
    const frame = doc.createNode(name);
    const resolve = (f) =>
      f.startsWith('package://') ? join(descDir, f.replace('package://fairino_description/', '')) : join(descDir, 'urdf', f);
    const file = link?.meshes.map(resolve).find((f) => existsSync(f));
    if (link && link.meshes.length && !file) console.warn(`  ${slug}: sin malla para ${name}`);
    if (file) {
      const pos = readStl(file);
      triangles += pos.length / 9;
      const nor = creaseNormals(pos);
      const prim = doc
        .createPrimitive()
        .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(pos).setBuffer(buffer))
        .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(nor).setBuffer(buffer))
        .setMaterial(materialFor(link.rgba));
      const visual = doc
        .createNode(`${name}_visual`)
        .setTranslation(link.xyz)
        .setRotation(rpyToQuat(link.rpy))
        .setMesh(doc.createMesh(name).addPrimitive(prim));
      frame.addChild(visual);
    }
    for (const j of joints.filter((j) => j.parent === name)) {
      const jn = doc.createNode(j.name).setTranslation(j.xyz).setRotation(rpyToQuat(j.rpy));
      const rot = doc.createNode(`${j.name}_rot`).setExtras({ axis: j.axis, lower: j.lower, upper: j.upper, type: j.type });
      jn.addChild(rot);
      rot.addChild(linkNode(j.child));
      frame.addChild(jn);
    }
    return frame;
  };
  const childLinks = new Set(joints.map((j) => j.child));
  const base = [...links.keys()].find((l) => !childLinks.has(l));
  root.addChild(linkNode(base));

  await doc.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.55, error: 0.0004, lockBorder: false }),
    dedup(),
    prune(),
    quantize({ quantizeNormal: 10 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );

  mkdirSync(OUT, { recursive: true });
  const out = join(OUT, `${slug}.glb`);
  const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  await io.write(out, doc);
  console.log(`${slug.padEnd(7)} ${urdfName.padEnd(14)} ${triangles} triángulos → ${(statSync(out).size / 1024).toFixed(0)} KB`);
}

for (const [slug, urdf] of Object.entries(MODELS)) {
  if (only.length && !only.includes(slug)) continue;
  await convert(slug, urdf);
}
