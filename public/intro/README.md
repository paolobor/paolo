# Intro de FAIRINO Spain

Entrada animada con el logotipo oficial de FAIRINO. Funciona de dos formas:

- **Dentro de esta web** (inicio y tienda): `BaseLayout` con `intro` la muestra encima de la página la primera
  vez de cada sesión; al terminar, la capa se funde y deja la página a la vista (ver `src/components/IntroOverlay.astro`).
- **Suelta** (esta carpeta tal cual, `index.html`): página propia que al terminar salta a https://fairino.es/,
  para GitHub Pages, WordPress o cualquier hosting estático. HTML, CSS y JavaScript sin compilar.

## Recorrido: llegar en persona a una gran fábrica (estilo cine)

Un único plano secuencia sin cortes, hecho con IA (Higgsfield · Kling 3.0, 15 s, con los robots cambiados por el
FAIRINO real con Genjutsu a partir de sus fotos; es imagen ilustrativa), que el
visitante recorre con la rueda del ratón o el dedo, como en las páginas de producto de Apple. La cámara va siempre
hacia delante, recta y sin pararse: la rueda o el dedo (en cualquier sentido) la aceleran, nunca la hacen volver.
Es un vídeo normal (H.264: 1080p en ordenador, 720p en móvil), que reproduce el chip de vídeo del aparato y va fluido
en cualquiera; la rueda y el dedo cambian su velocidad. Antes eran 768 fotogramas pintados en un `<canvas>`, que no
cabían en la memoria de muchos móviles y ordenadores (iban a tirones o se quedaban colgados).

0. **Pantalla de inicio, la de siempre:** el bloque «FAIRINO SPAIN» con su destello, «Haz clic para entrar» y
   «Saltar intro». Mientras se ve, se descarga el vídeo.
1. **Clic (o Intro, espacio, rueda o dedo):** la cámara cruza el hueco de la «O» y al otro lado está la fábrica desde
   el aire; entran las bandas de cine (2,39:1). Leve parallax con el ratón.
2. **Rueda o dedo:** aceleran la cámara con inercia, nunca a saltos ni hacia atrás. Si se deja de mover, la cámara
   sigue sola (`IDLE`): nunca se para. **Clic:** avanza sola a velocidad normal hasta el final
   (`AUTO`). La página de debajo no se mueve.
3. **Dentro de la nave (desde 5,5 s):** los cobots FAIRINO trabajando, sin textos encima.
4. **El cobot del final (desde 13,75 s):** un marco naranja lo «fija», como un sistema de visión, y
   le sigue mientras la cámara se acerca a su anillo.
5. **Por el anillo:** al llegar al último fotograma, la cámara entra por el anillo, un destello
   anamórfico cruza la pantalla, las bandas se abren y la capa se funde dejando ver la home.

