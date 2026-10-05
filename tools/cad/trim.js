// Acabados reales de los cobots FAIRINO sobre el modelo oficial (URDF/STL), sin inventar geometría:
//   · aro naranja-rojo en la tapa libre de cada articulación J1–J5, del 77,5 % del radio al canto,
//     siguiendo el perfil medido de la propia tapa y envolviendo un poco el lateral;
//   · 4 tornillos de acero a 90° sobre el aro;
//   · brida final (wrist3_link) de aluminio satinado.
// Referencia: assets-src/oficiales/fr3/fr3-lateral-referencia-386px.png (color del aro ≈ #F0502F–#FF5A40).
//
// En cada GLB la articulación N es el nodo «jN_rot» y su eje es el Z local. Hay que llamar a addRealTrim
// con el robot en la postura cero (antes de girar las articulaciones).
// Opciones de depuración: { debug: true } devuelve las tapas candidatas y por qué se descartan las demás;
// { debug: 'prof' } añade el perfil medido; { all: true } pinta todas las candidatas en colores planos.
// Acabado negro: { ringColor, screwColor } cambian el color del aro y de los tornillos (studio.html?paint=black).
// Comprobado en los 9 GLB (fr3, fr3wms, fr3wml, fr5, fr5wml, fr10, fr16, fr20, fr30).
import * as THREE from 'three';

const RING_COLOR = '#f2512f';
const RING_INNER = 0.775; // radio interior del aro / radio del alojamiento, medido en la foto oficial
const MM = 0.001;

const ray = new THREE.Raycaster();

// Vértices de todas las mallas en el marco de una articulación.
function verticesIn(frame, meshes) {
  const inv = frame.matrixWorld.clone().invert();
  const v = new THREE.Vector3();
  return meshes.map((m) => {
    const M = inv.clone().multiply(m.matrixWorld);
    const pos = m.geometry.attributes.position;
    const out = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(M);
      out[i * 3] = v.x;
      out[i * 3 + 1] = v.y;
      out[i * 3 + 2] = v.z;
    }
    return { mesh: m, pts: out };
  });
}

