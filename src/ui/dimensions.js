import { Vector3 } from 'three';

const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};

// Líneas de cota técnicas (SVG) proyectadas desde puntos 3D.
export class Dimensions {
  constructor(svg) {
    this.svg = svg;
    this.items = new Map();
    this._v = new Vector3();
  }

  add(key, spec, object) {
    const g = el('g', { class: 'dim', opacity: 0 });
    const ext1 = el('line', { class: 'dim-ext' });
    const ext2 = el('line', { class: 'dim-ext' });
    const main = el('line', { class: 'dim-line' });
    const t1 = el('line', { class: 'dim-tick' });
    const t2 = el('line', { class: 'dim-tick' });
    const label = el('text', { class: 'dim-label', 'text-anchor': 'middle' });
    label.textContent = spec.label;
    g.append(ext1, ext2, main, t1, t2, label);
    this.svg.appendChild(g);
    const state = { draw: 0, alpha: 0 };
    this.items.set(key, { spec, object, g, ext1, ext2, main, t1, t2, label, state });
    return state;
  }

  project(p, object, camera, w, h) {
    const v = this._v.copy(p);
    object.localToWorld(v);
    v.project(camera);
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, z: v.z };
  }

  update(camera, w, h) {
    for (const it of this.items.values()) {
      const { spec, object, state } = it;
      const vis = Math.min(state.draw * 3, 1) * (1 - state.alpha);
      it.g.setAttribute('opacity', vis.toFixed(3));
      if (vis <= 0.001) continue;
      const a = this.project(spec.a, object, camera, w, h);
      const b = this.project(spec.b, object, camera, w, h);
      const pa = spec.a.clone().add(spec.offset);
      const pb = spec.b.clone().add(spec.offset);
      const a2 = this.project(pa, object, camera, w, h);
      const b2 = this.project(pb, object, camera, w, h);
      // prolongación ligeramente más allá de la línea de cota
      const ext = (p, q) => ({ x: q.x + (q.x - p.x) * 0.18, y: q.y + (q.y - p.y) * 0.18 });
      const a3 = ext(a, a2), b3 = ext(b, b2);
      const gap = (p, q) => ({ x: p.x + (q.x - p.x) * 0.12, y: p.y + (q.y - p.y) * 0.12 });
      const a0 = gap(a, a2), b0 = gap(b, b2);
      const d = Math.min(1, state.draw);
      const set = (line, p, q) => {
        line.setAttribute('x1', p.x.toFixed(1)); line.setAttribute('y1', p.y.toFixed(1));
        line.setAttribute('x2', q.x.toFixed(1)); line.setAttribute('y2', q.y.toFixed(1));
      };
      set(it.ext1, a0, { x: a0.x + (a3.x - a0.x) * d, y: a0.y + (a3.y - a0.y) * d });
      set(it.ext2, b0, { x: b0.x + (b3.x - b0.x) * d, y: b0.y + (b3.y - b0.y) * d });
      const mid = { x: (a2.x + b2.x) / 2, y: (a2.y + b2.y) / 2 };
      set(it.main, { x: mid.x + (a2.x - mid.x) * d, y: mid.y + (a2.y - mid.y) * d }, { x: mid.x + (b2.x - mid.x) * d, y: mid.y + (b2.y - mid.y) * d });
      // marcas de cota a 45°
      const tick = (line, p) => set(line, { x: p.x - 4, y: p.y + 4 }, { x: p.x + 4, y: p.y - 4 });
      tick(it.t1, a2); tick(it.t2, b2);
      it.t1.setAttribute('opacity', d > 0.95 ? 1 : 0);
      it.t2.setAttribute('opacity', d > 0.95 ? 1 : 0);
      // etiqueta hacia fuera de la pieza
      let nx = mid.x - (a.x + b.x) / 2, ny = mid.y - (a.y + b.y) / 2;
      const nl = Math.hypot(nx, ny) || 1;
      nx /= nl; ny /= nl;
      const horizontalish = Math.abs(b2.x - a2.x) > Math.abs(b2.y - a2.y);
      const off = horizontalish ? 16 : 14;
      it.label.setAttribute('x', (mid.x + nx * off + (horizontalish ? 0 : nx * 26)).toFixed(1));
      it.label.setAttribute('y', (mid.y + ny * off + 4).toFixed(1));
      it.label.setAttribute('text-anchor', horizontalish ? 'middle' : nx < 0 ? 'end' : 'start');
      it.label.setAttribute('opacity', Math.max(0, (d - 0.6) / 0.4).toFixed(3));
    }
  }
}
