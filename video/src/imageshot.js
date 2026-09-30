// Plano cinematográfico a partir de una imagen fija: cámara 2.5D con parallax por profundidad,
// gradación oscura/naranja, destellos anamórficos, fugas de luz y motas de polvo.
import * as THREE from 'three';
import { GLSL_NOISE } from './util.js';

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export function createImageShots(renderer, W, H) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      img: { value: null }, dep: { value: null }, imgAspect: { value: 16 / 9 }, aspect: { value: W / H },
      center: { value: new THREE.Vector2(0.5, 0.5) }, zoom: { value: 1 }, par: { value: new THREE.Vector2() }, d0: { value: 0.5 },
      rot: { value: 0 }, exposure: { value: 1 }, flarePos: { value: new THREE.Vector2(-1, -1) }, flare: { value: 0 },
      leak: { value: 0 }, leakPos: { value: new THREE.Vector2(0, 0) }, time: { value: 0 }, orange: { value: 0.6 }, crush: { value: 0.5 },
      sweep: { value: -1 },
    },
    vertexShader: VS,
    fragmentShader: /* glsl */`
      ${GLSL_NOISE}
      uniform sampler2D img, dep; uniform float imgAspect, aspect, zoom, d0, rot, exposure, flare, leak, time, orange, crush, sweep;
      uniform vec2 center, par, flarePos, leakPos; varying vec2 vUv;
      vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
      void main(){
        // coordenadas de la imagen (cover) con zoom, rotación y encuadre
        vec2 p = vUv - 0.5;
        p.x *= aspect;
        float cs = cos(rot), sn = sin(rot);
        p = mat2(cs, -sn, sn, cs) * p;
        p /= zoom;
        p.x /= imgAspect;
        vec2 uv = center + p;
        // parallax: búsqueda iterativa del píxel de origen desplazado por su profundidad
        vec2 src = uv;
        for (int i = 0; i < 6; i++) {
          float d = texture2D(dep, src).r;
          src = uv - par * (d - d0);
        }
        src = clamp(src, vec2(0.001), vec2(0.999));
        vec3 c = toLin(texture2D(img, src).rgb);
        // gradación cinematográfica: oscura, contrastada, altas luces cálidas
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        vec3 warm = c * vec3(1.18, 0.86, 0.62);
        c = mix(c, warm, orange * smoothstep(0.02, 0.5, l));
        c = mix(c, c * vec3(0.78, 0.9, 1.05), 0.35 * (1.0 - smoothstep(0.0, 0.08, l))); // sombras ligeramente frías
        c = pow(c, vec3(1.0 + crush * 0.35)) * (1.0 + crush * 0.25);
        c *= exposure;
        // barrido de luz diagonal
        if (sweep > -0.5) {
          float s = dot(vUv - 0.5, normalize(vec2(1.0, 0.35)));
          c += vec3(1.0, 0.55, 0.2) * exp(-pow((s - sweep) * 7.0, 2.0)) * 0.22;
        }
        // destello anamórfico
        if (flare > 0.0) {
          vec2 d = (vUv - flarePos) * vec2(aspect, 1.0);
          float core = exp(-dot(d, d) * 900.0);
          float streak = exp(-abs(d.y) * 260.0) * exp(-abs(d.x) * 1.6);
          float halo = exp(-abs(length(d) - 0.16) * 60.0) * 0.12;
          vec2 g = (vec2(0.5) - flarePos) * vec2(aspect, 1.0);
          float ghost = exp(-length(d - g * 1.6) * 30.0) * 0.25 + exp(-length(d - g * 0.7) * 50.0) * 0.18;
          c += (vec3(1.0, 0.62, 0.3) * (streak * 1.4 + halo + ghost) + vec3(1.0, 0.9, 0.8) * core * 6.0) * flare;
        }
        // fuga de luz cálida
        if (leak > 0.0) {
          vec2 q = (vUv - leakPos) * vec2(aspect, 1.0);
          float n = fbm(q * 2.0 + time * 0.3);
          c += vec3(1.0, 0.45, 0.12) * exp(-dot(q, q) * 2.5) * (0.5 + n) * leak;
        }
        // motas en suspensión
        vec2 gp = vUv * vec2(aspect, 1.0) * 26.0 + vec2(time * 0.35, -time * 0.2);
        vec2 gi = floor(gp); vec2 gf = fract(gp) - 0.5;
        float h = hash12(gi);
        vec2 o = vec2(hash12(gi + 3.1), hash12(gi + 7.7)) - 0.5;
        float mote = step(0.9, h) * exp(-dot(gf - o * 0.6, gf - o * 0.6) * 900.0);
        c += vec3(1.0, 0.75, 0.45) * mote * 0.35;
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  const scene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  function render(target, s) {
    const u = mat.uniforms;
    u.img.value = s.img; u.dep.value = s.dep; u.imgAspect.value = s.imgAspect ?? 16 / 9;
    u.center.value.set(...s.center); u.zoom.value = s.zoom; u.par.value.set(...(s.par || [0, 0])); u.d0.value = s.d0 ?? 0.5;
    u.rot.value = s.rot ?? 0; u.exposure.value = s.exposure ?? 0.9;
    u.flare.value = s.flare ?? 0; u.flarePos.value.set(...(s.flarePos || [-1, -1]));
    u.leak.value = s.leak ?? 0; u.leakPos.value.set(...(s.leakPos || [0, 0])); u.time.value = s.time ?? 0;
    u.orange.value = s.orange ?? 0.6; u.crush.value = s.crush ?? 0.5; u.sweep.value = s.sweep ?? -1;
    renderer.setRenderTarget(target); renderer.render(scene, cam);
  }
  return { render };
}

// Plano de color sólido / fondo del estallido
export function createFlatShots(renderer, W, H) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { mode: { value: 0 }, t: { value: 0 }, color: { value: new THREE.Color(0, 0, 0) }, aspect: { value: W / H }, r: { value: 0 }, amt: { value: 1 } },
    vertexShader: VS,
    fragmentShader: /* glsl */`
      ${GLSL_NOISE}
      uniform int mode; uniform float t, aspect, r, amt; uniform vec3 color; varying vec2 vUv;
      void main(){
        vec3 c = color;
        if (mode == 1) {
          // estallido: fondo claro sobreexpuesto, anillo naranja y descargas eléctricas
          vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
          float d = length(p);
          vec3 bg = mix(vec3(0.16, 0.11, 0.08), vec3(0.008, 0.006, 0.006), smoothstep(0.0, 0.9, d)) * (0.8 + 0.4 * fbm(p * 3.0 + t));
          float ring = exp(-pow((d - r) * 26.0, 2.0));
          float ringIn = exp(-pow((d - r * 0.93) * 60.0, 2.0)) * 0.6;
          float ang = atan(p.y, p.x);
          float crack = pow(ridged(vec2(ang * 3.0, d * 9.0 - t * 5.0)), 6.0) * smoothstep(r, r * 0.3, d) * 2.5;
          float sparks = step(0.985, hash12(floor(vec2(ang * 60.0, d * 70.0 - t * 30.0)))) * smoothstep(r * 1.25, r, d) * smoothstep(r * 0.6, r, d);
          c = bg + vec3(1.0, 0.42, 0.08) * (ring * 5.0 + ringIn * 2.5 + crack * 0.35) + vec3(1.0, 0.7, 0.4) * sparks * 4.0;
          c *= amt;
        } else if (mode == 2) {
          // blanco limpio con viñeta muy suave
          vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
          c = vec3(1.0) * (1.0 - 0.06 * smoothstep(0.3, 1.2, length(p)));
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  const scene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  function render(target, s) {
    const u = mat.uniforms;
    u.mode.value = s.mode ?? 0; u.t.value = s.t ?? 0; u.color.value.setRGB(...(s.color || [0, 0, 0])); u.r.value = s.r ?? 0; u.amt.value = s.amt ?? 1;
    renderer.setRenderTarget(target); renderer.render(scene, cam);
  }
  return { render };
}
