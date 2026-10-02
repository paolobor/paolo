import { getImage } from 'astro:assets';
import { getProducts, categoryMeta } from './catalog';
import { url } from './url';

export interface StoreItem {
  id: string;
  name: string;
  category: string;
  price: number | null;
  shipping: number | null;
  versions: { id: string; label: string; delta: number }[];
  img: string | null;
  href: string;
  shopifyVariantId: string | null;
}

// Datos mínimos que necesita el carrito en el navegador.
export async function getStoreData(): Promise<Record<string, StoreItem>> {
  const products = await getProducts();
  const entries = await Promise.all(
    products.map(async (p) => {
      const src = p.data.images[0]?.src;
      const img = src ? (await getImage({ src, width: 160, format: 'webp' })).src : null;
      return [
        p.id,
        {
          id: p.id,
          name: p.data.name,
          category: categoryMeta[p.data.category].singular,
          price: p.data.store.price,
          shipping: p.data.store.shipping,
          versions: p.data.store.versions.map((v) => ({ id: v.id, label: v.label, delta: v.delta })),
          img,
          href: url(`productos/${p.id}/`),
          shopifyVariantId: p.data.store.shopifyVariantId,
        },
      ] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export const formatEUR = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
