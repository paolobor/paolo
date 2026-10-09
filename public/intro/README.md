# Intro de FAIRINO Spain

Entrada animada con el logotipo oficial de FAIRINO. Funciona de dos formas:

- **Dentro de esta web** (inicio y tienda): `BaseLayout` con `intro` la muestra encima de la página la primera
  vez de cada sesión; al terminar, la capa se funde y deja la página a la vista (ver `src/components/IntroOverlay.astro`).
- **Suelta** (esta carpeta tal cual, `index.html`): página propia que al terminar salta a https://fairino.es/,
  para GitHub Pages, WordPress o cualquier hosting estático. HTML, CSS y JavaScript sin compilar.

## Recorrido: llegar en persona a una gran fábrica (estilo cine)

Un único plano secuencia sin cortes, hecho con IA (Higgsfield · Kling 3.0 en 4K, 15 s; es imagen ilustrativa), que el
visitante recorre con la rueda del ratón o el dedo, como en las páginas de producto de Apple. La cámara va siempre
hacia delante, recta y sin pararse: la rueda o el dedo (en cualquier sentido) la aceleran, nunca la hacen volver. El vídeo está convertido en fotogramas WebP que se pintan en un `<canvas>` (1920 px en ordenador, 960 px en
móvil): así se puede ir adelante y atrás al instante y sin tirones.

0. **Pantalla de inicio, la de siempre:** el bloque «FAIRINO SPAIN» con su destello, «Haz clic para entrar» y
   «Saltar intro». Mientras se ve, se descargan los fotogramas (primero el tramo aéreo).
1. **Clic (o Intro, espacio, rueda o dedo):** la cámara cruza el hueco de la «O» y al otro lado está la fábrica desde
   el aire, al anochecer; entran las bandas de cine (2,39:1). Abajo, como título de película: «Desliza o haz clic»,
   con la rueda del ratón animada («Desliza para avanzar» en el móvil). Leve parallax con el ratón.
2. **Rueda o dedo:** aceleran la cámara con inercia, nunca a saltos ni hacia atrás. Si se deja de mover, la cámara
   sigue sola (`IDLE`): nunca se para. **Clic:** avanza sola a velocidad normal hasta el final
   (`AUTO`). La página de debajo no se mueve.
3. **Dentro de la nave (desde 5,5 s):** cuando aparecen los 8 cobots entra el HUD (líneas finas, «8 cobots FAIRINO en
   producción» y contadores de ciclos, piezas y tiempo sin parar) y vuelve el bloque «FAIRINO SPAIN», con su
   animación de siempre, arriba de la imagen.
4. **El cobot del final (desde 13,75 s):** el HUD se va y un marco naranja lo «fija», como un sistema de visión, y
   le sigue mientras la cámara se acerca a su anillo.
5. **El portal:** al llegar al último fotograma, el anillo se ilumina en el borde, la cámara lo atraviesa, un destello
   anamórfico cruza la pantalla, las bandas se abren y la capa se funde dejando ver la home.

Acabado de cine: corrección de color (sombras frías, luces cálidas que hacen saltar el naranja #fc5220) y destellos
anamórficos discretos en las luces fuertes, ya metidos en los fotogramas; grano y viñeta suaves en la página.
Textos como títulos de película: fundidos lentos y letras muy espaciadas. Una barra naranja fina (en el borde de la
banda de abajo) muestra la carga; la cámara no pasa a un tramo cuyos fotogramas aún no han llegado.

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
assets/frames/1920/        fotogramas del recorrido para ordenador (361 WebP, unos 21 MB en total)
assets/frames/960/         los mismos para el móvil y las pantallas pequeñas (unos 9 MB)
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

- **Carga:** primero el tramo aéreo (para poder empezar en 2-3 s) y el resto en segundo plano, 6 a la vez. Si en
  8 s no ha llegado ni el primer fotograma, se entra en la web.
- **«Saltar intro»** (arriba a la derecha) lleva directo a la web en cualquier momento; dentro de la web, también Esc.
- **Teclado:** Intro o espacio = clic; flecha abajo y Av Pág adelantan la cámara.
- **Movimiento reducido** (`prefers-reduced-motion`): sin recorrido; al hacer clic, fundidos entre tres imágenes fijas
  del vídeo (fábrica, nave y anillo) y paso a la web.
- **Móvil:** fotogramas de 960 px, «Toca para entrar» y «Desliza para avanzar».
- **Sin JavaScript:** la página suelta muestra el logotipo y un enlace a la web; dentro de la web, la intro no aparece.

## Cambiar el vídeo

1. Pon el plano secuencia nuevo (15 s, 16:9, sin cortes) en `assets-src/intro/` (ahí está `recorrido-1080.mp4`, la
   copia en 1080p del actual; el original en 4K está en Higgsfield).
2. Saca los fotogramas con el acabado de cine:
   ```bash
   tools/videos/intro-fotogramas.sh assets-src/intro/recorrido.mp4 public/intro/assets/frames
   ```
3. En `js/intro.js`, actualiza:
   - `FRAMES.count` (lo dice el script) y súbele `v` para que el navegador no use los fotogramas guardados;
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
