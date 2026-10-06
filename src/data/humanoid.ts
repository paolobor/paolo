// Robótica humanoide FAIRINO: bloque «Próximamente» del inicio y de la tienda (components/home/HumanoidTeaser.astro).
// Textos y datos sacados tal cual del teaser oficial «ART7 R7» de FAIRINO (en español, 58 s). No añadir cifras que no
// salgan en material oficial. El fondo y el segundo vídeo son el anuncio oficial de los humanoides FAIRINO (90 s).
// Origen de los vídeos y de cómo se recortaron: assets-src/fabricantes/LEEME.md.
export interface HumanoidVideo {
  id: string;
  title: string;
  meta: string;
  mp4?: string;
  youtube?: string;
  poster: string;
}

export const humanoid = {
  eyebrow: 'Próximamente · Robótica humanoide FAIRINO',
  hook: 'Hay una diferencia entre moverse y sentir.',
  name: 'ART7 R7',
  claim: 'Plataforma de brazo humanoide con control de fuerza.',
  tagline: 'Lo que viene ya se siente.',
  specs: [
    { value: '7 ejes', label: 'Sensor de par en cada articulación' },
    { value: '≥ 5 kHz', label: 'Muestreo del sensor' },
    { value: '≤ 0,15 N', label: 'Precisión de control de fuerza' },
    { value: '±0,03 mm', label: 'Repetibilidad' },
  ],
  note: 'Certificación CE en proceso. Uso: I+D, investigación, educación, demostración y prototipos.',
  // ?demo= rellena el comentario de la cita (pages/reservar-cita.astro)
  demoHref: 'reservar-cita/?demo=art7-r7',
  background: {
    webm: 'media/fairino-humanoide-fondo.webm',
    mp4: 'media/fairino-humanoide-fondo.mp4',
    poster: 'videos/fairino-humanoide-poster.jpg',
    credit: 'Vídeo oficial de FAIRINO · humanoides',
  },
  // El primero sale destacado (grande). youtube: vídeo del canal oficial de FAIRINO; se carga solo al pulsar
  // (youtube-nocookie). mp4: vídeo alojado en la web.
  videos: <HumanoidVideo[]>[
    {
      id: 'wrc-2026',
      title: 'IA física: FAIRINO en la WRC 2026',
      meta: '0:44 · vídeo oficial · YouTube',
      youtube: 'DCkKewMlc3s',
      poster: 'videos/yt-DCkKewMlc3s.jpg',
    },
    {
      id: 'art7-r7',
      title: 'Teaser ART7 R7',
      meta: '0:58 · en español',
      mp4: 'media/fairino-art7-r7-teaser.mp4',
      poster: 'videos/fairino-art7-r7-poster.jpg',
    },
    {
      id: 'humanoides',
      title: 'Humanoides FAIRINO',
      meta: '1:30 · vídeo oficial',
      mp4: 'media/fairino-humanoide.mp4',
      poster: 'videos/fairino-humanoide-familia.jpg',
    },
  ],
};
