import gsap from 'gsap';

// Capa de interfaz: indicaciones, botones, lema bajo el rótulo 3D, textos de la
// escena de estructura, fundido a negro y sección del catálogo.
const STEPS = {
  intro: { n: '01', label: 'Inicio' },
  building: { n: '02', label: 'Unión' },
  logo: { n: '02', label: 'Unión' },
  structuring: { n: '03', label: 'Estructura' },
  structure: { n: '03', label: 'Estructura' },
  diving: { n: '04', label: 'Catálogo' },
  catalog: { n: '04', label: 'Catálogo' },
};
const STAGGER = [0.12, 0.5, 0.16];

export class UI {
  constructor(root = document) {
    this.stage = root.getElementById('stage');
    this.hint = root.getElementById('hint');
    this.tagline = root.getElementById('tagline');
    this.stepN = root.getElementById('step-n');
    this.stepLabel = root.getElementById('step-label');
    this.skipBtn = root.getElementById('btn-skip');
    this.replayBtn = root.getElementById('btn-replay');
    this.fade = root.getElementById('fade');
    this.statements = [...root.querySelectorAll('.statement')];
    this.body = document.body;
    this.fadeState = { o: 0 };
    this._tagFit = { w: 0, size: 0 };
    this.motionAsked = false;
    this.setupCatalog(root);
  }

  setState(state) {
    this.body.dataset.state = state;
    const s = STEPS[state] || STEPS.intro;
    this.stepN.textContent = s.n;
    this.stepLabel.textContent = s.label;
    this.skipBtn.hidden = state === 'catalog' || state === 'diving';
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

  // ---------- Textos de la escena de estructura (revelado por líneas)
  resetStatements() {
    for (const el of this.statements) {
      gsap.set(el, { autoAlpha: 0 });
      gsap.set(el.querySelectorAll('.in'), { yPercent: 110 });
      gsap.set(el.querySelector('.accent'), { scaleX: 0 });
    }
  }

  statementIn(i) {
    const el = this.statements[i];
    const tl = gsap.timeline();
    tl.set(el, { autoAlpha: 1 });
    tl.fromTo(el.querySelector('.accent'), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power3.out' }, 0);
    tl.fromTo(el.querySelectorAll('.in'), { yPercent: 110 }, { yPercent: 0, duration: 0.95, ease: 'power3.out', stagger: STAGGER[i] }, 0.1);
    return tl;
  }

  statementOut(i) {
    const el = this.statements[i];
    const tl = gsap.timeline();
    tl.to(el.querySelectorAll('.in'), { yPercent: -110, duration: 0.6, ease: 'power2.in', stagger: 0.05 }, 0);
    tl.to(el.querySelector('.accent'), { scaleX: 0, duration: 0.5, ease: 'power2.in' }, 0);
    tl.set(el, { autoAlpha: 0 });
    return tl;
  }

  setFade(o) {
    this.fadeState.o = o;
    this.fade.style.opacity = String(o);
  }

  // ---------- Catálogo
  setupCatalog(root) {
    this.cards = [...root.querySelectorAll('.reveal')];
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); this.io.unobserve(e.target); }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    }
    const btn = root.getElementById('btn-contact');
    const card = root.getElementById('contact-card');
    if (btn && card) {
      btn.addEventListener('click', () => {
        const open = card.hidden;
        card.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
      });
    }
  }

  showCatalog() {
    window.scrollTo(0, 0);
    for (const c of this.cards) {
      c.classList.remove('is-in');
      if (this.io) this.io.observe(c); else c.classList.add('is-in');
    }
    gsap.to(this.fadeState, { o: 0, duration: 1.1, delay: 0.15, ease: 'power2.out', onUpdate: () => this.setFade(this.fadeState.o) });
  }

  hideCatalog() {
    window.scrollTo(0, 0);
  }
}
