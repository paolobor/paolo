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
}

export const solutions: Solution[] = [
  {
    slug: 'celula-de-soldadura',
    name: 'Célula de soldadura',
    summary: 'Puesto de soldadura colaborativa listo para producir: cobot, equipo de soldadura, mesa y seguridad.',
    application: 'soldadura',
    includes: null,
    image: 'products/fr5wml/fairino-fr5wml-escena-soldadura.webp',
    imagePosition: '60% 50%',
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
