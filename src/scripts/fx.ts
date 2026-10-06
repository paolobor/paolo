// Detalles en movimiento (estilos .fx-* en global.css).
// - .fx-spot: la luz sigue al puntero dentro de la tarjeta.
// - [data-fx-cycle]: ilumina sus .fx-spot uno tras otro (cada data-fx-cycle ms) mientras la sección está a la vista;
//   se para al pasar el ratón por encima y con «movimiento reducido».
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let raf = 0;
document.addEventListener(
  'pointermove',
  (e) => {
    const el = (e.target as Element | null)?.closest?.<HTMLElement>('.fx-spot');
    if (!el || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  },
  { passive: true },
);
document.addEventListener('pointerout', (e) => {
  const el = (e.target as Element | null)?.closest?.<HTMLElement>('.fx-spot');
  if (el && !el.contains(e.relatedTarget as Node | null)) {
    el.style.removeProperty('--mx');
    el.style.removeProperty('--my');
  }
});

if (!reduce && 'IntersectionObserver' in window) {
  document.querySelectorAll<HTMLElement>('[data-fx-cycle]').forEach((box) => {
    const items = [...box.querySelectorAll<HTMLElement>('.fx-spot')];
    if (items.length < 2) return;
    const every = Number(box.dataset.fxCycle) || 3200;
    box.style.setProperty('--fx-cycle', `${every}ms`);
    let i = -1;
    let timer = 0;
    let visible = false;
    let hover = false;
    const light = (n: number) => {
      items.forEach((it, k) => it.classList.toggle('is-lit', k === n));
    };
    const step = () => {
      i = (i + 1) % items.length;
      light(i);
    };
    const sync = () => {
      window.clearInterval(timer);
      if (visible && !hover) {
        step();
        timer = window.setInterval(step, every);
      } else {
        light(-1);
      }
    };
    box.addEventListener('pointerenter', () => {
      hover = true;
      sync();
    });
    box.addEventListener('pointerleave', () => {
      hover = false;
      sync();
    });
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.25 },
    ).observe(box);
  });
}
