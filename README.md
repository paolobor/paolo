# FDI MODULAR — web 3D

Web de una sola página para **FDI MODULAR** (perfilería de aluminio de FDI Quality Import),
hecha con Three.js (0.186, módulos ES), GSAP y postproceso físico (ACES, bloom, profundidad
de campo, oclusión ambiental).

## Recorrido

1. **Inicio:** virutas de aluminio flotando (clic, scroll, teclado o toque para avanzar).
2. **Unión:** la escuadra cúbica se mecaniza, entran los perfiles y tornillos, se enciende el
   filo naranja y se ensambla el logo cromado.
3. **Estructura:** la cámara se aleja y se monta una bancada para cobot de 800 x 800 x 750 mm,
   con los tres textos de la marca.
4. **Catálogo:** la cámara entra por la ranura de una viga y funde a la sección del catálogo,
   que ya funciona con scroll normal.

Botones "Saltar intro" (va directo al catálogo) y "Volver a ver".

## Catálogo

- Siete familias con su página de inicio en el PDF (portadillas):
  fijación (5), unión (20), montaje (53), posicionamiento (71), puertas (86),
  plásticos (107) y perfiles de aluminio (116).
- PDF comprimido en `public/catalogo/FDI-MODULAR_Catalogo-2026.pdf` (10,8 MB, 139 págs.).
  Para regenerarlo desde el original: `python3 tools/compress-pdf.py original.pdf public/catalogo/FDI-MODULAR_Catalogo-2026.pdf 110 60`
  (requiere `pip install pikepdf pillow`).
- Imágenes de producto recortadas del propio catálogo en `src/assets/catalog/`.
- **Email y teléfono de ejemplo:** se cambian en `index.html` (bloque `contact-card`,
  marcado con el comentario "Datos de contacto de ejemplo").

## Diseño 3D (carpeta `design/`)

| Archivo | Contenido |
| --- | --- |
| `FDI-MODULAR_escuadra-cubica_40x40-ranura10.glb` | Escuadra cúbica + 3 perfiles 40x40 ranura 10 + tornillos Allen DIN 7984 M6 + tuercas martillo |
| `FDI-MODULAR_logo-3D.glb` | Logo 3D completo (montaje + rótulo cromado) con la cámara del logo |
| `FDI-MODULAR_bancada-cobot.glb` | Bancada para cobot 800 x 800 x 750 con 4 escuadras cúbicas, escuadras angulares, pies niveladores, placa y cobot |
| `renders/` | Renders de revisión |
| `video/` | Vídeo del inicio renderizado desde la web |

Los `.glb` se abren en el Visor 3D de Windows, Blender o cualquier visor glTF.
Unidades del modelo: 1 unidad = 10 mm, eje Y hacia arriba.
La web carga ese mismo modelo (versión comprimida con meshopt en `src/assets/models/`).

## Desarrollo

```bash
npm install
npm run dev        # servidor local
npm run build      # genera la web publicable en docs/
npm run model      # regenera los .glb (necesita "npm run dev" en el puerto 5173)
npm run glyphs     # regenera los contornos de la tipografía de las letras 3D
```

Parámetros útiles en la URL: `?q=low` / `?q=high` (calidad), `?reduced` (sin movimiento),
`?nogl` (sin WebGL), `?state=logo` (logo final),
`?design=logo|logo-limpio|escuadra|explosion|seccion|bancada` (vistas técnicas del modelo).

## Publicación con GitHub Pages

La web compilada está en `docs/`. En GitHub: **Settings → Pages → Build and deployment →
Source: Deploy from a branch**, rama `claude/fdi-modular-threejs-web-dcmgtz` (o `main`
cuando se fusione), carpeta **`/docs`** → Save. La web queda en
`https://paolobor.github.io/paolo/`.

## Estructura

```
src/model/        modelo 3D (geometría CAD, materiales PBR, composición del logo, bancada, cobot)
src/gl/           renderizador, postproceso, entorno de estudio, rejilla, rótulo
src/scenes/       virutas (escena 1), montaje (escena 2) y bancada (escena 3)
src/ui/           cotas técnicas SVG, textos e interfaz
tools/            exportador del modelo a .glb, compresor del PDF y extractor de glifos
design/           archivos 3D, renders y vídeo para revisión
docs/             web compilada (GitHub Pages)
```
