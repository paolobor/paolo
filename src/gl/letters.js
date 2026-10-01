import { BufferGeometry, Float32BufferAttribute, LineSegments, LineBasicMaterial, Color, Group } from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import glyphData from '../assets/saira-glyphs.json';

// Prepara el rótulo cromado cargado del .glb. Añade el croquis técnico
// (contorno de cada letra y líneas guía) que se dibuja antes de que cada
// pieza cromada llegue desde el fondo y encaje en su sitio.
export function setupWordmark(root, glyphs = glyphData) {
  const { width, capHeight, em, depth } = root.userData.meta;
  const font = new Font(glyphs);
  const lineMat = new LineBasicMaterial({ color: new Color(0.9, 0.92, 0.95), transparent: true, opacity: 0, depthWrite: false });
  const letters = [];
  for (const holder of root.children) {
    // El cargador glTF añade sufijos (_1) a nombres repetidos entre rótulos
    const match = holder.name.match(/letra-\d+-([A-Z])/);
    if (!match) continue;
    const ch = match[1];
    const solid = holder.children.find((c) => c.name.includes('-cromo')) || holder.children[0];
    // Pivote intermedio: se anima él y no la malla, que conserva la
    // transformación de descuantización del .glb comprimido.
    const pivot = new Group();
    pivot.name = `${holder.name}-pivote`;
    holder.add(pivot);
    pivot.add(solid);
    const pts = [];
    const zf = depth / 2 + 0.006;
    for (const sh of font.generateShapes(ch, em)) {
      for (const path of [sh, ...sh.holes]) {
        const p = path.getPoints(12);
        for (let i = 0; i < p.length; i++) {
          const a = p[i], b = p[(i + 1) % p.length];
          pts.push(a.x, a.y, zf, b.x, b.y, zf);
        }
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pts, 3));
    g.setDrawRange(0, 0);
    const outline = new LineSegments(g, lineMat);
    outline.frustumCulled = false;
    outline.userData.count = pts.length / 3;
    holder.add(outline);
    letters.push({ ch, holder, pivot, solid, outline, draw: 0 });
  }

  // Líneas guía de construcción (base y altura de mayúsculas)
  const ext = em * 0.6;
  const gg = new BufferGeometry();
  gg.setAttribute('position', new Float32BufferAttribute([
    -ext, 0, 0.01, width + ext, 0, 0.01,
    -ext, capHeight, 0.01, width + ext, capHeight, 0.01,
  ], 3));
  const guides = new LineSegments(gg, new LineBasicMaterial({ color: new Color(0.9, 0.92, 0.95), transparent: true, opacity: 0, depthWrite: false }));
  guides.frustumCulled = false;
  root.add(guides);

  return { group: root, letters, width, capHeight, em, depth, lineMat, guides };
}

export function applyOutlineDraw(wordmark) {
  for (const L of wordmark.letters) {
    const n = L.outline.userData.count;
    L.outline.geometry.setDrawRange(0, Math.floor((n * Math.min(1, L.draw)) / 2) * 2);
  }
}
