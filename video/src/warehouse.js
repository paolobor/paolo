// Almacén oscuro con estanterías de luces naranjas, polvo en suspensión y dos cobots (FR3 y FR5)
// sobre mesas de perfil de aluminio. Incluye profundidad de campo (DOF) por software.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCobot } from './cobot.js';
import { POSES } from './motion.js';

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export function createWarehouse(renderer, W, H) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020203);
  scene.fog = new THREE.FogExp2(0x040405, 0.035);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  // el entorno solo se aplica a robots y aluminio (en el suelo daría un velo gris)
  const withEnv = (m, k) => { m.envMap = env; m.envMapIntensity = k; m.needsUpdate = true; };

  const camera = new THREE.PerspectiveCamera(32, W / H, 0.02, 120);

  // suelo
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x09090a, roughness: 0.55, metalness: 0.0, envMapIntensity: 0.06 });
  floorMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec2 fp = vWorldPosF.xz;
      float n = fract(sin(dot(floor(fp * 40.0), vec2(12.9898, 78.233))) * 43758.5453);
      diffuseColor.rgb *= 0.8 + 0.35 * n;`);
    sh.fragmentShader = 'varying vec3 vWorldPosF;\n' + sh.fragmentShader;
    sh.vertexShader = 'varying vec3 vWorldPosF;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
      vWorldPosF = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80).rotateX(-Math.PI / 2), floorMat);
  floor.receiveShadow = true; scene.add(floor);
  // líneas amarillas de seguridad en el suelo
  const yellow = new THREE.MeshStandardMaterial({ color: 0xc9a100, roughness: 0.6, emissive: 0x2a2000 });
  function floorStripe(x0, z0, x1, z1) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.07).rotateX(-Math.PI / 2), yellow);
    m.position.set((x0 + x1) / 2, 0.002, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); scene.add(m);
  }

  // estanterías (racks): montantes azules + largueros naranjas luminosos
  const upMat = new THREE.MeshStandardMaterial({ color: 0x050a1a, roughness: 0.5, emissive: 0x1a3aa8, emissiveIntensity: 0.45, envMapIntensity: 0.05 });
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x1a0800, emissive: 0xff4a08, emissiveIntensity: 0.9, roughness: 0.5, envMapIntensity: 0.05 });
  const racks = new THREE.Group(); scene.add(racks);
  function rackRow(z, x0, x1, rot = 0) {
    const g = new THREE.Group();
    const bay = 2.4;
    for (let x = x0; x <= x1 + 0.01; x += bay) {
      for (const dz of [0, 1.0]) {
        const up = new THREE.Mesh(new THREE.BoxGeometry(0.06, 8, 0.06), upMat); up.position.set(x, 4, dz); g.add(up);
      }
    }
    for (const y of [0.55, 1.75, 3.1, 4.4, 5.7]) {
      for (const dz of [0, 1.0]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.055, 0.04), beamMat); b.position.set((x0 + x1) / 2, y, dz); g.add(b);
      }
    }
    g.position.z = z; g.rotation.y = rot; racks.add(g);
    return g;
  }
  rackRow(-8.5, -16, 16);
  rackRow(-13, -18, 18);
  const side1 = rackRow(0, -9, 3, Math.PI / 2); side1.position.x = -9;
  const side2 = rackRow(0, -9, 3, -Math.PI / 2); side2.position.x = 9;

  // focos colgados (bokeh)
  const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.2, 1.3) });
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 8), bulbMat);
    b.position.set(-8 + i * 2.1, 6.2 + Math.sin(i) * 0.3, -4.5 - (i % 3) * 2.2); scene.add(b);
  }

  // mesas de perfil de aluminio con tablero negro
  const alu = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.28, metalness: 0.95 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0x0e0e10, roughness: 0.85, metalness: 0.0 });
  function table(x, z, w = 0.8, d = 0.8, h = 0.78) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const p = 0.04;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(p, h, p), alu); leg.position.set(sx * (w / 2 - p / 2), h / 2, sz * (d / 2 - p / 2)); leg.castShadow = true; g.add(leg);
    }
    for (const y of [0.12, h - 0.03]) {
      for (const sz of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, p, p), alu); b.position.set(0, y, sz * (d / 2 - p / 2)); g.add(b); }
      for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(p, p, d), alu); b.position.set(sx * (w / 2 - p / 2), y, 0); g.add(b); }
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.025, d + 0.02), topMat); top.position.y = h + 0.0125; top.castShadow = true; top.receiveShadow = true; g.add(top);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.024, 0.006, d + 0.024), alu); edge.position.y = h + 0.026; g.add(edge);
    scene.add(g);
    return { g, top: h + 0.025 };
  }

  const tFR5 = table(0.55, 0, 0.8, 0.8, 0.78);
  const tFR3 = table(-0.75, 0.15, 0.7, 0.7, 0.78);
  floorStripe(-1.6, 1.0, 1.4, 1.0); floorStripe(1.4, 1.0, 1.4, -0.9); floorStripe(-1.6, 1.0, -1.6, -0.9);

  withEnv(alu, 0.5);
  const fr5 = createCobot('FR5'); fr5.root.position.set(0.55, tFR5.top, 0); scene.add(fr5.root);
  const fr3 = createCobot('FR3'); fr3.root.position.set(-0.75, tFR3.top, 0.15); scene.add(fr3.root);
  for (const rb of [fr5, fr3]) rb.root.traverse((o) => { if (o.material && !o.material.map) withEnv(o.material, 0.35); });

  // piezas sobre las mesas (cubos de colores para pick & place)
  const pieceMats = [0xd63a1f, 0x2456c8, 0xe0a800].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45 }));
  const pieces = [];
  for (const [tx, tz, s] of [[0.55, 0, 1], [-0.75, 0.15, 0.8]]) {
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.045 * s, 0.045 * s, 0.045 * s), pieceMats[i]);
      m.position.set(tx + 0.3 * s, 0.78 + 0.025 + 0.0225 * s, tz + (i - 1) * 0.1 * s); m.castShadow = true; scene.add(m); pieces.push(m);
    }
  }

  // anillo de alcance (discontinuo, se dibuja progresivamente)
  const reachMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uP: { value: 0 }, uA: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uP, uA; varying vec2 vUv;
      void main(){
        float a = vUv.x; if (a > uP) discard;
        float dash = step(0.45, fract(a * 90.0));
        float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
        gl_FragColor = vec4(vec3(1.0, 0.45, 0.12) * 3.0 * dash * edge * uA, 1.0);
      }`,
  });
  function ringGeo(R, w) {
    const g = new THREE.RingGeometry(R - w, R + w, 256, 1);
    // uv.x = ángulo normalizado, uv.y = radial
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const a = (Math.atan2(y, x) / (Math.PI * 2) + 1) % 1;
      const rr = Math.hypot(x, y);
      uv.setXY(i, a, (rr - (R - w)) / (2 * w));
    }
    return g.rotateX(-Math.PI / 2);
  }
  const reach5 = new THREE.Mesh(ringGeo(0.922, 0.004), reachMat.clone()); reach5.position.set(0.55, tFR5.top + 0.2, 0); scene.add(reach5);
  const reach3 = new THREE.Mesh(ringGeo(0.622, 0.004), reachMat.clone()); reach3.position.set(-0.75, tFR3.top + 0.17, 0.15); scene.add(reach3);

  // luces
  scene.add(new THREE.HemisphereLight(0x223355, 0x0a0503, 0.12));
  const key = new THREE.SpotLight(0xfff1e0, 9, 12, 0.55, 0.6, 1.6);
  key.position.set(1.8, 3.4, 2.6); key.target.position.set(0, 0.9, 0); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.radius = 4;
  scene.add(key, key.target);
  const rimL = new THREE.PointLight(0xff5a1a, 4, 6, 1.5); rimL.position.set(-2.4, 2.6, -2.6); scene.add(rimL);
  const rimR = new THREE.PointLight(0xff6a22, 3.5, 6, 1.5); rimR.position.set(2.8, 2.4, -2.2); scene.add(rimR);
  const fill = new THREE.PointLight(0x5a78ff, 1.2, 6, 1.6); fill.position.set(-1.2, 1.2, 2.2); scene.add(fill);
  const topSpot = new THREE.SpotLight(0xffe6c8, 5, 8, 0.4, 0.8, 1.5); topSpot.position.set(0, 4.2, 0.3); topSpot.target.position.set(0, 0.8, 0); scene.add(topSpot, topSpot.target);

  // polvo en suspensión
  const NP = 1600;
  const pg = new THREE.BufferGeometry();
  const pp = new Float32Array(NP * 3), ps = new Float32Array(NP);
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < NP; i++) { pp[i * 3] = (rnd() - 0.5) * 9; pp[i * 3 + 1] = rnd() * 4; pp[i * 3 + 2] = (rnd() - 0.7) * 9; ps[i] = rnd(); }
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('seed', new THREE.BufferAttribute(ps, 1));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uPx: { value: H } },
    vertexShader: `attribute float seed; uniform float uT, uPx; varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(uT * 0.21 + seed * 40.0) * 0.25; p.y += mod(uT * 0.03 * (0.4 + seed), 1.0) * 0.5 + sin(uT * 0.3 + seed * 10.0) * 0.08;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((0.6 + seed * 1.6) * uPx * 0.004 / -mv.z, 1.0, 10.0);
        vA = (0.25 + 0.75 * fract(seed * 13.7)) * smoothstep(0.2, 1.2, -mv.z);
      }`,
    fragmentShader: `varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = exp(-dot(c, c) * 18.0); gl_FragColor = vec4(vec3(1.0, 0.8, 0.6) * d * vA * 0.9, 1.0); }`,
  });
  const dust = new THREE.Points(pg, dustMat); scene.add(dust);

  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // --------------------------------------------------------------- DOF
  const colorRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const depthRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
  depthRT.depthTexture = new THREE.DepthTexture(W, H); depthRT.depthTexture.type = THREE.FloatType;
  const depthMat = new THREE.MeshDepthMaterial();
  const dofMat = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: colorRT.texture }, tDepth: { value: depthRT.depthTexture },
      near: { value: 0.02 }, far: { value: 120 }, focus: { value: 2 }, aperture: { value: 0.03 }, maxR: { value: 0.022 },
      aspect: { value: W / H },
    },
    vertexShader: VS,
    fragmentShader: /* glsl */`
      uniform sampler2D tColor, tDepth; uniform float near, far, focus, aperture, maxR, aspect; varying vec2 vUv;
      float lin(float d){ float z = d * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }
      float coc(float z){ return clamp(aperture * abs(z - focus) / max(z, 0.05), 0.0, maxR); }
      void main(){
        float z0 = lin(texture2D(tDepth, vUv).r);
        float c0 = coc(z0);
        vec3 acc = texture2D(tColor, vUv).rgb; float wsum = 1.0;
        const int N = 56;
        for (int i = 1; i < N; i++){
          float fi = float(i);
          float r = sqrt(fi / float(N));
          float a = fi * 2.39996;
          vec2 off = vec2(cos(a), sin(a)) * r;
          vec2 uv = vUv + off * vec2(1.0 / aspect, 1.0) * max(c0, 0.0008) ;
          float zs = lin(texture2D(tDepth, uv).r);
          float cs = coc(zs);
          // una muestra contribuye si su propio círculo cubre este píxel
          float w = smoothstep(r * max(c0, 0.0008) - 0.002, r * max(c0, 0.0008), cs + 0.0005);
          if (zs > z0 + 0.05) w = max(w, step(0.0005, c0)); // fondo detrás: se mezcla si este píxel está desenfocado
          acc += texture2D(tColor, uv).rgb * w; wsum += w;
        }
        gl_FragColor = vec4(acc / wsum, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  const fsScene = new THREE.Scene(); const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  fsScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), dofMat));

  const robots = { FR5: fr5, FR3: fr3 };
  // cubo que manipula cada robot y sus posiciones de reposo (centro de los dedos en A y B)
  const carry = { FR5: pieces[1], FR3: pieces[4] };
  const fingerLocal = (k) => new THREE.Vector3(0, 0, robots[k].spec.r * 1.45);
  function toolYaw(k) {
    const m = robots[k].anchors.tool.matrixWorld;
    const x = new THREE.Vector3().setFromMatrixColumn(m, 0);
    return Math.atan2(-x.z, x.x);
  }
  const rest = {};
  for (const k of ['FR5', 'FR3']) {
    rest[k] = {};
    for (const L of ['A', 'B']) {
      robots[k].setPose(POSES[k][L], 1); robots[k].root.updateMatrixWorld(true);
      const p = robots[k].anchors.tool.localToWorld(fingerLocal(k));
      p.y = carry[k].position.y;
      rest[k][L] = { pos: p, yaw: toolYaw(k) };
    }
  }
  function placePiece(k, piece) {
    const m = carry[k];
    if (!piece) return;
    if (piece.carried) {
      robots[k].root.updateMatrixWorld(true);
      m.position.copy(robots[k].anchors.tool.localToWorld(fingerLocal(k)));
      m.rotation.set(0, toolYaw(k), 0);
    } else {
      const r = rest[k][piece.at];
      m.position.copy(r.pos); m.rotation.set(0, r.yaw, 0);
    }
  }
  const reaches = { FR5: reach5, FR3: reach3 };

  function render(target, s) {
    camera.fov = s.fov ?? 32; camera.updateProjectionMatrix();
    camera.position.copy(s.pos); camera.lookAt(s.target);
    if (s.roll) camera.rotateZ(s.roll);
    dustMat.uniforms.uT.value = s.t ?? 0;
    for (const k of ['FR5', 'FR3']) {
      const st = s.robots?.[k];
      robots[k].root.visible = st ? st.visible !== false : true;
      if (st?.q) robots[k].setPose(st.q, st.grip ?? 0);
      placePiece(k, st?.piece);
      reaches[k].material.uniforms.uP.value = s.reach?.[k]?.p ?? 0;
      reaches[k].material.uniforms.uA.value = s.reach?.[k]?.a ?? 0;
    }
    const lg = s.lightGain ?? 1;
    beamMat.emissiveIntensity = 0.9 * lg;
    renderer.setRenderTarget(colorRT); renderer.setClearColor(0x020203, 1); renderer.clear();
    renderer.render(scene, camera);
    // profundidad
    scene.overrideMaterial = depthMat; const fog = scene.fog; scene.fog = null; dust.visible = false;
    renderer.setRenderTarget(depthRT); renderer.clear(); renderer.render(scene, camera);
    scene.overrideMaterial = null; scene.fog = fog; dust.visible = true;
    const u = dofMat.uniforms;
    u.focus.value = s.focus ?? s.pos.distanceTo(s.target); u.aperture.value = s.aperture ?? 0.03; u.maxR.value = s.maxR ?? 0.02;
    u.near.value = camera.near; u.far.value = camera.far;
    renderer.setRenderTarget(target); renderer.clear(); renderer.render(fsScene, fsCam);
  }

  function project(obj, s, offset = new THREE.Vector3()) {
    camera.fov = s.fov ?? 32; camera.updateProjectionMatrix();
    camera.position.copy(s.pos); camera.lookAt(s.target);
    if (s.roll) camera.rotateZ(s.roll);
    camera.updateMatrixWorld();
    for (const k of ['FR5', 'FR3']) { const st = s.robots?.[k]; if (st?.q) robots[k].setPose(st.q, st.grip ?? 0); }
    scene.updateMatrixWorld(true);
    const v = obj.isVector3 ? obj.clone() : obj.getWorldPosition(new THREE.Vector3());
    v.add(offset);
    const p = v.project(camera);
    return { x: (p.x * 0.5 + 0.5) * W, y: (1 - (p.y * 0.5 + 0.5)) * H };
  }

  return { render, project, robots, scene, camera };
}