// Tapa libre de una malla en el sentido s (±1) del eje: extremo de la pieza sobre el eje, cara plana completa,
// lateral cilíndrico alrededor, que no sea la cara interior de un tubo y sin otra pieza delante ni encajada.
function findCap(all, k, s, frame, meshes, log = () => {}) {
  const { pts } = all[k];
  const n = pts.length / 3;
  // Extremo de la pieza a lo largo del eje: rayo desde fuera, por el propio eje, contra esta malla.
  const far = new THREE.Vector3(0, 0, s * 3).applyMatrix4(frame.matrixWorld);
  ray.set(far, new THREE.Vector3(0, 0, -s).transformDirection(frame.matrixWorld));
  ray.far = 6;
  const hit = ray.intersectObject(all[k].mesh, false)[0];
  if (!hit) return null;
  const e0 = s * hit.point.clone().applyMatrix4(frame.matrixWorld.clone().invert()).z;
  const why = (r, extra = '') => (log(`${all[k].mesh.name} s${s} e0=${(e0 / MM).toFixed(1)} ${r} ${extra}`), null);

  // Losa junto al extremo: aquí están la cara plana, el redondeo del canto y el inicio del lateral.
  const near = [];
  for (let i = 0; i < n; i++) {
    const h = s * pts[i * 3 + 2] - e0;
    if (h < -20 * MM || h > 6 * MM) continue;
    const x = pts[i * 3], y = pts[i * 3 + 1];
    near.push({ r: Math.hypot(x, y), h, a: Math.atan2(y, x) });
  }
  const top = near.filter((p) => p.h > -1.5 * MM);
  // Radio de la cara: desde el eje hacia fuera hasta el primer hueco de más de 60 mm
  // (en el brazo, las tapas de J2 y J3 quedan a la misma altura y no deben mezclarse).
  const radii = top.map((p) => p.r).filter((r) => r > 10 * MM).sort((a, b) => a - b);
  if (!radii.length) return why('sin cara');
  let rFlat = radii[0];
  for (const r of radii) {
    if (r - rFlat > 60 * MM) break;
    rFlat = r;
  }

  // Plana: vértices del borde en al menos 10 de 12 sectores.
  const rim = top.filter((p) => p.r > 10 * MM && p.r <= rFlat);
  const sectors = new Set(rim.map((p) => Math.floor(((p.a + Math.PI) / (2 * Math.PI)) * 12) % 12));
  if (sectors.size < 10) return why('cara incompleta', `sect=${sectors.size} rFlat=${(rFlat / MM).toFixed(1)}`);

  // El centro de algunas tapas está rehundido: la cara real es el punto más alto de la propia tapa.
  const lift = Math.max(...near.filter((p) => p.r <= rFlat + 1 * MM).map((p) => p.h));
  const e = e0 + lift;
  // Los alojamientos grandes (FR20, FR30) tienen el redondeo del canto más alto.
  const depth = Math.max(8 * MM, 0.16 * rFlat);
  const slab = near.map((p) => ({ ...p, h: p.h - lift })).filter((p) => p.h <= 0.6 * MM && p.h >= -depth);

  // Radio del alojamiento: el valor de r más repetido entre el borde de la cara plana y +14 mm
  // (descarta los vértices del brazo que nace del lateral).
  const hist = new Map();
  for (const p of slab) {
    if (p.r < rFlat - 2 * MM || p.r > rFlat + 14 * MM) continue;
    const b = Math.round(p.r / (0.5 * MM));
    hist.set(b, (hist.get(b) ?? 0) + 1);
  }
  let best = 0, R = rFlat;
  for (const [b, c] of hist) if (c > best || (c === best && b * 0.5 * MM > R)) [best, R] = [c, b * 0.5 * MM];
  // Lateral del alojamiento: vértices a radio R por debajo de la cara, en cuántos de 12 sectores.
  const wallPts = slab.filter((p) => Math.abs(p.r - R) <= 1 * MM && p.h < -0.8 * MM);
  const wall = new Set(wallPts.map((p) => Math.floor(((p.a + Math.PI) / (2 * Math.PI)) * 12) % 12)).size;
  // Media franja más: el lateral real puede quedar hasta 0,25 mm por fuera del centro de la franja.
  R = Math.max(R + 0.25 * MM, rFlat);

  // Un alojamiento de verdad: lateral completo alrededor de la cara y tamaño de motor de cobot.
  if (wall < 10 || R < 25 * MM || R > 130 * MM) return why('lateral', `wall=${wall} R=${(R / MM).toFixed(1)} rFlat=${(rFlat / MM).toFixed(1)}`);
  // Cara interior: el propio alojamiento sigue más allá de ella (tapa modelada como disco dentro de un tubo).
  for (let i = 0; i < n; i++) {
    const d = s * pts[i * 3 + 2] - e;
    const r = Math.hypot(pts[i * 3], pts[i * 3 + 1]);
    if (d > 1.5 * MM && d < 40 * MM && r > 0.5 * R && r < 1.1 * R) return why('cara interior', `R=${(R / MM).toFixed(1)}`);
  }
  // Nada delante de la tapa ni la cara metida dentro de otra pieza (unión entre dos eslabones).
  if (!exposed(frame, meshes, all[k].mesh, e, s, R)) return why('tapada', `R=${(R / MM).toFixed(1)}`);

  // Perfil exterior (r, h) del canto: máximo h por franja de 0,5 mm entre el radio interior del aro y R.
  const rIn = RING_INNER * R;
  const bins = [];
  for (let r = rIn; r <= R + 1e-6; r += 0.5 * MM) {
    let h = -Infinity;
    for (const p of slab) if (Math.abs(p.r - r) <= 0.5 * MM) h = Math.max(h, p.h);
    bins.push([r, h]);
  }
  // Huecos sin vértices: interpolar.
  for (let i = 0; i < bins.length; i++) {
    if (Number.isFinite(bins[i][1])) continue;
    const a = bins.slice(0, i).reverse().find((b) => Number.isFinite(b[1]));
    const b = bins.slice(i + 1).find((b) => Number.isFinite(b[1]));
    bins[i][1] = a && b ? a[1] + ((b[1] - a[1]) * (bins[i][0] - a[0])) / (b[0] - a[0]) : (a ?? b)?.[1] ?? 0;
  }
  // Envolvente que nunca sube hacia fuera y queda por encima de todo lo que hay más afuera
  // (un vértice interior suelto no puede hundir el aro).
  for (let i = bins.length - 2; i >= 0; i--) bins[i][1] = Math.max(bins[i][1], bins[i + 1][1]);
  // Perfil limpio sin escalones: un punto cada ~1,5 mm con el máximo de su entorno (siempre por encima).
  const step = 3;
  const profile = [];
  for (let i = 0; i < bins.length; i += step) {
    const w = bins.slice(Math.max(0, i - step), Math.min(bins.length, i + step + 1));
    profile.push([bins[i][0], Math.max(...w.map((b) => b[1]))]);
  }
  if (profile[profile.length - 1][0] < bins[bins.length - 1][0]) profile.push(bins[bins.length - 1]);
  return { e, s, R, rFlat, rIn, profile, wall, mesh: all[k].mesh };
}

