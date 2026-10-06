// Vídeos de fondo ([data-bgvideo]: «Ecosistema FAIRINO» del inicio, cabecera de «Sobre nosotros»). Va en el script
// común de BaseLayout: en las páginas sin vídeo de fondo no hace nada.
// Solo se descargan y se mueven con su sección a la vista; con «movimiento reducido» o ahorro de datos se quedan en el
// fotograma fijo. El botón [data-bgvideo-toggle] los pausa y los reanuda.
const ICON_PAUSE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>';
const ICON_PLAY =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"/></svg>';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

document.querySelectorAll<HTMLElement>('[data-bgvideo]').forEach((section) => {
  const video = section.querySelector<HTMLVideoElement>('[data-bgvideo-video]');
  const toggle = section.querySelector<HTMLButtonElement>('[data-bgvideo-toggle]');
  if (!video || reduce || saveData || !('IntersectionObserver' in window)) return;

  let visible = false;
  let userPaused = false;
  const sync = () => {
    if (visible && !userPaused) video.play().catch(() => {});
    else video.pause();
    if (toggle) {
      toggle.hidden = false;
      toggle.setAttribute('aria-label', userPaused ? 'Reanudar el vídeo de fondo' : 'Pausar el vídeo de fondo');
      toggle.innerHTML = userPaused ? ICON_PLAY : ICON_PAUSE;
    }
  };
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && video.preload === 'none') video.preload = 'auto';
      sync();
    },
    { rootMargin: '200px 0px' },
  ).observe(section);
  toggle?.addEventListener('click', () => {
    userPaused = !userPaused;
    sync();
  });
});

// Módulo propio: sus constantes no chocan con las de los otros scripts.
export {};
