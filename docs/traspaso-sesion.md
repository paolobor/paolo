# Traspaso de sesión — Web y tienda FAIRINO España

Estado a 2 de octubre de 2026 (tarde). Léelo entero antes de tocar nada.

## Dónde está el trabajo

- Repositorio `paolobor/paolo`, rama **`claude/festive-pascal-qvt6oq`**. `main` solo tiene un README.
  La sesión del 2/10 por la tarde trabajó en `claude/dazzling-brown-fhhro6` y subió lo mismo a las dos ramas.
- Web en Astro 7 + Tailwind 4, estática. `npm install && npm run build`; `npx astro check` debe dar 0 errores.
- Vista previa navegable (privada del usuario): https://claude.ai/artifact/4jto5oMVMn7yimjgeq64PG
  - Se regenera con `npm run build && bash tools/preview/build-preview.sh <carpeta>` y se publica
    `<carpeta>/site-dist/index.html` (que es la tienda) con `root` = `<carpeta>/site-dist` y los archivos de
    `<carpeta>/site-files-final.json`. Antes de publicar desde otra sesión hay que leer el artefacto.
- Despliegue previsto en el repo nuevo `paolobor/fairino-web` (el usuario tiene que crearlo y decir «creado»);
  `.github/workflows/deploy.yml` ya está preparado.

## Hecho en la sesión del 2 de octubre (tarde)

- **Descargas**: `d8j0ntlcm91z4.cloudfront.net`, `d2ol7oe51mr4n9.cloudfront.net` y `fairino.es` ya descargan
  (el 403 de la raíz de CloudFront es de S3, no del proxy). `www.fairino.es` sigue bloqueado: usar `fairino.es`.
- **Robots como son de verdad** (sin IA): `tools/cad/trim.js` añade sobre el modelo oficial, al renderizar,
  - un aro naranja-rojo `#f2512f` en la tapa libre de J1–J5 (del 77,5 % del radio al canto, siguiendo el perfil
    medido de la tapa y envolviendo un poco el lateral);
  - 4 tornillos de acero a 90° sobre cada aro;
  - la brida (`wrist3_link`) en aluminio.

  Detecta las tapas solo, con rayos y la geometría real; está comprobado en los 9 GLB.
  `tools/cad/studio.html?…&debug=1` explica qué tapas elige y `&all=1` pinta todas las candidatas.
  `tools/cad/profile.html` saca el perfil (r, z) de una tapa.
- **Recortes nuevos**: cámara `-20,8,2.75` (tapas de J2/J3 de frente, como en la foto oficial), 1600×2000,
  en `assets-src/renders/<modelo>/<modelo>-recorte-4x5.png`. `node tools/cad/crop-cutouts.mjs` los recorta con
  margen del 3 % a `src/assets/products/<modelo>/<modelo>-provisional-3d.png`. FR5 tiene además
  `fr5-recorte.png`, `fr5-estudio-16x9.png` y `fr5-estudio-4x5.png`, rehechos con los aros.
- **Escaparate**:
  - más grande: escenario `h-[min(60vh,580px)]`, robots al 97 %, escala 0,82–1;
  - más separación entre robots: en móvil los laterales asoman por el borde;
  - menos brillo en el fondo, el contraluz, el suelo, el haz, los halos, el tinte `.rim`, el barrido y las brasas;
  - lo demás, igual.

## Higgsfield: estado

- Saldo: 949 créditos, plan Plus.
- Coste medido con `get_cost`:
  - nano_banana_2: 2 créditos (2k) y 3 (4k);
  - gpt_image_2_5 alta: 2,75 (2k);
  - flux_3_image: 3 (2k).
- Trabajo `efbe8dff` (piloto FR5 antiguo): **descartado**. Se generó con la referencia vieja, robot todo blanco sin
  aros ni brida; la escena es buena.
- Trabajo `268e7452` (FR3 sin fondo): correcto, pero a 386 px, solo vale de referencia.
- **Piloto FR5 hecho** con la referencia nueva con aros (medio `a1f4b956-1506-4d45-957a-abb0b037ee57`, importado
  desde `src/assets/products/fr5/fr5-provisional-3d.png`). El usuario dijo «sigue con la web añadiendo esas fotos».
  - Coste: 8 créditos; quedan 941.
  - Tres escenas válidas, ya en la ficha del FR5 (`src/content/products/fr5.json`, `illustrative: true`, pie
    «Imagen ilustrativa»).
  - Hoja de control: `docs/control-calidad-fotos.md`.
