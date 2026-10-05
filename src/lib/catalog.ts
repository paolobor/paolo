import { getCollection, type CollectionEntry } from 'astro:content';
import { applications } from '../data/applications';

export type Product = CollectionEntry<'products'>;

export async function getProducts(category?: Product['data']['category']) {
  const rank = { cobot: 0, controlador: 1, accesorio: 2 } as const;
  const all = (await getCollection('products')).sort(
    (a, b) => rank[a.data.category] - rank[b.data.category] || a.data.order - b.data.order,
  );
  return category ? all.filter((p) => p.data.category === category) : all;
}

export const categoryMeta = {
  cobot: { label: 'Cobots', singular: 'Cobot', href: 'cobots/' },
  controlador: { label: 'Controladores', singular: 'Controlador', href: 'controladores/' },
  accesorio: { label: 'Accesorios', singular: 'Accesorio', href: 'accesorios/' },
} as const;

export const accessoryGroups: Record<string, string> = {
  vision: 'Visión',
  garra: 'Garras',
  fuerza: 'Sensores de fuerza',
  control: 'Control y seguridad',
  montaje: 'Montaje',
};

export const applicationOptions = applications.map((a) => ({ value: a.slug, label: a.name }));

export function payloadBucket(kg: number | null): string[] {
  if (kg == null) return [];
  if (kg <= 5) return ['hasta-5'];
  if (kg <= 16) return ['6-16'];
  return ['20-30'];
}

export function reachBucket(mm: number | null): string[] {
  if (mm == null) return [];
  if (mm < 800) return ['hasta-800'];
  if (mm <= 1500) return ['800-1500'];
  return ['mas-1500'];
}

// Texto alternativo de una escena del catálogo a partir de su ruta (p. ej. 'products/fr3/fairino-fr3-escena-dosificacion.webp').
export async function sceneAlt(path: string | null | undefined): Promise<string> {
  if (!path) return '';
  const name = path.split('/').pop()!.replace(/\.[a-z0-9]+$/i, '');
  for (const p of await getCollection('products'))
    for (const img of p.data.images) if (img.src.src.includes(`${name}.`)) return img.alt;
  return '';
}
