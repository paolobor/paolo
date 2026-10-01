import { InstancedMesh, Object3D, Vector3, Quaternion, DynamicDrawUsage, Group, MathUtils } from 'three';
import { helixChip, longChip, flatSpiralChip, curlChip, flakeChip } from '../gl/geometry/swarf.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Escena 1: virutas de aluminio flotando en ingravidez.
export class Chips {
  constructor(material, count, center = new Vector3(0, -1, 0)) {
    this.group = new Group();
    this.group.name = 'virutas';
    this.center = center;
    this.converge = 0;
    const r = rng(2026);
    const flakes = [flakeChip(11), flakeChip(17)];
    const variants = [
      { g: helixChip(1), w: 0.12 }, { g: helixChip(5), w: 0.11 }, { g: helixChip(9), w: 0.1 },
      { g: longChip(21), w: 0.08 }, { g: longChip(33), w: 0.07 },
      { g: flatSpiralChip(7), w: 0.08 }, { g: curlChip(3), w: 0.11 }, { g: curlChip(13), w: 0.1 },
      { g: flakes[0], w: 0.12 }, { g: flakes[1], w: 0.11 },
    ];
    this.items = [];
    this.meshes = [];
    for (const v of variants) {
      const n = Math.max(3, Math.round(count * v.w));
      const mesh = new InstancedMesh(v.g, material, n);
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.frustumCulled = false;
      this.group.add(mesh);
      this.meshes.push(mesh);
      for (let i = 0; i < n; i++) {
        // Distribución en un volumen amplio, más denso cerca del plano de foco
        const z = MathUtils.lerp(-26, 10, Math.pow(r(), 0.8));
        const spread = 1 + (-z + 10) / 36;
        const it = {
          mesh, i,
          base: new Vector3((r() - 0.5) * 30 * spread, (r() - 0.5) * 17 * spread, z),
          drift: new Vector3((r() - 0.5) * 0.25, 0.08 + r() * 0.18, (r() - 0.5) * 0.15),
          phase: r() * Math.PI * 2,
          axis: new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
          spin: 0.12 + r() * 0.45,
          q: new Quaternion().setFromAxisAngle(new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), r() * 6.28),
          scale: (0.8 + r() * 0.9) * (flakes.includes(v.g) ? 1.4 : 1),
          delay: r() * 0.4,
          swirl: (0.9 + r() * 1.3) * (r() > 0.5 ? 1 : -1),
        };
        this.items.push(it);
      }
    }
    this.build = null; // guion de montaje: cada viruta vuela a fundirse en un perfil
    this.buildT = 0;
    this._o = new Object3D();
    this._q = new Quaternion();
    this._p = new Vector3();
    this._v = new Vector3();
    this.time = 0;
    this.update(0);
  }

  // Asigna cada viruta a un perfil (o a la escuadra) con su instante de llegada.
  // specs: [{ start, dir, len, t0, t1, weight }] (frente de crecimiento lineal t0->t1)
  setBuild(specs, { scatterUntil = 2.4 } = {}) {
    const r = rng(77);
    const total = specs.reduce((a, s) => a + s.weight, 0);
    const perp = new Vector3();
    const side = new Vector3();
    let maxT = scatterUntil;
    for (const it of this.items) {
      let pick = r() * total * 1.12; // ~10 % se dispersan fuera de cuadro
      let spec = null;
      for (const sp of specs) { if (pick < sp.weight) { spec = sp; break; } pick -= sp.weight; }
      if (!spec) { it.job = { scatter: true, dir: new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), t0: 0.2 + r() * 1.2 }; continue; }
      const s = Math.pow(r(), 0.9);
      const ta = spec.t0 + s * (spec.t1 - spec.t0) + (r() - 0.5) * 0.08;
      const flight = 1.1 + r() * 1.0;
      // punto de llegada sobre la superficie del perfil, junto al frente
      perp.set(spec.dir.y, spec.dir.z, spec.dir.x);
      side.crossVectors(spec.dir, perp);
      const a = (r() - 0.5) * 2 * (spec.half || 2), b = (r() > 0.5 ? 1 : -1) * (spec.half || 2) * (0.6 + r() * 0.45);
      const flip = r() > 0.5;
      const target = spec.start.clone().addScaledVector(spec.dir, s * spec.len)
        .addScaledVector(perp, flip ? a : b).addScaledVector(side, flip ? b : a);
      const swirl = new Vector3(r() - 0.5, (r() - 0.5) * 0.6, r() - 0.5).normalize().multiplyScalar(4 + r() * 6);
      it.job = { target, td: Math.max(0, ta - flight), ta, swirl, p0: null };
      maxT = Math.max(maxT, ta);
    }
    this.build = { maxT };
    this.buildT = 0;
  }

  clearBuild() {
    this.build = null;
    this.buildT = 0;
    for (const it of this.items) it.job = null;
  }

  update(dt) {
    this.time += dt;
    const t = this.time;
    const c = this.converge;
    const o = this._o, q = this._q;
    const H = 12;
    for (const it of this.items) {
      const spinBoost = 1 + c * 7;
      q.setFromAxisAngle(it.axis, it.spin * dt * spinBoost);
      it.q.multiply(q);
      // deriva lenta con recirculación vertical
      const p = this._p.copy(it.base).addScaledVector(it.drift, t);
      p.y = ((p.y + H) % (2 * H) + 2 * H) % (2 * H) - H;
      p.x += Math.sin(t * 0.21 + it.phase) * 0.35;
      p.z += Math.cos(t * 0.17 + it.phase) * 0.3;
      let s = it.scale;
      if (c > 0) {
        const u = MathUtils.clamp((c - it.delay) / 0.6, 0, 1);
        const e = easeInOut(u);
        // espiral hacia el centro
        const v = this._v.copy(p).sub(this.center);
        const ang = e * it.swirl * Math.PI;
        const cs = Math.cos(ang), sn = Math.sin(ang);
        const x = v.x * cs - v.z * sn, z = v.x * sn + v.z * cs;
        v.set(x, v.y, z).multiplyScalar(1 - e);
        p.copy(this.center).add(v);
        s *= 1 - MathUtils.smoothstep(e, 0.62, 1.0);
      }
      if (this.build && it.job) {
        const j = it.job, bt = this.buildT;
        if (j.scatter) {
          // se alejan girando y desaparecen
          const u = MathUtils.clamp((bt - j.t0) / 1.6, 0, 1);
          p.addScaledVector(j.dir, u * u * 14);
          s *= 1 - MathUtils.smoothstep(u, 0.3, 1);
        } else if (bt > j.td) {
          if (!j.p0) j.p0 = p.clone();
          const u = MathUtils.clamp((bt - j.td) / (j.ta - j.td), 0, 1);
          const e = u * u * (1.6 - 0.6 * u); // aceleración de succión
          // Bézier cuadrática con un remolino lateral
          const mid = this._v.copy(j.p0).lerp(j.target, 0.5).add(j.swirl);
          const a = 1 - e;
          p.set(
            a * a * j.p0.x + 2 * a * e * mid.x + e * e * j.target.x,
            a * a * j.p0.y + 2 * a * e * mid.y + e * e * j.target.y,
            a * a * j.p0.z + 2 * a * e * mid.z + e * e * j.target.z,
          );
          s *= u >= 1 ? 0 : 1 - MathUtils.smoothstep(u, 0.78, 1) * 0.85;
          q.setFromAxisAngle(it.axis, dt * 6 * u);
          it.q.multiply(q);
        } else if (j.p0) {
          j.p0 = null; // guion rebobinado
        }
      }
      o.position.copy(p);
      o.quaternion.copy(it.q);
      o.scale.setScalar(s);
      o.updateMatrix();
      it.mesh.setMatrixAt(it.i, o.matrix);
    }
    for (const m of this.meshes) m.instanceMatrix.needsUpdate = true;
    this.group.visible = c < 0.999 && !(this.build && this.buildT > this.build.maxT + 0.05);
  }
}
