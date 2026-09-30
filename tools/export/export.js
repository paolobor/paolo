// Genera los .glb del modelo 3D (lo ejecuta tools/export-glb.mjs en Chromium).
import { Scene, PerspectiveCamera, Group } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createModelMaterials } from '../../src/model/materials.js';
import { buildAssembly, buildWordmark } from '../../src/model/build.js';
import { composeLogo, projectedExtents, basis } from '../../src/model/layout.js';

const exporter = new GLTFExporter();
const toGLB = (input) => exporter.parseAsync(input, { binary: true, onlyVisible: true });
const b64 = (buf) => {
  let s = '';
  const u = new Uint8Array(buf);
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
};

window.exportAll = async () => {
  const m = createModelMaterials();
  const out = {};

  // 1) Modelo para la web: montaje + rótulo en su propio origen
  {
    const scene = new Scene();
    scene.name = 'FDI MODULAR';
    scene.add(buildAssembly(m), buildWordmark(m.chrome));
    out.web = b64(await toGLB(scene));
  }
  // 2) Diseño: escuadra cúbica con perfiles y tornillería
  {
    const scene = new Scene();
    scene.name = 'FDI MODULAR - escuadra cubica 40x40 ranura 10';
    scene.add(buildAssembly(m));
    out.escuadra = b64(await toGLB(scene));
  }
  // 3) Diseño: logo 3D compuesto (con cámara que reproduce el logo)
  {
    const scene = new Scene();
    scene.name = 'FDI MODULAR - logo 3D';
    const asm = buildAssembly(m);
    const text = buildWordmark(m.chrome);
    const aspect = 3.0, fov = 24;
    const { right, up } = basis(225, 30);
    const L = composeLogo({ extents: projectedExtents(asm, right, up), textWidth: text.userData.meta.width, textCap: text.userData.meta.capHeight, aspect, fov });
    text.position.copy(L.text.position);
    text.quaternion.copy(L.text.quaternion);
    text.scale.setScalar(L.text.scale);
    const cam = new PerspectiveCamera(fov, aspect, 0.1, 500);
    cam.name = 'camara-logo';
    const b = basis(L.pose.az, L.pose.el);
    cam.position.copy(L.pose.target).addScaledVector(b.back, L.pose.dist);
    cam.lookAt(L.pose.target);
    const logo = new Group();
    logo.name = 'logo-fdi-modular';
    logo.add(asm, text);
    scene.add(logo, cam);
    out.logo = b64(await toGLB(scene));
  }
  document.getElementById('s').textContent = 'Listo';
  return out;
};
window.exporterReady = true;
