import type { ImageMetadata } from 'astro';

// Imágenes de src/assets para optimizarlas con astro:assets a partir de una ruta en los datos.
// La ruta es relativa a src/assets/images (p. ej. 'blog/portada.jpg') o a src/assets (p. ej. 'products/fr5/…webp').
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/**/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

export function findImage(path: string | null | undefined): ImageMetadata | null {
  if (!path) return null;
  const clean = path.replace(/^\/+/, '');
  return (files[`/src/assets/images/${clean}`] ?? files[`/src/assets/${clean}`])?.default ?? null;
}

// Las escenas generadas a partir del render oficial llevan «escena» en el nombre y se marcan como ilustrativas.
export function isIllustrative(path: string | null | undefined): boolean {
  return !!path && /fairino-[a-z0-9-]+-escena-/.test(path);
}

// Las escenas se sirven siempre en estos anchos y solo en WebP: así cada escena genera 3 archivos y no decenas.
export const SCENE_WIDTHS = [480, 960, 1600];

// Recortes y fotos de producto con transparencia (…-provisional-3d.png, …-oficial.png): solo WebP (admite
// transparencia) y en estos anchos, para no multiplicar archivos con AVIF y PNG de respaldo.
export const CUTOUT_WIDTHS = [320, 640, 960];
export function isCutout(src: string): boolean {
  return /-(provisional-3d|oficial)\./.test(src);
}