Acabado de cine: todo de noche (el exterior, assets-src/intro/exterior-noche.mp4, se funde con la nave al cruzar las puertas) y la nave se va oscureciendo según se entra; al final un dron vuela entre los cobots y sale por el techo; aros
de los ejes mate (sin brillo); 48 fotogramas por segundo (interpolados por movimiento) para que vaya fluido;
corrección de color (sombras frías, luces cálidas que hacen saltar el naranja #fc5220) y destellos
anamórficos discretos en las luces fuertes, ya metidos en los fotogramas; grano y viñeta suaves en la página.
Textos como títulos de película: fundidos lentos y letras muy espaciadas. Una barra naranja fina (en el borde de la
banda de abajo) muestra la carga; si el vídeo se queda esperando más de 6 s (`STALL`), se pasa a la web.

**Sonido tipo tráiler (opcional):** viento en el tramo aéreo, golpe grave al abrirse las puertas, zumbido de fábrica
dentro, un latido grave en el anillo y un golpe final al cruzarlo. Arranca tras el primer gesto, a volumen bajo, con
el botón «Sonido» (arriba a la izquierda) para silenciarlo. Basta con poner en `assets/audio/` los archivos de
`AUDIO` en `js/intro.js`: `viento.mp3`, `golpe-puertas.mp3`, `fabrica.mp3`, `latido.mp3` y `golpe-final.mp3`. Si no
está `viento.mp3`, no se pide ninguno, no suena nada y el botón no aparece.

Se ve una vez por sesión del navegador (sessionStorage); nunca la ven los buscadores ni las fichas de producto. Dentro
de la web es una capa a pantalla completa encima de la página (no una página aparte ni una redirección), así que no
afecta al posicionamiento en Google.

## Estructura

```
index.html                 la página suelta (destino en <html data-target="https://fairino.es/">); la web toma de aquí el marcado
css/intro.css              estilos
js/intro.js                guion de las escenas (GSAP)
js/vendor/gsap.min.js      GSAP 3.15 (licencia gratuita de GSAP)
assets/intro-1080.mp4      el recorrido para ordenador (16 s a 48 fps, unos 16 MB)
assets/intro-720.mp4       el mismo para el móvil, las pantallas pequeñas y las conexiones lentas (unos 5 MB)
assets/intro-poster.webp   primer fotograma (se ve al instante mientras arranca el vídeo)
assets/intro-still-1..3    tres imágenes fijas para el movimiento reducido
assets/audio/              sonido opcional (ver «Sonido tipo tráiler»)
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

- **Carga:** primero el tramo aéreo (para poder empezar en 2-3 s) y el resto en segundo plano, 10 a la vez. Si en
  8 s no ha llegado ni el primer fotograma, se entra en la web.
- **«Saltar intro»** (arriba a la derecha) lleva directo a la web en cualquier momento; dentro de la web, también Esc.
- **Teclado:** Intro o espacio = clic; flecha abajo y Av Pág adelantan la cámara.
- **Movimiento reducido** (`prefers-reduced-motion`): sin recorrido; al hacer clic, fundidos entre tres imágenes fijas
  del vídeo (fábrica, nave y anillo) y paso a la web.
- **Móvil:** vídeo de 720p y «Toca para entrar».
- **Sin JavaScript:** la página suelta muestra el logotipo y un enlace a la web; dentro de la web, la intro no aparece.

## Cambiar el vídeo

1. Pon el plano secuencia nuevo (15 s, 16:9, sin cortes) en `assets-src/intro/` (ahí está `recorrido-1080.mp4`, la
   copia en 1080p del actual; el original en 4K está en Higgsfield).
2. Pásalo a 48 fotogramas por segundo (interpolación por movimiento, unos minutos) y saca los fotogramas con el
   acabado de cine:
   ```bash
   # recorrido-noche-1080.mp4 = exterior de noche + recorrido-1080.mp4, escalado a 4K con Topaz (Higgsfield) y bajado a 1920
   ffmpeg -i recorrido-noche-4k.mp4 -vf "scale=1920:1080:flags=lanczos,fps=24,minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" -c:v libx264 -crf 12 /tmp/recorrido-noche-48.mp4
   MID=assets-src/intro/nave-4k.mp4 MIDCUT=264 FINAL=assets-src/intro/final-dron-rapido.mp4 CUT=576 \
     tools/videos/intro-fotogramas.sh /tmp/recorrido-noche-48.mp4 /tmp/packs
   tools/videos/intro-video.sh /tmp/packs/1920 public/intro/assets
   ```
3. En `js/intro.js`, actualiza:
   - súbele `v` a `VIDEO` para que el navegador no use el vídeo guardado;
   - `SEG`: segundo en que empieza cada tramo (entrada, nave, final); mira fotogramas sueltos con
     `ffmpeg -i video.mp4 -vf "fps=2,scale=400:-2,tile=6x5" hoja.jpg`;
   - `LOCK`: dónde está el cobot elegido al principio y al final del marco (proporciones del fotograma);
   - `RING`: centro y radio del anillo en el último fotograma.

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

## Integrarla en WordPress (como capa encima de la home)

La intro va encima de la portada, en la misma página: nada de redirecciones ni páginas aparte, así Google sigue viendo
la portada de siempre.

1. **Subir la carpeta** `intro/` a la raíz de WordPress (por ejemplo `public_html/intro/`), por FTP o desde el gestor
   de archivos del hosting.
2. **En la portada**, solo en la página de inicio (en la plantilla o con un plugin como WPCode):
   - en el `<head>`:
     ```html
     <script>
       (function () {
         try {
           var q = new URLSearchParams(location.search);
           if (q.has('intro') || (!/bot|crawl|spider|slurp|lighthouse|preview/i.test(navigator.userAgent) &&
               sessionStorage.getItem('fairino-intro-vista') !== '1')) {
             document.documentElement.classList.add('fi-play');
           }
         } catch (e) {}
       })();
     </script>
     <style>html.fi-play .fi-overlay{display:block;position:fixed;inset:0;z-index:2147483000;background:#000}
       .fi-overlay{display:none}</style>
     <link rel="stylesheet" href="/intro/css/intro.css" />
     ```
   - justo después de abrir el `<body>`: `<div class="fi-overlay">` + el bloque `<main class="fi-intro" …>…</main>`
     copiado tal cual de `intro/index.html` + `</div>`;
   - al final del `<body>`:
     ```html
     <script>
       if (document.documentElement.classList.contains('fi-play')) {
         ['/intro/js/vendor/gsap.min.js', '/intro/js/intro.js'].forEach(function (src) {
           var s = document.createElement('script');
           s.src = src;
           s.async = false;
           document.body.appendChild(s);
         });
       } else {
         var o = document.querySelector('.fi-overlay');
         if (o) o.remove();
       }
     </script>
     ```
3. Probar con `https://tu-dominio/?intro=1` (fuerza la intro aunque ya se haya visto).

Así lo hace también esta web (Astro): `src/layouts/BaseLayout.astro` y `src/components/IntroOverlay.astro`.

## Licencias

- **GSAP:** licencia estándar gratuita de GreenSock (https://gsap.com/standard-license).
- **Inter:** SIL Open Font License (`assets/fonts/OFL.txt`).
- **Logotipo de FAIRINO:** marca de FAIRINO, del SVG oficial de fairino.com (original en `assets-src/marca/`).
- **Vídeo:** plano secuencia generado con IA (Higgsfield · Kling 3.0); imagen ilustrativa.
