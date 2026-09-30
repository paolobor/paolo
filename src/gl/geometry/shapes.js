import { Shape, Path, Vector2 } from 'three';

// Redondea cada vértice de un polígono cerrado con un arco tangente.
// pts: [{ x, y, r }] — r es el radio del empalme en ese vértice.
export function filletPolygon(pts, segs = 4) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    let r = p1.r || 0;
    const d1x = p0.x - p1.x, d1y = p0.y - p1.y;
    const d2x = p2.x - p1.x, d2y = p2.y - p1.y;
    const l1 = Math.hypot(d1x, d1y), l2 = Math.hypot(d2x, d2y);
    if (r <= 0 || l1 < 1e-6 || l2 < 1e-6) { out.push(new Vector2(p1.x, p1.y)); continue; }
    const u1x = d1x / l1, u1y = d1y / l1, u2x = d2x / l2, u2y = d2y / l2;
    const cos = Math.min(1, Math.max(-1, u1x * u2x + u1y * u2y));
    const ang = Math.acos(cos);
    if (ang < 1e-3 || Math.abs(ang - Math.PI) < 1e-3) { out.push(new Vector2(p1.x, p1.y)); continue; }
    const tanHalf = Math.tan(ang / 2);
    let dist = r / tanHalf;
    const maxd = Math.min(l1, l2) * 0.5;
    if (dist > maxd) { dist = maxd; r = dist * tanHalf; }
    const t1x = p1.x + u1x * dist, t1y = p1.y + u1y * dist;
    const t2x = p1.x + u2x * dist, t2y = p1.y + u2y * dist;
    let bx = u1x + u2x, by = u1y + u2y;
    const bl = Math.hypot(bx, by); bx /= bl; by /= bl;
    const cd = r / Math.sin(ang / 2);
    const cx = p1.x + bx * cd, cy = p1.y + by * cd;
    const a1 = Math.atan2(t1y - cy, t1x - cx);
    let da = Math.atan2(t2y - cy, t2x - cx) - a1;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    for (let s = 0; s <= segs; s++) {
      const a = a1 + (da * s) / segs;
      out.push(new Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
  }
  return out;
}

export const rot90 = (p, k) => {
  let { x, y } = p;
  for (let i = 0; i < k; i++) [x, y] = [-y, x];
  return { ...p, x, y };
};

export function scalePts(pts, s) {
  return pts.map((p) => ({ ...p, x: p.x * s, y: p.y * s, r: (p.r || 0) * s }));
}

export function shapeFromPts(v2s) {
  const s = new Shape();
  s.setFromPoints(v2s);
  return s;
}

export function pathFromPts(v2s) {
  const p = new Path();
  p.setFromPoints(v2s);
  return p;
}

export function roundedRectPts(w, h, r, cx = 0, cy = 0) {
  const x = w / 2, y = h / 2;
  return [
    { x: cx + x, y: cy - y, r },
    { x: cx + x, y: cy + y, r },
    { x: cx - x, y: cy + y, r },
    { x: cx - x, y: cy - y, r },
  ];
}

export function circlePts(r, n = 32, cx = 0, cy = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(new Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return out;
}

// Tras toCreasedNormals: las tapas de una ExtrudeGeometry (grupos con
// materialIndex 0) reciben normales planas para evitar degradados falsos
// en caras grandes. frontFn(x, y) permite curvar ligeramente la normal frontal.
export function flattenCaps(g, frontFn = null) {
  const pos = g.attributes.position, nor = g.attributes.normal;
  let zmin = Infinity, zmax = -Infinity;
  for (let i = 0; i < pos.count; i++) { const z = pos.getZ(i); if (z < zmin) zmin = z; if (z > zmax) zmax = z; }
  const mid = (zmin + zmax) / 2;
  for (const grp of g.groups) {
    if (grp.materialIndex !== 0) continue;
    for (let i = grp.start; i < grp.start + grp.count; i++) {
      if (pos.getZ(i) > mid) {
        if (frontFn) { const n = frontFn(pos.getX(i), pos.getY(i)); nor.setXYZ(i, n.x, n.y, n.z); }
        else nor.setXYZ(i, 0, 0, 1);
      } else nor.setXYZ(i, 0, 0, -1);
    }
  }
  nor.needsUpdate = true;
  return g;
}
