// Capa de interfaz: indicaciones, botones discretos y lema bajo el rótulo 3D.
const STEPS = {
  intro: { n: '01', label: 'Inicio' },
  building: { n: '02', label: 'Unión' },
  logo: { n: '02', label: 'Unión' },
};

export class UI {
  constructor(root = document) {
    this.stage = root.getElementById('stage');
    this.hint = root.getElementById('hint');
    this.tagline = root.getElementById('tagline');
    this.stepN = root.getElementById('step-n');
    this.stepLabel = root.getElementById('step-label');
    this.skipBtn = root.getElementById('btn-skip');
    this.replayBtn = root.getElementById('btn-replay');
    this.body = document.body;
    this._tagFit = { w: 0, size: 0 };
    this.motionAsked = false;
  }

  setState(state) {
    this.body.dataset.state = state;
    const s = STEPS[state] || STEPS.intro;
    this.stepN.textContent = s.n;
    this.stepLabel.textContent = s.label;
    this.skipBtn.hidden = state === 'logo';
    this.replayBtn.hidden = state === 'intro';
  }

  // iOS pide permiso para el giroscopio tras un gesto del usuario
  requestMotionPermission() {
    if (this.motionAsked) return;
    this.motionAsked = true;
    const D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {});
  }

  updateTagline(p, box) {
    const el = this.tagline;
    if (p <= 0.001) {
      if (el.style.opacity !== '0') el.style.opacity = '0';
      return;
    }
    const w = Math.hypot(box.x2 - box.x1, box.y2 - box.y1);
    // Ajusta el cuerpo de letra para que el lema ocupe el ancho del rótulo
    if (Math.abs(w - this._tagFit.w) > 0.5) {
      el.style.fontSize = '20px';
      const natural = el.scrollWidth || 1;
      this._tagFit = { w, size: (20 * w) / natural };
      el.style.fontSize = `${this._tagFit.size.toFixed(2)}px`;
    }
    const e = 1 - Math.pow(1 - p, 3);
    el.style.opacity = String(Math.min(1, p * 1.6));
    el.style.transform = `translate(${box.x1.toFixed(1)}px, ${(box.y1 + (1 - e) * 10).toFixed(1)}px)`;
    el.style.clipPath = `inset(-20% ${((1 - e) * 100).toFixed(2)}% -20% 0)`;
  }
}
