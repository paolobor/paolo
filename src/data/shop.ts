// Categorías de la tienda: sustituyen a la pestaña única «Accesorios». Cada accesorio indica las suyas en el campo
// "shopCategories" de su ficha; «Soluciones» muestra además las células llave en mano de src/data/solutions.ts.
// Una categoría con "subs" saca una segunda fila de pestañas: el producto lleva en su ficha la clave de la categoría y
// la del apartado (p. ej. ["otras-soluciones", "tracks"]).
export interface ShopCategory {
  key: string;
  label: string;
  // Texto de la tarjeta de consulta cuando la categoría aún no tiene productos publicados.
  empty?: string;
  // Frase que sale encima de los apartados.
  intro?: string;
  subs?: ShopCategory[];
}

export const shopCategories: ShopCategory[] = [
  { key: 'accesorios-fairino', label: 'Accesorios FAIRINO' },
  { key: 'pinzas-electricas', label: 'Pinzas eléctricas' },
  { key: 'pinzas-flexibles', label: 'Pinzas flexibles', empty: 'pinzas flexibles' },
  { key: 'pinzas-vacio', label: 'Pinzas de vacío' },
  { key: 'ventosas-vacio', label: 'Ventosas de vacío', empty: 'ventosas de vacío' },
  { key: 'montaje', label: 'Accesorios de montaje' },
  { key: 'vision', label: 'Cámaras de visión' },
  { key: 'ihm', label: 'IHM' },
  { key: 'lijado', label: 'Lijado' },
  { key: 'soluciones', label: 'Soluciones' },
  {
    key: 'otras-soluciones',
    label: 'Otras soluciones',
    intro: 'Equipos para ampliar la célula de tu cobot FAIRINO: séptimo eje, columnas, transportadores de charnela y mesas modulares que trabajan junto al robot.',
    subs: [
      { key: 'tracks', label: 'Tracks' },
      { key: 'columnas', label: 'Columnas' },
      { key: 'transportadores-charnela', label: 'Transportadores de charnela', empty: 'transportadores de charnela' },
      { key: 'modular', label: 'Modular', empty: 'mesas y soportes modulares' },
    ],
  },
  { key: 'proteccion', label: 'Protección para cobots', empty: 'fundas y protecciones para cobots' },
  { key: 'seguridad', label: 'Seguridad' },
];

// Apartado principal de un producto en la tienda: cobots, controladores o, en los accesorios, su primera categoría de
// las pestañas (y su subapartado, si lo tiene). Con `rank` la rejilla de «Todos» y el visor de fotos van en el mismo
// orden que las pestañas, sin mezclar apartados.
export function shopSection(category: 'cobot' | 'controlador' | 'accesorio', cats: string[]) {
  if (category === 'cobot') return { tab: 'cobot', sub: '', label: 'Cobots', rank: 0 };
  if (category === 'controlador') return { tab: 'controlador', sub: '', label: 'Controladores', rank: 1 };
  const top = cats.map((k) => shopCategories.findIndex((c) => c.key === k)).find((i) => i >= 0) ?? -1;
  const cat = shopCategories[top];
  if (!cat) return { tab: shopCategories[0].key, sub: '', label: 'Accesorios', rank: 2 + shopCategories.length };
  const subI = cat.subs?.findIndex((x) => cats.includes(x.key)) ?? -1;
  const sub = subI >= 0 ? cat.subs![subI] : undefined;
  return { tab: cat.key, sub: sub?.key ?? '', label: sub ? `${cat.label} · ${sub.label}` : cat.label, rank: 2 + top + (subI + 1) / 100 };
}
