# Intro de FAIRINO Spain

Entrada animada con el logotipo oficial de FAIRINO. Funciona de dos formas:

- **Dentro de esta web** (inicio y tienda): `BaseLayout` con `intro` la muestra encima de la página la primera
  vez de cada sesión; al terminar, la capa se funde y deja la página a la vista (ver `src/components/IntroOverlay.astro`).
- **Suelta** (esta carpeta tal cual, `index.html`): página propia que al terminar salta a https://fairino.es/,
  para GitHub Pages, WordPress o cualquier hosting estático. HTML, CSS y JavaScript sin compilar.

## Recorrido (unos 4 s desde el clic)

1. **El logotipo de FAIRINO.** Las letras oficiales (SVG de fairino.com) se enfocan desde un desenfoque
   mientras un destello recorre las letras; después aparece «SPAIN» en naranja. Sin chispas ni partículas.
2. **Clic en cualquier parte** (o Intro / espacio).
   - Otro destello recorre el logotipo, que se encoge un instante antes de lanzarse.
   - El logotipo se acerca a cámara y la cámara cruza por el hueco de la «O». El vídeo solo se ve a través de ese hueco, como un portal.
   - Al otro lado, el cobot sale de la sombra.
   - Zoom al anillo rojo de una articulación, todavía en la escena oscura (el vídeo se para a 1,2 s): la imagen se
     oscurece y un aro de luz naranja enciende el anillo al cruzarlo, como un portal.
3. **Fundido a negro** con un resplandor naranja que sale del anillo, y entrada en la web (que también es oscura).
   Nada de blanco: el cliente pidió que la entrada siga en la escena oscura.

Se ve una vez por sesión del navegador; nunca la ven los buscadores ni las fichas de producto. Al final, dentro de
la web la capa se funde y aparece la página; la página suelta salta a fairino.es.

## Estructura

```
index.html                 la página suelta (destino en <html data-target="https://fairino.es/">); la web toma de aquí el marcado
css/intro.css              estilos
js/intro.js                guion de las escenas (GSAP)
js/vendor/gsap.min.js      GSAP 3.15 (licencia gratuita de GSAP)
assets/fairino-intro.mp4   vídeo 1080p H.264 (0,5 MB)  · .webm VP9 (0,3 MB)
assets/fairino-intro-720.* vídeo 720p para pantallas pequeñas en horizontal (0,26 MB / 0,15 MB)
assets/fonts/              Inter (Google Fonts, licencia OFL), servida desde la propia web
assets/favicon.svg
```

## Verla en local

```bash
cd public/intro
python3 -m http.server 8000
# http://localhost:8000/?intro=1
```

Dentro de la web: `npm run build` y abre `/?intro=1` o `/tienda/?intro=1`.

`?intro=1` la fuerza aunque ya se haya visto en la sesión; útil para enseñarla. En la web, el enlace «Ver la intro»
del pie de página hace lo mismo.

**Caché:** la web pide `intro.css` e `intro.js` con `?v=` y la huella del archivo, así que cada cambio llega sin
que el navegador use la versión guardada. En la página suelta (`index.html`) el `?v=` es un número: súbelo al
cambiar cualquiera de los dos.

Para verla otra vez sin el parámetro, cierra la pestaña: sessionStorage se borra al cerrarla.

## Comportamiento

- **Precarga:** el vídeo se descarga entero mientras se ve la escena 1, para que arranque al instante tras el clic.
  - Chrome, Edge y Firefox reciben WebM; Safari recibe MP4.
  - El móvil y las pantallas pequeñas reciben 720p. En el móvil en vertical el vídeo se ve entero (encajado,
    con los bordes fundidos en negro), no recortado.
  - Dentro de la web, los estilos, scripts y el vídeo de la intro solo se descargan si toca verla.
- **«Saltar intro»** (esquina superior derecha) lleva directo a la web (dentro de la web, también la tecla Esc).
- **Movimiento reducido** (`prefers-reduced-motion`): sin vídeo. El texto aparece con un fundido y, al hacer clic, funde a negro y entra.
- **Móvil:** logotipo más grande y algo por encima del centro, y «Toca para entrar» en lugar de «Haz clic».
- **Si el vídeo no carga** (red lenta), la intro no se queda colgada: funde a negro y entra.
- **Sin JavaScript:** la página suelta muestra el logotipo y un enlace «Entrar en fairino.es»; dentro de la web, la
  intro no aparece.

## Cambiar el vídeo

El vídeo es un montaje del vídeo oficial del FAIRINO FR3:
- 0,16 s de negro;
- el brazo saliendo de la sombra;
- el plano del anillo rojo;
- el anillo naranja sobre fondo blanco (desde 2,1 s; ya no se ve: el zoom empieza a 1,2 s, sobre el anillo rojo
  de la escena oscura; posición en `RING` de `js/intro.js`).

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

**Opción C, con esta web:** al publicar la web (Astro) la intro ya va dentro, en el inicio y la tienda, y además
queda la página suelta en `/intro/`.

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
- **Logotipo de FAIRINO:** marca de FAIRINO, del SVG oficial de fairino.com (original en `assets-src/marca/`).
- **Vídeo:** montaje del vídeo oficial del FAIRINO FR3.
