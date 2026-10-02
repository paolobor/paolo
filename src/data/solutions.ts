// Soluciones llave en mano. Contenido pendiente de definir con FAIRINO España: lo marcado con null sale como [DATO: …].
export interface Solution {
  slug: string;
  name: string;
  summary: string;
  includes: string[] | null;
  image: string | null;
  imageHint: string;
}

export const solutions: Solution[] = [
  {
    slug: 'celula-de-soldadura',
    name: 'Célula de soldadura',
    summary: 'Puesto de soldadura colaborativa listo para producir: cobot, equipo de soldadura, mesa y seguridad.',
    includes: null,
    image: null,
    imageHint: 'célula de soldadura FAIRINO montada',
  },
  {
    slug: 'celula-de-paletizado',
    name: 'Célula de paletizado',
    summary: 'Final de línea compacto que apila cajas con el patrón que definas y cabe donde hoy paletiza una persona.',
    includes: null,
    image: null,
    imageHint: 'célula de paletizado FAIRINO con palé y cajas',
  },
  {
    slug: 'celula-de-carga-de-maquinas',
    name: 'Célula de carga de máquinas',
    summary: 'Cobot con garra y bandejas de entrada y salida para alimentar tu máquina sin vigilancia constante.',
    includes: null,
    image: null,
    imageHint: 'célula de carga de máquina CNC con cobot',
  },
];
