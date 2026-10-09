import { getImage } from 'astro:assets';
import { getProducts, categoryMeta } from './catalog';
import { url } from './url';
import { hasBox, includedText, POWER } from '../data/caja';

export interface StoreItem {
  id: string;
  name: string;
  category: string;
  price: number | null;
  shipping: number | null;
  versions: { id: string; label: string; delta: number; includes?: string }[];
  // Lo que ya va en el precio (cobots: controladora, sus cables y la seta de emergencia); sale en el carrito y el pedido.
  includes: string | null;
  img: string | null;
  href: string;
  shopifyVariantId: string | null;
}

// Versiones para el carrito. En los cobots se combina la versión (IP54/IP65) con la controladora incluida, AC o DC:
// «estandar~dc» = «Estándar (IP54) · Controladora DC». Se mantienen también las versiones sueltas por si había
// algo en un carrito guardado de antes.
function versionsOf(p: Awaited<ReturnType<typeof getProducts>>[number]) {
  const base = p.data.store.versions.map((v) => ({ id: v.id, label: v.label, delta: v.delta }));
  if (!hasBox(p)) return base;
  const power = POWER.map((w) => ({ id: w.id, label: `Controladora ${w.short}`, includes: includedText(w.short) }));
  const combined = (base.length ? base : [{ id: '', label: '', delta: 0 }]).flatMap((v) =>
    power.map((w) => ({
      id: v.id ? `${v.id}~${w.id}` : w.id,
      label: [v.label, w.label].filter(Boolean).join(' · '),
      delta: v.delta,
      includes: w.includes,
    })),
  );
  return [...combined, ...base.filter((v) => !combined.some((c) => c.id === v.id))];
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
          versions: versionsOf(p),
          includes: hasBox(p) ? includedText() : null,
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
