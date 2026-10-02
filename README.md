# FAIRINO España · web

Nueva web de [FAIRINO España](https://fairino.es), distribuidor oficial de cobots FAIRINO en España.
Sitio estático con **Astro 7 + Tailwind CSS 4**, pensado para GitHub Pages.

## Estado

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 | Mapa del sitio y dirección visual ([docs/propuesta-fase-1.md](docs/propuesta-fase-1.md)) | Aprobada |
| 2 | Home completa con configurador de célula | En revisión |
| 3 | Listados, fichas de producto y resto de páginas | Pendiente |
| 4 | Lista de placeholders para rellenar | Pendiente |

## Uso

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # genera dist/
npm run check     # comprobación de tipos
```

Para publicar en una subruta (p. ej. GitHub Pages de un repositorio): `SITE=https://usuario.github.io BASE=/repo/ npm run build`.

## Dónde se cambia cada cosa

| Qué | Archivo |
| --- | --- |
| Contacto, WhatsApp, redes, formularios, mostrar precios | `src/data/site.ts` |
| Textos de la home, vídeo del hero, contadores, testimonio | `src/data/home.ts` |
| Aplicaciones, características, soluciones llave en mano | `src/data/applications.ts`, `features.ts`, `solutions.ts` |
| Catálogo: un JSON por producto (specs, imágenes, descargas, precio) | `src/content/products/*.json` |
| Blog | `src/content/blog/*.md` |
| Colores y tipografías | `src/styles/global.css` (bloque `@theme`) |

- Un valor `null` en los datos se muestra en la web como placeholder visible (`[DATO: …]`, `[FOTO: …]`).
- **Precios del configurador:** poner `showPrices: true` en `site.ts` y rellenar `configurator.price` en cada producto.
- **Formularios:** crear una clave en [Web3Forms](https://web3forms.com) para po@fairino.es y pegarla en `site.forms.accessKey`. Hasta entonces, los formularios ofrecen enviar por correo o WhatsApp.
- **Datos de producto:** salen de fairino.es y de la web del fabricante (campo `source` de cada JSON) y están marcados `verified: false` hasta revisarlos contra la ficha oficial.
