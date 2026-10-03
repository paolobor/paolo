// Industrias. Contenido basado en fairino.es/industrias y fairino.es/aplicaciones, redactado de nuevo.
export interface Industry {
  slug: string;
  name: string;
  icon: string;
  intro: string;
  scenarios: string[];
  // Aplicaciones de la web relacionadas (slugs de applications.ts).
  applications: string[];
  // Soluciones específicas que publica FAIRINO para el sector, con sus cifras.
  solutions?: { name: string; text: string; claims: string[] }[];
  image: string | null;
  imagePosition?: string;
  imageHint: string;
}

export const industries: Industry[] = [
  {
    slug: 'automocion',
    name: 'Automoción',
    icon: 'car',
    intro:
      'La industria del automóvil cambia de modelos y variantes cada vez más rápido. Los cobots FAIRINO automatizan puestos de la línea para producir con calidad constante, adaptarse a la personalización y reducir el consumo de energía y los costes.',
    scenarios: ['Soldadura de componentes', 'Atornillado', 'Imprimación por pulverización', 'Pick & place', 'Inspección de piezas'],
    applications: ['soldadura', 'pick-and-place', 'manipulacion', 'pintura'],
    image: 'products/fr3wms/fairino-fr3wms-escena-soldadura.webp',
    imagePosition: '55% 50%',
    imageHint: 'cobot FAIRINO en una línea de automoción',
  },
  {
    slug: 'electronica',
    name: 'Electrónica (3C)',
    icon: 'microchip',
    intro:
      'En electrónica de consumo, informática y comunicaciones (las «3C») se ha pasado de grandes series estándar a series cortas y personalizadas. Hacen falta líneas que cambien de producto en poco tiempo y equipos compatibles con todo tipo de piezas.',
    scenarios: ['Pick & place', 'Atornillado', 'Paletizado', 'Desbarbado y rectificado', 'Aplicación de adhesivo'],
    applications: ['pick-and-place', 'dosificacion-y-encolado', 'lijado-y-pulido', 'paletizado'],
    image: 'products/fr3/fairino-fr3-escena-pick-and-place.webp',
    imagePosition: '40% 50%',
    imageHint: 'cobot FAIRINO montando placas electrónicas',
  },
  {
    slug: 'alimentacion-y-bebidas',
    name: 'Alimentación y bebidas',
    icon: 'utensils',
    intro:
      'En alimentación y bebidas la mano de obra pesa mucho: seleccionar, clasificar, preparar pedidos, cocinar y servir exige mucho personal y mucha formación. Un cobot asume las tareas repetitivas y mantiene el mismo resultado en cada ración.',
    scenarios: ['Elaboración de helados', 'Preparación de café', 'Cocción de fideos'],
    applications: ['pick-and-place', 'manipulacion', 'paletizado'],
    image: null,
    imageHint: 'cobot FAIRINO preparando bebidas o comida',
  },
  {
    slug: 'salud',
    name: 'Salud',
    icon: 'heart-pulse',
    intro:
      'Crece la demanda de tratamientos y no siempre hay profesionales con la misma formación. Los cobots aportan automatización segura en tareas de terapia y de manipulación en el ámbito sanitario.',
    scenarios: ['Fisioterapia con moxibustión', 'Rehabilitación', 'Recogida y desinfección de residuos sanitarios'],
    applications: ['manipulacion'],
    solutions: [
      {
        name: 'Moxibustión',
        text: 'Automatiza una terapia que tradicionalmente genera humo y depende de la destreza del terapeuta.',
        claims: ['Cinco técnicas tradicionales de moxibustión para ayudar a quien empieza.', 'Diseño sin humo, fácil de limpiar.', 'Triple sistema de seguridad: más de un 40 % de mejora en seguridad.'],
      },
      {
        name: 'Rehabilitación',
        text: 'Entrenamiento asistido de extremidades superiores e inferiores.',
        claims: ['Un 10 % menos de tiempo de rehabilitación con el entrenamiento integrado.', 'Rango de movimiento ampliado de 90° a 120°.', 'Triple sistema de seguridad: más de un 40 % de mejora en seguridad.'],
      },
    ],
    image: null,
    imageHint: 'cobot FAIRINO en una aplicación sanitaria',
  },
];
