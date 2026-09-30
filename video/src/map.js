// Mapa nocturno 3D de España: relieve, luces, fronteras, haces de luz de los centros.
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { GLSL_NOISE, loadImage, loadTexture } from './util.js';

export const HEIGHT = 0.13; // exageración del relieve en unidades de mundo (1 u ≈ 111 km)

export async function createMap(W, H) {
  const geo = await (await fetch('../assets/map/geo.json')).json();
  const [XMIN, XMAX, ZMIN, ZMAX] = geo.extent;
  const terrainTex = await loadTexture('../assets/map/terrain.png', { srgb: false });
  const lightsTex = await loadTexture('../assets/map/lights.png', { srgb: false });
  const detailTex = await loadTexture('../assets/map/detail.png', { srgb: false, repeat: true });

  // muestreo de altura en CPU para colocar líneas, haces y cámara
  const timg = await loadImage('../assets/map/terrain.png');
  const cv = document.createElement('canvas'); cv.width = timg.width; cv.height = timg.height;
  const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(timg, 0, 0);
  const tdata = cx.getImageData(0, 0, cv.width, cv.height).data;
  function sampleT(x, z, ch) {
    const u = (x - XMIN) / (XMAX - XMIN) * cv.width - 0.5, v = (z - ZMIN) / (ZMAX - ZMIN) * cv.height - 0.5;
    const i0 = Math.max(0, Math.min(cv.width - 2, Math.floor(u))), j0 = Math.max(0, Math.min(cv.height - 2, Math.floor(v)));
    const fu = Math.min(1, Math.max(0, u - i0)), fv = Math.min(1, Math.max(0, v - j0));
    const g = (i, j) => tdata[(j * cv.width + i) * 4 + ch] / 255;
    return (g(i0, j0) * (1 - fu) + g(i0 + 1, j0) * fu) * (1 - fv) + (g(i0, j0 + 1) * (1 - fu) + g(i0 + 1, j0 + 1) * fu) * fv;
  }
  const heightAt = (x, z) => sampleT(x, z, 0) * Math.min(1, sampleT(x, z, 2) * 1.6) * HEIGHT;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, W / H, 0.004, 300);

  // cielo (solo visible en planos rasantes)
  const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uSky: { value: new THREE.Color(0.025, 0.05, 0.10) }, uGain: { value: 1 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uSky; uniform float uGain; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = uSky * exp(-max(h, 0.0) * 9.0) * uGain; gl_FragColor = vec4(c, 1.0); }`,
  }));
  scene.add(sky);

  const common = {
    uLightGain: { value: 1 }, uFogColor: { value: new THREE.Color(0.01, 0.015, 0.03) },
    uFogNear: { value: 6 }, uFogFar: { value: 40 }, uMood: { value: 0 }, uTime: { value: 0 },
  };

  // océano infinito
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { ...common },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `${GLSL_NOISE}
      uniform vec3 uFogColor; uniform float uFogNear, uFogFar, uMood; varying vec3 vW;
      void main(){
        vec3 oc = mix(vec3(0.006, 0.014, 0.034), vec3(0.008, 0.013, 0.024), uMood);
        oc *= 0.85 + 0.3 * fbm(vW.xz * 2.0);
        float d = length(vW - cameraPosition);
        gl_FragColor = vec4(mix(oc, uFogColor, smoothstep(uFogNear, uFogFar, d)), 1.0);
      }`,
  }));
  ocean.position.y = -0.002;
  scene.add(ocean);

  // terreno
  const tgeo = new THREE.PlaneGeometry(XMAX - XMIN, ZMAX - ZMIN, 760, 630).rotateX(-Math.PI / 2);
  const terrainMat = new THREE.ShaderMaterial({
    uniforms: {
      ...common, terrainTex: { value: terrainTex }, lightsTex: { value: lightsTex }, detailTex: { value: detailTex }, uHeight: { value: HEIGHT },
      uLightColor: { value: new THREE.Color(1.0, 0.52, 0.16) },
    },
    vertexShader: /* glsl */`
      uniform sampler2D terrainTex, detailTex; uniform float uHeight;
      varying vec2 vUv; varying vec3 vW;
      void main(){
        vUv = uv;
        vec4 t = texture2D(terrainTex, uv);
        float landV = min(1.0, t.b * 1.6);
        float dA = texture2D(detailTex, position.xz * 1.2).a;
        vec3 p = position; p.y += (t.r + (dA - 0.5) * (0.06 + t.r * 0.35)) * landV * uHeight;
        vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_NOISE}
      uniform sampler2D terrainTex, lightsTex, detailTex; uniform vec3 uLightColor, uFogColor;
      uniform float uLightGain, uFogNear, uFogFar, uMood, uHeight;
      varying vec2 vUv; varying vec3 vW;
      void main(){
        vec4 t = texture2D(terrainTex, vUv);
        float elev = t.r, land = smoothstep(0.3, 0.7, t.b);
        float camD = length(vW - cameraPosition);
        float near = 1.0 - smoothstep(0.5, 5.0, camD);
        vec4 d1 = texture2D(detailTex, vW.xz * 1.2);
        vec4 d2 = texture2D(detailTex, vW.xz * 5.3 + 0.37);
        vec2 g = (d1.xy - 0.5) * (0.35 + elev * 2.2) + (d2.xy - 0.5) * (0.12 + elev * 0.6) * near;
        vec3 n = normalize(vec3(g.x, 1.0, g.y));
        vec3 Ld = normalize(vec3(-0.55, 0.5, -0.45));
        float dif = clamp(dot(n, Ld), 0.0, 1.0);
        float relief = clamp(t.g, 0.0, 1.0);
        vec3 lowC = mix(vec3(0.030, 0.040, 0.060), vec3(0.030, 0.026, 0.024), uMood);
        vec3 highC = mix(vec3(0.060, 0.075, 0.105), vec3(0.060, 0.050, 0.044), uMood);
        vec3 base = mix(lowC, highC, clamp(elev * 1.6, 0.0, 1.0));
        vec3 landC = base * (0.22 + 1.5 * dif) * (0.45 + 1.1 * relief) * (0.55 + 0.2 * near);
        vec3 oc = mix(vec3(0.006, 0.014, 0.034), vec3(0.008, 0.013, 0.024), uMood);
        oc *= 0.85 + 0.3 * fbm(vW.xz * 2.0);
        float shelf = texture2D(terrainTex, vUv, 4.0).b;
        oc += vec3(0.010, 0.022, 0.045) * shelf;
        vec3 col = mix(oc, landC, land);
        // luces de ciudades: núcleo nítido + brillo suave; chispeo fino de cerca
        float L = texture2D(lightsTex, vUv).r;
        float Lb = texture2D(lightsTex, vUv, 3.0).r;
        float sp = hash12(floor(vW.xz * 1100.0)) * hash12(floor(vW.xz * 1100.0) + 7.3);
        float spark = mix(1.0, 0.04 + 4.0 * smoothstep(0.3, 0.95, sp), near * smoothstep(0.02, 0.3, L));
        float Ls = mix(L, smoothstep(0.08, 0.7, L), near);
        vec3 em = uLightColor * (pow(Ls, 1.4) * 1.7 * spark + Lb * 0.05 * (1.0 - near)) + vec3(1.0, 0.82, 0.55) * pow(L, 4.0) * 1.0 * spark;
        col += em * uLightGain * smoothstep(0.05, 0.5, t.b) * mix(1.0, 0.72, near);
        col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, camD));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const terrain = new THREE.Mesh(tgeo, terrainMat);
  scene.add(terrain);

  // ---------------------------------------------------------------- fronteras
  const res = new THREE.Vector2(W, H);
  function segs(polys, lift = 0.006) {
    const arr = [];
    for (const pl of polys) {
      for (let i = 0; i + 1 < pl.length; i++) {
        const [x0, z0] = pl[i], [x1, z1] = pl[i + 1];
        arr.push(x0, heightAt(x0, z0) + lift, z0, x1, heightAt(x1, z1) + lift, z1);
      }
    }
    return arr;
  }
  function lineObj(polys, color, width, opacity, lift) {
    const g = new LineSegmentsGeometry(); g.setPositions(segs(polys, lift));
    const m = new LineMaterial({ color, linewidth: width, transparent: true, opacity, depthWrite: false, worldUnits: false });
    m.resolution.copy(res);
    m.blending = THREE.AdditiveBlending;
    const o = new LineSegments2(g, m); o.renderOrder = 2;
    scene.add(o); return o;
  }
  const inner = lineObj(geo.inner, new THREE.Color(0.55, 0.62, 0.78), 1.1, 0.35);
  const spainLine = lineObj(geo.spain, new THREE.Color(0.75, 0.82, 1.0), 1.6, 0.6);
  const coast = lineObj(geo.coast, new THREE.Color(0.55, 0.62, 0.8), 1.2, 0.35);
  const [ix0, iz0, ix1, iz1] = geo.inset;
  const insetFrame = lineObj([[[ix0, iz0], [ix1, iz0], [ix1, iz1], [ix0, iz1], [ix0, iz0]]], new THREE.Color(0.6, 0.65, 0.8), 1.2, 0.5, 0.001);

  // ---------------------------------------------------------------- centros
  const beamMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uA: { value: 0 }, uCol: { value: new THREE.Color(1.0, 0.55, 0.2) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uA; uniform vec3 uCol; varying vec2 vUv;
      void main(){
        float x = abs(vUv.x - 0.5) * 2.0;
        float core = exp(-x * x * 40.0), halo = exp(-x * x * 4.0);
        float fall = pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.03, vUv.y + 0.02);
        vec3 c = (vec3(1.0, 0.92, 0.8) * core * 5.0 + uCol * halo * 1.6) * fall;
        gl_FragColor = vec4(c * uA, 1.0);
      }`,
  });
  const glowMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uA: { value: 0 }, uPulse: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uA, uPulse; varying vec2 vUv;
      void main(){
        float r = length(vUv - 0.5) * 2.0;
        float g = exp(-r * r * 30.0) * 6.0 + exp(-r * r * 5.0) * 0.8;
        float rr = fract(uPulse); float ring = exp(-pow((r - rr) * 18.0, 2.0)) * (1.0 - rr) * 2.5;
        vec3 c = vec3(1.0, 0.5, 0.18) * (g + ring) + vec3(1.0, 0.9, 0.8) * exp(-r * r * 400.0) * 12.0;
        gl_FragColor = vec4(c * uA, 1.0);
      }`,
  });
  const centers = geo.centers.map((c) => {
    const y = heightAt(c.x, c.z);
    const grp = new THREE.Group(); grp.position.set(c.x, y, c.z); scene.add(grp);
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), beamMat());
    beam.renderOrder = 3; grp.add(beam);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), glowMat());
    glow.position.y = 0.002; glow.renderOrder = 3; grp.add(glow);
    const hl = lineObj(c.outline, new THREE.Color(3.2, 1.35, 0.35), 2.6, 0.0, 0.003);
    return { ...c, y, grp, beam, glow, hl, pos: new THREE.Vector3(c.x, y, c.z) };
  });

  // punto pulsante de la intro
  const dot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), glowMat());
  dot.renderOrder = 3; scene.add(dot);

  function render(renderer, target, s) {
    camera.fov = s.fov ?? 34; camera.updateProjectionMatrix();
    camera.position.copy(s.pos); camera.up.set(0, 1, 0); camera.lookAt(s.target);
    if (s.roll) { camera.rotateZ(s.roll); }
    const mood = s.mood ?? 1;
    for (const m of [terrainMat, ocean.material]) {
      m.uniforms.uMood.value = mood; m.uniforms.uLightGain.value = s.lightGain ?? 1;
      m.uniforms.uFogNear.value = s.fogNear ?? 8; m.uniforms.uFogFar.value = s.fogFar ?? 45;
    }
    sky.material.uniforms.uGain.value = s.sky ?? 0;
    inner.material.opacity = (s.borders ?? 1) * 0.35;
    spainLine.material.opacity = (s.borders ?? 1) * 0.6;
    coast.material.opacity = (s.borders ?? 1) * 0.35;
    insetFrame.material.opacity = (s.borders ?? 1) * 0.5;
    const camDist = s.pos.distanceTo(s.target);
    for (let i = 0; i < centers.length; i++) {
      const c = centers[i], st = (s.centers && s.centers[i]) || {};
      const a = st.act ?? 0;
      c.grp.visible = a > 0.001;
      const bh = (st.beamH ?? 0.55) * Math.max(0.35, Math.min(2.5, camDist * 0.45));
      c.beam.scale.set(bh * 0.035, bh * a, 1);
      c.beam.material.uniforms.uA.value = a * (st.beamGain ?? 1);
      c.beam.lookAt(camera.position.x, c.grp.position.y + 0.0, camera.position.z);
      c.beam.rotation.x = 0; c.beam.rotation.z = 0;
      const gs = Math.max(0.03, camDist * 0.05) * (st.glowScale ?? 1);
      c.glow.scale.set(gs, 1, gs);
      c.glow.material.uniforms.uA.value = a;
      c.glow.material.uniforms.uPulse.value = st.pulse ?? 0;
      c.hl.material.opacity = st.hl ?? 0;
    }
    if (s.dot) {
      dot.visible = true;
      const y = heightAt(s.dot.x, s.dot.z) + 0.003;
      dot.position.set(s.dot.x, y, s.dot.z);
      const ds = s.dot.size ?? 0.12; dot.scale.set(ds, 1, ds);
      dot.material.uniforms.uA.value = s.dot.a ?? 1; dot.material.uniforms.uPulse.value = s.dot.pulse ?? 0;
    } else dot.visible = false;
    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 1); renderer.clear();
    renderer.render(scene, camera);
  }

  function project(v, s) {
    camera.fov = s.fov ?? 34; camera.updateProjectionMatrix();
    camera.position.copy(s.pos); camera.up.set(0, 1, 0); camera.lookAt(s.target);
    if (s.roll) camera.rotateZ(s.roll);
    camera.updateMatrixWorld();
    const p = v.clone().project(camera);
    return { x: (p.x * 0.5 + 0.5) * W, y: (1 - (p.y * 0.5 + 0.5)) * H, behind: p.z > 1 };
  }

  return { render, project, centers, heightAt, geo };
}
