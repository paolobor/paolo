// Lo que trae la caja de cada cobot FAIRINO (FR3 a FR30) y la alimentación de la controladora, AC o DC.
// La controladora, sus cables y el módulo de seguridad van incluidos en el precio del cobot: el cliente solo elige
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

export type PowerId = (typeof POWER)[number]['id'];

export const BOX_ITEMS = [
  { icon: 'bot', name: 'Brazo robot FAIRINO', note: '6 ejes' },
  { icon: 'cpu', name: 'Controladora', note: 'AC o DC, la que elijas' },
  { icon: 'cable', name: 'Cables de conexión', note: 'Brazo y controladora' },
  { icon: 'octagon-x', name: 'Módulo de seguridad', note: 'Seta de emergencia' },
] as const;

// Cobots de la serie FR (no el humanoide, que aún no se vende).
export const hasBox = (p: Product) => p.data.category === 'cobot' && !p.data.upcoming;

// La controladora que corresponde a cada alimentación según el modelo (compatibleWith): Mini 2 kW o 5 kW.
export const controllerFor = (p: Product, power: PowerId) => p.data.compatibleWith.find((id) => id.startsWith(`${power}-`)) ?? null;

export const powerLabel = (power: PowerId) => `Controladora ${POWER.find((x) => x.id === power)!.short}`;

// Controladoras y módulo de seguridad sueltos: ya vienen con el cobot, en la tienda son recambio o unidad adicional.
export const SPARE_IDS = ['ac-mini-controller-2kw', 'dc-mini-controller-2kw', 'ac-controller-5kw', 'dc-controller-5kw', 'modulo-seguridad'];
export const spareNote = (id: string) =>
  id === 'modulo-seguridad'
    ? 'Ya viene incluido con cada cobot FAIRINO. Aquí, como recambio o unidad adicional.'
    : 'Ya viene incluida con cada cobot FAIRINO. Aquí, como recambio o unidad adicional.';
