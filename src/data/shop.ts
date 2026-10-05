// Categorías de la tienda: sustituyen a la pestaña única «Accesorios». Cada accesorio indica las suyas en el campo
// "shopCategories" de su ficha; «Soluciones» muestra además las células llave en mano de src/data/solutions.ts.
export interface ShopCategory {
  key: string;
  label: string;
  // Texto de la tarjeta de consulta cuando la categoría aún no tiene productos publicados.
  empty?: string;
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
  { key: 'proteccion', label: 'Protección para cobots', empty: 'fundas y protecciones para cobots' },
  { key: 'seguridad', label: 'Seguridad' },
];
