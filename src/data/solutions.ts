// Soluciones llave en mano. Contenido pendiente de definir con FAIRINO España: lo marcado con null sale como [DATO: …].
export interface Solution {
  slug: string;
  name: string;
  summary: string;
  // Aplicación relacionada (slug de applications.ts): de ahí salen los cobots recomendados.
  application: string;
  includes: string[] | null;
  image: string | null;
  imagePosition?: string;
  imageHint: string;
  // Foto de cómo llega el equipo (opcional): ruta en src/assets/images y texto.
  delivery?: { image: string; alt: string; text: string };
}

export const solutions: Solution[] = [
  {
    slug: 'celula-de-soldadura',
    name: 'Célula de soldadura',
    summary: 'Puesto de soldadura colaborativa listo para producir: cobot, equipo de soldadura, mesa y seguridad.',
    application: 'soldadura',
    includes: null,
    // El FR5 negro de FAIRINO España con su equipo de soldadura completo (escena a partir de su foto real).
    image: 'products/fr5-negro/fairino-fr5-negro-escena-estacion-soldadura.webp',
    imagePosition: '55% 50%',
    imageHint: 'célula de soldadura FAIRINO montada',
  },
  {
    slug: 'celula-de-paletizado',
    name: 'Célula de paletizado',
    summary: 'Final de línea compacto que apila cajas con el patrón que definas y cabe donde hoy paletiza una persona.',
    application: 'paletizado',
    includes: null,
    image: 'products/fr20/fairino-fr20-escena-paletizado-doble.webp',
    imagePosition: '60% 50%',
    imageHint: 'célula de paletizado FAIRINO con palé y cajas',
    // Foto del cliente (8/10/2026) de las cajas reales; Higgsfield solo cambió el entorno (assets-src/fabricantes/LEEME.md).
    delivery: {
      image: 'soluciones/fairino-paletizadores-escena-embalaje.webp',
      alt: 'Cuatro cajas de madera FAIRINO sobre palés, apiladas de dos en dos',
      text: 'Así llegan los paletizadores FAIRINO: en cajas de madera sobre palé, con cierres metálicos y los pictogramas de manipulación. Nosotros las recibimos, montamos la célula y te la entregamos funcionando.',
    },
  },
  {
    slug: 'celula-de-carga-de-maquinas',
    name: 'Célula de carga de máquinas',
    summary: 'Cobot con garra y bandejas de entrada y salida para alimentar tu máquina sin vigilancia constante.',
    application: 'carga-de-maquinas',
    includes: null,
    image: 'products/fr10/fairino-fr10-escena-carga-de-maquinas.webp',
    imagePosition: '35% 50%',
    imageHint: 'célula de carga de máquina CNC con cobot',
  },
];
