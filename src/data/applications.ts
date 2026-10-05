// Las 8 aplicaciones. Cada una tiene su página /aplicaciones/<slug>/ generada con una única plantilla.
// Los cobots y accesorios recomendados salen del catálogo (campo "applications" de cada producto).
export interface Application {
  slug: string;
  name: string;
  short: string;
  icon: string;
  // Ruta relativa a src/assets (p. ej. 'products/fr3/…webp') o a src/assets/images; null → placeholder visible.
  image: string | null;
  // Encuadre de la imagen cuando se recorta (object-position).
  imagePosition?: string;
  imageHint: string;
  intro: string;
  tasks: string[];
  benefits: { title: string; text: string }[];
  // Cifras que publica FAIRINO para esta aplicación (fairino.es/aplicaciones). null si no publica ninguna.
  claims: string[] | null;
  // Más escenas del catálogo para la galería de la página.
  gallery: string[];
}

const scene = (model: string, name: string) => `products/${model}/fairino-${model}-escena-${name}.webp`;

export const applications: Application[] = [
  {
    slug: 'soldadura',
    name: 'Soldadura',
    short: 'Cordones repetibles y estables, programados por arrastre en lugar de líneas de código.',
    icon: 'zap',
    // Foto principal: el FR5 negro de FAIRINO España con su equipo de soldadura (escena a partir de su foto real).
    image: scene('fr5-negro', 'soldadura'),
    imagePosition: '30% 50%',
    imageHint: 'cobot FAIRINO soldando en mesa de trabajo',
    intro:
      'Con la antorcha montada en la brida, el cobot repite el mismo cordón con la misma velocidad y el mismo ángulo en cada pieza. Se programa llevando el brazo con la mano por la trayectoria, así que un soldador sin experiencia en robótica lo pone a producir en poco tiempo y la formación sale más barata.',
    tasks: ['Soldadura MIG/MAG de chapa y perfil', 'Soldadura TIG de tubo y piezas finas', 'Cordones largos en bastidores y estructuras', 'Series cortas con cambios frecuentes de pieza'],
    benefits: [
      { title: 'Programación por arrastre', text: 'Se marcan los puntos del cordón moviendo el brazo con la mano, sin escribir código.' },
      { title: 'Simulación offline', text: 'Las trayectorias se preparan y se revisan en el ordenador antes de llevarlas a la célula.' },
      { title: 'Calidad constante', text: 'Mismo cordón en la primera y en la última pieza del turno.' },
      { title: 'Versiones para soldadura', text: 'FR3WMS, FR3WML y FR5WML: brazos pensados para soldar, con más alcance en las versiones WML.' },
    ],
    claims: [
      'Hasta un 30 % más de eficiencia con la soldadura sin programación.',
      'Entre un 10 y un 20 % menos de coste de producción gracias a la enseñanza por arrastre.',
      'Varios paquetes de software de soldadura para empezar rápido.',
    ],
    gallery: [
      scene('fr5-negro', 'estacion-soldadura'),
      scene('fr3wml', 'soldadura'),
      scene('fr3wms', 'soldadura'),
      scene('fr3wml', 'soldadura-tuberia'),
      scene('fr5wml', 'soldadura'),
      scene('fr3wms', 'soldadura-movil'),
    ],
  },
  {
    slug: 'paletizado',
    name: 'Paletizado',
    short: 'Final de línea automatizado: cajas apiladas con el patrón exacto, turno tras turno.',
    icon: 'layers',
    image: scene('fr20', 'paletizado'),
    imagePosition: '48% 50%',
    imageHint: 'cobot paletizando cajas al final de línea',
    intro:
      'El paletizado es un trabajo repetitivo y pesado que un cobot hace sin descanso. Coge las cajas o sacos de la cinta y los apila en el palé con el mosaico que definas, y permite alargar los turnos sin cargar la espalda de nadie.',
    tasks: ['Paletizado de cajas al final de línea', 'Paletizado de sacos', 'Despaletizado para alimentar la línea', 'Varios palés y mosaicos en la misma célula'],
    benefits: [
      { title: 'Cambio de formato rápido', text: 'Un mosaico nuevo se prepara desde el software de paletizado, sin reprogramar la célula.' },
      { title: 'Cabe en poco espacio', text: 'Un cobot de 20 o 30 kg ocupa el sitio de un puesto manual y no necesita un vallado grande.' },
      { title: 'Ergonomía', text: 'Nadie levanta cajas ni sacos durante todo el turno.' },
      { title: 'Turnos largos', text: 'Funcionamiento continuo con el mismo ritmo de principio a fin.' },
    ],
    claims: [
      'Cambio de programa en unos 10 minutos.',
      'Varios paquetes de paletizado para cada necesidad.',
      'Más de un 30 % de productividad en funcionamiento continuo 24/7.',
    ],
    gallery: [scene('fr20', 'paletizado-doble'), scene('fr30', 'paletizado')],
  },
  {
    slug: 'pick-and-place',
    name: 'Pick & place',
    short: 'Coger, orientar y colocar piezas a ritmo constante, con o sin visión artificial.',
    icon: 'move',
    image: scene('fr3', 'pick-and-place'),
    imagePosition: '40% 50%',
    imageHint: 'cobot con garra moviendo piezas entre bandejas',
    intro:
      'Coger una pieza, orientarla y dejarla en su sitio es la tarea más habitual de un cobot. Trabaja junto a las personas en la misma línea y cubre los puestos que cuesta más cubrir. Con una cámara 3D puede coger piezas que no llegan siempre en la misma posición.',
    tasks: ['Carga y descarga de bandejas', 'Montaje de componentes', 'Alimentación de líneas de ensamblaje', 'Clasificación con visión artificial'],
    benefits: [
      { title: 'Colaboración', text: 'Trabaja al lado del operario, con detección de colisiones.' },
      { title: 'Cambios de producto', text: 'Una pieza nueva se enseña en minutos desde la interfaz web o llevando el brazo con la mano.' },
      { title: 'Visión 3D', text: 'Con la cámara Orbbec Gemini 2 localiza piezas sueltas o mal orientadas.' },
      { title: 'Ritmo constante', text: 'El mismo ciclo durante todo el turno, sin pausas.' },
    ],
    claims: ['Más de un 30 % de productividad en funcionamiento continuo 24/7.', 'Un 30 % menos de tiempo en los cambios de producto.'],
    gallery: [scene('fr5', 'pick-and-place')],
  },
  {
    slug: 'carga-de-maquinas',
    name: 'Carga de máquinas',
    short: 'Alimenta tornos, centros de mecanizado o inyectoras y libera al operario para tareas de más valor.',
    icon: 'factory',
    image: scene('fr16', 'carga-de-maquinas'),
    imagePosition: '30% 50%',
    imageHint: 'cobot cargando un centro de mecanizado CNC',
    intro:
      'Un operario que solo abre la puerta, cambia la pieza y pulsa marcha pierde la mayor parte del turno esperando. El cobot se encarga de cargar y descargar la máquina y la persona pasa a controlar varias máquinas, medir piezas o preparar la siguiente serie.',
    tasks: ['Carga y descarga de tornos y centros de mecanizado', 'Alimentación de inyectoras y prensas', 'Cambio de pieza con garra doble', 'Medición y soplado entre operaciones'],
    benefits: [
      { title: 'Más horas de máquina', text: 'La máquina sigue trabajando en pausas, cambios de turno y horas sin personal.' },
      { title: 'Se mueve de una máquina a otra', text: 'Sobre un soporte móvil, el mismo cobot atiende varias máquinas.' },
      { title: 'Comunicación con la máquina', text: 'E/S digitales y Modbus para abrir puertas, cerrar platos y dar marcha.' },
      { title: 'Cargas de 10 a 16 kg', text: 'FR10 y FR16 cubren desde piezas pequeñas hasta ejes y bloques pesados.' },
    ],
    claims: null,
    gallery: [scene('fr10', 'carga-de-maquinas')],
  },
  {
    slug: 'manipulacion',
    name: 'Manipulación',
    short: 'Traslado, ensamblaje y atornillado de componentes con precisión y sin esfuerzo para el equipo.',
    icon: 'hand',
    image: scene('fr10', 'manipulacion'),
    imagePosition: '55% 50%',
    imageHint: 'cobot ensamblando componentes en un puesto de trabajo',
    intro:
      'Mover piezas entre puestos, sujetarlas mientras alguien trabaja sobre ellas o atornillarlas son tareas que cansan y provocan lesiones. Un cobot las asume con la carga y el alcance que pida cada pieza, desde componentes ligeros hasta piezas de fundición.',
    tasks: ['Traslado de piezas entre puestos y cintas', 'Ensamblaje y atornillado', 'Sujeción de piezas para el operario', 'Manipulación de piezas pesadas o largas'],
    benefits: [
      { title: 'De 3 a 30 kg', text: 'Toda la gama FAIRINO comparte software, así que se elige el modelo por carga y alcance.' },
      { title: 'Sensor de fuerza', text: 'Con un sensor de fuerza y par en la muñeca ensambla piezas con ajuste sin forzarlas.' },
      { title: 'Ergonomía', text: 'Menos movimientos repetitivos y menos peso para el equipo.' },
      { title: 'Precisión', text: 'Repetibilidad de ±0,02 a ±0,1 mm según el modelo.' },
    ],
    claims: null,
    gallery: [scene('fr16', 'manipulacion'), scene('fr5wml', 'manipulacion'), scene('fr30', 'manipulacion')],
  },
  {
    slug: 'lijado-y-pulido',
    name: 'Lijado y pulido',
    short: 'Acabados uniformes con control de fuerza, sin polvo ni vibraciones para las personas.',
    icon: 'refresh-cw',
    image: null,
    imageHint: 'cobot con lijadora y sensor de fuerza sobre una pieza',
    intro:
      'El lijado y el pulido exigen apretar siempre igual sobre la pieza. Con un sensor de fuerza en la muñeca, el cobot mantiene la presión constante y sigue la forma de la superficie, mientras las personas se alejan del polvo y de las vibraciones.',
    tasks: ['Lijado de piezas de madera, composite o metal', 'Pulido de superficies', 'Desbarbado de piezas mecanizadas o fundidas', 'Rectificado de cordones de soldadura'],
    benefits: [
      { title: 'Fuerza constante', text: 'El sensor de fuerza y par mantiene la misma presión en toda la pasada.' },
      { title: 'Acabado uniforme', text: 'Misma rugosidad de la primera a la última pieza.' },
      { title: 'Salud laboral', text: 'Menos exposición al polvo, al ruido y a las vibraciones.' },
      { title: 'Programación sencilla', text: 'Las pasadas se enseñan llevando el brazo por la pieza.' },
    ],
    claims: null,
    gallery: [],
  },
  {
    slug: 'dosificacion-y-encolado',
    name: 'Dosificación y encolado',
    short: 'Cordones de adhesivo o sellante con caudal y trayectoria constantes en cada pieza.',
    icon: 'workflow',
    image: scene('fr3', 'dosificacion'),
    imagePosition: '60% 50%',
    imageHint: 'cobot aplicando un cordón de adhesivo',
    intro:
      'Un cordón de adhesivo o de sellante bien aplicado depende de dos cosas: velocidad y distancia constantes. El cobot recorre la pieza siempre igual y el dosificador aporta el caudal justo, sin cortes ni excesos.',
    tasks: ['Encolado de carcasas y tapas', 'Sellado de juntas', 'Aplicación de adhesivo en electrónica', 'Dosificación de grasa o lubricante'],
    benefits: [
      { title: 'Cordón uniforme', text: 'Velocidad y altura constantes sobre la pieza.' },
      { title: 'Menos material', text: 'Sin excesos ni repasos manuales.' },
      { title: 'Trayectorias complejas', text: 'Seis ejes para seguir contornos en 3D.' },
      { title: 'Integración', text: 'Las salidas digitales del cobot activan y cortan el dosificador en el punto exacto.' },
    ],
    claims: null,
    gallery: [],
  },
  {
    slug: 'pintura',
    name: 'Pintura',
    short: 'Capas homogéneas y menos consumo de pintura, sin exponer a nadie a los disolventes.',
    icon: 'sliders-horizontal',
    image: null,
    imageHint: 'cobot pintando una pieza con pistola',
    intro:
      'Pintar a mano una serie de piezas igual de bien es difícil y expone a la persona a los disolventes. Con la pistola en la brida, el cobot repite la misma distancia, el mismo solape y la misma velocidad en cada pasada.',
    tasks: ['Pintura de piezas en serie', 'Imprimación por pulverización', 'Barnizado', 'Aplicación de recubrimientos'],
    benefits: [
      { title: 'Capa homogénea', text: 'Distancia, solape y velocidad constantes en cada pasada.' },
      { title: 'Menos consumo', text: 'Menos pintura desperdiciada y menos repasos.' },
      { title: 'Salud laboral', text: 'Las personas se quedan fuera de la zona de pulverización.' },
      { title: 'Programación por arrastre', text: 'Las pasadas se enseñan llevando la pistola con la mano.' },
    ],
    claims: null,
    gallery: [],
  },
];
