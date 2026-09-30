import {
  WebGLRenderer, Scene, PerspectiveCamera, HalfFloatType, Color, PCFShadowMap, NoToneMapping, SRGBColorSpace,
} from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode,
  DepthOfFieldEffect, VignetteEffect, SMAAEffect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

export const BG = new Color(0x030304);

// Renderizador + cadena de postproceso con niveles de calidad adaptativos.
export class Stage {
  constructor(canvas, quality) {
    this.quality = quality;
    const renderer = (this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      stencil: false,
      depth: false,
      alpha: false,
      powerPreference: 'high-performance',
    }));
    renderer.setClearColor(BG, 1);
    renderer.toneMapping = NoToneMapping; // lo hace el postproceso (ACES)
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = quality.shadows;
    renderer.shadowMap.type = PCFShadowMap;

    this.scene = new Scene();
    this.scene.background = BG;
    this.camera = new PerspectiveCamera(24, 1, 0.1, 500);

    this.pixelRatio = quality.pixelRatio;
    this.resScale = 1;
    this.composer = new EffectComposer(renderer, { frameBufferType: HalfFloatType, multisampling: quality.msaa });
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    if (quality.ao) {
      const ao = (this.ao = new N8AOPostPass(this.scene, this.camera, 2, 2));
      ao.configuration.aoRadius = 0.9;
      ao.configuration.distanceFalloff = 0.6;
      ao.configuration.intensity = 2.6;
      ao.configuration.gammaCorrection = false;
      ao.configuration.halfRes = true;
      ao.setQualityMode('Medium');
      this.composer.addPass(ao);
    }

    this.dof = new DepthOfFieldEffect(this.camera, {
      focusDistance: 25,
      focusRange: 14,
      bokehScale: quality.tier === 'low' ? 1.8 : 2.6,
      resolutionScale: quality.tier === 'low' ? 0.35 : 0.5,
    });
    this.dofPass = new EffectPass(this.camera, this.dof);
    this.dofPass.enabled = quality.dof;
    this.composer.addPass(this.dofPass);

    this.bloom = new BloomEffect({
      mipmapBlur: true,
      luminanceThreshold: 1.6,
      luminanceSmoothing: 0.4,
      intensity: 0.38,
      radius: 0.62,
      levels: quality.tier === 'low' ? 5 : 7,
    });
    this.tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    this.vignette = new VignetteEffect({ offset: 0.32, darkness: 0.62 });
    const effects = [this.bloom, this.tone, this.vignette];
    if (!quality.msaa) effects.push(new SMAAEffect());
    this.composer.addPass(new EffectPass(this.camera, ...effects));

    this.exposure = 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Control adaptativo de rendimiento
    this.frameTimes = [];
    this.lastAdapt = performance.now();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const pr = Math.max(0.6, this.pixelRatio * this.resScale);
    this.renderer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.width = w; this.height = h;
    this.onResize && this.onResize(w, h);
  }

  setDof(enabled) {
    this.dofPass.enabled = enabled && this.quality.dof;
  }

  // Baja la resolución interna si no se alcanzan ~55 fps de forma sostenida.
  adapt(dt) {
    if (this.quality.fixed) return;
    this.frameTimes.push(dt);
    if (this.frameTimes.length > 90) this.frameTimes.shift();
    const now = performance.now();
    if (now - this.lastAdapt < 2500 || this.frameTimes.length < 60) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    if (avg > 1 / 50 && this.resScale > 0.55) {
      this.resScale = Math.max(0.55, this.resScale - 0.15);
      if (this.resScale <= 0.7 && this.ao) this.ao.enabled = false;
      this.resize();
      this.frameTimes.length = 0;
    } else if (avg < 1 / 90 && this.resScale < 1) {
      this.resScale = Math.min(1, this.resScale + 0.1);
      this.resize();
      this.frameTimes.length = 0;
    }
    this.lastAdapt = now;
  }

  render(dt) {
    this.composer.render(dt);
  }
}
