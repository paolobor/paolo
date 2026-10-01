import { Uniform, Vector4, VideoTexture, SRGBColorSpace, LinearFilter } from 'three';
import { Effect, EffectAttribute } from 'postprocessing';

// Vídeo fotorrealista de virutas detrás de las virutas 3D. Se compone en el
// postproceso solo donde no hay geometría (fondo), después de la profundidad
// de campo, así el vídeo conserva su nitidez y las piezas 3D quedan delante.
const fragment = /* glsl */ `
uniform sampler2D map;
uniform float opacity;
uniform vec4 uvTransform;
void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  vec3 v = texture2D(map, uv * uvTransform.xy + uvTransform.zw).rgb;
  float bg = step(0.99999, depth);
  outputColor = vec4(inputColor.rgb + v * opacity * bg, inputColor.a);
}`;

export class VideoBackdropEffect extends Effect {
  constructor() {
    super('VideoBackdropEffect', fragment, {
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map([
        ['map', new Uniform(null)],
        ['opacity', new Uniform(0)],
        ['uvTransform', new Uniform(new Vector4(1, 1, 0, 0))],
      ]),
    });
    this.sources = null;
    this.video = null;
    this.videoAspect = 16 / 9;
  }

  // sources: { h: video horizontal, v: video vertical } (elementos <video>)
  setSources(sources) {
    this.sources = sources;
  }

  // Elige el vídeo según el formato de pantalla y ajusta el encuadre (cover)
  fit(width, height) {
    if (!this.sources) return;
    const portrait = height > width;
    const want = (portrait && this.sources.v) || this.sources.h || this.sources.v;
    if (want !== this.video) {
      if (this.video) this.video.pause();
      this.video = want;
      want.preload = 'auto';
      const tex = new VideoTexture(want);
      tex.colorSpace = SRGBColorSpace;
      tex.minFilter = tex.magFilter = LinearFilter;
      tex.generateMipmaps = false;
      const old = this.uniforms.get('map').value;
      if (old) old.dispose();
      this.uniforms.get('map').value = tex;
      this.videoAspect = want === this.sources.v ? 9 / 16 : 16 / 9;
      if (this.playing) want.play().catch(() => {});
    }
    const sa = width / height, va = this.videoAspect;
    const t = this.uniforms.get('uvTransform').value;
    if (sa > va) t.set(1, va / sa, 0, (1 - va / sa) / 2);
    else t.set(sa / va, 1, (1 - sa / va) / 2, 0);
  }

  get opacity() { return this.uniforms.get('opacity').value; }
  set opacity(v) { this.uniforms.get('opacity').value = v; }

  play() {
    this.playing = true;
    if (this.video) this.video.play().catch(() => {});
  }

  pause() {
    this.playing = false;
    if (this.video) this.video.pause();
  }
}
