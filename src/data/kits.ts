// Soluciones de aplicación FAIRINO: los 13 casos del folleto «servicios de FAIRINO COBOT South Europe» (PDF del
// cliente, 8/10/2026), traducidos y resumidos. Cada una tiene su página en /aplicaciones/soluciones/<slug>/ y sale en
// el apartado «Aplicaciones» del inicio, en /aplicaciones/ y en la página de su aplicación (parent).
// Fotos: escena generada a partir de la foto del equipo del folleto (Higgsfield, «Imagen ilustrativa») y fotos reales
// del folleto ampliadas (las que no llevan textos en chino). Origen: assets-src/fabricantes/LEEME.md.
// Precio: aún no hay tarifa; se pide propuesta.
export interface Kit {
  slug: string;
  name: string;
  // Aplicación general (slug de applications.ts) a la que pertenece; null si no encaja en ninguna.
  parent: string | null;
  icon: string;
  short: string;
  intro: string;
  benefits: { title: string; text: string }[];
  scenarios: string[];
  // Partes del equipo, tal como las rotula el folleto.
  parts: string[];
  // Cobots compatibles según el folleto (id de la ficha) y nota.
  cobots: string[];
  cobotsNote?: string;
  // Modelo cuando no es un cobot de la gama (el humanoide).
  model?: string;
  image: string;
  gallery: string[];
  // PVP en euros cuando haya tarifa (sale en la web y en el catálogo); sin él, «Consultar».
  pvp?: number | null;
}

const scene = (slug: string) => `aplicaciones/${slug}/fairino-${slug}-escena-principal.webp`;
const photos = (slug: string, ns: number[]) => ns.map((n) => `aplicaciones/${slug}/fairino-${slug}-foto-${n}.jpg`);
const magnetica = 'Admite base magnética.';

