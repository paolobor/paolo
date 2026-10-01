import { DirectionalLight, Vector3, Quaternion, MathUtils, Group, Mesh, PlaneGeometry, ShadowMaterial, CatmullRomCurve3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import gsap from 'gsap';
import { Stage } from './gl/stage.js';
import { createStudioEnvironment, createChromeEnvironment } from './gl/environment.js';
import { prepareMaterials } from './gl/materials.js';
import { createGrid } from './gl/grid.js';
import { setupWordmark, applyOutlineDraw } from './gl/letters.js';
import { Chips } from './scenes/chips.js';
import { setupAssembly } from './scenes/assembly.js';
import { setupStructure } from './scenes/structure.js';
import { Dimensions } from './ui/dimensions.js';
import { basis, composeLogo, projectedExtents, FINAL_AZ } from './model/layout.js';

const MODEL_URL = new URL('./assets/models/fdi-modular.glb', import.meta.url).href;

// Poses de cámara (esféricas alrededor de un objetivo)
const POSES = {
  intro: { az: 200, el: 5, dist: 25, target: new Vector3(0, -1, 0) },
  close: { az: 213, el: 17, dist: 17, target: new Vector3(0, -1.3, 0) },
  wide: { az: 228, el: 24, dist: 38, target: new Vector3(1.6, -3.8, 1.6) },
};
const STRUCT_AZ = 218, STRUCT_EL = 21;

function lerpPose(a, b, t, out) {
  out.az = MathUtils.lerp(a.az, b.az, t);
  out.el = MathUtils.lerp(a.el, b.el, t);
  out.dist = MathUtils.lerp(a.dist, b.dist, t);
  out.target.lerpVectors(a.target, b.target, t);
  return out;
}
const newPose = () => ({ az: 0, el: 0, dist: 0, target: new Vector3() });

export class App {
  constructor({ canvas, svg, ui, quality, reducedMotion }) {
    this.ui = ui;
    this.svg = svg;
    this.quality = quality;
    this.reducedMotion = reducedMotion;
    this.state = 'intro';
    this.stage = new Stage(canvas, quality);
  }

  async init() {
    const { stage, quality } = this;
    const { scene, renderer } = stage;

    // Modelo 3D (diseño tipo CAD exportado a .glb)
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(MODEL_URL);
    const montaje = gltf.scene.getObjectByName('montaje');
    const rotulo = gltf.scene.getObjectByName('rotulo');
    const bancada = gltf.scene.getObjectByName('bancada');

    // Entornos y materiales
    scene.environment = createStudioEnvironment(renderer);
    const chromeEnv = createChromeEnvironment(renderer);
    const mats = (this.mats = prepareMaterials(gltf.scene, { chromeEnv }));

    // Luces directas (destellos y sombras suaves)
    const key = (this.key = new DirectionalLight(0xfff6ec, 1.1));
    key.position.set(-9, 16, -7);
    key.target.position.set(1, -4, 1);
    if (quality.shadows) {
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.bias = -0.0004;
      key.shadow.normalBias = 0.025;
      key.shadow.radius = 4;
    }
    this.setShadowFrame('logo');
    scene.add(key, key.target);
    const glint = (this.glint = new DirectionalLight(0xffffff, 3.2));
    glint.position.set(6, 8, 12);
    scene.add(glint);

    // Escena 1: virutas
    this.chips = new Chips(mats.chip, quality.chips);
    scene.add(this.chips.group);

    // Escena 2: montaje
    const asm = (this.asm = setupAssembly(montaje, mats, { shadows: quality.shadows }));
    scene.add(asm.root);

    // Rótulo cromado
    const wm = (this.wordmark = setupWordmark(rotulo));
    this.textRig = new Group();
    this.textRig.add(wm.group);
    scene.add(this.textRig);

    // Escena 3: bancada para cobot (la esquina 0 es el propio montaje del logo)
    const bench = (this.bench = setupStructure(bancada, { shadows: quality.shadows }));
    bench.corners[0].visible = false;
    scene.add(bench.root);

    // Rejilla técnica y sombra en el suelo
    this.logoFloor = asm.meta.vTop - asm.meta.lengthV - 0.6;
    this.grid = createGrid({ y: this.logoFloor, center: new Vector3(1.5, 0, 1.5) });
    scene.add(this.grid);
    this.shadowFloor = new Mesh(new PlaneGeometry(400, 400), new ShadowMaterial({ opacity: 0, transparent: true, depthWrite: false }));
    this.shadowFloor.rotation.x = -Math.PI / 2;
    this.shadowFloor.position.set(bench.meta.W / 2, bench.meta.floor + 0.01, bench.meta.D / 2);
    this.shadowFloor.receiveShadow = true;
    scene.add(this.shadowFloor);

    // Cotas
    this.dims = new Dimensions(this.svg);
    this.dimState = {};
    for (const [k, spec] of Object.entries(asm.dims)) this.dimState[k] = this.dims.add(k, spec, asm.root);
    const { W, floor } = bench.meta;
    this.benchDims = {
      w800: this.dims.add('w800', { a: new Vector3(-2, floor, -2), b: new Vector3(W + 2, floor, -2), offset: new Vector3(0, 0, -7), label: '800 mm' }, bench.root),
      h750: this.dims.add('h750', { a: new Vector3(W + 2, floor, -2), b: new Vector3(W + 2, 0, -2), offset: new Vector3(7, 0, 0), label: '750 mm' }, bench.root),
    };

    // Estado animable
    this.cam = { k1: 0, k2: 0, k3: 0, k4: 0, orbit: 0 };
    this.pose = newPose();
    this.scanState = { y: 1000, gain: 0 };
    this.dofState = { bokeh: stage.dof.bokehScale };
    this.gridState = { o: 0, y: this.logoFloor, r: 30 };
    this.chromeSweep = { v: 0 };
    this.tagState = { p: 0 };
    // Postura del cobot: plegado -> trabajo (unfold) + movimiento de trabajo (w)
    this.cobotPose = bench.pose.map((r) => [r.x, r.y, r.z]);
    this.cobotFolded = [[0, 2.36 - 0.9, 0], [-0.2, 0, 0], [2.85, 0, 0], [0.5, 0, 0], [0, 0, 0], [0, 0, 0]];
    this.cobotState = { unfold: 1, w: 0 };
    this.diveState = { k: 0 };
    this.parallax = { x: 0, y: 0, tx: 0, ty: 0 };
    this.time = 0;

    this.computeLayout();
    stage.onResize = () => this.computeLayout();
    this.resetToIntro();
    this.bindInput();
  }

  setShadowFrame(which) {
    const key = this.key;
    const c = key.shadow.camera;
    // En la bancada la luz directa solo se usa para la sombra del suelo
    key.intensity = which === 'logo' ? 1.1 : 0.3;
    if (which === 'logo') {
      key.position.set(-9, 16, -7);
      key.target.position.set(1, -4, 1);
      c.left = -16; c.right = 16; c.top = 16; c.bottom = -16; c.near = 1; c.far = 60;
    } else {
      key.position.set(-30, 90, -40);
      key.target.position.set(38, -40, 38);
      c.left = -85; c.right = 85; c.top = 85; c.bottom = -85; c.near = 10; c.far = 320;
    }
    c.updateProjectionMatrix();
    key.target.updateMatrixWorld();
  }

  // ---------- Composición según el formato de pantalla
  computeLayout() {
    const { width: w, height: h } = this.stage;
    const aspect = w / h;
    const cam = this.stage.camera;
    const el = aspect < 0.95 ? 27 : 30;
    const { right, up } = basis(FINAL_AZ, el);
    // Extensión proyectada del montaje con las piezas en su posición final
    const saved = [];
    for (const p of Object.values(this.asm.parts)) { saved.push([p, p.position.clone()]); p.position.copy(p.userData.final); }
    const extents = projectedExtents(this.asm.root, right, up);
    for (const [p, pos] of saved) p.position.copy(pos);
    this.asm.root.updateMatrixWorld(true);

    const wm = this.wordmark;
    const L = composeLogo({ extents, textWidth: wm.width, textCap: wm.capHeight, aspect, fov: cam.fov });
    this.finalPose = L.pose;
    this.textRig.position.copy(L.text.position);
    this.textRig.quaternion.copy(L.text.quaternion);
    this.textRig.scale.setScalar(L.text.scale);
    this.textRig.updateMatrixWorld(true);
    this.chromeBase = L.text.quaternion.clone();
    this.layout = { portrait: L.portrait, s: L.text.scale };

    // Bancada: a la derecha (horizontal) o arriba (vertical), dejando sitio a los textos
    const B = this.bench;
    const sb = basis(STRUCT_AZ, STRUCT_EL);
    const savedB = B.all.map((p) => [p, p.position.clone(), p.scale.clone()]);
    for (const p of B.all) { p.position.copy(p.userData.final); p.scale.copy(p.userData.finalScale); }
    const vis = B.root.visible;
    B.root.visible = true;
    const e = projectedExtents(B.root, sb.right, sb.up);
    B.root.visible = vis;
    for (const [p, pos, sc] of savedB) { p.position.copy(pos); p.scale.copy(sc); }
    const bw = e.maxR - e.minR, bh = e.maxU - e.minU;
    const tanV = Math.tan((cam.fov * Math.PI) / 360), tanH = tanV * aspect;
    const center = new Vector3().addScaledVector(sb.right, (e.minR + e.maxR) / 2).addScaledVector(sb.up, (e.minU + e.maxU) / 2);
    let dist, shiftR = 0, shiftU = 0;
    if (!L.portrait) {
      dist = Math.max((bh * 1.12) / 2 / tanV, bw / (0.56 * 2 * tanH));
      shiftR = -0.2 * 2 * dist * tanH; // la bancada queda a la derecha
    } else {
      dist = Math.max((bw * 1.1) / 2 / tanH, bh / (0.62 * 2 * tanV));
      shiftU = -0.15 * 2 * dist * tanV; // la bancada queda arriba
    }
    const target = center.clone().addScaledVector(sb.right, shiftR).addScaledVector(sb.up, shiftU);
    // El objetivo se lleva al plano de la bancada (profundidad de su centro)
    this.structPose = { az: STRUCT_AZ, el: STRUCT_EL, dist, target };
  }

  // ---------- Estados
  resetToIntro() {
    if (this.tl) this.tl.kill();
    if (this.stl) this.stl.kill();
    if (this.dtl) this.dtl.kill();
    this.tl = this.stl = this.dtl = null;
    this.state = 'intro';
    this.chips.converge = 0;
    this.chips.group.visible = true;
    const P = this.asm.parts;
    for (const p of Object.values(P)) { p.visible = false; p.position.copy(p.userData.final); }
    for (const s of this.asm.screws) s.userData.spin.rotation.y = 0;
    const wm = this.wordmark;
    for (const L of wm.letters) {
      L.solid.visible = false;
      L.pivot.position.set(0, 0, 0);
      L.pivot.rotation.set(0, 0, 0);
      L.draw = 0;
    }
    this.textRig.visible = true;
    wm.lineMat.opacity = 0;
    wm.guides.material.opacity = 0;
    this.resetBench();
    Object.assign(this.cam, { k1: 0, k2: 0, k3: 0, k4: 0, orbit: 0 });
    Object.assign(this.scanState, { y: 1000, gain: 0 });
    this.dofState.bokeh = this.stage.quality.tier === 'low' ? 1.8 : 2.6;
    Object.assign(this.gridState, { o: 0, y: this.logoFloor, r: 30 });
    this.tagState.p = 0;
    this.chromeSweep.v = 0;
    this.diveState.k = 0;
    this.stage.scene.environmentRotation.set(0, 0, 0);
    this.mats.rimUniforms.uGlow.value = 0;
    this.mats.rimUniforms.uBand.value = 0;
    this.mats.rimUniforms.uSweep.value = -0.2;
    for (const st of Object.values(this.dimState)) Object.assign(st, { draw: 0, alpha: 0 });
    for (const st of Object.values(this.benchDims)) Object.assign(st, { draw: 0, alpha: 0 });
    this.setShadowFrame('logo');
    this.ui.resetStatements();
    this.ui.setFade(0);
    this.ui.setState('intro');
    if (this.reducedMotion) this.goToLogo(true);
  }

  resetBench() {
    const B = this.bench;
    B.root.visible = false;
    for (const p of B.all) { p.position.copy(p.userData.final); p.scale.copy(p.userData.finalScale); p.visible = true; }
    B.corners[0].visible = false;
    for (const list of B.cornerScrews) for (const s of list) { s.position.copy(s.userData.final); s.userData.spin.rotation.y = 0; }
    for (const f of B.footSpins) f.rotation.y = 0;
    this.cobotState.unfold = 1;
    this.cobotState.w = 0;
    this.shadowFloor.material.opacity = 0;
  }

  buildTimeline() {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    const A = this.asm, P = A.parts, R = this.mats.rimUniforms;

    // Las virutas se ordenan hacia el centro y desaparecen
    tl.to(this.chips, { converge: 1, duration: 2.7, ease: 'power2.inOut' }, 0);
    tl.to(this.cam, { k1: 1, duration: 3.2, ease: 'power3.inOut' }, 0);
    tl.to(this.dofState, { bokeh: 0, duration: 2.4, ease: 'power1.inOut' }, 0.8);

    // La escuadra se "mecaniza" de arriba abajo
    tl.set(P.connector, { visible: true }, 1.95);
    tl.fromTo(this.scanState, { y: A.anchors.scanTop }, { y: A.anchors.scanBottom, duration: 1.9, ease: 'power2.inOut' }, 1.95);
    tl.fromTo(this.scanState, { gain: 0 }, { gain: 1, duration: 0.35 }, 1.95);
    tl.to(this.scanState, { gain: 0, duration: 0.45 }, 3.45);
    tl.set(this.scanState, { y: -1000 }, 3.9);
    tl.fromTo(this.stage.scene.environmentRotation, { y: -1.1 }, { y: 0.25, duration: 5, ease: 'power1.inOut' }, 2.2);

    // Perfil vertical desde abajo
    tl.to(this.cam, { k2: 1, duration: 3.6, ease: 'power2.inOut' }, 3.2);
    tl.to(this.gridState, { o: 1, duration: 3 }, 3.4);
    tl.set(P.pV, { visible: true }, 3.35);
    tl.fromTo(P.pV.position, { y: P.pV.userData.final.y - 24 }, { y: P.pV.userData.final.y, duration: 1.9, ease: 'expo.out' }, 3.35);
    tl.to(this.dimState.width40, { draw: 1, duration: 0.9, ease: 'power2.out' }, 4.4);

    // Perfiles horizontales desde sus direcciones
    tl.set(P.pX, { visible: true }, 4.35);
    tl.fromTo(P.pX.position, { x: P.pX.userData.final.x + 26 }, { x: P.pX.userData.final.x, duration: 1.9, ease: 'expo.out' }, 4.35);
    tl.set(P.pZ, { visible: true }, 4.65);
    tl.fromTo(P.pZ.position, { z: P.pZ.userData.final.z + 26 }, { z: P.pZ.userData.final.z, duration: 1.9, ease: 'expo.out' }, 4.65);
    tl.to(this.dimState.slot10, { draw: 1, duration: 0.9, ease: 'power2.out' }, 5.7);
    tl.to(this.dimState.height40, { draw: 1, duration: 0.9, ease: 'power2.out' }, 6.0);

    // Tornillos de las pletinas: entran en la ranura superior y se aprietan
    [P.screwX, P.screwZ].forEach((s, i) => {
      const t = 6.3 + i * 0.28;
      tl.set(s, { visible: true }, t);
      tl.fromTo(s.position, { y: s.userData.final.y + 3.4 }, { y: s.userData.final.y, duration: 1.35, ease: 'power3.out' }, t);
      tl.fromTo(s.userData.spin.rotation, { y: -Math.PI * 9 }, { y: -0.5, duration: 1.35, ease: 'power3.out' }, t);
      tl.to(s.userData.spin.rotation, { y: 0, duration: 0.5, ease: 'power4.out' }, t + 1.38);
    });
    // Tornillos laterales del cuello
    [[P.screwNX, 'x'], [P.screwNZ, 'z']].forEach(([s, ax], i) => {
      const t = 7.15 + i * 0.25;
      tl.set(s, { visible: true }, t);
      tl.fromTo(s.position, { [ax]: s.userData.final[ax] - 2.6 }, { [ax]: s.userData.final[ax], duration: 1.2, ease: 'power3.out' }, t);
      tl.fromTo(s.userData.spin.rotation, { y: -Math.PI * 7 }, { y: -0.45, duration: 1.2, ease: 'power3.out' }, t);
      tl.to(s.userData.spin.rotation, { y: 0, duration: 0.45, ease: 'power4.out' }, t + 1.22);
    });
    for (const k of Object.keys(this.dimState)) tl.to(this.dimState[k], { alpha: 1, duration: 0.7 }, 8.0);

    // El filo naranja se enciende con un barrido de luz
    tl.fromTo(R.uBand, { value: 0 }, { value: 1, duration: 0.35 }, 8.45);
    tl.fromTo(R.uSweep, { value: -0.15 }, { value: 1.85, duration: 1.9, ease: 'power1.inOut' }, 8.45);
    tl.to(R.uGlow, { value: 0.9, duration: 1.3 }, 8.7);
    tl.to(R.uBand, { value: 0, duration: 0.6 }, 9.9);

    // Cámara a la composición del logo
    tl.to(this.cam, { k3: 1, duration: 2.9, ease: 'power3.inOut' }, 8.1);

    // Letras cromadas pieza a pieza
    tl.add(this.lettersTimeline(), 10.2);
    tl.to(this.tagState, { p: 1, duration: 1.4, ease: 'power2.out' }, 12.6);
    tl.to(this.cam, { orbit: 1, duration: 4, ease: 'sine.inOut' }, 12.8);
    tl.add(() => { if (this.state === 'building') { this.state = 'logo'; this.ui.setState('logo'); } }, 12.6);
    return tl;
  }

  lettersTimeline() {
    const tl = gsap.timeline();
    const wm = this.wordmark;
    // Croquis técnico: líneas guía y contorno de cada letra
    tl.fromTo(wm.guides.material, { opacity: 0 }, { opacity: 0.3, duration: 0.6, ease: 'power1.out' }, 0);
    tl.fromTo(wm.lineMat, { opacity: 0 }, { opacity: 0.7, duration: 0.3 }, 0.05);
    wm.letters.forEach((L, i) => {
      tl.fromTo(L, { draw: 0 }, { draw: 1, duration: 0.6, ease: 'power1.inOut' }, 0.1 + i * 0.05);
    });
    // Cada pieza cromada llega desde el fondo y encaja en su croquis
    const t1 = 0.75;
    wm.letters.forEach((L, i) => {
      const t = t1 + i * 0.09;
      tl.set(L.solid, { visible: true }, t);
      tl.fromTo(L.pivot.position, { z: -11, y: wm.capHeight * 0.08 }, { z: 0, y: 0, duration: 1.25, ease: 'expo.out' }, t);
      tl.fromTo(L.pivot.rotation, { y: -0.55, x: 0.1 }, { y: 0, x: 0, duration: 1.25, ease: 'expo.out' }, t);
    });
    const tEnd = t1 + wm.letters.length * 0.09 + 0.7;
    tl.to(wm.lineMat, { opacity: 0, duration: 0.8 }, tEnd);
    tl.to(wm.guides.material, { opacity: 0, duration: 1.0 }, tEnd);
    tl.fromTo(this.chromeSweep, { v: -0.9 }, { v: 0.45, duration: 2.4, ease: 'power2.inOut' }, t1 + 0.5);
    return tl;
  }

  // Escena 3: la cámara se aleja y la bancada se monta pieza a pieza
  structureTimeline() {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    const B = this.bench, P = this.asm.parts, wm = this.wordmark, ui = this.ui;
    const m = B.meta;

    // Salida del rótulo y del lema
    tl.to(this.tagState, { p: 0, duration: 0.6, ease: 'power2.in' }, 0);
    wm.letters.forEach((L, i) => {
      tl.to(L.pivot.position, { z: -14, duration: 0.9, ease: 'power3.in' }, i * 0.035);
      tl.set(L.solid, { visible: false }, 0.9 + i * 0.035);
    });
    tl.to(this.cam, { k4: 1, duration: 3.4, ease: 'power3.inOut' }, 0.1);
    tl.to(this.cam, { orbit: 0.6, duration: 2 }, 0);
    tl.to(this.gridState, { y: m.floor, r: 95, duration: 3, ease: 'power2.inOut' }, 0.3);
    tl.set(B.root, { visible: true }, 0.55);
    tl.add(() => this.setShadowFrame('bench'), 0.55);
    tl.to(this.shadowFloor.material, { opacity: 0.42, duration: 2.5 }, 2.2);
    tl.add(ui.statementIn(0), 0.9);
    tl.add(ui.statementOut(0), 4.3);

    // Cada pieza está oculta hasta su entrada y llega desde fuera con deceleración
    const slide = (part, axis, delta, at, dur = 1.1) => {
      tl.set(part, { visible: false }, 0);
      tl.set(part, { visible: true }, at);
      tl.fromTo(part.position, { [axis]: part.userData.final[axis] + delta }, { [axis]: part.userData.final[axis], duration: dur, ease: 'expo.out' }, at);
    };
    // Esquina del logo: los perfiles cortos se "extruyen" hasta su longitud final
    const grow = (part, from, at) => {
      tl.set(part.scale, { z: from }, 0);
      tl.fromTo(part.scale, { z: from }, { z: 1, duration: 1.5, ease: 'power3.inOut' }, at);
    };
    tl.set([P.pX, P.pZ, P.pV], { visible: false }, 0.6);
    grow(B.beams.x0, this.asm.meta.lengthH / m.beamLength, 0.6);
    grow(B.beams.z0, this.asm.meta.lengthH / m.beamLength, 0.75);
    grow(B.legs[0], this.asm.meta.lengthV / m.legLen, 0.9);
    tl.set([B.beams.x0, B.beams.z0, B.legs[0]], { visible: true }, 0.6);

    // Resto de patas (desde abajo) y escuadras cúbicas (desde arriba)
    [1, 2, 3].forEach((k, i) => {
      slide(B.legs[k], 'y', -70, 1.4 + i * 0.13, 1.2);
      slide(B.corners[k], 'y', 16, 1.85 + i * 0.13, 1.0);
      B.cornerScrews[k].forEach((s, j) => {
        tl.fromTo(s.userData.spin.rotation, { y: -Math.PI * 6 }, { y: 0, duration: 0.7, ease: 'power3.out' }, 2.4 + i * 0.13 + j * 0.04);
      });
    });
    // Vigas superiores restantes desde sus direcciones
    slide(B.beams.x1, 'x', 80, 2.7);
    slide(B.beams.z1, 'z', 80, 2.85);

    // Travesaños inferiores y escuadras angulares
    slide(B.stretchers[0], 'x', -80, 3.4, 1.0);
    slide(B.stretchers[1], 'x', 80, 3.5, 1.0);
    slide(B.stretchers[2], 'z', -80, 3.6, 1.0);
    slide(B.stretchers[3], 'z', 80, 3.7, 1.0);
    B.brackets.slice(0, 8).forEach((b, i) => {
      slide(b, 'y', 6, 4.15 + i * 0.05, 0.7);
    });
    // Pies niveladores: suben girando
    B.feet.forEach((f, k) => {
      const at = 4.4 + k * 0.08;
      slide(f, 'y', -2.2, at, 0.9);
      tl.fromTo(B.footSpins[k].rotation, { y: -Math.PI * 5 }, { y: 0, duration: 1.0, ease: 'power3.out' }, at);
    });

    tl.add(ui.statementIn(1), 4.9);
    tl.add(ui.statementOut(1), 7.9);

    // Vigas de apoyo, placa y cobot
    slide(B.robotBeams[0], 'x', 80, 5.0);
    slide(B.robotBeams[1], 'x', -80, 5.15);
    B.brackets.slice(8).forEach((b, i) => slide(b, 'y', -5, 5.6 + i * 0.05, 0.7));
    slide(B.plate, 'y', 12, 5.9, 1.0);
    slide(B.cobot, 'y', 48, 6.5, 1.7);
    const cs = this.cobotState;
    tl.fromTo(cs, { unfold: 0 }, { unfold: 1, duration: 1.8, ease: 'power2.inOut' }, 7.7);
    tl.fromTo(cs, { w: 0 }, { w: 1, duration: 2.5, ease: 'sine.inOut' }, 9.5);

    tl.add(ui.statementIn(2), 8.4);
    tl.to(this.benchDims.w800, { draw: 1, duration: 1.0, ease: 'power2.out' }, 8.9);
    tl.to(this.benchDims.h750, { draw: 1, duration: 1.0, ease: 'power2.out' }, 9.1);
    tl.add(() => { if (this.state === 'structuring') { this.state = 'structure'; this.ui.setState('structure'); } }, 9.4);
    return tl;
  }

  // Escena 4: la cámara se acerca a la ranura superior de una viga y la atraviesa
  diveTimeline() {
    const tl = gsap.timeline({ paused: true });
    const cam = this.stage.camera;
    const m = this.bench.meta;
    const top = m.topOfH; // cara superior de las vigas
    const inside = top - 0.42 - 0.38; // bajo los labios de la ranura
    const p0 = cam.position.clone();
    this.diveCurve = new CatmullRomCurve3([
      p0,
      new Vector3(-10, 16, -14),
      new Vector3(1.5, 3.2, -1.2),
      new Vector3(9, top + 0.55, 0),
      new Vector3(15, top + 0.1, 0),
      new Vector3(19, inside, 0),
      new Vector3(30, inside, 0),
      new Vector3(46, inside, 0),
    ], false, 'centripetal', 0.5);
    tl.add(this.ui.statementOut(2), 0);
    tl.to(this.benchDims.w800, { alpha: 1, duration: 0.5 }, 0);
    tl.to(this.benchDims.h750, { alpha: 1, duration: 0.5 }, 0);
    tl.fromTo(this.diveState, { k: 0 }, { k: 1, duration: 3.6, ease: 'power2.inOut' }, 0);
    tl.to(this.ui.fadeState, { o: 1, duration: 0.7, ease: 'power1.in', onUpdate: () => this.ui.setFade(this.ui.fadeState.o) }, 2.95);
    tl.add(() => this.enterCatalog(), 3.65);
    return tl;
  }

  goToLogo(instant = false) {
    if (this.state !== 'intro' && this.state !== 'building') return;
    this.ui.requestMotionPermission?.();
    this.tl = this.tl && this.state === 'building' ? this.tl : this.buildTimeline();
    this.state = 'building';
    this.ui.setState('building');
    if (instant) {
      this.tl.progress(1).pause();
      this.cam.orbit = this.reducedMotion ? 0 : 1;
      this.state = 'logo';
      this.ui.setState('logo');
    } else {
      this.tl.play();
    }
  }

  goToStructure(instant = false) {
    if (this.state !== 'logo') return;
    if (!this.tl) this.goToLogo(true);
    this.stl = this.structureTimeline();
    this.state = 'structuring';
    this.ui.setState('structuring');
    if (instant) {
      this.stl.progress(1).pause();
      this.state = 'structure';
      this.ui.setState('structure');
    } else {
      this.stl.play();
    }
  }

  dive() {
    if (this.state !== 'structure') return;
    this.state = 'diving';
    this.ui.setState('diving');
    if (this.reducedMotion) { this.enterCatalog(); return; }
    this.dtl = this.diveTimeline();
    this.dtl.play();
  }

  enterCatalog() {
    this.state = 'catalog';
    this.diveState.k = 0;
    this.ui.setState('catalog');
    this.ui.showCatalog();
  }

  // Avance con clic / scroll / teclado / toque
  advance() {
    switch (this.state) {
      case 'intro': this.goToLogo(false); break;
      case 'building': if (this.tl) this.tl.timeScale(3.2); break;
      case 'logo': this.goToStructure(this.reducedMotion); break;
      case 'structuring': if (this.stl) this.stl.timeScale(3); break;
      case 'structure': this.dive(); break;
      default: break;
    }
  }

  // "Saltar intro": directamente al catálogo
  skip() {
    if (this.state === 'catalog') return;
    if (this.state === 'intro' || this.state === 'building') this.goToLogo(true);
    if (this.state === 'logo') this.goToStructure(true);
    if (this.stl && this.state === 'structuring') { this.stl.progress(1).pause(); this.state = 'structure'; }
    if (this.dtl) this.dtl.pause();
    this.ui.setFade(0);
    this.enterCatalog();
  }

  replay() {
    this.ui.hideCatalog();
    this.resetToIntro();
  }

  // Vistas técnicas del diseño 3D (renders de revisión):
  // ?design=logo|escuadra|explosion|seccion|bancada
  designView(name) {
    this.reducedMotion = true;
    this.goToLogo(true);
    this.cam.orbit = 0;
    document.body.dataset.design = name;
    const A = this.asm, P = A.parts, meta = A.meta;
    const V = (x, y, z) => new Vector3(x, y, z);
    const showDims = (keys) => {
      for (const [k, st] of Object.entries(this.dimState)) Object.assign(st, { draw: keys.includes(k) ? 1 : 0, alpha: 0 });
    };
    showDims([]);
    if (name === 'logo') return;
    if (name === 'logo-limpio') { this.grid.visible = false; return; }
    this.textRig.visible = false;
    this.tagState.p = 0;
    this.grid.visible = name !== 'seccion';
    if (name === 'bancada') {
      this.goToStructure(true);
      this.ui.resetStatements();
      for (const st of Object.values(this.benchDims)) st.draw = 0;
      const sb = this.structPose;
      this.customPose = { az: sb.az, el: sb.el, dist: sb.dist * 0.86, target: this.bench.center.clone().add(V(0, 14, 0)) };
    } else if (name === 'escuadra') {
      this.customPose = { az: 212, el: 24, dist: 17, target: V(0.6, -1.9, 0.6) };
    } else if (name === 'explosion') {
      // Despiece siguiendo el guion de la imagen de montaje
      P.pX.position.x += 3.2; P.pZ.position.z += 3.2; P.pV.position.y -= 3.2;
      P.screwX.position.y += 2.6; P.screwZ.position.y += 2.6;
      P.screwNX.position.x -= 2.4; P.screwNZ.position.z -= 2.4;
      this.customPose = { az: 225, el: 27, dist: 46, target: V(2.4, -4.4, 2.4) };
      showDims(['width40', 'height40', 'slot10']);
    } else if (name === 'seccion') {
      const half = 2, xEnd = half + meta.gap + meta.lengthH;
      const add = (k, a, b, offset, label) => { this.dimState[k] = this.dims.add(k, { a, b, offset, label }, A.root); Object.assign(this.dimState[k], { draw: 1, alpha: 0 }); };
      add('secW', V(xEnd, meta.hy - half, half), V(xEnd, meta.hy - half, -half), V(0, -0.9, 0), '40 mm');
      add('secH', V(xEnd, meta.hy - half, -half), V(xEnd, meta.hy + half, -half), V(0, 0, -0.9), '40 mm');
      add('secS', V(xEnd, meta.topOfH, 0.505), V(xEnd, meta.topOfH, -0.505), V(0, 0.9, 0), 'Ranura 10');
      this.customPose = { az: 84, el: 6, dist: 15.5, target: V(xEnd, meta.hy, -0.2) };
    }
  }

  bindInput() {
    const canvasArea = this.ui.stage;
    canvasArea.addEventListener('click', () => this.advance());
    let wheelLock = 0;
    window.addEventListener('wheel', (e) => {
      if (this.state === 'catalog' || this.state === 'diving') return;
      const now = performance.now();
      if (e.deltaY > 12 && now > wheelLock) { wheelLock = now + 1400; this.advance(); }
    }, { passive: true });
    window.addEventListener('keydown', (e) => {
      if (this.state === 'catalog') return;
      if (['Space', 'Enter', 'ArrowDown', 'ArrowRight', 'PageDown'].includes(e.code)) {
        if (e.target.closest && e.target.closest('button, a')) return;
        e.preventDefault();
        this.advance();
      }
    });
    let ty = null;
    window.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', (e) => {
      if (ty === null || this.state === 'catalog') { ty = null; return; }
      const dy = ty - e.changedTouches[0].clientY;
      if (dy > 40) this.advance();
      ty = null;
    }, { passive: true });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      this.parallax.tx = (e.clientX / window.innerWidth) * 2 - 1;
      this.parallax.ty = (e.clientY / window.innerHeight) * 2 - 1;
    });
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      if (this.beta0 == null) this.beta0 = e.beta;
      this.parallax.tx = MathUtils.clamp(e.gamma / 22, -1, 1);
      this.parallax.ty = MathUtils.clamp((e.beta - this.beta0) / 22, -1, 1);
    });
  }

  // ---------- Bucle
  update(dt) {
    // En el catálogo la escena 3D no se ve: no se renderiza (ahorro de GPU)
    if (this.state === 'catalog') return;
    this.time += dt;
    const t = this.time;
    const stage = this.stage;
    const cam = stage.camera;

    // Parallax suavizado
    const pr = this.reducedMotion ? 0 : 1;
    const px = this.parallax;
    const k = 1 - Math.exp(-dt * 2.2);
    px.x += (px.tx * pr - px.x) * k;
    px.y += (px.ty * pr - px.y) * k;

    // Pose de cámara encadenada: intro -> cerca -> amplio -> logo -> bancada
    const p = this.pose;
    const tmp = this._tmpPose || (this._tmpPose = newPose());
    lerpPose(POSES.intro, POSES.close, this.cam.k1, p);
    lerpPose(p, POSES.wide, this.cam.k2, tmp);
    lerpPose(tmp, this.finalPose, this.cam.k3, p);
    lerpPose(p, this.structPose, this.cam.k4, tmp);
    p.az = tmp.az; p.el = tmp.el; p.dist = tmp.dist; p.target.copy(tmp.target);
    if (this.customPose) lerpPose(this.customPose, this.customPose, 0, p);
    const orb = this.cam.orbit * (this.reducedMotion ? 0 : 1);
    const introPar = 1 - this.cam.k1;
    const orbAmp = 3.6 + this.cam.k4 * 4.4;
    const az = p.az + orb * Math.sin(t * 0.22) * orbAmp + px.x * (1.8 + introPar * 2.8);
    const el = p.el + orb * Math.sin(t * 0.17 + 1.3) * 1.0 - px.y * (1.1 + introPar * 1.8);
    const b = basis(az, el);
    cam.position.copy(p.target).addScaledVector(b.back, p.dist);
    cam.lookAt(p.target);

    // Inmersión por la ranura: la cámara sigue la curva mirando hacia delante
    const dk = this.diveState.k;
    let near = 0.1;
    if (dk > 0 && this.diveCurve) {
      const c = this.diveCurve;
      const pos = c.getPointAt(Math.min(dk, 0.999));
      const ahead = c.getPointAt(Math.min(dk + 0.04, 1));
      const blend = MathUtils.smoothstep(dk, 0, 0.12);
      cam.position.lerp(pos, blend);
      const look = new Vector3().lerpVectors(p.target, ahead, blend);
      cam.lookAt(look);
      near = MathUtils.lerp(0.1, 0.01, MathUtils.smoothstep(dk, 0.4, 0.7));
    }
    if (cam.near !== near) { cam.near = near; cam.updateProjectionMatrix(); }
    // Dentro de la ranura la oclusión ambiental no aporta y es costosa
    if (stage.ao) stage.ao.enabled = !stage.aoDisabled && dk < 0.45;

    // Virutas
    if (this.chips.group.visible || this.chips.converge < 1) this.chips.update(dt);
    this.glint.position.set(Math.sin(t * 0.35) * 12, 7 + Math.sin(t * 0.23) * 5, Math.cos(t * 0.35) * 12);
    this.glint.intensity = 3.2 * (1 - this.cam.k1);

    // Profundidad de campo
    stage.dof.cocMaterial.focusDistance = cam.position.distanceTo(p.target);
    stage.dof.bokehScale = this.dofState.bokeh;
    stage.setDof(this.dofState.bokeh > 0.05);

    // Mecanizado de la escuadra
    this.asm.scan.uScanY.value = this.scanState.y;
    this.asm.scan.uScanGain.value = this.scanState.gain;
    this.asm.scanPlane.constant = -this.scanState.y;

    const g = this.grid;
    g.material.uniforms.uOpacity.value = this.gridState.o;
    g.position.y = this.gridState.y;
    g.material.uniforms.uRadius.value = this.gridState.r;
    g.material.uniforms.uCenter.value.set(MathUtils.lerp(1.5, 38, this.cam.k4), 0, MathUtils.lerp(1.5, 38, this.cam.k4));

    // Cobot: postura animada + movimiento lento de trabajo
    if (this.bench.root.visible) {
      const cs = this.cobotState, w = cs.w, u = cs.unfold;
      const a = (j, c) => MathUtils.lerp(this.cobotFolded[j][c], this.cobotPose[j][c], u);
      const d1 = w * 0.42 * Math.sin(t * 0.42);
      const d2 = w * 0.07 * Math.sin(t * 0.55 + 0.4);
      const d3 = w * 0.13 * Math.sin(t * 0.55 + 1.1);
      const J = this.bench.joints;
      J[0].rotation.set(a(0, 0), a(0, 1) + d1, a(0, 2));
      J[1].rotation.set(a(1, 0) + d2, a(1, 1), a(1, 2));
      J[2].rotation.set(a(2, 0) + d3, a(2, 1), a(2, 2));
      J[3].rotation.set(a(3, 0) - d2 - d3, a(3, 1), a(3, 2));
      J[4].rotation.set(a(4, 0), a(4, 1), a(4, 2));
      J[5].rotation.set(a(5, 0), a(5, 1) + w * Math.sin(t * 0.3) * 0.9, a(5, 2));
    }

    // Barrido de luz sobre el cromo (entorno propio orientado a la cámara final)
    const e = this.mats.chrome.envMapRotation;
    this._ax = (this._ax || new Vector3()).set(0, 1, 0).applyQuaternion(this.chromeBase);
    this._qq = (this._qq || new Quaternion()).setFromAxisAngle(this._ax, this.chromeSweep.v + px.x * 0.06);
    e.setFromQuaternion(this._qq.multiply(this.chromeBase));
    applyOutlineDraw(this.wordmark);

    // Superposiciones HTML
    this.dims.update(cam, stage.width, stage.height);
    this.ui.updateTagline(this.tagState.p, this.projectTagline());

    stage.adapt(dt);
    stage.render(dt);
  }

  projectTagline() {
    const wm = this.wordmark;
    const cam = this.stage.camera;
    const w = this.stage.width, h = this.stage.height;
    const a = new Vector3(0, -wm.capHeight * 0.34, 0);
    const b = new Vector3(wm.width, -wm.capHeight * 0.34, 0);
    wm.group.localToWorld(a).project(cam);
    wm.group.localToWorld(b).project(cam);
    return {
      x1: (a.x * 0.5 + 0.5) * w, y1: (-a.y * 0.5 + 0.5) * h,
      x2: (b.x * 0.5 + 0.5) * w, y2: (-b.y * 0.5 + 0.5) * h,
    };
  }

  // Precompila shaders para evitar tirones en las transiciones
  async warmup() {
    const { renderer, scene, camera } = this.stage;
    const vis = [];
    scene.traverse((o) => { if (o.isMesh || o.isGroup) { vis.push([o, o.visible]); o.visible = true; } });
    try { await renderer.compileAsync(scene, camera); } catch { renderer.compile(scene, camera); }
    this.stage.render(0.016);
    for (const [o, v] of vis) o.visible = v;
  }
}