- **Pendiente: aprobación del piloto** antes de hacer el resto de modelos (≈ 6 créditos por modelo, 3 escenas cada
  uno; ≈ 50 créditos para los 8 restantes, más repeticiones). Mismos prompts que el piloto, adaptando la aplicación:
  - FR3: pick & place;
  - FR3WMS, FR3WML y FR5WML: soldadura;
  - FR10 y FR16: carga de máquinas;
  - FR20 y FR30: paletizado.

## Lo que pidió el usuario (referencia)

1. Robots realistas: aro naranja-rojo con 4 tornillos y disco blanco en cada tapa, brida de aluminio.
   Referencia: `assets-src/oficiales/fr3/fr3-lateral-referencia-386px.png`. **Hecho.**
2. Más grandes en el escaparate. **Hecho.**
3. Menos brillo. **Hecho.**
4. Mantener: clic a izquierda/derecha, nombre al pasar el ratón, panel de compatibles, carrito, movimiento,
   iluminación cálida. **Mantenido.**
5. Higgsfield para escenas: piloto FR5 hecho y en la web; **pendiente su aprobación** para el resto.

## Higgsfield (contexto)

- Proyecto ya creado: «Web FAIRINO España» (`a28b5833-8863-439f-88b5-5beb941a071c`).
- Medios importados antes, con la referencia vieja sin aros:
  - render FR5 recorte `0d8a4ac3-…`;
  - FR5 estudio 16:9 `ba4bfb1a-…`;
  - foto oficial FR3 `4f6e822e-8e39-410e-9eb7-87236c8650c0`.

  Para el piloto hay que importar el recorte nuevo con aros.
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

## Herramientas 3D (sin IA)

- `tools/cad/urdf-to-glb.mjs` convierte el URDF/STL oficial (repo `FAIR-INNOVATION/frcobot_ros2`) en
  `public/models/<modelo>.glb`. En cada GLB, cada articulación es un nodo `jN_rot` y **su eje es el Z local**.
- `tools/cad/studio.html` es el estudio Three.js (0.186) y aplica `trim.js`. Parámetros:
  - `model`, `pose`, `cam`, `fov`, `ty`, `alpha`, `platform`;
  - `trim=0` para quitar los aros, `debug=1` y `all=1` para depurar.
- Para renderizar: `python3 -m http.server 4600 --bind 127.0.0.1` en la raíz y `tools/cad/render.cjs`
  (instrucciones en su cabecera).
- Parámetros de los recortes actuales:
  - pose `0.5,-1.95,1.75,-1.35,-1.57,0`, cam `-20,8,2.75`, ty `1.0`, fov `30`;
  - 1600×2000, alpha `1`, platform `0`.
- El FR3C no tiene modelo 3D en el repo oficial; queda el marcador `[FOTO: FR3C]`.

## Escaparate (archivo clave)

`src/components/store/StoreShowroom.astro`:

- **Tamaño**: escenario `h-[min(60vh,580px)]`; robots `height: calc(97% * var(--size))`, `bottom: 3%`.
- **Luz**: `.showroom-glow`, `.backlight`, `.floor`, `.beam`, halos en `.robot-img`, `.rim`; brasas en
  `canvas[data-embers]` (script al final del archivo).
- **Navegación**: zonas `.side[data-side]` a izquierda y derecha.

## Otras restricciones que siguen vigentes

- No copiar nada de inluxrobotics.es (ni textos, ni imágenes, ni logos). No quitar marcas de agua de nadie.
- No inventar cifras, clientes ni testimonios: usar `[DATO: …]`, `[TESTIMONIO REAL]`, `[FOTO: …]`.
- Precios: todos a 0 de momento. No crear productos en Shopify sin confirmación.
- Nada de identificadores de modelo en commits. Mensajes de commit en español.

## Otros pendientes

- Datos de fairino.es: copiar los que faltan. El dominio ya descarga (`fairino.es`; `www.fairino.es` sigue bloqueado).
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
