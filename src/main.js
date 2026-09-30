import './styles.css';
import gsap from 'gsap';
import { UI } from './ui/ui.js';

const params = new URLSearchParams(location.search);
const body = document.body;

function hasWebGL2() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

function detectQuality() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(screen.width, screen.height) < 900;
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  let tier = (coarse && small) || mobileUA ? 'low' : 'high';
  if (params.get('q') === 'low' || params.get('q') === 'high') tier = params.get('q');
  const dpr = window.devicePixelRatio || 1;
  const px = window.innerWidth * window.innerHeight;
  // Presupuesto de píxeles para mantener 60 fps con el postproceso
  const budget = tier === 'high' ? 4.6e6 : 1.9e6;
  const pixelRatio = Math.min(dpr, tier === 'high' ? 2 : 1.5, Math.sqrt(budget / px));
  return {
    tier,
    pixelRatio: Math.max(0.75, pixelRatio),
    msaa: tier === 'high' ? 4 : 0,
    ao: tier === 'high',
    dof: true,
    shadows: tier === 'high',
    chips: tier === 'high' ? 280 : 120,
    fixed: params.has('fixed'),
  };
}

async function start() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('reduced');
  if (!hasWebGL2() || params.has('nogl')) {
    body.classList.add('no-webgl');
    body.dataset.state = 'fallback';
    return;
  }
  const ui = new UI();
  const { App } = await import('./app.js');
  let app;
  try {
    app = new App({
      canvas: document.getElementById('gl'),
      svg: document.getElementById('dims'),
      ui,
      quality: detectQuality(),
      reducedMotion,
    });
    await app.init();
    await document.fonts.ready;
    await app.warmup();
  } catch (err) {
    console.error(err);
    body.classList.add('no-webgl');
    body.dataset.state = 'fallback';
    return;
  }

  document.getElementById('btn-skip').addEventListener('click', (e) => { e.stopPropagation(); app.skip(); });
  document.getElementById('btn-replay').addEventListener('click', (e) => { e.stopPropagation(); app.replay(); });

  gsap.ticker.lagSmoothing(500, 33);
  gsap.ticker.add((time, deltaMs) => app.update(Math.min(deltaMs / 1000, 1 / 20)));

  // Modo captura: ?t=segundos congela el guion en ese instante
  if (params.has('t')) {
    const t = parseFloat(params.get('t'));
    app.goToLogo(false);
    app.tl.pause().seek(t);
    app.chips.update(0);
  }
  if (params.get('state') === 'logo') app.skip();
  if (params.has('design')) app.designView(params.get('design'));

  requestAnimationFrame(() => body.classList.add('ready'));
  window.__fdi = app;
}

start();
