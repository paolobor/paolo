// Vídeos del canal oficial de FAIRINO en YouTube (@FAIRINOrobot) que salen en la ficha de cada modelo.
// Solo se asigna un vídeo a un modelo cuando su título o su descripción oficial nombra ese modelo; los demás
// vídeos del canal (tutoriales generales, ferias, aplicaciones sin modelo) no se asignan. Cómo se revisa: tools/videos/LEEME.md.
// El póster es la miniatura oficial, guardada en src/assets/images/videos/yt-<id>.jpg (tools/videos/miniaturas.py).
export interface FairinoVideo {
  youtube: string;
  // Título en español, fiel al título y a la descripción del vídeo.
  title: string;
  // Ids de producto (src/content/products). Las versiones en negro muestran los vídeos de su modelo.
  models: string[];
  // Short vertical (9:16).
  short: boolean;
  // Duración en segundos (los Shorts no la publican en el listado del canal).
  duration: number | null;
  // Fecha de publicación (AAAA-MM-DD); null si no se ha podido comprobar (no se enseña).
  date: string | null;
}

export const fairinoVideos: FairinoVideo[] = [
  // FR3C
  { youtube: 'jYYxfiXPExw', title: 'Desempaquetado y puesta en marcha del FR3-C y el FR5-C', models: ['fr3c'], short: false, duration: 240, date: '2026-05-12' },
  // FR5
  { youtube: 'ees0UtTjlfE', title: 'FR5 paletizando en la India', models: ['fr5'], short: true, duration: null, date: '2025-12-23' },
  { youtube: 'Dphdf9U_POw', title: 'FR5 con módulo de visión: identifica y clasifica piezas', models: ['fr5'], short: false, duration: 63, date: '2025-03-16' },
  { youtube: 'rAXqDJh1qcY', title: 'FR5 con cambiador de herramienta en una feria en Corea', models: ['fr5'], short: true, duration: null, date: '2024-11-08' },
  { youtube: 'A2AfbDkQ-3U', title: 'FR5 sobre un carro móvil haciendo picking', models: ['fr5'], short: true, duration: null, date: '2024-11-04' },
  { youtube: 'O7rd6E2vp2Y', title: 'FR5 en la cocina de un restaurante de pollo frito en Seúl', models: ['fr5'], short: false, duration: 86, date: '2024-09-16' },
  { youtube: 'LQgMjVMp_ZI', title: 'Prueba de pick and place con el FR5', models: ['fr5'], short: true, duration: null, date: '2024-09-04' },
  { youtube: 'KccoOXgFNmk', title: '50 FR5 manipulando discos las 24 horas', models: ['fr5'], short: false, duration: 136, date: '2024-08-26' },
  // FR10
  { youtube: 'cVUGRhw_m-M', title: 'FR10 en una aplicación de montaje en Godrej (India)', models: ['fr10'], short: true, duration: null, date: '2026-02-01' },
  { youtube: 'o7W6sXR8MYc', title: 'FR10 en el campo: recolección de fruta sobre una plataforma móvil', models: ['fr10'], short: false, duration: 61, date: '2025-11-04' },
  { youtube: 'GhUHXVERSwQ', title: 'FR10 soldando por láser en una fábrica de fregaderos (Corea)', models: ['fr10'], short: true, duration: null, date: '2024-11-28' },
  { youtube: '_zbyX9ZKDn8', title: 'FR10 con visión 3D de Solomon', models: ['fr10'], short: true, duration: null, date: '2024-11-06' },
  { youtube: 'A8qt7QAMdLA', title: 'FR10 soldando con MIG: caso de cliente', models: ['fr10'], short: false, duration: 47, date: '2024-10-22' },
  // FR20
  { youtube: 'KQhfpUCJUWQ', title: 'Unilever paletiza con el FR20', models: ['fr20'], short: false, duration: 13, date: '2026-04-10' },
  { youtube: 'kUOjh4Ukru8', title: 'FR20 sobre carril paletizando en Tailandia', models: ['fr20'], short: true, duration: null, date: '2025-01-12' },
  { youtube: 'p2EVoFe9k9w', title: 'Dos FR20 en una inyectora de 2800 toneladas', models: ['fr20'], short: true, duration: null, date: '2024-12-24' },
  { youtube: 'NfI4DaphA8Y', title: 'Seis FR20 en una línea de envasado de helados', models: ['fr20'], short: false, duration: 6, date: '2024-08-22' },
  { youtube: 'Isq0c5ckwFA', title: 'FR20 en paletizado y pick and place en Tailandia', models: ['fr20'], short: false, duration: 110, date: '2023-12-05' },
  // FR30
  { youtube: 'vFznCarJe-0', title: 'FR30 paletizando en la industria alimentaria (India)', models: ['fr30'], short: true, duration: null, date: '2025-12-17' },
  // Accesorios
  { youtube: 'Abutmnjbvhs', title: 'Configurar y usar la Smart Tool en un cobot FAIRINO', models: ['smart-tool'], short: false, duration: 217, date: null },
];

// Vídeos del mismo canal que valen para toda la gama FR y salen en la ficha de cada cobot FR, después de los de su
// modelo (o solos, si el modelo no tiene): tutoriales del software (todos los cobots FR llevan la misma controladora y
// el mismo programa) y aplicaciones en clientes en las que FAIRINO no dice qué modelo sale.
export interface FairinoRangeVideo {
  youtube: string;
  title: string;
  kind: 'Tutorial' | 'Aplicación';
  short: boolean;
  duration: number;
}

export const fairinoRangeVideos: FairinoRangeVideo[] = [
  { youtube: '5zJ3x1TooCE', title: 'Soldadura robotizada en Corea del Sur', kind: 'Aplicación', short: false, duration: 28 },
  { youtube: '3XZFIwvE5ZM', title: 'Pulido robotizado en Tailandia', kind: 'Aplicación', short: false, duration: 20 },
  { youtube: 'AKuiPafXEkY', title: 'Paletizado en la República Checa', kind: 'Aplicación', short: false, duration: 95 },
  { youtube: '7bUgkwf2hfU', title: 'Programación gráfica de los cobots FR', kind: 'Tutorial', short: false, duration: 146 },
  { youtube: 'aK7vcWw5v5I', title: 'Configurar el punto de inicio y el programa principal', kind: 'Tutorial', short: false, duration: 118 },
  { youtube: 'nuCT_AgDDn4', title: 'Control de fuerza y arrastre asistido', kind: 'Tutorial', short: false, duration: 312 },
];

export const fairinoChannel = 'https://www.youtube.com/@FAIRINOrobot';
