import { defineConfig } from 'vite';

// Salida en /docs para publicar con GitHub Pages ("Deploy from a branch" → /docs)
export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1200,
  },
  server: { host: true },
});
