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
    this._o = new Object3D();
    this._q = new Quaternion();
    this._p = new Vector3();
    this._v = new Vector3();
    this.time = 0;
    this.update(0);
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
      o.position.copy(p);
      o.quaternion.copy(it.q);
      o.scale.setScalar(s);
      o.updateMatrix();
      it.mesh.setMatrixAt(it.i, o.matrix);
    }
    for (const m of this.meshes) m.instanceMatrix.needsUpdate = true;
    this.group.visible = c < 0.999;
  }
}
