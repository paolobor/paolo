// Las 8 aplicaciones. Cada una tendrá su página /aplicaciones/<slug>/ generada con una única plantilla.
export interface Application {
  slug: string;
  name: string;
  short: string;
  icon: string;
  image: string | null; // ruta en /public o null → placeholder visible
  imageHint: string;
}

export const applications: Application[] = [
  {
    slug: 'soldadura',
    name: 'Soldadura',
    short: 'Cordones repetibles y estables, programados por arrastre en lugar de líneas de código.',
    icon: 'zap',
    image: null,
    imageHint: 'cobot FAIRINO soldando en mesa de trabajo',
  },
  {
    slug: 'paletizado',
    name: 'Paletizado',
    short: 'Final de línea automatizado: cajas apiladas con el patrón exacto, turno tras turno.',
    icon: 'layers',
    image: null,
    imageHint: 'cobot paletizando cajas al final de línea',
  },
  {
    slug: 'pick-and-place',
    name: 'Pick & place',
    short: 'Coger, orientar y colocar piezas a ritmo constante, con o sin visión artificial.',
    icon: 'move',
    image: null,
    imageHint: 'cobot con garra moviendo piezas entre bandejas',
  },
  {
    slug: 'carga-de-maquinas',
    name: 'Carga de máquinas',
    short: 'Alimenta tornos, centros de mecanizado o inyectoras y libera al operario para tareas de más valor.',
    icon: 'factory',
    image: null,
    imageHint: 'cobot cargando un centro de mecanizado CNC',
  },
  {
    slug: 'manipulacion',
    name: 'Manipulación',
    short: 'Traslado, ensamblaje y atornillado de componentes con precisión y sin esfuerzo para el equipo.',
    icon: 'hand',
    image: null,
    imageHint: 'cobot ensamblando componentes en un puesto de trabajo',
  },
  {
    slug: 'lijado-y-pulido',
    name: 'Lijado y pulido',
    short: 'Acabados uniformes con control de fuerza, sin polvo ni vibraciones para las personas.',
    icon: 'refresh-cw',
    image: null,
    imageHint: 'cobot con lijadora y sensor de fuerza sobre una pieza',
  },
  {
    slug: 'dosificacion-y-encolado',
    name: 'Dosificación y encolado',
    short: 'Cordones de adhesivo o sellante con caudal y trayectoria constantes en cada pieza.',
    icon: 'workflow',
    image: null,
    imageHint: 'cobot aplicando un cordón de adhesivo',
  },
  {
    slug: 'pintura',
    name: 'Pintura',
    short: 'Capas homogéneas y menos consumo de pintura, sin exponer a nadie a los disolventes.',
    icon: 'sliders-horizontal',
    image: null,
    imageHint: 'cobot pintando una pieza con pistola',
  },
];
