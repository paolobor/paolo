# EDUCAFAIRINO 2026–2027 · vídeo

Anuncio de ~56 s (1920×1080, 30 fps) de la llegada de los cobots FAIRINO a institutos y
universidades, con el mismo lenguaje visual que el vídeo de la red de colaboradores:
mapa nocturno 3D de España, almacén oscuro con luces naranjas, tipografía Anton con glitch,
barridos con desenfoque de movimiento y cierre en blanco.

Todo se genera por código (Three.js en Chromium sin GPU + ffmpeg). No hay material de terceros
salvo los datos cartográficos públicos y las imágenes del aula.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `src/main.js` | Montaje: línea de tiempo a 129 BPM, planos, cámaras, textos y transiciones |
| `src/map.js` | Mapa 3D: relieve, luces de ciudades, fronteras, haces de los 10 centros |
| `src/warehouse.js`, `src/cobot.js`, `src/motion.js` | Almacén, cobots FR3/FR5 y pick & place (poses por IK) |
| `src/imageshot.js` | Planos 2.5D de las fotos del aula (parallax, gradación, destellos) y fondos planos |
| `src/overlay.js` | Titulares con glitch, rótulos, tarjetas del mapa, fichas técnicas y cierre |
| `src/post.js` | Motion blur por submuestras, barridos, bloom, gradación, grano, aberración |
| `tools/` | Preparación de datos (mapa, fotos, profundidad), banda sonora y render |

## Uso

```bash
npm install
# (opcional) regenerar datos
node tools/export_geo.cjs && python3 tools/prep_map.py && python3 tools/prep_detail.py
python3 tools/prep_images.py
python3 tools/soundtrack.py
# render de fotogramas (reanudable) y codificación
node tools/render.mjs 2 out/frames
ffmpeg -framerate 30 -i out/frames/f_%05d.jpg -i assets/audio/soundtrack.wav \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest out/educafairino.mp4
```

Para revisar fotogramas sueltos: `npx http-server -p 8765 .` y `node tools/stills.mjs test/x b20 b60.5`
(los tiempos con `b` están en pulsos de 60/129 s).

## Cambiar contenido

- **Textos**: bloque «textos» al final de `src/main.js`. Las palabras entre `*asteriscos*` salen en naranja.
- **Centros del mapa**: lista `centers` en `tools/prep_map.py` (después, ejecutar el script).
- **Fotos reales**: sustituir `assets/img/*_src.jpg`, ajustar `LABEL`/`SHAPES` en `tools/prep_images.py`
  (caja de la etiqueta incrustada y siluetas para la profundidad) y ejecutar el script.
