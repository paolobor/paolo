// Recursos fotorrealistas opcionales (vídeos, fotos de producto, textura).
// Se declaran en public/assets/recursos.json; si un recurso no está, la web
// sigue con el 3D y las imágenes del catálogo, sin peticiones fallidas.
const BASE = './assets/';

export async function loadResources() {
  try {
    const r = await fetch(`${BASE}recursos.json`, { cache: 'no-cache' });
    if (!r.ok) return {};
    const data = await r.json();
    const abs = (p) => (p ? BASE + p : null);
    const video = (v) => (v && v.mp4 ? { mp4: abs(v.mp4), webm: abs(v.webm), poster: abs(v.poster) } : null);
    const fotos = {};
    for (const [k, v] of Object.entries(data.fotosFamilias || {})) if (v) fotos[k] = abs(v);
    return {
      videoVirutas: data.videoVirutas ? { h: video(data.videoVirutas.horizontal), v: video(data.videoVirutas.vertical) } : null,
      videoNave: video(data.videoNave),
      fotosFamilias: fotos,
      texturaAluminio: abs(data.texturaAluminio),
    };
  } catch {
    return {};
  }
}

export function createVideo(src, { loop = true, autoplay = true, preload = 'none' } = {}) {
  const v = document.createElement('video');
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('muted', '');
  v.loop = loop;
  v.preload = preload; // solo se descarga el vídeo que se va a ver
  v.crossOrigin = 'anonymous';
  if (src.poster) v.poster = src.poster;
  if (src.webm) {
    const s = document.createElement('source');
    s.src = src.webm;
    s.type = 'video/webm';
    v.appendChild(s);
  }
  const s = document.createElement('source');
  s.src = src.mp4;
  s.type = 'video/mp4';
  v.appendChild(s);
  if (autoplay) v.autoplay = true;
  return v;
}

// Fotos de estudio de cada familia (sobre negro puro: se funden con la tarjeta)
export function applyFamilyPhotos(fotos = {}) {
  for (const [k, url] of Object.entries(fotos)) {
    const img = document.querySelector(`.f-${k} .family-media img`);
    if (!img) continue;
    const probe = new Image();
    probe.onload = () => {
      img.src = url;
      img.width = probe.naturalWidth;
      img.height = probe.naturalHeight;
      img.classList.add('is-photo');
    };
    probe.src = url;
  }
}

// Vídeo cinematográfico de la nave en la cabecera del catálogo (transición)
export function setupHeroVideo(src, reducedMotion) {
  const hero = document.querySelector('.cat-hero');
  if (!hero || !src) return null;
  const v = createVideo(src, { loop: true, autoplay: false, preload: 'none' });
  v.className = 'cat-hero-video';
  v.setAttribute('aria-hidden', 'true');
  const wrap = document.createElement('div');
  wrap.className = 'cat-hero-media';
  wrap.appendChild(v);
  hero.prepend(wrap);
  hero.classList.add('has-video');
  return {
    play() {
      if (reducedMotion) return;
      v.preload = 'auto';
      try { v.currentTime = 0; } catch { /* sin datos aún */ }
      v.play().catch(() => {});
    },
    pause() { v.pause(); },
  };
}