// Punto dentro de una malla cerrada: número impar de cortes en dos direcciones distintas.
function inside(point, mesh) {
  const odd = (d) => {
    ray.set(point, d.clone().normalize());
    ray.far = Infinity;
    return ray.intersectObject(mesh, false).length % 2 === 1;
  };
  return odd(new THREE.Vector3(0.31, 0.83, 0.47)) && odd(new THREE.Vector3(-0.62, -0.18, 0.76));
}

function exposed(frame, meshes, own, e, s, R) {
  const dir = new THREE.Vector3(0, 0, s).transformDirection(frame.matrixWorld);
  for (const f of [0, 0.5]) {
    const o = new THREE.Vector3(f * R, 0, s * (e + 1.5 * MM)).applyMatrix4(frame.matrixWorld);
    if (meshes.some((m) => m !== own && inside(o, m))) return false;
  }
  let hits = 0, total = 0;
  for (const f of [0, 0.4, 0.7]) {
    for (let a = 0; a < (f ? 6 : 1); a++) {
      const t = (a / 6) * Math.PI * 2;
      const o = new THREE.Vector3(f * R * Math.cos(t), f * R * Math.sin(t), s * (e + 1.5 * MM)).applyMatrix4(frame.matrixWorld);
      ray.set(o, dir);
      ray.far = 80 * MM;
      total++;
      if (ray.intersectObjects(meshes, false).length) hits++;
    }
  }
  return hits / total < 0.3;
}

function ringGeometry(cap) {
  const off = 0.45 * MM;
  const band = Math.max(2.2 * MM, 0.07 * cap.R);
  const prof = cap.profile;
  const hEdge = prof[prof.length - 1][1];
  // Contorno del aro en (r, h), de dentro afuera y bajando por el lateral; luego se cierra por debajo.
  const outer = [[cap.rIn, prof[0][1] - 0.25 * MM], [cap.rIn, prof[0][1] + off + 0.35 * MM]];
  // Separado de la superficie real a lo largo de su normal (también en la parte inclinada del redondeo).
  prof.forEach(([r, h], i) => {
    const [ra, ha] = prof[Math.max(0, i - 1)];
    const [rb, hb] = prof[Math.min(prof.length - 1, i + 1)];
    const l = Math.hypot(rb - ra, hb - ha) || 1;
    outer.push([r - ((hb - ha) / l) * off, h + ((rb - ra) / l) * off]);
  });
  outer.push([cap.R + off, hEdge + off]);
  outer.push([cap.R + off, hEdge - 0.4 * MM]);
  outer.push([cap.R + off, hEdge - band]);
  outer.push([cap.R - 0.6 * MM, hEdge - band]);
  // LatheGeometry gira alrededor de Y: (x = r, y = h).
  const g = new THREE.LatheGeometry(outer.map(([r, h]) => new THREE.Vector2(r, h)), 160);
  g.computeVertexNormals();
  return g;
}

function screw(R, mat, socketMat) {
  const rh = Math.max(1.6 * MM, 0.055 * R);
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(rh, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  head.scale.y = 0.42;
  const socket = new THREE.Mesh(new THREE.CircleGeometry(rh * 0.46, 6), socketMat);
  socket.rotation.x = -Math.PI / 2;
  socket.position.y = rh * 0.42 + 0.05 * MM;
  g.add(head, socket);
  return g;
}

// Aro y 4 tornillos sobre una tapa, colgados del eslabón que la lleva (se mueven con él).
function placeRing(j, cap, ringMat, steel, socketMat, opts) {
  // Marco de la tapa: origen en el centro de la cara, Y local = normal hacia fuera.
  const frame = new THREE.Object3D();
  frame.position.set(0, 0, cap.e * cap.s);
  frame.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, cap.s));
  frame.updateMatrix();
  const link = cap.mesh.parent;
  const toLink = link.matrixWorld.clone().invert().multiply(j.matrixWorld).multiply(frame.matrix);
  const group = new THREE.Group();
  group.name = `${j.name.replace('_rot', '')}_aro`;
  toLink.decompose(group.position, group.quaternion, group.scale);

  const ring = new THREE.Mesh(ringGeometry(cap), ringMat);
  ring.castShadow = ring.receiveShadow = true;
  group.add(ring);

  // Tornillos en el centro de la banda del aro, siguiendo la inclinación del perfil.
  const rs = (cap.rIn + cap.R) / 2;
  const i = cap.profile.findIndex(([r]) => r >= rs);
  const [r0, h0] = cap.profile[Math.max(0, i - 1)];
  const [r1, h1] = cap.profile[Math.min(cap.profile.length - 1, i + 1)];
  const hs = cap.profile[Math.max(0, i)][1] + 0.35 * MM;
  const tilt = Math.atan2(-(h1 - h0), r1 - r0 || 1e-6);
  const phase = THREE.MathUtils.degToRad(opts.screwPhase ?? 8);
  for (let n = 0; n < 4; n++) {
    const a = phase + (n * Math.PI) / 2;
    const sc = screw(cap.R, steel, socketMat);
    const holder = new THREE.Group();
    holder.rotation.y = -a;
    sc.position.set(rs, hs, 0);
    sc.rotation.z = -tilt;
    holder.add(sc);
    group.add(holder);
  }
  link.add(group);
}

