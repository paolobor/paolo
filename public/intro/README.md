# Intro de FAIRINO Spain

Entrada animada con el logotipo oficial de FAIRINO. Funciona de dos formas:

- **Dentro de esta web** (inicio y tienda): `BaseLayout` con `intro` la muestra encima de la página la primera
  vez de cada sesión; al terminar, la capa se funde y deja la página a la vista (ver `src/components/IntroOverlay.astro`).
- **Suelta** (esta carpeta tal cual, `index.html`): página propia que al terminar salta a https://fairino.es/,
  para GitHub Pages, WordPress o cualquier hosting estático. HTML, CSS y JavaScript sin compilar.

## Recorrido (unos 14 s desde el clic), estilo cine

Toda la intro va en **cinemascope**: bandas negras arriba y abajo (2,39:1; en el móvil en vertical la franja de imagen
es más alta). Los textos son títulos de película: fundidos lentos y letras muy espaciadas. Grano de película y viñeta
suaves (`css/intro.css`).

1. **El logotipo de FAIRINO.** Las letras oficiales se enfocan desde un desenfoque con un destello; después aparece
   «SPAIN» en naranja y, con un fundido lento, «Desliza o haz clic» («Desliza o toca» en el móvil).
2. **Clic, deslizar (rueda o dedo), Intro o espacio.** La cámara cruza por el hueco de la «O» y detrás arranca el vídeo:
   - **Exterior, de noche:** la cámara avanza hacia las puertas de cristal de una fábrica, que se abren
     (imagen ilustrativa hecha con IA, sin robots).
   - **Interior:** nave con 8 cobots FAIRINO en dos filas junto a las cintas, paletizando a la vez. Los robots son el
     **modelo 3D oficial** (no IA), con sus aros naranjas, tornillos y brida (`tools/cad/nave.html`).
   - **Primer plano:** la cámara se lanza hacia la tapa del codo de un FAIRINO hasta que el aro naranja llena la imagen.
   - Cortes secos de montaje con desenfoque de movimiento, corrección de color común (sombras frías, luces cálidas) y
     destellos anamórficos horizontales en las luces fuertes.
   - En la banda de abajo: el título de cada plano, «Imagen ilustrativa» y el código de tiempo.
3. **Por el aro:** el vídeo se para, la cámara entra por la tapa, las bandas se abren, un destello anamórfico naranja
   cruza la pantalla y todo funde a negro con un resplandor naranja; aparece la web a pantalla completa.

**Sonido (opcional):** ambiente grave de fábrica, un golpe al entrar en la nave y otro al cruzar el aro. Arranca tras
el primer gesto, a volumen bajo, con el botón «Sonido» (arriba a la izquierda) para silenciarlo. Basta con poner estos
archivos en `assets/audio/`: `ambiente-fabrica.mp3`, `golpe-nave.mp3` y `golpe-anillo.mp3` (`AUDIO` en
`js/intro.js`). Si no están, no suena nada y el botón no aparece.

Se ve una vez por sesión del navegador; nunca la ven los buscadores ni las fichas de producto. Al final, dentro de
la web la capa se funde y aparece la página; la página suelta salta a fairino.es.

## Estructura

```
index.html                 la página suelta (destino en <html data-target="https://fairino.es/">); la web toma de aquí el marcado
css/intro.css              estilos
js/intro.js                guion de las escenas (GSAP)
js/vendor/gsap.min.js      GSAP 3.15 (licencia gratuita de GSAP)
assets/fairino-intro.mp4   vídeo 1080p H.264 · .webm VP9
assets/fairino-intro-720.* vídeo 720p para el móvil y las pantallas pequeñas
assets/audio/              sonido opcional (ver «Sonido»)
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
- **«Saltar intro»** (en la banda de arriba, a la derecha) lleva directo a la web en cualquier momento (dentro de la web, también la tecla Esc).
- **Movimiento reducido** (`prefers-reduced-motion`): sin vídeo. El texto aparece con un fundido y, al hacer clic, funde a negro y entra.
- **Móvil:** logotipo más grande y algo por encima del centro, y «Toca para entrar» en lugar de «Haz clic».
- **Si el vídeo no carga** (red lenta) o se queda parado 3 s, la intro no se queda colgada: funde a negro y entra. Si se entra antes de que termine la descarga previa, el vídeo se reproduce mientras llega.
- **Sin JavaScript:** la página suelta muestra el logotipo y un enlace «Entrar en fairino.es»; dentro de la web, la
  intro no aparece.

## Cambiar el vídeo

El vídeo (unos 10 s, 24 fps) se monta con `tools/videos/intro-montaje.sh`:

```bash
# 1. Robots FAIRINO reales en 3D (sirviendo la raíz del repo en el puerto 4600):
python3 -m http.server 4600 --bind 127.0.0.1 &
Q='shot=interior&t0=0.6&dur=4' FROM=0 TO=96 OUT=/tmp/interior PW=/opt/node-tools/node_modules/playwright node tools/cad/render-nave.cjs
Q='shot=cerca&dur=3&hero=1'    FROM=0 TO=73 OUT=/tmp/cerca    PW=/opt/node-tools/node_modules/playwright node tools/cad/render-nave.cjs
# 2. Montaje con el exterior (Higgsfield, Kling 3.0, 5 s, 16:9) y codificación 1080p/720p, MP4 y WebM:
tools/videos/intro-montaje.sh exterior.mp4 /tmp/interior /tmp/cerca public/intro/assets
```

Si cambias el vídeo, actualiza en `js/intro.js`:
- `RING`: **posición** del aro en el último fotograma (proporción del ancho y del alto), **radio** de su tapa blanca
  (proporción del ancho) y **segundo** en que se para el vídeo para entrar por él;
- `SHOTS`: segundo en que empieza cada plano y su título;
- el `?v=` de `src`, para que el navegador no use el vídeo guardado.

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
- **Vídeo:** exterior generado con IA (Higgsfield, imagen ilustrativa); interior y primer plano renderizados con el
  modelo 3D oficial de FAIRINO.
