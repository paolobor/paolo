// Paso 4 del configurador (components/home/Configurator.astro): salen TODOS los accesorios del catálogo, agrupados por
// familia. Todos valen para cualquier cobot FAIRINO de la gama FR (brida ISO 9409-1 y controladoras comunes); si un
// accesorio indica "compatibleWith" en su ficha, solo se activa con esos cobots.
// Lo que va en la muñeca resta de la carga útil del cobot: con su peso de ficha («Peso»), el configurador dice cuánta
// carga queda para la pieza y bloquea lo que supere la carga del cobot elegido.

export interface AccessoryFamily {
  // Igual que el "group" de la ficha del producto.
  id: string;
  label: string;
  // Nombre corto para el resumen («Garra: …»).
  short: string;
  icon: string;
  // Pieza del esquema de la célula que se enciende (data-node del SVG).
  slot: string;
}

export const accessoryFamilies: AccessoryFamily[] = [
  { id: 'garra', label: 'Garras y pinzas', short: 'Garra', icon: 'hand', slot: 'gripper' },
  { id: 'vision', label: 'Visión', short: 'Visión', icon: 'scan-eye', slot: 'camara' },
  { id: 'fuerza', label: 'Fuerza y lijado', short: 'Fuerza', icon: 'sliders-horizontal', slot: 'fuerza' },
  { id: 'control', label: 'Control y seguridad', short: 'Control', icon: 'shield-check', slot: 'control' },
  { id: 'montaje', label: 'Montaje', short: 'Montaje', icon: 'wrench', slot: 'montaje' },
];

// Pieza del esquema cuando no es la de su familia (los de FAIRINO la llevan en "configurator.slot" de su ficha).
export const slotOverrides: Record<string, string> = {
  'kit-escaner-seguridad-idec': 'safety',
  'kit-hmi-delta': 'pendant',
};

// Lo que NO va en la muñeca aunque sea de una familia que sí (garras, visión, fuerza): cajas de control, aspiradores…
// Y lo que SÍ va en la muñeca siendo de otra familia (enseñanza manual, cambiadores y adaptadores de brida).
export const offWrist = ['controlbox-softgripping', 'aspirador-lijado-mirka'];
export const onWristExtra = ['smart-tool', 'cambiador-rapido', 'adaptador-doble-herramienta', 'adaptador-antorcha'];
export const wristFamilies = ['garra', 'vision', 'fuerza'];

// Lo que necesita otro accesorio para funcionar (se avisa al marcarlo).
export const needs: Record<string, string> = {
  'softgripper-parallel-finger': 'controlbox-softgripping',
  'softgripper-centric-finger': 'controlbox-softgripping',
  'softactuator-centric-finger': 'controlbox-softgripping',
  'adaptador-pinza-vacio': 'pinza-vacio-electrica',
};

// Peso en kg de la spec «Peso» de la ficha, solo si es un número limpio (en g o kg). «≤ 1», «aprox. …» o un valor
// pendiente dan null: el configurador lo cuenta como «sin peso indicado».
export function specWeightKg(specs: { label: string; value: string | number | null; unit?: string }[]): number | null {
  const s = specs.find((x) => x.label === 'Peso');
  if (!s || s.value == null) return null;
  const raw = typeof s.value === 'number' ? s.value : /^\d+(,\d+)?$/.test(s.value.trim()) ? Number(s.value.replace(',', '.')) : NaN;
  if (!Number.isFinite(raw)) return null;
  if (s.unit === 'g') return raw / 1000;
  if (s.unit === 'kg') return raw;
  return null;
}

type Entry = { id: string; data: { category: string; upcoming?: boolean; group?: string; configurator?: { slot: string } } };

// Hueco del configurador de cualquier producto: el de su ficha o el de su familia. null = no entra en el configurador
// (lo que está «Próximamente», como el ART7 R7).
export function configSlot(p: Entry): string | null {
  if (p.data.configurator) return p.data.configurator.slot;
  if (p.data.category !== 'accesorio' || p.data.upcoming) return null;
  return slotOverrides[p.id] ?? accessoryFamilies.find((f) => f.id === p.data.group)?.slot ?? 'accesorio';
}

export const isOnWrist = (p: Entry) =>
  onWristExtra.includes(p.id) || (wristFamilies.includes(p.data.group ?? '') && !offWrist.includes(p.id));

// 0,097 kg → «97 g»; 1,5 → «1,5 kg».
export const formatWeight = (kg: number) =>
  kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg.toLocaleString('es-ES', { maximumFractionDigits: 3 })} kg`;
