import type { ImageMetadata } from 'astro';

// Todas las imágenes de src/assets/images, para optimizarlas con astro:assets a partir de una ruta en los datos.
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/**/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

export function findImage(path: string | null | undefined): ImageMetadata | null {
  if (!path) return null;
  return files[`/src/assets/images/${path.replace(/^\/+/, '')}`]?.default ?? null;
}
