# Imágenes

Guarda aquí las fotos en JPG o PNG a buena resolución (mínimo 1600 px de ancho). Astro genera
automáticamente versiones AVIF y WebP en varios tamaños con carga diferida.

En los archivos de datos (`src/data/*.ts`, frontmatter del blog) se indica la ruta relativa a esta
carpeta, por ejemplo `aplicaciones/soldadura.jpg`. Mientras el valor sea `null` o el archivo no
exista, la web muestra un placeholder visible.

Las fotos de producto van en `src/assets/products/<slug>/` y se enlazan desde el JSON del
producto (`images[].src`, ruta relativa al JSON: `../../assets/products/fr5/fr5-frontal.png`).
