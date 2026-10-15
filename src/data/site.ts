// Datos globales de FAIRINO España. Todo lo que cambie de contacto, redes o comportamiento del sitio se toca aquí.

export const site = {
  name: 'FAIRINO España',
  legalName: 'Fairino Cobot S.L.',
  tagline: 'Distribuidor oficial de cobots FAIRINO en España',
  description:
    'Distribuidor oficial de robots colaborativos FAIRINO en España. Cobots, controladores y accesorios, integración llave en mano y soporte desde Toledo.',
  url: 'https://fairino.es', // dominio de esta web; igual que SITE en astro.config.mjs
  // Otros dominios de la web. fairinocobot.com redirige (301) a fairino.es con tools/fairinocobot/.htaccess; se sigue
  // aceptando en los enlaces del asistente porque su base de conocimiento antigua puede traer direcciones de ese dominio.
  mirrors: ['fairinocobot.com'],
  locale: 'es_ES',

  // Logotipo oficial: src/assets/brand/fairino-wordmark.svg (letras de FAIRINO), lo pinta components/ui/Logo.astro.

  // Instalaciones de FAIRINO España, la dirección que da la empresa (la misma que el pie de fairino.es).
  // Si street es null sale [DATO: calle y número].
  address: {
    street: 'Avenida de la Estación, 12' as string | null,
    postalCode: '45520',
    city: 'Villaluenga de la Sagra',
    region: 'Toledo',
    country: 'España',
    countryCode: 'ES',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Avenida+de+la+Estaci%C3%B3n+12+45520+Villaluenga+de+la+Sagra+Toledo',
  },

  // Titular del sitio para el aviso legal y la privacidad. Datos tomados del aviso legal actual de fairino.es,
  // que no coinciden con legalName: confirmar con FAIRINO España y poner confirmed: true.
  legal: {
    holder: 'FDI QUALITY IMPORT S.L.',
    taxId: 'B13956479',
    address: 'Calle Málaga, 3, nave 13 (Pol. Ind. La Carrehuela), 28343 Valdemoro (Madrid)',
    email: 'info@fdi-qi.com',
    phone: null as string | null, // el 630 832 586 se quitó de la web a petición de FAIRINO España
    registry: null as string | null, // [DATO: datos del Registro Mercantil]
    confirmed: false,
  },

  contacts: [
    { email: 'po@fairino.es', phone: '+34 627 775 294', tel: '+34627775294' },
  ],

  // Número de WhatsApp (formato internacional sin "+" ni espacios).
  whatsapp: {
    number: '34627775294',
    defaultMessage: 'Hola, me gustaría recibir información sobre los cobots FAIRINO.',
  },

  social: [
    { name: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/company/fairinocobots' },
    { name: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/fairinocobots' },
    { name: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/fairinocobots' },
    { name: 'X', icon: 'x', href: 'https://x.com/fairinocobots' },
  ],

  // Formularios (GitHub Pages no tiene servidor). Con Web3Forms basta una clave pública:
  // https://web3forms.com → crear clave para po@fairino.es → pegarla aquí.
  forms: {
    provider: 'web3forms' as const,
    endpoint: 'https://api.web3forms.com/submit',
    // Clave pública del formulario «Web FAIRINO España» del panel app.web3forms.com; el destinatario (po@fairino.es,
    // correo vinculado y verificado) se elige en Settings → Email Configuration de ese formulario.
    accessKey: 'be38439e-f1cb-4fae-b276-c312edcc0921' as string | null,
    fallbackEmail: 'po@fairino.es',
  },

  // Cuentas de cliente (Firebase Authentication + Cloud Firestore, de Google; plan gratuito Spark). Para comprar hay que
  // iniciar sesión o crear una cuenta, como en Amazon. Mientras firebase sea null no se pide cuenta y el pedido
  // funciona como antes. Dónde sale: consola de Firebase → Configuración del proyecto → Tus apps → app web
  // («firebaseConfig»). Son datos públicos: la seguridad la ponen las reglas de tools/firebase/firestore.rules.
  accounts: {
    firebase: {
      apiKey: 'AIzaSyCmtf-uMaf5zIrUiR6miKXO2y-BbxqtYiI',
      authDomain: 'fairinocobot.firebaseapp.com',
      projectId: 'fairinocobot',
      appId: '1:271044825844:web:2256f52a62f3a475c3c4a1',
    } as null | { apiKey: string; authDomain: string; projectId: string; appId: string },
  },

  // Asistente virtual (ElevenLabs Agents): voz y chat de texto en todas las páginas. Mientras agentId sea null no se
  // carga nada. En el panel del agente: idioma español, entrada de texto en Widget → Interface y el dominio de la web en
  // Security → Allowlist. La posición (abajo a la izquierda) y los textos del widget van en AssistantWidget.astro.
  // Base de conocimiento: /asistente/base-conocimiento.txt (src/pages/asistente/), se genera con cada build, más los
  // textos del manual y el SDK de tools/asistente/extraer-manual.py (subidos a mano, con «Usar RAG»).
  // Google Analytics 4 (cuenta «FAIRINO España», flujo web de fairino.es). Solo se carga si el visitante acepta las
  // cookies de análisis en el aviso (BaseLayout + CookieBanner). null = sin analítica.
  analytics: { gaId: 'G-97VG1MQNJB' as string | null },
  assistant: {
    agentId: 'agent_0701m4bjmv7rfg9abjm69q28bm9b' as string | null, // «Asistente FAIRINO España»
    // Conversaciones por visitante y día (se cuentan en su navegador; 0 = sin tope). El tope de toda la web (llamadas al
    // día, simultáneas, ráfagas) está en el panel del agente: Configuración → Límites.
    dailyLimit: 2,
  },

  // Newsletter: proveedor pendiente (Brevo, Mailchimp…). Mientras sea null, el formulario usa el mismo envío que los demás.
  newsletter: { endpoint: null as string | null },

  // Tienda. vatIncluded: true = precios con IVA, false = sin IVA, null = sin indicarlo (pendiente de confirmar).
  store: {
    vatIncluded: false as boolean | null,
    // Dominio de la tienda Shopify para el pago (enlace de carrito). null = el pedido se envía por formulario.
    shopifyDomain: null as string | null,
  },

  // Stock y plazos (src/scripts/stock.ts). El stock sale de la hoja de Google «Stock web FAIRINO España»: una fila por
  // producto con «Código web» (el de la dirección de su ficha), «Unidades en stock» y, si se quiere, «Plazo si no hay
  // stock (días)». La hoja se comparte como «Cualquier persona con el enlace: lector» y sheetId es lo que va entre
  // /d/ y /edit en su enlace. La web la lee al abrir cada página (como mucho cada 2 minutos por visitante), así que
  // los cambios se ven al momento sin volver a subir la web. Mientras sheetId sea null no se enseña el stock.
  stock: {
    sheetId: '10y-QObHQglJW1GTNusYvn5ogWcHuRmDAf8WLViflt5M' as string | null,
    // Plazo de entrega con stock, tal cual se enseña (lo da FAIRINO España, 15-10-2026).
    inStockDelivery: '2 a 4 días laborables' as string | null,
    // Sin stock, para todos los productos: «Unidades fuera de stock: plazo de suministro de 45 días» (tarifa; FAIRINO
    // España confirma que también vale para los accesorios). La columna «Plazo» de la hoja lo cambia por producto.
    onOrderDays: 45,
    // Con estas unidades o menos sale «Últimas X unidades».
    lastUnits: 3,
    // Se puede recoger sin gastos de envío en las instalaciones (site.address). En el pedido se elige «Recogida».
    pickup: true,
  },

  // Configurador: precios ocultos por defecto. Para mostrarlos, poner true y rellenar "price" en cada producto.
  showPrices: true,
  currency: 'EUR',
};

export type Site = typeof site;
