# FDI MODULAR — web 3D

Web de una sola página para **FDI MODULAR** (perfilería de aluminio de FDI Quality Import),
hecha con Three.js (0.186, módulos ES), GSAP y postproceso físico (ACES, bloom, profundidad
de campo, oclusión ambiental).

## Estado

- **Fase 1 (lista para revisar):** escena 1 (virutas de aluminio) y escena 2 (montaje de la
  escuadra cúbica y logo cromado).
- **Fase 2 (pendiente de visto bueno):** estructura para cobot y catálogo.

## Diseño 3D (carpeta `design/`)

| Archivo | Contenido |
| --- | --- |
| `FDI-MODULAR_escuadra-cubica_40x40-ranura10.glb` | Escuadra cúbica + 3 perfiles 40x40 ranura 10 + tornillos Allen DIN 7984 M6 + tuercas martillo |
| `FDI-MODULAR_logo-3D.glb` | Logo 3D completo (montaje + rótulo cromado) con la cámara del logo |
| `renders/` | Renders de revisión: logo, escuadra, vista explosionada y sección del perfil |

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
`?nogl` (imagen fija), `?state=logo` (estado final), `?design=logo|escuadra|explosion|seccion`
(vistas técnicas del modelo).

## Publicación con GitHub Pages

La web compilada está en `docs/`. En GitHub: **Settings → Pages → Build and deployment →
Source: Deploy from a branch**, rama `claude/fdi-modular-threejs-web-dcmgtz` (o `main`
cuando se fusione), carpeta **`/docs`** → Save. La web queda en
`https://paolobor.github.io/paolo/`.

## Estructura

```
src/model/        modelo 3D (geometría CAD, materiales PBR, composición del logo)
src/gl/           renderizador, postproceso, entorno de estudio, rejilla, rótulo
src/scenes/       virutas (escena 1) y montaje (escena 2)
src/ui/           cotas técnicas SVG e interfaz
tools/            exportador del modelo a .glb y extractor de glifos
design/           archivos 3D y renders para revisión
docs/             web compilada (GitHub Pages)
```
