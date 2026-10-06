// Bloque «Próximamente» de los humanoides ([data-teaser], components/home/HumanoidTeaser.astro). Va en el script común
// de BaseLayout: en las páginas sin el bloque no hace nada. El vídeo de fondo lo mueve scripts/bg-video.ts.
// - Entrada: al verse el bloque, se abren las bandas de cine (.is-on) y el nombre y las cifras se descifran.
//   Con «movimiento reducido» todo aparece quieto desde el principio.
// - Código de tiempo del vídeo de fondo en la esquina.
// - Los vídeos completos se abren con sonido en una ventana; sin <dialog>, el enlace abre el MP4 tal cual.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GLYPHS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789#%';

function scramble(el: HTMLElement, duration: number) {
  const final = el.dataset.final ?? '';
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const fixed = Math.floor(p * final.length);
    let out = '';
    for (let i = 0; i < final.length; i++) {
      const c = final[i];
      out += i < fixed || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

interface TeaserVideo {
  id: string;
  title: string;
  src: string | null;
  youtube: string | null;
  poster?: string;
}

document.querySelectorAll<HTMLElement>('[data-teaser]').forEach((box) => {
  if (!reduce && 'IntersectionObserver' in window) {
    box.classList.add('tz-armed');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        box.classList.add('is-on');
        box.querySelectorAll<HTMLElement>('[data-scramble]').forEach((el) => {
          el.dataset.final = el.textContent ?? '';
          window.setTimeout(() => scramble(el, Number(el.dataset.duration) || 900), Number(el.dataset.delay) || 0);
        });
      },
      { threshold: 0.3 },
    );
    io.observe(box);
  }

  const bg = box.querySelector<HTMLVideoElement>('[data-bgvideo-video]');
  const tc = box.querySelector<HTMLElement>('[data-teaser-tc]');
  if (bg && tc && !reduce) {
    const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
    let raf = 0;
    const draw = () => {
      const t = bg.currentTime;
      tc.textContent = `TC 00:00:${pad(t)}:${pad((t % 1) * 25)}`;
      raf = requestAnimationFrame(draw);
    };
    bg.addEventListener('play', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    });
    bg.addEventListener('pause', () => cancelAnimationFrame(raf));
  }

  const modal = box.querySelector<HTMLDialogElement>('[data-teaser-modal]');
  const player = modal?.querySelector<HTMLVideoElement>('[data-teaser-player]');
  const title = modal?.querySelector<HTMLElement>('[data-teaser-modal-title]');
  const yt = modal?.querySelector<HTMLElement>('[data-teaser-yt]');
  if (!modal || !player || typeof modal.showModal !== 'function') return;
  let list: TeaserVideo[] = [];
  let bgWasPlaying = false;
  try {
    list = JSON.parse(box.querySelector('[data-teaser-videos]')?.textContent || '[]');
  } catch {
    return;
  }
  box.querySelectorAll<HTMLAnchorElement>('[data-teaser-open]').forEach((link) =>
    link.addEventListener('click', (e) => {
      const v = list.find((x) => x.id === link.dataset.teaserOpen);
      if (!v) return;
      if (v.youtube && !yt) return;
      e.preventDefault();
      if (title) title.textContent = v.title;
      bgWasPlaying = !!bg && !bg.paused;
      bg?.pause();
      if (v.youtube && yt) {
        // Vídeo del canal oficial de FAIRINO: se carga ahora, al pulsar (modo de privacidad mejorada de YouTube).
        player.hidden = true;
        yt.hidden = false;
        const frame = document.createElement('iframe');
        frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtube)}?autoplay=1&rel=0&modestbranding=1`;
        frame.title = v.title;
        frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        frame.allowFullscreen = true;
        yt.replaceChildren(frame);
        modal.showModal();
        return;
      }
      if (yt) yt.hidden = true;
      player.hidden = false;
      player.poster = v.poster ?? '';
      player.src = v.src ?? '';
      modal.showModal();
      player.play().catch(() => {});
    }),
  );
  modal.addEventListener('close', () => {
    yt?.replaceChildren();
    player.pause();
    player.removeAttribute('src');
    player.load();
    // el fondo sigue donde estaba
    if (bg && bgWasPlaying) bg.play().catch(() => {});
  });
  modal.querySelector('[data-teaser-close]')?.addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
});

// Módulo propio: sus constantes no chocan con las de los otros scripts.
export {};
