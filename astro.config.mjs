// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// SITE y BASE permiten publicar en el dominio final (https://fairino.es, base "/"; fairinocobot.com lleva una copia
// exacta con el canonical apuntando aquí) o en una URL de pruebas de GitHub Pages (SITE=https://usuario.github.io BASE=/repo).
const site = process.env.SITE ?? 'https://fairino.es';
const base = process.env.BASE ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es-ES', en: 'en' } },
      filter: (page) => !page.includes('/gracias/'),
    }),
  ],
  image: { responsiveStyles: true },
  vite: { plugins: [tailwindcss()] },
});
