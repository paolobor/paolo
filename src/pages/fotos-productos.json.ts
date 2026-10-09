// Fotos de cada producto para el visor (src/components/ProductLightbox.astro). Son las mismas imágenes y tamaños que la
// galería de la ficha (WebP, mismos anchos), así que no se genera ningún archivo nuevo. El navegador lo descarga la
// primera vez que alguien abre el visor.
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { getProducts } from '../lib/catalog';
import { formatEUR } from '../lib/store';
import { site } from '../data/site';
import { shopSection } from '../data/shop';
import { hasBox } from '../data/caja';
import { SCENE_WIDTHS, CUTOUT_WIDTHS } from '../lib/images';
import { url } from '../lib/url';

export const GET: APIRoute = async () => {
  const vat = site.store.vatIncluded === true ? 'IVA incluido' : site.store.vatIncluded === false ? '+ IVA' : '';
  const out: Record<string, unknown> = {};
  for (const p of await getProducts()) {
    const d = p.data;
    if (!d.images.length) continue;
    const photos = await Promise.all(
      d.images.map(async (img) => {
        const r = await getImage({ src: img.src, widths: img.illustrative ? SCENE_WIDTHS : CUTOUT_WIDTHS, format: 'webp' });
        return { src: r.src, srcset: r.srcSet.attribute, alt: img.alt, ill: Boolean(img.illustrative) };
      }),
    );
    // Apartado de la tienda al que pertenece («Pinzas eléctricas», «Otras soluciones · Tracks»…) y su orden.
    const section = shopSection(d.category, d.shopCategories);
    out[p.id] = {
      name: d.name,
      kind: section.label,
      rank: section.rank,
      href: url(`productos/${p.id}/`),
      price: d.upcoming ? 'Próximamente' : d.store.price != null ? `${formatEUR(d.store.price)}${vat ? ` ${vat}` : ''}` : 'Consultar',
      box: hasBox(p),
      photos,
    };
  }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
