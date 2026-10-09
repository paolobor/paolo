// Lo que trae la caja de cada cobot FAIRINO (FR3 a FR30) y la alimentación de la controladora, AC o DC.
// La controladora, sus cables y la seta de emergencia (módulo de seguridad) van incluidos en el precio del cobot: el cliente solo elige
// si la quiere en alterna o en continua. Mismo precio en las dos.
import type { Product } from '../lib/catalog';

export const POWER = [
  {
    id: 'ac',
    short: 'AC',
    name: 'Corriente alterna',
    icon: 'plug-zap',
    text: 'Se enchufa a la red eléctrica. Para puestos fijos en planta.',
  },
  {
    id: 'dc',
    short: 'DC',
    name: 'Corriente continua',
    icon: 'battery-charging',
    text: 'Entrada de 30–60 V DC. Para robots móviles, AGV y equipos con batería.',
  },
] as const;

export const BOX_ITEMS = [
  { icon: 'bot', name: 'Brazo robot FAIRINO', note: '6 ejes', inc: 'Incluido' },
  { icon: 'cpu', name: 'Controladora', note: 'AC o DC, la que elijas', inc: 'Incluida' },
  { icon: 'cable', name: 'Cables de la controladora', note: 'Para conectarla al brazo', inc: 'Incluidos' },
  { icon: 'octagon-x', name: 'Seta de emergencia', note: 'Módulo de seguridad', inc: 'Incluida' },
] as const;

// Frase de junto al precio, del carrito y del pedido. Sin `power`, «AC o DC».
export const includedText = (power?: string) => `El precio incluye la controladora ${power ?? 'AC o DC'}, sus cables y la seta de emergencia`;

// Cobots de la serie FR (no el humanoide, que aún no se vende).
export const hasBox = (p: Product) => p.data.category === 'cobot' && !p.data.upcoming;

// Controladoras y módulo de seguridad sueltos: ya vienen con el cobot, en la tienda son recambio o unidad adicional.
export const SPARE_IDS = ['ac-mini-controller-2kw', 'dc-mini-controller-2kw', 'ac-controller-5kw', 'dc-controller-5kw', 'modulo-seguridad'];
export const spareNote = (id: string) =>
  id === 'modulo-seguridad'
    ? 'Ya viene incluido con cada cobot FAIRINO. Aquí, como recambio o unidad adicional.'
    : 'Ya viene incluida con cada cobot FAIRINO. Aquí, como recambio o unidad adicional.';
