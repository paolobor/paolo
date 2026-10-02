# Traspaso de sesión — Web y tienda FAIRINO España

Estado a 2 de octubre de 2026. Léelo entero antes de tocar nada.

## Dónde está el trabajo

- Repositorio `paolobor/paolo`, rama **`claude/festive-pascal-qvt6oq`**. `main` solo tiene un README.
- Web en Astro 7 + Tailwind 4, estática. `npm install && npm run build`; `npx astro check` debe dar 0 errores.
- Vista previa navegable (privada del usuario): https://claude.ai/artifact/4jto5oMVMn7yimjgeq64PG
  - Se regenera con `npm run build && bash tools/preview/build-preview.sh <carpeta>` y se publica
    `<carpeta>/site-dist/index.html` (que es la tienda) con `root` = `<carpeta>/site-dist` y los archivos de
    `<carpeta>/site-files-final.json`. Antes de publicar desde otra sesión hay que leer el artefacto.
- Despliegue previsto en el repo nuevo `paolobor/fairino-web` (el usuario tiene que crearlo y decir «creado»);
  `.github/workflows/deploy.yml` ya está preparado.

## Lo que pide el usuario ahora (pendiente)

1. **Robots realistas, como son de verdad**: el FAIRINO real tiene en cada tapa de articulación un **aro
   naranja-rojo** con **4 tornillos metálicos** (a 90°) y un **disco blanco** en el centro, y la **brida final
   de aluminio cepillado**. Referencia oficial: `assets-src/oficiales/fr3/fr3-lateral-referencia-386px.png`.
   Color del aro medido en la foto ≈ `#F0502F`–`#FF5A40`.
2. **Más grandes** en el escaparate de la tienda, para que impacten más.
3. **Un poco menos de brillo** en la iluminación del escaparate (contraluz, brasas, halos).
4. Mantener todo lo demás: clic a izquierda/derecha para cambiar de modelo, nombre al pasar el ratón,
   panel de compatibles a la izquierda, carrito, movimiento suave, iluminación cálida.
5. Usar **Higgsfield** para hacerlos más realistas si hace falta (el usuario lo permite).

## Higgsfield

- La conexión MCP funciona. Lo que estaba bloqueado era la **descarga** de resultados:
  `d8j0ntlcm91z4.cloudfront.net` y `d2ol7oe51mr4n9.cloudfront.net` (y `fairino.es`). El usuario los ha
  añadido a la red del entorno; **compruébalo primero** (`curl -sI https://d8j0ntlcm91z4.cloudfront.net/`
  no debe dar 403 en `$HTTPS_PROXY/__agentproxy/status`).
- Proyecto ya creado: «Web FAIRINO España» (`a28b5833-8863-439f-88b5-5beb941a071c`).
- Medios ya importados (desde raw.githubusercontent de esta rama): render FR5 recorte
  `0d8a4ac3-…`, FR5 estudio 16:9 `ba4bfb1a-…`, foto oficial FR3 `4f6e822e-8e39-410e-9eb7-87236c8650c0`.
- Trabajos lanzados que no se pudieron revisar: `efbe8dff-c248-4ac6-b4f1-3334b7064637` (nano_banana_2,
  piloto FR5) y `268e7452-19c0-4316-be5f-d08f234b2563` (quitar fondo de la foto del FR3).
- **Reglas acordadas con el usuario**:
  - el robot tiene que ser el producto real; la IA solo para fondo, luz y escenas;
  - cada imagen generada debe partir de una referencia oficial, nunca solo de texto;
  - hoja de control de calidad;
  - nombres `fairino-<modelo>-principal.webp`, etc.;
  - pie «Imagen ilustrativa» en las escenas;
  - **antes de gastar créditos**: tabla de material y estimación de créditos (`get_cost`), y esperar su OK;
  - **piloto con el FR5** y esperar aprobación antes del resto.
- Formatos: recorte transparente para el carrusel (sombra de contacto y brillo se hacen en CSS) y versión
  obligatoria con **fondo blanco de 2048×2048** para Shopify / Google Shopping.

## Camino sin IA (ya preparado) para los detalles naranjas

- `tools/cad/urdf-to-glb.mjs` convierte el URDF/STL oficial (repo `FAIR-INNOVATION/frcobot_ros2`) en
  `public/models/<modelo>.glb`. En cada GLB, cada articulación es un nodo `jN_rot` y **su eje es el Z local**.
- `tools/cad/studio.html` es el estudio Three.js (0.186) con los parámetros `model`, `pose`, `cam`, `fov`,
  `ty`, `alpha` y `platform`. Para renderizarlo: `python3 -m http.server 4600 --bind 127.0.0.1` y `tools/cad/render.cjs`
  (instrucciones en su cabecera). Parámetros de los recortes actuales: pose `0.5,-1.95,1.75,-1.35,-1.57,0`,
  cam `-35,8,2.75`, ty `1.0`, fov `30`, 1000×1250, alpha `1`, platform `0`.
- Idea para los aros (sin inventar nada):
  1. En el marco de cada `jN_rot` (J1–J5), buscar en las mallas del eslabón padre e hijo la tapa plana del
     extremo del alojamiento: un disco perpendicular a Z y centrado en el eje.
  2. Poner encima un bisel (`LatheGeometry`) naranja de 0,74R a R que envuelva un poco el canto, y 4 tornillos.
  3. Pintar `wrist3_link` como aluminio cepillado.
  4. Verificar contra la foto oficial.
- Los recortes recortados con margen del 3 % van en `src/assets/products/<slug>/<slug>-provisional-3d.png`.
  El FR3C no tiene modelo 3D en el repo oficial; queda el marcador `[FOTO: FR3C]`.

## Escaparate (archivo clave)

`src/components/store/StoreShowroom.astro`:

- **Tamaño**: escenario `h-[min(46vh,430px)]`; robots `height: calc(86% * var(--size))`, `bottom: 3%`.
- **Luz**: `.showroom-glow`, `.backlight`, `.floor`, `.beam`, halos en `.robot-img`, `.rim`; brasas en
  `canvas[data-embers]` (script al final del archivo).
- **Navegación**: zonas `.side[data-side]` a izquierda y derecha.

## Otras restricciones que siguen vigentes

- No copiar nada de inluxrobotics.es (ni textos, ni imágenes, ni logos). No quitar marcas de agua de nadie.
- No inventar cifras, clientes ni testimonios: usar `[DATO: …]`, `[TESTIMONIO REAL]`, `[FOTO: …]`.
- Precios: todos a 0 de momento. No crear productos en Shopify sin confirmación.
- Nada de identificadores de modelo en commits. Mensajes de commit en español.

## Otros pendientes

- Datos de fairino.es: copiar los que faltan cuando el dominio esté abierto.
- Dudas por confirmar con el usuario:
  - ¿IVA incluido?
  - ¿«Safety Box» = «Módulo de seguridad» 129 €?
  - Alcance del FR3WML: 922 o 1000 mm.
  - Nombre exacto del sensor GZCX.
  - Tensión de entrada del AC Mini.
- Páginas de la fase 3:
  - aplicaciones (+8);
  - industrias;
  - llave en mano;
  - descargas;
  - sobre nosotros;
  - blog;
  - reservar cita;
  - contacto;
  - garantía;
  - gracias;
  - legales.
- Fase 4: lista final de marcadores pendientes.