export const kits: Kit[] = [
  {
    slug: 'soldadura-mig-carro-movil',
    name: 'Soldadura MIG en carro móvil',
    parent: 'soldadura',
    icon: 'zap',
    short: 'El cobot va en un carro con el equipo de soldadura: lo llevas al puesto, le enseñas el cordón con el mando y suelda.',
    intro:
      'Cobot FAIRINO montado en un carro móvil con el equipo de soldadura MIG y un mando de programación rápida. No necesita instalación fija: se lleva de un puesto a otro y la trayectoria se enseña llevando el brazo con la mano.',
    benefits: [
      { title: 'Sin instalación fija', text: 'Se mueve a cualquier puesto de trabajo en pocos minutos.' },
      { title: 'Programación rápida', text: 'El mando en la antorcha marca los puntos del cordón sin escribir código.' },
      { title: 'Seguridad colaborativa', text: 'El cobot trabaja junto a las personas.' },
    ],
    scenarios: ['Soldadura in situ de piezas grandes', 'Repasos y cordones complejos', 'Maquinaria de obra pública y estructura metálica'],
    parts: ['Brazo robot', 'Mando de programación rápida', 'Antorcha', 'Consola de programación', 'Carro', 'Fuente de soldadura', 'Ruedas macizas'],
    cobots: ['fr3', 'fr3wml', 'fr5', 'fr5wml', 'fr10'],
    cobotsNote: magnetica,
    image: scene('soldadura-mig-carro-movil'),
    gallery: photos('soldadura-mig-carro-movil', [1, 2, 3]),
  },
  {
    slug: 'soldadura-mig-mag-carro-estandar',
    name: 'Soldadura MIG/MAG en carro estándar',
    parent: 'soldadura',
    icon: 'zap',
    short: 'Carro estándar con antorcha MIG/MAG, devanadora y botella de gas: soldadura automática que va donde está la pieza.',
    intro:
      'El cobot va sobre un carro móvil estándar que integra la antorcha MIG/MAG, la devanadora y la botella de gas de protección. Automatiza la soldadura sin obra ni instalación fija y se adapta a piezas de distintas medidas.',
    benefits: [
      { title: 'Sin instalación fija', text: 'Del almacén al puesto de trabajo en minutos.' },
      { title: 'Piezas de todas las medidas', text: 'Se adapta a series y formatos distintos.' },
      { title: 'Seguridad colaborativa', text: 'Suelda con el operario al lado.' },
    ],
    scenarios: ['Soldadura in situ y repasos en piezas grandes', 'Cordones complejos', 'Maquinaria de obra pública y estructura metálica'],
    parts: ['Brazo robot', 'Mando de programación rápida', 'Antorcha', 'Devanadora', 'Carro'],
    cobots: ['fr3wml', 'fr5'],
    cobotsNote: magnetica,
    image: scene('soldadura-mig-mag-carro-estandar'),
    gallery: photos('soldadura-mig-mag-carro-estandar', [1, 2, 3]),
  },
  {
    slug: 'soldadura-sobre-rail-ligero',
    name: 'Soldadura sobre raíl ligero',
    parent: 'soldadura',
    icon: 'zap',
    short: 'El cobot recorre un raíl por tramos de 3 a 4 m y suelda cordones largos sin mover la pieza.',
    intro:
      'Cobot sobre un raíl ligero que se monta por tramos hasta 3 o 4 m, para piezas largas y zonas de trabajo amplias. El servomotor con piñón y cremallera da un avance preciso y suave, y los imanes conmutables lo fijan en segundos.',
    benefits: [
      { title: 'Raíl de 3 a 4 m', text: 'Por tramos, para cordones largos y piezas grandes.' },
      { title: 'Avance preciso', text: 'Servomotor con piñón y cremallera.' },
      { title: 'Fijación en segundos', text: 'Imanes conmutables en las patas del raíl.' },
    ],
    scenarios: ['Soldadura por arco de estructura metálica y chapa', 'Cordones largos y en posiciones difíciles'],
    parts: ['Brazo robot', 'Cámara 3D + ALR Lab', 'Antorcha', 'Raíl', 'Cremallera y piñón', 'Servomotor', 'Patas de apoyo', 'Imanes conmutables'],
    cobots: ['fr3wml', 'fr5', 'fr5wml', 'fr10'],
    cobotsNote: magnetica,
    image: scene('soldadura-sobre-rail-ligero'),
    gallery: photos('soldadura-sobre-rail-ligero', [1, 2, 3]),
  },
  {
    slug: 'soldadura-portico-vision-3d',
    name: 'Soldadura con visión 3D en pórtico',
    parent: 'soldadura',
    icon: 'scan-eye',
    short: 'Cobot colgado de un pórtico ligero con cámara 3D: localiza la pieza y sigue la junta.',
    intro:
      'Un pórtico ligero lleva el cobot invertido con una cámara de visión para posicionar y una antorcha refrigerada por agua. La cámara localiza la pieza y busca la junta, y el cobot suelda con precisión sin plantillas.',
    benefits: [
      { title: 'Visión 3D', text: 'Posiciona la pieza y sigue la junta.' },
      { title: 'Pórtico sobre ruedas', text: 'Sin instalación fija.' },
      { title: 'Calidad de cordón', text: 'Juntas de precisión, repasos y cordones complejos.' },
    ],
    scenarios: ['Maquinaria, estructura metálica y calderería', 'Cordones de precisión y repasos'],
    parts: ['Pórtico ligero', 'Guía lineal', 'Brazo robot', 'Cámara 3D + ALR Lab', 'Antorcha', 'Fuente de soldadura', 'Armario de control'],
    cobots: ['fr3wml', 'fr5', 'fr5wml', 'fr10'],
    image: scene('soldadura-portico-vision-3d'),
    gallery: photos('soldadura-portico-vision-3d', [1, 2, 3]),
  },
  {
    slug: 'soldadura-laser-carro-movil',
    name: 'Soldadura láser en carro móvil',
    parent: 'soldadura',
    icon: 'zap',
    short: 'Soldadura láser con cobot sobre carro: cordones finos y limpios, con poca zona afectada por el calor.',
    intro:
      'El cobot integra un equipo de soldadura láser en un carro móvil con mando de programación rápida. El láser deja poca zona afectada por el calor y un cordón limpio y resistente, y la programación rápida acorta la puesta a punto.',
    benefits: [
      { title: 'Cordón limpio', text: 'Poca zona afectada por el calor.' },
      { title: 'Va a la pieza', text: 'Se lleva al puesto de producción, sin mover piezas grandes.' },
      { title: 'Puesta a punto corta', text: 'Mando de programación rápida.' },
    ],
    scenarios: ['Carrocería, chapa de precisión y maquinaria', 'Uniones a tope, repasos de precisión y juntas irregulares'],
    parts: ['Brazo robot', 'Mando de programación rápida', 'Cabezal láser', 'Fuente láser', 'Carro'],
    cobots: ['fr10', 'fr20'],
    cobotsNote: 'El carro admite otros modelos y base magnética.',
    image: scene('soldadura-laser-carro-movil'),
    gallery: photos('soldadura-laser-carro-movil', [1, 2, 3]),
  },
  {
    slug: 'carga-piezas-automocion',
    name: 'Carga y descarga de piezas de automoción',
    parent: 'carga-de-maquinas',
    icon: 'factory',
    short: 'Cobot con garra y visión que carga, descarga, traslada y monta piezas de automoción las 24 horas.',
    intro:
      'Brazo colaborativo con articulaciones ligeras de alta carga, garra flexible y visión inteligente para cargar, descargar, trasladar y montar piezas con precisión en líneas de componentes de automoción.',
    benefits: [
      { title: 'Visión inteligente', text: 'Reconoce la pieza y planifica la trayectoria.' },
      { title: 'Ágil y con alcance', text: 'Cubre un área de trabajo amplia.' },
      { title: 'Modular', text: 'Se adapta al ritmo de la línea.' },
    ],
    scenarios: ['Piezas de motor, chapa de carrocería y electrónica', 'Carga, descarga, traslado y montaje', 'Funcionamiento 24 horas'],
    parts: ['Brazo robot', 'Garra', 'Puesto de trabajo', 'Base del robot', 'Seta de emergencia'],
    cobots: ['fr3wml', 'fr5', 'fr5wml', 'fr10'],
    image: scene('carga-piezas-automocion'),
    gallery: photos('carga-piezas-automocion', [1, 2, 3]),
  },
  {
    slug: 'carga-maquina-herramienta',
    name: 'Carga y descarga de máquina-herramienta',
    parent: 'carga-de-maquinas',
    icon: 'factory',
    short: 'Carro con cobot, bandejas de posicionado y visión para alimentar centros de mecanizado, tornos y rectificadoras.',
    intro:
      'El cobot va en un carro móvil con bandejas de posicionado, visión y garra. Se acerca a la máquina, coge la pieza, la amarra y la retira, sin instalación fija y con piezas de distintas medidas.',
    benefits: [
      { title: 'Sin instalación fija', text: 'De una máquina a otra en minutos.' },
      { title: 'Más horas de máquina', text: 'Coge, amarra y retira la pieza sin parar.' },
      { title: 'Seguridad colaborativa', text: 'El operario sigue trabajando al lado.' },
    ],
    scenarios: ['Centros de mecanizado CNC, tornos y rectificadoras', 'Coger, amarrar y trasladar piezas'],
    parts: ['Brazo robot', 'Bandejas de posicionado', 'Carro del cobot'],
    cobots: ['fr3wml', 'fr5', 'fr5wml', 'fr10', 'fr16', 'fr20', 'fr30'],
    image: scene('carga-maquina-herramienta'),
    gallery: photos('carga-maquina-herramienta', [1, 2, 3]),
  },
  {
    slug: 'pintura-con-vision',
    name: 'Pintura con mando portátil y visión',
    parent: 'pintura',
    icon: 'droplet',
    short: 'Le enseñas la pasada llevando la pistola con la mano y la repite, también en superficies curvas.',
    intro:
      'Cobot de pintura montado invertido, con visión y pistola de atomización de alto rendimiento. La trayectoria se enseña con un mando portátil AR llevando la pistola a mano, también en superficies curvas complejas; la visión ayuda a posicionar la pieza.',
    benefits: [
      { title: 'Enseñanza a mano', text: 'Mando portátil AR: sin programar líneas de código.' },
      { title: 'Visión', text: 'Posiciona la pieza con precisión.' },
      { title: 'Acabado constante', text: 'Capa uniforme en cada pieza.' },
    ],
    scenarios: ['Maquinaria, sanitarios, tableros de mueble y chapa', 'Grandes superficies, esquinas y superficies curvas'],
    parts: ['Funda protectora', 'Controlador del robot', 'Brazo robot', 'Pistola de pintura', 'Mando portátil AR', 'Base magnética'],
    cobots: ['fr5', 'fr5wml', 'fr10'],
    image: scene('pintura-con-vision'),
    gallery: photos('pintura-con-vision', [1, 2]),
  },
  {
    slug: 'lijado-y-desbarbado',
    name: 'Lijado y desbarbado',
    parent: 'lijado-y-pulido',
    icon: 'hammer',
    short: 'Cabezal de lijado flexible y percepción inteligente para lijar, desbarbar y pulir igual en cada pieza.',
    intro:
      'El cobot integra articulaciones ligeras de alta carga, un cabezal de lijado flexible y percepción inteligente para lijar y pulir con precisión en madera, metal y piezas de automoción, y adaptarse al ritmo de cada proceso.',
    benefits: [
      { title: 'Percepción inteligente', text: 'Reconoce la pieza y planifica la trayectoria.' },
      { title: 'Acabado uniforme', text: 'Misma precisión en la primera y en la última pieza.' },
      { title: 'Menos esfuerzo', text: 'Libera al operario del trabajo más duro.' },
    ],
    scenarios: ['Lijado de madera', 'Desbarbado de metal', 'Pulido de piezas de automoción', 'Funcionamiento 24 horas'],
    parts: ['Cabezal de lijado', 'Brazo robot', 'Base de montaje'],
    cobots: ['fr16', 'fr20', 'fr30'],
    image: scene('lijado-y-desbarbado'),
    gallery: photos('lijado-y-desbarbado', [1, 2, 3]),
  },
  {
    slug: 'paletizado-vision-3d',
    name: 'Paletizado y despaletizado con visión 3D',
    parent: 'paletizado',
    icon: 'layers',
    short: 'Una cámara 3D escanea las cajas: coge material desordenado o mezclado sin enseñarle posiciones.',
    intro:
      'La cámara 3D escanea en tiempo real la forma, la posición y la orientación de cada caja. El cobot coge material mezclado o desordenado sin programar posiciones fijas, planifica el mejor agarre y apila con orden.',
    benefits: [
      { title: 'Escaneo 3D automático', text: 'Sin enseñar ni colocar las cajas a mano.' },
      { title: 'Cajas desordenadas', text: 'Detecta cajas descolocadas, apiladas o mezcladas.' },
      { title: 'Palés más regulares', text: 'Menos esfuerzo físico para el equipo.' },
    ],
    scenarios: ['Logística y almacenes', 'Alimentación, química y materiales de construcción', 'Electrodomésticos y automoción', 'Final de línea, despaletizado y traslados'],
    parts: ['Brazo robot', 'Ventosa', 'Base del robot'],
    cobots: ['fr16', 'fr20', 'fr30'],
    image: scene('paletizado-vision-3d'),
    gallery: photos('paletizado-vision-3d', [1, 2, 3]),
  },
  {
    slug: 'doble-brazo-enhebrado-cables',
    name: 'Doble brazo con visión 3D: enhebrado de cables',
    parent: 'manipulacion',
    icon: 'workflow',
    short: 'Dos brazos coordinados y visión 3D de alta precisión para pasar cables por orificios de 1 mm.',
    intro:
      'Sistema de doble brazo con visión 3D de alta precisión y control coordinado: localiza en tiempo real el cable y el orificio y lo enhebra con precisión milimétrica, en lugar del trabajo manual más fino.',
    benefits: [
      { title: 'Precisión milimétrica', text: 'La visión 3D sitúa cable y orificio.' },
      { title: 'Dos brazos coordinados', text: 'Hacen el trabajo fino de las dos manos.' },
      { title: 'Flexible', text: 'Distintos cables y diámetros de orificio.' },
    ],
    scenarios: ['Electrónica y mazos de cables de automoción', 'Instrumentos de precisión y equipos médicos', 'Enhebrado de cables y tubos'],
    parts: ['Dos brazos robot', 'Sistema de visión', 'Garras del doble brazo', 'Base de montaje'],
    cobots: ['fr3', 'fr5', 'fr10', 'fr16', 'fr20'],
    cobotsNote: 'FR5 con extremo de alta precisión de 360°.',
    image: scene('doble-brazo-enhebrado-cables'),
    gallery: photos('doble-brazo-enhebrado-cables', [1, 2]),
  },
  {
    slug: 'inspeccion-movil-vision-3d',
    name: 'Robot móvil de inspección con visión 3D',
    parent: null,
    icon: 'scan-eye',
    short: 'Vehículo autónomo con cobot y cámara 3D que recorre la planta y detecta anomalías las 24 horas.',
    intro:
      'Robot móvil que combina la plataforma de algoritmos ALR Lab, visión 3D de alta precisión y navegación autónoma para revisar equipos, detectar defectos y vigilar el entorno en planta y almacén, con datos y alarmas a la vista.',
    benefits: [
      { title: 'Detecta anomalías', text: 'Equipos, desviaciones de material y riesgos.' },
      { title: 'Rutas autónomas', text: 'Planificadas con ALR Lab.' },
      { title: 'Datos y alarmas', text: 'Para gestionar la línea con información.' },
    ],
    scenarios: ['Salas eléctricas', 'Talleres inteligentes y centros logísticos', 'Inspección 24/7'],
    parts: ['Cámara 3D + ALR Lab', 'Brazo robot', 'Caja de control', 'Vehículo de guiado automático (AGV)'],
    cobots: ['fr3wml', 'fr5', 'fr5wml'],
    image: scene('inspeccion-movil-vision-3d'),
    gallery: photos('inspeccion-movil-vision-3d', [1, 2]),
  },
  {
    slug: 'robot-humanoide',
    name: 'Robot humanoide para la industria',
    parent: null,
    icon: 'users',
    short: 'Humanoide con brazos de 7 grados de libertad, percepción y plataforma móvil para inspeccionar, montar y mover material.',
    intro:
      'Integra módulos articulares, brazos humanoides, una unidad de ejecución semihumanoide y una plataforma móvil para automatizar con precisión tareas de fabricación, inspección y mantenimiento.',
    benefits: [
      { title: 'Brazo humanoide de 7 GDL', text: '10 kg de carga instantánea y ±0,5 mm de precisión.' },
      { title: 'Percepción y autonomía', text: 'Reconoce el entorno y planifica su trayectoria.' },
      { title: 'Modular', text: 'Se configura para cada tarea.' },
    ],
    scenarios: ['Talleres inteligentes y salas eléctricas', 'Centros logísticos', 'Inspección, montaje de precisión y manipulación 24 h'],
    parts: ['Módulo de percepción', 'Brazos humanoides', 'Efector final', 'Columna elevadora', 'Plataforma móvil'],
    cobots: [],
    model: 'ART3-R7',
    image: scene('robot-humanoide'),
    gallery: [],
  },
];

export const kitsFor = (appSlug: string) => kits.filter((k) => k.parent === appSlug);
