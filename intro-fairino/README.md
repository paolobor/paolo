# Intro de FAIRINO España (fairino.es)

Página de entrada animada que se muestra antes de la web oficial https://fairino.es/.
HTML, CSS y JavaScript sin compilar: se publica tal cual en cualquier hosting estático.

## Recorrido (unos 4,5 s desde el clic)

1. **«fairino.es» y chispas.** El nombre se enfoca desde un desenfoque mientras un destello recorre las letras.
   - Chispas de amoladora salen del borde de las letras: tienen gravedad y rozamiento con el aire, se enfrían de blanco a rojo y algunas revientan en fragmentos.
   - El resplandor naranja ilumina el texto desde abajo según cuántas chispas calientes haya.
   - Al mover el ratón cerca, salen más chispas desde ese punto.
2. **Clic en cualquier parte** (o Intro / espacio).
   - Las chispas estallan y caen dentro de la «o».
   - El texto se acerca a cámara y la cámara cruza por el hueco de la «o». El vídeo solo se ve a través de ese hueco, como un portal.
   - Al otro lado, el cobot sale de la sombra.
   - Zoom rápido al anillo naranja de una articulación hasta cruzarlo.
3. **Fundido a blanco** y salto a la web.

Si ya se vio en esta sesión del navegador, la página salta directa a la web.

## Estructura

```
index.html                 la página (destino en <html data-target="https://fairino.es/">)
css/intro.css              estilos
js/intro.js                guion de las escenas (GSAP)
js/sparks.js               sistema de chispas (Canvas 2D, mezcla aditiva)
js/vendor/gsap.min.js      GSAP 3.15 (licencia gratuita de GSAP)
assets/fairino-intro.mp4   vídeo 1080p H.264 (0,5 MB)  · .webm VP9 (0,3 MB)
assets/fairino-intro-720.* vídeo 720p para móvil (0,26 MB / 0,15 MB)
assets/fonts/              Inter (Google Fonts, licencia OFL), servida desde la propia web
assets/favicon.svg
```

## Verla en local

```bash
cd intro-fairino
python3 -m http.server 8000
# http://localhost:8000/?intro=1
```

`?intro=1` la fuerza aunque ya se haya visto en la sesión; útil para enseñarla.

Para verla otra vez sin el parámetro, cierra la pestaña: sessionStorage se borra al cerrarla.

## Comportamiento

- **Precarga:** el vídeo se descarga entero mientras se ve la escena 1, para que arranque al instante tras el clic.
  - Chrome, Edge y Firefox reciben WebM; Safari recibe MP4.
  - Móvil y pantallas pequeñas reciben 720p.
- **«Saltar intro»** (esquina superior derecha) lleva directo a la web.
- **Movimiento reducido** (`prefers-reduced-motion`): sin chispas ni vídeo. El texto aparece con un fundido y, al hacer clic, funde a blanco y entra.
- **Móvil:** menos chispas, sin halos extra y densidad de píxeles limitada a 1,5.
- **Si el vídeo no carga** (red lenta), la intro no se queda colgada: funde a blanco y entra.
- **Sin JavaScript:** se ve el nombre y un enlace «Entrar en fairino.es».

## Cambiar el vídeo

El vídeo es un montaje del vídeo oficial del FAIRINO FR3:
- 0,16 s de negro;
- el brazo saliendo de la sombra;
- el plano del anillo rojo;
- el anillo naranja sobre fondo blanco, que se congela en el segundo 2,44 (justo cuando empieza el zoom).

Se regenera con:

```bash
V=original-fr3.mp4
FC="[0:v]trim=start=1.44:end=2.12,setpts=PTS-STARTPTS[a];[0:v]trim=start=0.12:end=1.40,setpts=PTS-STARTPTS[b];[0:v]trim=start=3.64:end=3.97,setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0,fps=25,tpad=start_duration=0.16:color=black:stop_mode=clone:stop_duration=1.6,format=yuv420p"
ffmpeg -i "$V" -filter_complex "$FC,scale=-2:1080:flags=lanczos[v]" -map "[v]" -an -c:v libx264 -preset slow -crf 23 -profile:v high -g 25 -movflags +faststart assets/fairino-intro.mp4
ffmpeg -i "$V" -filter_complex "$FC,scale=-2:1080:flags=lanczos[v]" -map "[v]" -an -c:v libvpx-vp9 -crf 33 -b:v 0 -row-mt 1 -g 25 assets/fairino-intro.webm
# 720p: scale=-2:720 y -crf 24 (MP4) / 35 (WebM), con el sufijo -720
```

Si cambias el vídeo, actualiza `RING` en `js/intro.js`:
- **posición** del anillo en el fotograma congelado (proporción del ancho y del alto);
- **radio** de su tapa interior (proporción del ancho);
- **segundo** en que empieza el zoom.

## Publicar en GitHub Pages

**Opción A, repositorio propio (la más limpia):**
1. Crea un repositorio, por ejemplo `fairino-intro`, y sube el *contenido* de esta carpeta a su raíz.
2. Settings → Pages → Build and deployment → Source: «Deploy from a branch» → `main` / `(root)`.
3. Queda en `https://paolobor.github.io/fairino-intro/`.

**Opción B, junto a la web de FDI Modular:** copia esta carpeta dentro de `docs/` de la rama que publica
paolobor.github.io/paolo/ (como `docs/fairino-intro/`). Queda en `https://paolobor.github.io/paolo/fairino-intro/`.

Todas las rutas son relativas, así que funciona en cualquier subcarpeta.

## Integrarla en WordPress (fairino.es)

1. **Subir la carpeta.** Súbela por FTP o desde el gestor de archivos del hosting a la raíz de WordPress, por ejemplo `public_html/intro/`. Los archivos estáticos se sirven tal cual: `https://fairino.es/intro/`.
2. **Destino.** En `intro/index.html`, cambia el destino a la portada del mismo dominio: `<html lang="es" data-target="/">`.
3. **Mostrarla antes de la portada.** Añade en la portada este código, en el `<head>` de la plantilla o con un plugin como WPCode, solo en la página de inicio:

   ```html
   <script>
     try {
       if (!/bot|crawl|spider|slurp|lighthouse|preview/i.test(navigator.userAgent) &&
           !sessionStorage.getItem('fairino-intro-vista')) {
         location.replace('/intro/');
       }
     } catch (e) {}
   </script>
   ```

   Al estar en el mismo dominio, la portada y la intro comparten sessionStorage: la intro se ve una vez por sesión y después la portada carga normal.

   El filtro de robots evita que Google indexe la intro en lugar de la portada. La intro, además, lleva `rel="canonical"` a https://fairino.es/.

## Licencias

- **GSAP:** licencia estándar gratuita de GreenSock (https://gsap.com/standard-license).
- **Inter:** SIL Open Font License (`assets/fonts/OFL.txt`).
- **Vídeo:** montaje del vídeo oficial del FAIRINO FR3.
