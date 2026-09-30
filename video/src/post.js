// Pipeline HDR: acumulación (motion blur), transiciones, desenfoque, bloom y etapa final
// (tonemap, gradación, viñeta, grano, aberración cromática, glitch, letterbox, flash).
import * as THREE from 'three';

const VS = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

function rt(w, h, opts = {}) {
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: !!opts.depth,
    samples: opts.samples || 0,
    colorSpace: THREE.LinearSRGBColorSpace,
  });
}

export class Post {
  constructor(renderer, W, H) {
    this.r = renderer; this.W = W; this.H = H;
    this.shotRT = rt(W, H, { depth: true, samples: 4 });
    this.accA = rt(W, H); this.accB = rt(W, H); this.accTmp = rt(W, H);
    this.comp = rt(W, H); this.tmp = rt(W, H); this.tmp2 = rt(W, H);
    this.bloomLv = [];
    let w = W >> 1, h = H >> 1;
    for (let i = 0; i < 5; i++) { this.bloomLv.push([rt(w, h), rt(w, h)]); w >>= 1; h >>= 1; }
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    this.scene = new THREE.Scene(); this.scene.add(this.quad);

    this.copyMat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: null }, gain: { value: 1 } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tex; uniform float gain; varying vec2 vUv;
        void main(){ gl_FragColor = texture2D(tex, vUv) * gain; }`,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, depthTest: false, depthWrite: false,
    });
    // media progresiva de submuestras (sin depender del blending en half-float)
    this.accumMat = new THREE.ShaderMaterial({
      uniforms: { prev: { value: null }, cur: { value: null }, w: { value: 1 } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D prev, cur; uniform float w; varying vec2 vUv;
        void main(){ gl_FragColor = vec4(mix(texture2D(prev, vUv).rgb, texture2D(cur, vUv).rgb, w), 1.0); }`,
      depthTest: false, depthWrite: false,
    });
    this.plainCopy = new THREE.ShaderMaterial({
      uniforms: { tex: { value: null } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tex; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tex, vUv); }`,
      depthTest: false, depthWrite: false,
    });

    // Transiciones: barrido con desenfoque direccional, destello, corte con glitch, fundido
    this.transMat = new THREE.ShaderMaterial({
      uniforms: {
        A: { value: null }, B: { value: null }, p: { value: 0 }, kind: { value: 0 }, dir: { value: new THREE.Vector2(1, 0) },
        aspect: { value: W / H },
      },
      vertexShader: VS,
      fragmentShader: /* glsl */`
        uniform sampler2D A, B; uniform float p; uniform int kind; uniform vec2 dir; uniform float aspect;
        varying vec2 vUv;
        vec3 smear(sampler2D t, vec2 uv, vec2 d, float amt){
          vec3 c = vec3(0.0); float wsum = 0.0;
          for (int i = 0; i < 28; i++){
            float f = float(i) / 27.0 - 0.5;
            float w = 1.0 - abs(f) * 1.2;
            vec2 u = uv + d * f * amt;
            u = abs(mod(u + 1.0, 2.0) - 1.0); // espejo en bordes
            c += min(texture2D(t, u).rgb, vec3(3.0)) * w; wsum += w;
          }
          return c / wsum;
        }
        float ease(float x){ return x < 0.5 ? 4.0*x*x*x : 1.0 - pow(-2.0*x + 2.0, 3.0) / 2.0; }
        void main(){
          vec3 col;
          if (kind == 1) { // barrido (whip pan)
            float e = ease(p);
            float speed = sin(3.14159 * p);            // 0 -> 1 -> 0
            vec2 d = normalize(dir);
            float amt = 0.05 + 0.55 * speed;
            vec2 offA = -d * e * 1.0;
            vec2 offB = d * (1.0 - e);
            vec3 a = smear(A, vUv - offA * 0.9, d, amt);
            vec3 b = smear(B, vUv - offB * 0.9, d, amt);
            float m = smoothstep(0.35, 0.65, p);
            col = mix(a, b, m);
            col += vec3(1.0, 0.72, 0.45) * pow(speed, 6.0) * 0.08; // destello cálido en el centro del barrido
          } else if (kind == 2) { // fundido
            col = mix(texture2D(A, vUv).rgb, texture2D(B, vUv).rgb, p);
          } else if (kind == 3) { // destello blanco
            vec3 a = texture2D(A, vUv).rgb, b = texture2D(B, vUv).rgb;
            col = mix(a, b, step(0.5, p)) + vec3(6.0) * pow(1.0 - abs(p * 2.0 - 1.0), 2.0);
          } else if (kind == 4) { // zoom con desenfoque radial
            float e = ease(p); float speed = sin(3.14159 * p);
            vec2 c0 = vUv - 0.5;
            vec3 a = vec3(0.0), b = vec3(0.0);
            for (int i = 0; i < 20; i++){
              float f = float(i) / 19.0;
              a += min(texture2D(A, 0.5 + c0 * (1.0 - e * 0.6) * (1.0 - f * speed * 0.25)).rgb, vec3(3.0));
              b += min(texture2D(B, 0.5 + c0 * (1.6 - e * 0.6) * (1.0 - f * speed * 0.25)).rgb, vec3(3.0));
            }
            col = mix(a / 20.0, b / 20.0, smoothstep(0.4, 0.6, p)) + vec3(1.0, 0.8, 0.6) * pow(speed, 8.0) * 0.12;
          } else {
            col = texture2D(B, vUv).rgb;
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });

    this.blurMat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: null }, dir: { value: new THREE.Vector2() }, radius: { value: 1 } },
      vertexShader: VS,
      fragmentShader: /* glsl */`
        uniform sampler2D tex; uniform vec2 dir; uniform float radius; varying vec2 vUv;
        void main(){
          vec3 c = vec3(0.0); float ws = 0.0;
          for (int i = -12; i <= 12; i++){
            float f = float(i) / 12.0; float w = exp(-f * f * 3.0);
            c += texture2D(tex, vUv + dir * f * radius).rgb * w; ws += w;
          }
          gl_FragColor = vec4(c / ws, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });

    this.brightMat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: null }, thr: { value: 1.0 } }, vertexShader: VS,
      fragmentShader: /* glsl */`
        uniform sampler2D tex; uniform float thr; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tex, vUv).rgb;
          float l = max(max(c.r, c.g), c.b);
          float k = smoothstep(thr, thr * 2.0 + 0.4, l);
          gl_FragColor = vec4(min(c * k, vec3(30.0)), 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });

    this.finalMat = new THREE.ShaderMaterial({
      uniforms: {
        tex: { value: null },
        b0: { value: null }, b1: { value: null }, b2: { value: null }, b3: { value: null }, b4: { value: null },
        bloom: { value: 0.8 }, exposure: { value: 1 }, contrast: { value: 1.1 }, sat: { value: 1 },
        lift: { value: new THREE.Vector3(0, 0, 0) }, gain: { value: new THREE.Vector3(1, 1, 1) },
        warm: { value: 0 }, vignette: { value: 0.35 }, grain: { value: 0.05 }, seed: { value: 0 },
        ca: { value: 0.0015 }, letterbox: { value: 0 }, flash: { value: 0 }, flashColor: { value: new THREE.Vector3(1, 1, 1) },
        glitch: { value: 0 }, white: { value: 0 }, aspect: { value: W / H }, res: { value: new THREE.Vector2(W, H) },
        fade: { value: 1 },
      },
      vertexShader: VS,
      fragmentShader: /* glsl */`
        uniform sampler2D tex, b0, b1, b2, b3, b4;
        uniform float bloom, exposure, contrast, sat, warm, vignette, grain, seed, ca, letterbox, flash, glitch, white, aspect, fade;
        uniform vec3 lift, gain, flashColor; uniform vec2 res;
        varying vec2 vUv;
        float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
        float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
        vec3 hdrAt(vec2 uv){
          vec3 c = texture2D(tex, uv).rgb;
          vec3 bl = texture2D(b0, uv).rgb * 0.6 + texture2D(b1, uv).rgb * 0.8 + texture2D(b2, uv).rgb * 1.0 + texture2D(b3, uv).rgb * 1.1 + texture2D(b4, uv).rgb * 1.2;
          return c + bl * bloom;
        }
        void main(){
          vec2 uv = vUv;
          // glitch: desplazamiento por bloques horizontales
          if (glitch > 0.0) {
            float row = floor(uv.y * 38.0 + h11(seed) * 7.0);
            float r = h21(vec2(row, floor(seed * 13.0)));
            if (r < glitch * 0.55) uv.x += (h21(vec2(row, seed)) - 0.5) * 0.12 * glitch;
          }
          vec2 c0 = uv - 0.5;
          float caA = ca + glitch * 0.012;
          vec3 col;
          col.r = hdrAt(uv + c0 * caA * 2.0 + vec2(glitch * 0.006, 0.0)).r;
          col.g = hdrAt(uv).g;
          col.b = hdrAt(uv - c0 * caA * 2.0 - vec2(glitch * 0.006, 0.0)).b;
          col *= exposure;
          col = aces(col);
          // gradación
          col = pow(col, vec3(1.0 / 2.2));
          col = (col - 0.5) * contrast + 0.5;
          float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
          col = mix(vec3(l), col, sat);
          // tonos cálidos: sombras frías/negras, medios y altas naranjas
          vec3 warmTone = vec3(1.08, 0.93, 0.78);
          col = mix(col, col * warmTone + vec3(0.02, 0.0, -0.01) * smoothstep(0.2, 0.8, l), warm);
          col = col * gain + lift * (1.0 - col);
          // viñeta
          vec2 vc = c0 * vec2(aspect, 1.0);
          col *= 1.0 - vignette * smoothstep(0.35, 1.05, length(vc));
          // grano
          float g = h21(gl_FragCoord.xy + fract(seed * 7.13) * 1000.0) - 0.5;
          col += g * grain * (0.6 + 0.4 * (1.0 - l));
          col = mix(col, flashColor, clamp(flash, 0.0, 1.0));
          col = mix(col, vec3(1.0), white);
          col *= fade;
          // letterbox 2.35:1
          float bar = letterbox * 0.5 * (1.0 - (res.x / 2.35) / res.y);
          if (vUv.y < bar || vUv.y > 1.0 - bar) col = vec3(0.0);
          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
  }

  pass(mat, target) {
    this.quad.material = mat;
    this.r.setRenderTarget(target);
    this.r.render(this.scene, this.cam);
  }

  // Renderiza un plano con N submuestras temporales (desenfoque de movimiento real)
  renderShot(shot, t, samples, shutter, target) {
    const n = Math.max(1, samples | 0);
    const bufs = [target, this.accTmp];
    for (let i = 0; i < n; i++) {
      const tt = n === 1 ? t : t + ((i + 0.5) / n - 0.5) * shutter;
      shot.render(this.shotRT, tt);
      const out = bufs[(n - 1 - i) % 2], prev = bufs[(n - i) % 2];
      const m = this.accumMat;
      m.uniforms.cur.value = this.shotRT.texture;
      m.uniforms.prev.value = i === 0 ? this.shotRT.texture : prev.texture;
      m.uniforms.w.value = 1 / (i + 1);
      this.pass(m, out);
    }
  }

  blur(src, radiusPx, out) {
    const m = this.blurMat;
    m.uniforms.tex.value = src.texture; m.uniforms.dir.value.set(1 / this.W, 0); m.uniforms.radius.value = radiusPx;
    this.pass(m, this.tmp2);
    m.uniforms.tex.value = this.tmp2.texture; m.uniforms.dir.value.set(0, 1 / this.H);
    this.pass(m, out);
  }

  bloomChain(src, thr) {
    this.brightMat.uniforms.tex.value = src.texture; this.brightMat.uniforms.thr.value = thr;
    this.pass(this.brightMat, this.bloomLv[0][0]);
    let prev = this.bloomLv[0][0];
    for (let i = 0; i < this.bloomLv.length; i++) {
      const [a, b] = this.bloomLv[i];
      if (i > 0) { this.plainCopy.uniforms.tex.value = prev.texture; this.pass(this.plainCopy, a); }
      const m = this.blurMat;
      m.uniforms.tex.value = a.texture; m.uniforms.dir.value.set(1 / a.width, 0); m.uniforms.radius.value = 6;
      this.pass(m, b);
      m.uniforms.tex.value = b.texture; m.uniforms.dir.value.set(0, 1 / a.height);
      this.pass(m, a);
      prev = a;
    }
  }

  // f: parámetros del fotograma
  frame(f) {
    // f.a: {shot, t, samples}, f.b opcional, f.trans {kind, p, dir}
    const shutter = f.shutter;
    this.renderShot(f.a.shot, f.a.t, f.a.samples, shutter, this.accA);
    let src = this.accA;
    if (f.b) {
      this.renderShot(f.b.shot, f.b.t, f.b.samples, shutter, this.accB);
      const m = this.transMat;
      m.uniforms.A.value = this.accA.texture; m.uniforms.B.value = this.accB.texture;
      m.uniforms.p.value = f.trans.p; m.uniforms.kind.value = f.trans.kind;
      m.uniforms.dir.value.set(f.trans.dir[0], f.trans.dir[1]);
      this.pass(m, this.comp); src = this.comp;
    }
    if (f.blur > 0.01) { this.blur(src, f.blur, this.tmp); src = this.tmp; }
    this.bloomChain(src, f.bloomThr ?? 1.0);
    const u = this.finalMat.uniforms;
    u.tex.value = src.texture;
    for (let i = 0; i < 5; i++) u['b' + i].value = this.bloomLv[i][0].texture;
    const g = f.grade;
    u.bloom.value = g.bloom; u.exposure.value = g.exposure; u.contrast.value = g.contrast; u.sat.value = g.sat;
    u.lift.value.set(...g.lift); u.gain.value.set(...g.gain); u.warm.value = g.warm; u.vignette.value = g.vignette;
    u.grain.value = g.grain; u.seed.value = f.seed; u.ca.value = g.ca; u.letterbox.value = f.letterbox;
    u.flash.value = f.flash; u.flashColor.value.set(...(f.flashColor || [1, 1, 1])); u.glitch.value = f.glitch;
    u.white.value = f.white; u.fade.value = f.fade;
    this.pass(this.finalMat, null);
  }
}
