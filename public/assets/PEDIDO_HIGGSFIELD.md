# Recursos fotorrealistas (Higgsfield)

Estos recursos **ya están generados** en la cuenta de Higgsfield (biblioteca de
generaciones del 1-10-2026). La web los carga automáticamente desde `assets/`
cuando están declarados en `assets/recursos.json`; mientras no estén, usa el 3D
y las imágenes del catálogo (no hay peticiones fallidas).

Reglas aplicadas: nada de logo, letras ni textos generados con IA (el logo
FDI MODULAR se construye en 3D con código); todo sobre negro puro (#000000).

## Cómo activarlos

1. Permitir en la red del entorno el dominio de descarga de Higgsfield:
   `d8j0ntlcm91z4.cloudfront.net` (o descargar los originales a mano a una carpeta
   con los nombres de la columna "Original").
2. Ejecutar `node tools/import-higgsfield.mjs` (o `node tools/import-higgsfield.mjs <carpeta>`).
   Comprime, crea los pósters y actualiza `public/assets/recursos.json`.
3. `npm run build` y publicar.

## Lista

| Recurso | Uso en la web | Modelo | Formato de salida | Original |
| --- | --- | --- | --- | --- |
| a) Virutas en bucle 16:9 | Detrás de las virutas 3D (escena 1, escritorio) | Nano Banana 2 (fotograma 2K) + Kling 3.0 Pro, 10 s, mismo fotograma inicial y final | `video/virutas-16x9.mp4` + `.webm` (< 4 MB) + póster `.webp`, 1920x1080, 24 fps, sin audio | `virutas-16x9.mp4` |
| a) Virutas en bucle 9:16 | Igual, en móvil vertical | Igual | `video/virutas-9x16.mp4` + `.webm` + póster, 1080x1920 | `virutas-9x16.mp4` |
| b) Nave oscura con estructura | Cabecera del catálogo (transición al catálogo) | Nano Banana 2 (fotograma 2K) + Kling 3.0 Pro, 8 s | `video/nave-estructura.mp4` + `.webm` + póster, 1600x900, ida y vuelta (16 s, bucle sin salto) | `nave-estructura.mp4` |
| c) Foto de estudio por familia (7) | Tarjetas del catálogo | Nano Banana 2, 2K, 4:3, con la imagen del catálogo como referencia | `productos/<familia>.webp`, 1200 px | `fijacion.png`, `union.png`, `montaje.png`, `posicionamiento.png`, `puertas.png`, `plasticos.png`, `aluminio.png` |
| d) Aluminio cepillado sin costuras | Rugosidad y relieve del aluminio 3D | Nano Banana 2, 2048x2048 | `texturas/aluminio-cepillado.webp` (costuras corregidas en el importador) | `aluminio-cepillado.png` |

## Prompts exactos (inglés)

**a) Fotograma de virutas (16:9 y 9:16)**
> Macro product photograph of bright curled aluminium machining chips, small helical swarf spirals and thin shiny aluminium shavings floating weightlessly in a pure black void, background solid #000000 with no gradient. Shallow depth of field: a few chips razor sharp in the middle plane, others softly out of focus as round bokeh in the foreground and background. Crisp specular glints on the polished curled edges, fine machining texture on the chips, cool neutral white studio rim light from the upper left and a soft kicker from the right. Sparse composition with generous empty black space in the center. High-end Apple product page aesthetic, photorealistic, extremely detailed. No text, no letters, no logo, no watermark, no floor, no smoke.

**a) Animación del bucle (Kling 3.0, fotograma inicial = final)**
> Macro shot, the curled aluminium chips and shavings float weightlessly and rotate very slowly in place in a pure black void, gentle drift, crisp specular glints travel across the polished curled edges as they turn, shallow depth of field preserved, completely static locked-off camera, smooth seamless loop returning exactly to the first frame. No text, no logo, pure black background.

**b) Fotograma de la nave**
> Cinematic wide shot inside a very dark empty industrial warehouse at night. In the center stands a modular workbench frame built from silver anodized aluminium T-slot extrusion profiles 40x40 mm with visible slots, joined with cubic corner connectors, on leveling feet, on a dark polished concrete floor. The environment is almost pitch black, deep crushed blacks around the edges fading to pure black #000000. A single narrow beam of cool white light rakes across the aluminium profiles from the left, creating crisp linear highlights along the profile edges and slots, subtle volumetric haze. Low camera at waist height, symmetrical, 35mm anamorphic lens, high contrast, photorealistic, Apple product film look. No people, no robot, no text, no letters, no logo, no signage, no windows.

**b) Animación de la nave (Kling 3.0)**
> Slow cinematic dolly-in toward the aluminium profile workbench frame in the dark warehouse, the camera glides forward steadily at waist height, a narrow beam of cool white light sweeps slowly from left to right across the aluminium profiles making the edges and slots flash with crisp highlights, faint volumetric haze, everything else stays pitch black, smooth and elegant, no camera shake. No people, no text, no logo.

**c) Fotos de producto** (una por familia, con su recorte del catálogo como referencia).
Base común:
> Premium studio product photograph of exactly the [PIEZA] shown in the reference image, keeping its exact shape, proportions and details identical, same arrangement and angle. Real material: [MATERIAL]. Isolated on a pure solid black background #000000, no floor line, no gradient, soft subtle contact reflection only. Lighting: large softbox key light from upper left, thin white rim lights tracing the edges, gentle light sweep across the metal, deep blacks. Apple product page aesthetic, razor sharp, photorealistic. No text, no letters, no logo, no watermark.

| Familia | [PIEZA] | [MATERIAL] |
| --- | --- | --- |
| Fijación | two industrial hammer T-slot nuts (threaded hole, serrated grip edges) | bright zinc-plated steel with fine machining marks |
| Unión | cubic aluminium profile connector block (rounded edges, round through-hole, black ring cap on top) | satin bead-blasted silver anodized aluminium, matte black ring |
| Montaje | two adjustable clamping levers (one threaded stud, one female bushing) | satin chrome die-cast zinc handle, zinc-plated steel stud |
| Posicionamiento | four articulated leveling feet (threaded studs, hex nuts, round swivel bases) | zinc-plated steel, thin black rubber pads |
| Puertas | door hinge for aluminium profiles (two leaves, knuckle, four countersunk holes) | satin silver die-cast aluminium, polished steel pin |
| Plásticos | plastic slot cover strips lying side by side | matte dark grey extruded PVC |
| Aluminio | aluminium T-slot extrusion profile 40x80 slot 10, cut end facing the camera | natural silver anodized aluminium, brushed sides, bright machined cut face |

**d) Textura**
> Seamless tileable brushed aluminium material texture, perfectly flat orthographic top-down scan, very fine straight parallel horizontal brushing lines running edge to edge, uniform neutral silver grey, even flat diffuse lighting with no reflections, no highlights, no gradient, no vignette, no perspective, no scratches clusters, no dents, no text. Physically based albedo map style, ultra detailed microscopic grain.
