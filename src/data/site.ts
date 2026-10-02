// Datos globales de FAIRINO España. Todo lo que cambie de contacto, redes o comportamiento del sitio se toca aquí.

export const site = {
  name: 'FAIRINO España',
  legalName: 'Fairino Cobot S.L.',
  tagline: 'Distribuidor oficial de cobots FAIRINO en España',
  description:
    'Distribuidor oficial de robots colaborativos FAIRINO en España. Cobots, controladores y accesorios, integración llave en mano y soporte desde Toledo.',
  url: 'https://fairino.es',
  locale: 'es_ES',

  // Logo oficial: cuando tengamos el SVG, guardarlo en /public/brand/ y poner aquí la ruta (p. ej. 'brand/logo-fairino.svg').
  logo: null as string | null,

  address: {
    street: 'Avenida de la Estación, 12',
    postalCode: '45520',
    city: 'Villaluenga de la Sagra',
    region: 'Toledo',
    country: 'España',
    countryCode: 'ES',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Avenida+de+la+Estaci%C3%B3n+12+45520+Villaluenga+de+la+Sagra+Toledo',
  },

  contacts: [
    { email: 'po@fairino.es', phone: '+34 627 775 294', tel: '+34627775294' },
    { email: 'fd@fairino.es', phone: '+34 630 832 586', tel: '+34630832586' },
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
    accessKey: null as string | null, // [DATO: clave de Web3Forms]
    fallbackEmail: 'po@fairino.es',
  },

  // Newsletter: proveedor pendiente (Brevo, Mailchimp…). Mientras sea null, el formulario usa el mismo envío que los demás.
  newsletter: { endpoint: null as string | null },

  // Tienda. vatIncluded: true = precios con IVA, false = sin IVA, null = sin indicarlo (pendiente de confirmar).
  store: {
    vatIncluded: null as boolean | null,
    // Dominio de la tienda Shopify para el pago (enlace de carrito). null = el pedido se envía por formulario.
    shopifyDomain: null as string | null,
  },

  // Configurador: precios ocultos por defecto. Para mostrarlos, poner true y rellenar "price" en cada producto.
  showPrices: true,
  currency: 'EUR',
};

export type Site = typeof site;
