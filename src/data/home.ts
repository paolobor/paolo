// Contenido editable de la home. Los valores null se muestran como placeholders [DATO: …] / [FOTO: …].

export const hero = {
  // Vídeo de fondo: guardar en /public/media/ (MP4 H.264 + WebM, 10–15 s, sin audio, ≤ 3 MB) y poner las rutas aquí
  // (p. ej. 'media/hero.mp4'). El póster es una foto en src/assets/images (p. ej. 'home/hero-poster.jpg').
  // Vídeo oficial de la portada de fairino.es (wp-content/uploads/2025/10/video-portada.mp4), sin audio y comprimido
  // para la web (1080p, 38 s). El póster es su primer fotograma.
  video: {
    mp4: 'media/fairino-portada.mp4' as string | null,
    webm: 'media/fairino-portada.webm' as string | null,
    poster: 'home/fairino-portada-poster.jpg' as string | null,
    hint: 'cobot FAIRINO trabajando en una célula real, 10–15 s en bucle, sin audio',
  },
  // Modelo destacado de la primera diapositiva (slug de producto). Confirmar con FAIRINO España.
  featuredSlug: 'fr5',
  slides: [
    {
      id: 'distribuidor',
      eyebrow: 'Distribuidor oficial FAIRINO en España',
      title: 'Automatización colaborativa al alcance de tu producción',
      text: 'Cobots fiables y fáciles de programar, con asesoramiento, puesta en marcha y soporte desde Toledo.',
      primary: { label: 'Descubre el modelo', href: 'productos/fr5/' },
      secondary: { label: 'Reservar cita', href: 'reservar-cita/' },
    },
    {
      id: 'llave-en-mano',
      eyebrow: 'Llave en mano · plug & play',
      title: 'Soluciones completas, listas para producir',
      text: 'Diseñamos, montamos y ponemos en marcha la célula entera: cobot, garra, visión y seguridad, todo a la vez.',
      primary: { label: 'Ver soluciones', href: 'soluciones-llave-en-mano/' },
      secondary: { label: 'Pedir propuesta', href: 'contacto/' },
    },
    {
      id: 'gama',
      eyebrow: 'Gama completa',
      title: 'Cobots, controladores y accesorios en un solo proveedor',
      text: 'Todo el ecosistema FAIRINO, compatible entre sí, para que tu célula funcione a la primera.',
      primary: { label: 'Ver catálogo', href: 'cobots/' },
      secondary: { label: 'Configurar mi célula', href: '#configurador' },
    },
  ],
};

export const valueCards = [
  {
    icon: 'map-pin',
    title: 'Visítanos en Toledo',
    text: 'Ven a Villaluenga de la Sagra y mira los cobots FAIRINO funcionando antes de decidir.',
    cta: { label: 'Reservar visita', href: 'reservar-cita/' },
  },
  {
    icon: 'layers',
    title: 'Toda la gama FAIRINO',
    text: 'Diez cobots, cuatro controladores y los accesorios oficiales. Eliges lo que necesitas y nada más.',
    cta: { label: 'Ver productos', href: 'cobots/' },
  },
  {
    icon: 'wrench',
    title: 'Integración y soluciones completas',
    text: 'De la idea a la célula funcionando: diseño, montaje, programación, formación y soporte técnico.',
    cta: { label: 'Ver soluciones', href: 'soluciones-llave-en-mano/' },
  },
];

// Franja de logos: rellenar con logos reales (SVG en /public/logos/). null → placeholder.
export const logos: { name: string; src: string | null }[] = Array.from({ length: 8 }, (_, i) => ({
  name: `[LOGO: partner, certificación o cliente ${i + 1}]`,
  src: null,
}));

export const counters: { value: number | null; suffix?: string; label: string; hint: string }[] = [
  { value: null, suffix: '+', label: 'Células instaladas', hint: 'instalaciones' },
  { value: null, suffix: '', label: 'Años de experiencia del equipo', hint: 'años de experiencia' },
  { value: null, suffix: '', label: 'Clientes en España', hint: 'clientes' },
  { value: null, suffix: '', label: 'Personas formadas', hint: 'personas formadas' },
];

export const advice = {
  title: 'Asesoramiento gratuito, sin compromiso',
  text: 'Cuéntanos qué quieres automatizar y te decimos con franqueza si un cobot es la solución, qué modelo encaja y qué necesitas alrededor. Si quieres, lo vemos en persona en nuestras instalaciones.',
  points: ['Análisis de tu aplicación', 'Demostración en nuestras instalaciones', 'Propuesta detallada, sin compromiso'],
  image: null as string | null,
  imageHint: 'ingeniero de FAIRINO España explicando un cobot a un cliente en el showroom',
};

export const testimonial = {
  quote: null as string | null, // [TESTIMONIO REAL]
  author: null as string | null,
  role: null as string | null,
  company: null as string | null,
  image: null as string | null,
  imageHint: 'render o foto de la aplicación del cliente',
};

export const contactBand = {
  image: null as string | null,
  imageHint: 'instalaciones de FAIRINO España en Villaluenga de la Sagra',
};