const DEBUG_COLORS = [0xff0000, 0x00c000, 0x0060ff, 0xff00ff, 0x00c0c0];
const debugMat = (n) => new THREE.MeshBasicMaterial({ color: DEBUG_COLORS[n % DEBUG_COLORS.length], side: THREE.DoubleSide });

export function addRealTrim(robot, opts = {}) {
  robot.updateMatrixWorld(true);
  const meshes = [];
  robot.traverse((o) => o.isMesh && meshes.push(o));
  const base = meshes.find((m) => /^base_link/i.test(m.name));

  const ringMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(opts.ringColor ?? RING_COLOR),
    roughness: opts.ringColor ? 0.32 : 0.5,
    metalness: 0,
    clearcoat: opts.ringColor ? 0.4 : 0,
    side: THREE.DoubleSide,
  });
  const steel = new THREE.MeshPhysicalMaterial({ color: opts.screwColor ?? 0xc4c8cc, metalness: 1, roughness: 0.3, envMapIntensity: 1.6 });
  const socketMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
  const report = [];
  const log = [];

  // Los rayos de la prueba de tapa libre deben chocar también si salen desde dentro de otra pieza.
  const sides = meshes.map((m) => m.material.side);
  meshes.forEach((m) => (m.material.side = THREE.DoubleSide));
  const joints = [];
  robot.traverse((o) => /^j[1-5]_rot$/.test(o.name) && joints.push(o));
  const rootPos = new THREE.Vector3().setFromMatrixPosition((base ?? robot).matrixWorld);
  for (const j of joints) {
    const all = verticesIn(j, meshes);
    let cap = null;
    const cands = [];
    for (let k = 0; k < all.length; k++) {
      if (all[k].mesh === base) continue;
      for (const s of [1, -1]) {
        const c = findCap(all, k, s, j, meshes, opts.debug ? (m) => log.push(`${j.name} ${m}`) : undefined);
        if (!c) continue;
        // Si quedan dos (p. ej. arriba y abajo del hombro), la tapa libre es la más alejada de la base.
        c.dist = new THREE.Vector3(0, 0, c.e * c.s).applyMatrix4(j.matrixWorld).distanceTo(rootPos);
        cands.push(c);
        if (!cap || c.dist > cap.dist) cap = c;
      }
    }
    if (opts.debug)
      report.push({
        joint: j.name,
        cands: cands.map((c) => {
          const n = new THREE.Vector3(0, 0, c.s).transformDirection(j.matrixWorld);
          const p = new THREE.Vector3(0, 0, c.e * c.s).applyMatrix4(j.matrixWorld);
          return {
            link: c.mesh.parent.name,
            s: c.s,
            e: +(c.e / MM).toFixed(1),
            R: +(c.R / MM).toFixed(1),
            rFlat: +(c.rFlat / MM).toFixed(1),
            n: n.toArray().map((x) => +x.toFixed(2)),
            p: p.toArray().map((x) => Math.round(x / MM)),
            prof: opts.debug === 'prof' ? c.profile.map(([r, h]) => [+(r / MM).toFixed(1), +(h / MM).toFixed(2)]) : undefined,
          };
        }),
      });
    if (!cap) {
      report.push({ joint: j.name, cap: null });
      continue;
    }
    const placed = opts.all ? cands : [cap];
    placed.forEach((c, n) => placeRing(j, c, opts.all ? debugMat(n) : ringMat, steel, socketMat, opts));
    report.push({ joint: j.name, link: cap.mesh.parent.name, side: cap.s, R: +(cap.R / MM).toFixed(1), rFlat: +(cap.rFlat / MM).toFixed(1), rIn: +(cap.rIn / MM).toFixed(1) });
  }

  meshes.forEach((m, i) => (m.material.side = sides[i]));
  if (opts.debug) report.push({ log });

  // Brida de la herramienta: aluminio.
  const flange = meshes.find((m) => /^wrist3_link/i.test(m.name));
  if (flange) {
    flange.material = new THREE.MeshPhysicalMaterial({
      color: 0xd2d5d8,
      metalness: 1,
      roughness: 0.38,
      envMapIntensity: 2.4,
    });
    report.push({ flange: flange.name });
  }
  return report;
}
