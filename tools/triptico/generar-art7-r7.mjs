// Tríptico comercial del ART7 R7 (FAIRINO, serie ART) en PDF: A4 apaisado, dos caras de tres paneles de 99 mm.
//   node tools/triptico/generar-art7-r7.mjs
// Misma estética que la web y el catálogo (tools/catalogo/generar.mjs). Textos y cifras: el documento del cliente
// «ART7. recopilatorio de inform para catalogo comercial.docx» (traducción del artículo de Gaogong Robotics del
// 14/08/2026, preparada por Pedro Oreja el 02/10/2026), el teaser oficial del ART7 R7 y el anuncio oficial de los
// humanoides FAIRINO. No se añaden cifras que no salgan ahí; el precio en yuanes del artículo no se usa (es del
// mercado chino): «Precio y disponibilidad: consúltanos». Fotos: assets-src/fabricantes/fairino/art7-r7/ (ver LEEME).
// Deja:
//   public/descargas/fairino-art7-r7-triptico.pdf                el tríptico
//   src/assets/images/descargas/triptico-art7-r7-portada.jpg     la portada, para el botón de descarga de la web
//   src/data/triptico-art7-r7.json                               ruta y peso, para la web
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = join(ROOT, 'assets-src/fabricantes/fairino/art7-r7');
const CACHE = join(ROOT, 'tools/triptico/.cache');
const OUT_PDF = join(ROOT, 'public/descargas/fairino-art7-r7-triptico.pdf');
const OUT_COVER = join(ROOT, 'src/assets/images/descargas/triptico-art7-r7-portada.jpg');
const OUT_JSON = join(ROOT, 'src/data/triptico-art7-r7.json');
const SITE = 'https://fairinocobot.com/';
const DEMO = `${SITE}reservar-cita/?demo=art7-r7`;
mkdirSync(CACHE, { recursive: true });

// Contacto (el mismo de src/data/site.ts)
const CONTACTO = {
  tel: '+34627775294',
  telTxt: '+34 627 775 294',
  email: 'po@fairino.es',
  direccion: ['Avenida de la Estación, 12', '45520 Villaluenga de la Sagra (Toledo)'],
};

// ------------------------------------------------------------------ fotos
// Recorte (x, y, ancho, alto en píxeles del original) y ancho final. Ninguno lleva rótulos: los del vídeo quedan fuera.
const FOTOS = {
  portada: { src: 'teaser-48s5-plataforma.jpg', crop: [0, 0, 550, 720], w: 900 },
  alcance: { src: 'teaser-33s-alcance.jpg', crop: [90, 10, 1190, 610], w: 1000 },
  plataforma: { src: 'humanoides-80s.jpg', crop: [330, 150, 840, 500], w: 1000 },
  manipulacion: { src: 'humanoides-34s.jpg', crop: [0, 0, 1280, 720], w: 1000 },
  controlador: { src: 'controlador-art-documento.png', crop: [395, 40, 458, 340], w: 700 },
  ros2: { src: 'teaser-41s-ros2.jpg', crop: [120, 120, 1100, 560], w: 1000 },
  familia: { src: 'humanoides-86s.jpg', crop: [0, 150, 1280, 570], w: 1100 },
};

async function foto(id) {
  const f = FOTOS[id];
  const src = join(SRC, f.src);
  const out = join(CACHE, `${id}.jpg`);
  if (existsSync(out) && statSync(out).mtimeMs > statSync(src).mtimeMs && statSync(out).mtimeMs > statSync(fileURLToPath(import.meta.url)).mtimeMs) return out;
  const [left, top, width, height] = f.crop;
  await sharp(src).extract({ left, top, width, height }).resize({ width: f.w, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
  return out;
}

// ------------------------------------------------------------------ piezas
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fontUrl = (rel) => pathToFileURL(join(ROOT, 'node_modules', rel)).href;
const img = (p) => pathToFileURL(p).href;
const icono = (name, size = 16) =>
  readFileSync(join(ROOT, 'node_modules/lucide-static/icons', `${name}.svg`), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/width="24"/, `width="${size}"`)
    .replace(/height="24"/, `height="${size}"`)
    .replace(/stroke-width="2"/, 'stroke-width="1.7"');
const WORDMARK = readFileSync(join(ROOT, 'src/assets/brand/fairino-wordmark.svg'), 'utf8').replace('<svg ', '<svg fill="currentColor" ');
const logo = (h) => `<span class="logo" style="--h:${h}mm">${WORDMARK}<b>SPAIN</b></span>`;
const QR = readFileSync(join(ROOT, 'tools/triptico/qr-reservar-demo-art7-r7.svg'), 'utf8').replace(/<\?xml[^>]*>/, '');

// ------------------------------------------------------------------ contenido
// Cifras del brazo ART7 (documento del cliente; repetibilidad de fuerza y par, también en el anuncio oficial).
const CIFRAS = [
  { v: '7 kg', k: 'Carga nominal por brazo', n: '10 kg de carga máxima instantánea' },
  { v: '714 mm', k: 'Alcance de cada brazo', n: 'Cercano al brazo humano' },
  { v: '±0,03 mm', k: 'Repetibilidad de posicionamiento' },
  { v: '7 ejes', k: 'Sensor de par en cada articulación', n: 'Muñeca de ejes cruzados' },
  { v: '≤ 0,15 N', k: 'Repetibilidad de la fuerza aplicada' },
  { v: '≤ 0,05 N·m', k: 'Repetibilidad del par' },
  { v: '≤ 0,3 N·m', k: 'Percepción de par en la articulación' },
  { v: '≥ 5 kHz', k: 'Muestreo del sensor de par' },
];
const APLICACIONES = [
  'Montaje de precisión',
  'Atornillado con control de fuerza',
  'Conexión de mazos de cables en PCB',
  'Clasificación de paquetes',
  'Pipeteo en laboratorio',
  'Validación de algoritmos y recogida de datos',
];
const FAMILIA = [
  { n: 'ART3', t: 'Brazo de 3 kg y ±0,03 mm, ligero y flexible, para comercio y servicios inteligentes.' },
  { n: 'ART7', t: 'El modelo principal: 7 kg (10 kg máx.), 714 mm y control de fuerza en sus 7 articulaciones.' },
  { n: 'ART14', t: '14 kg por brazo (20 kg máx.) para soldadura, montaje en automoción y piezas grandes.' },
  { n: 'ART-UB', t: 'Cabeza, tronco y dos brazos (15 grados de libertad) para desarrollar y validar.' },
  { n: 'ART-RD', t: 'Diseño de referencia de robot completo: 24 grados de libertad con base móvil.' },
  { n: 'ART-JM', t: 'Módulos articulares FM-11, FM-14, FM-17 y FM-20, con reductor armónico y sensor de par.' },
];
// Pasos del asesoramiento gratuito (los mismos de la web, src/data/home.ts, adaptados al ART7 R7)
const PASOS = [
  { t: 'Análisis de tu aplicación', d: 'Nos cuentas qué quieres hacer con él y vemos si encaja.' },
  { t: 'Demostración', d: 'En Villaluenga de la Sagra (Toledo), o por videollamada si te viene mejor.' },
  { t: 'Propuesta detallada, sin compromiso', d: 'Te detallamos lo que hace falta para que decidas con calma.' },
];
const EN_CIFRAS = [
  { v: '250.000', k: 'módulos articulares entregados' },
  { v: '+300.000', k: 'módulos al año de capacidad' },
  { v: '+11.000', k: 'cobots enviados en un año' },
  { v: '100', k: 'países y regiones' },
];

// ------------------------------------------------------------------ paneles
const P = {};
const R = {};

// 1 · Portada
P.portada = () => `
<section class="panel cover">
  <img class="cover-img" src="${img(R.portada)}" alt="">
  <div class="cover-shade"></div>
  <div class="cover-top">${logo(6.4)}</div>
  <div class="cover-title">
    <p class="eyebrow"><span class="dot"></span>Próximamente · Robótica humanoide</p>
    <h1>ART7 R7</h1>
    <p class="cover-claim">Plataforma de brazo humanoide con control de fuerza.</p>
  </div>
  <div class="cover-foot">
    <p class="cover-hook">Hay una diferencia entre moverse y sentir.</p>
    <ul class="cover-keys"><li><b>7</b> ejes por brazo</li><li><b>7 kg</b> por brazo</li><li><b>±0,03</b> mm</li></ul>
    <p class="tagline">Lo que viene ya se siente.</p>
  </div>
</section>`;

// 2 · El brazo ART7
P.brazo = () => `
<section class="panel">
  <p class="eyebrow"><span class="num">01</span>El brazo ART7</p>
  <h2>Siente la fuerza <span>que aplica.</span></h2>
  <p class="lead">El ART7 es el modelo principal de la serie ART de FAIRINO: control de fuerza en sus siete articulaciones, muñeca de ejes cruzados y un brazo de 714 mm, cercano a la estructura del brazo humano.</p>
  <figure class="ph ph-dark"><img src="${img(R.alcance)}" alt=""></figure>
  <dl class="nums">${CIFRAS.map((c) => `<div><dd>${esc(c.v)}</dd><dt>${esc(c.k)}</dt>${c.n ? `<small>${esc(c.n)}</small>` : ''}</div>`).join('')}</dl>
  <ul class="ticks">
    <li><b>Guiado manual a fuerza cero:</b> basta con menos de 5 N para moverlo con la mano.</li>
    <li><b>Muñeca lista para integrar:</b> salida de cables en el extremo, botón de guiado y paso interior de cables de hasta 12 mm.</li>
  </ul>
</section>`;

// 3 · La plataforma de dos brazos
P.plataforma = () => `
<section class="panel">
  <p class="eyebrow"><span class="num">02</span>Plataforma ART7 R7</p>
  <h2>Dos brazos, <span>un solo equipo.</span></h2>
  <p class="lead">ART7 R7 une dos brazos ART7 en una plataforma con coordinación bimanual: 14 grados de libertad, 7 kg por brazo y una velocidad TCP típica de 1,2 m/s.</p>
  <figure class="ph"><img src="${img(R.plataforma)}" alt=""></figure>
  <h3>Rígido para la carga, suave al tocar</h3>
  <p>Estructura de aleación de aluminio de gran rigidez y carcasa ligera de ABS+PC. El control de impedancia y la compensación del par de FAIRINO combinan la rigidez que pide la carga con la flexibilidad de un brazo humano: más seguridad al trabajar junto a personas, en laboratorios y en puestos de montaje.</p>
  <h3>Para qué sirve</h3>
  <ul class="chips">${APLICACIONES.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
  <figure class="ph ph-s"><img src="${img(R.manipulacion)}" alt=""></figure>
  <p class="note">Pensada para I+D, investigación, educación, demostración y prototipos.</p>
</section>`;

// 4 · Controlador y software
P.control = () => `
<section class="panel">
  <p class="eyebrow"><span class="num">03</span>Control y software</p>
  <h2>El control cabe <span>en la palma de la mano.</span></h2>
  <figure class="ph ph-light"><img src="${img(R.controlador)}" alt=""></figure>
  <ul class="specs">
    <li><span>Tamaño</span><b>40 × 80 × 100 mm</b></li>
    <li><span>Red</span><b>2 Ethernet Gigabit, uno TSN</b></li>
    <li><span>Bus</span><b>EtherCAT de alta velocidad</b></li>
    <li><span>Coordinación</span><b>Hasta 5 brazos con un distribuidor</b></li>
    <li><span>Conexiones</span><b>CAN, RS485, entradas digitales y 24 V</b></li>
    <li><span>Procesador</span><b>RK3588 con NPU de 6 TOPS</b></li>
  </ul>
  <h3>Abierto para tu «cerebro»</h3>
  <p>El par de cada articulación se publica en topics de ROS2. Interfaces estandarizadas y efectores finales intercambiables para llevar tus modelos de IA al mundo físico sin reconstruir el robot.</p>
  <ul class="chips chips-mono"><li>ROS2 Humble</li><li>MoveIt2</li><li>SDK C++</li><li>URDF</li><li>EtherCAT</li></ul>
  <figure class="ph ph-dark ph-s"><img src="${img(R.ros2)}" alt=""></figure>
</section>`;

// 5 · Solapa: la serie ART y FAIRINO
P.serie = () => `
<section class="panel">
  <p class="eyebrow"><span class="dot"></span>La serie ART de FAIRINO</p>
  <h2>Un cuerpo fiable <span>para cada «cerebro».</span></h2>
  <p class="lead">FAIRINO lleva su experiencia en cobots industriales a la robótica humanoide: brazos, módulos y plataformas estandarizados, modulares y abiertos, para que quien desarrolla la IA tenga un cuerpo fiable donde ponerla a trabajar.</p>
  <figure class="ph"><img src="${img(R.familia)}" alt=""></figure>
  <ul class="family">${FAMILIA.map((f) => `<li><b>${esc(f.n)}</b><span>${esc(f.t)}</span></li>`).join('')}</ul>
  <div class="facts">
    <p class="k">FAIRINO en cifras</p>
    <dl>${EN_CIFRAS.map((c) => `<div><dd>${esc(c.v)}</dd><dt>${esc(c.k)}</dt></div>`).join('')}</dl>
    <p class="src">Fabricación propia de seis componentes esenciales. Cifras de FAIRINO publicadas por Gaogong Robotics el 14/08/2026.</p>
  </div>
</section>`;

// 6 · Contraportada
P.contacto = () => `
<section class="panel back">
  <div class="back-glow"></div>
  <p class="eyebrow"><span class="dot"></span>Próximamente en FAIRINO España</p>
  <h2 class="back-title">Reserva <span>tu demo.</span></h2>
  <p class="lead">Ven a verlo a nuestras instalaciones de Toledo o te lo enseñamos por videollamada. Te asesoramos sin compromiso.</p>
  <ol class="steps">${PASOS.map((p, i) => `<li><span>${i + 1}</span><div><b>${esc(p.t)}</b><p>${esc(p.d)}</p></div></li>`).join('')}</ol>
  <a class="qr" href="${DEMO}">${QR}<span>Escanea y reserva<br><b>fairinocobot.com/reservar-cita</b></span></a>
  <ul class="contact">
    <li>${icono('phone')}<a href="tel:${CONTACTO.tel}">${CONTACTO.telTxt}</a></li>
    <li>${icono('mail')}<a href="mailto:${CONTACTO.email}">${CONTACTO.email}</a></li>
    <li>${icono('map-pin')}<span>${CONTACTO.direccion.map(esc).join('<br>')}</span></li>
    <li>${icono('globe')}<a href="${SITE}">fairinocobot.com</a></li>
  </ul>
  <div class="back-foot">
    ${logo(5.6)}
    <p class="legal">Certificación CE en proceso. Precio y disponibilidad: consúltanos. Especificaciones según la documentación de FAIRINO, sujetas a cambios sin previo aviso. Imágenes de FAIRINO.</p>
  </div>
</section>`;

// ------------------------------------------------------------------ CSS
const css = `
@font-face { font-family: 'Archivo'; src: url('${fontUrl('@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2')}') format('woff2'); font-weight: 100 900; font-stretch: 62% 125%; }
@font-face { font-family: 'Plex'; src: url('${fontUrl('@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2')}') format('woff2'); font-weight: 400; }
@font-face { font-family: 'Plex'; src: url('${fontUrl('@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2')}') format('woff2'); font-weight: 500; }
@font-face { font-family: 'Plex'; src: url('${fontUrl('@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2')}') format('woff2'); font-weight: 600 700; }
@font-face { font-family: 'PlexMono'; src: url('${fontUrl('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2')}') format('woff2'); font-weight: 500; }
@page { size: 297mm 210mm; margin: 0; }
:root { --ink:#070504; --card:#120d0a; --card2:#1a130e; --line:#2a1f18; --text:#f5eee8; --muted:#c4b7ac; --mist:#9c8f84; --signal:#ff7a1a; --brand:#ff8a3d; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { background: var(--ink); color: var(--text); font: 400 7.6pt/1.45 'Plex', sans-serif; }
a { color: inherit; text-decoration: none; }
img { display: block; }
.sheet { width: 297mm; height: 210mm; display: grid; grid-template-columns: repeat(3, 99mm); break-after: page; overflow: hidden; }
.sheet:last-child { break-after: auto; }
.panel { position: relative; height: 210mm; overflow: hidden; padding: 10mm 8mm 9mm; display: flex; flex-direction: column; gap: 3.2mm;
  background:
    linear-gradient(rgba(255,122,26,0.035) 1px, transparent 1px) 0 0 / 8mm 8mm,
    linear-gradient(90deg, rgba(255,122,26,0.035) 1px, transparent 1px) 0 0 / 8mm 8mm,
    radial-gradient(ellipse 90% 40% at 80% 0%, rgba(255,106,19,0.10), transparent 70%),
    var(--ink); }
.panel + .panel { border-left: 0.2mm solid rgba(255,255,255,0.04); }
.logo { display: inline-flex; flex-direction: column; align-items: flex-end; gap: calc(var(--h) * 0.18); color: #fff; }
.logo svg { height: var(--h); width: auto; }
.logo b { font: 500 calc(var(--h) * 0.36)/1 'Plex', sans-serif; letter-spacing: 0.5em; margin-right: -0.5em; color: var(--signal); }
.eyebrow, .k, dt, .specs span, .chips-mono li, .tagline, .note, .src { font-family: 'PlexMono', monospace; text-transform: uppercase; letter-spacing: 0.14em; }
.eyebrow { display: flex; align-items: center; gap: 2mm; font-size: 6pt; color: var(--brand); }
.eyebrow .num { color: var(--ink); background: var(--signal); border-radius: 9mm; padding: 0.4mm 1.6mm; letter-spacing: 0.06em; }
.dot { width: 1.5mm; height: 1.5mm; border-radius: 50%; background: var(--signal); box-shadow: 0 0 2mm rgba(255,122,26,0.9); }
h1, h2, h3 { font-family: 'Archivo', sans-serif; font-weight: 800; line-height: 1; }
h2 { font-size: 17pt; font-stretch: 118%; letter-spacing: -0.005em; } h2 span { display: block; color: var(--signal); }
h3 { font-size: 8.6pt; font-stretch: 112%; margin-top: 0.6mm; }
.lead { font-size: 8.1pt; color: var(--muted); line-height: 1.5; }
p { color: var(--muted); }
.ph { border-radius: 2.6mm; overflow: hidden; border: 0.25mm solid var(--line); background: #000; flex: none; }
.ph img { width: 100%; height: auto; }
.ph-dark { border-color: rgba(255,122,26,0.25); }
.ph-light { background: #f2f1ee; }
.ph-s img { height: 26mm; object-fit: cover; }

/* Portada */
.cover { padding: 0; background: var(--ink); }
.cover-img { position: absolute; left: 0; right: 0; top: 52mm; width: 100%; height: 128mm; object-fit: cover; object-position: 30% 50%; }
.cover-shade { position: absolute; inset: 0; background:
  linear-gradient(180deg, var(--ink) 0%, var(--ink) 25%, rgba(7,5,4,0.4) 34%, rgba(7,5,4,0) 44%, rgba(7,5,4,0) 70%, rgba(7,5,4,0.9) 84%, var(--ink) 90%); }
.cover-top { position: absolute; top: 10mm; right: 8mm; }
.cover-title { position: absolute; top: 24mm; left: 8mm; right: 8mm; display: grid; gap: 2.6mm; }
.cover-title h1 { font-size: 46pt; font-stretch: 112%; letter-spacing: -0.01em; line-height: 0.9; }
.cover-claim { font-size: 9.4pt; color: var(--muted); max-width: 70mm; }
.cover-foot { position: absolute; left: 8mm; right: 8mm; bottom: 9mm; display: grid; gap: 3mm; }
.cover-hook { font: 700 11pt/1.2 'Archivo', sans-serif; font-stretch: 112%; color: var(--text); max-width: 70mm; }
.cover-keys { list-style: none; display: grid; grid-template-columns: repeat(3, 1fr); border-top: 0.3mm solid rgba(255,122,26,0.45); padding-top: 2.4mm; font-size: 6.6pt; color: var(--mist); }
.cover-keys b { display: block; font: 500 10.5pt 'PlexMono', monospace; color: var(--text); }
.tagline { font-size: 6.2pt; letter-spacing: 0.24em; color: var(--brand); }

/* Cifras */
.nums { display: grid; grid-template-columns: 1fr 1fr; border: 0.25mm solid var(--line); border-radius: 2.4mm; overflow: hidden; background: rgba(255,255,255,0.02); }
.nums div { padding: 1.7mm 2.2mm; border-bottom: 0.25mm solid var(--line); }
.nums div:nth-child(odd) { border-right: 0.25mm solid var(--line); }
.nums div:nth-last-child(-n+2) { border-bottom: 0; }
.nums dd { font: 500 10.4pt/1.1 'PlexMono', monospace; color: var(--text); }
.nums dt { font-size: 5pt; color: var(--mist); margin-top: 0.6mm; letter-spacing: 0.08em; line-height: 1.3; }
.nums small { display: block; font-size: 5.8pt; color: var(--brand); margin-top: 0.4mm; }
.ticks { list-style: none; display: grid; gap: 1.6mm; }
.ticks li { position: relative; padding-left: 3.6mm; color: var(--muted); }
.ticks li::before { content: ''; position: absolute; left: 0; top: 1.3mm; width: 1.4mm; height: 1.4mm; border-radius: 50%; background: var(--signal); }
.ticks b { color: var(--text); font-weight: 600; }

/* Chips */
.chips { list-style: none; display: flex; flex-wrap: wrap; gap: 1.2mm; }
.chips li { padding: 0.6mm 2mm; border: 0.25mm solid var(--line); border-radius: 9mm; color: var(--muted); font-size: 6.6pt; background: var(--card); }
.chips-mono li { font-size: 5.6pt; color: var(--brand); border-color: rgba(255,122,26,0.4); background: transparent; letter-spacing: 0.08em; }
.note { font-size: 5.6pt; color: var(--brand); letter-spacing: 0.1em; margin-top: auto; }

/* Controlador */
.specs { list-style: none; display: grid; border-top: 0.25mm solid var(--line); }
.specs li { display: grid; grid-template-columns: 22mm 1fr; gap: 2mm; align-items: baseline; padding: 1.3mm 0; border-bottom: 0.25mm solid var(--line); }
.specs span { font-size: 5.2pt; color: var(--mist); letter-spacing: 0.1em; }
.specs b { font-weight: 500; font-size: 7.6pt; color: var(--text); }

/* Serie ART */
.family { list-style: none; display: grid; gap: 1.3mm; }
.family li { display: grid; grid-template-columns: 13mm 1fr; gap: 2mm; align-items: baseline; padding-bottom: 1.3mm; border-bottom: 0.25mm solid var(--line); }
.family b { font: 800 8.4pt 'Archivo', sans-serif; font-stretch: 112%; color: var(--brand); }
.family span { font-size: 6.9pt; color: var(--muted); line-height: 1.35; }
.facts { margin-top: auto; padding: 2.6mm 3mm; border: 0.25mm solid rgba(255,122,26,0.45); border-radius: 2.6mm; background: linear-gradient(120deg, #24150b, #0b0705 75%); display: grid; gap: 1.8mm; }
.k { font-size: 5.4pt; color: var(--brand); }
.facts dl { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6mm 3mm; }
.facts dd { font: 800 11pt/1 'Archivo', sans-serif; font-stretch: 115%; color: var(--text); }
.facts dt { font-size: 5pt; color: var(--mist); margin-top: 0.5mm; letter-spacing: 0.06em; text-transform: none; font-family: 'Plex', sans-serif; font-size: 6.4pt; }
.src { font-size: 4.8pt; color: var(--mist); letter-spacing: 0.06em; text-transform: none; font-family: 'Plex', sans-serif; font-size: 5.6pt; line-height: 1.35; }

/* Contraportada */
.back { justify-content: flex-start; }
.back-glow { position: absolute; left: 0; right: 0; bottom: 0; height: 110mm; background: radial-gradient(ellipse 50% 45% at 50% 70%, rgba(255,106,19,0.22), transparent 70%); pointer-events: none; }
.back-title { font-size: 26pt; margin-top: 5mm; }
.steps { list-style: none; display: grid; gap: 2mm; margin-top: 1mm; }
.steps li { display: grid; grid-template-columns: 6mm 1fr; gap: 2.4mm; align-items: start; }
.steps li > span { display: grid; place-items: center; width: 6mm; height: 6mm; border-radius: 50%; border: 0.3mm solid rgba(255,122,26,0.6); font: 500 7pt 'PlexMono', monospace; color: var(--brand); }
.steps b { font: 700 8.2pt 'Archivo', sans-serif; font-stretch: 110%; color: var(--text); } .steps p { font-size: 7pt; margin-top: 0.4mm; }
.qr { position: relative; display: grid; grid-template-columns: 26mm 1fr; gap: 4mm; align-items: center; margin-top: 2mm; padding: 4mm; border: 0.3mm solid rgba(255,122,26,0.5); border-radius: 3mm; background: rgba(7,5,4,0.7); }
.qr svg { width: 26mm; height: 26mm; display: block; }
.qr span { font-size: 7.6pt; color: var(--muted); line-height: 1.4; } .qr b { color: var(--brand); font-weight: 500; font-size: 6.6pt; word-break: break-word; }
.contact { position: relative; list-style: none; display: grid; gap: 2mm; margin-top: 1mm; }
.contact li { display: grid; grid-template-columns: 6mm 1fr; align-items: start; gap: 1.6mm; font-size: 9pt; color: var(--text); }
.contact svg { color: var(--brand); margin-top: 0.4mm; }
.contact span { font-size: 8pt; color: var(--muted); }
.back-foot { position: relative; margin-top: auto; display: grid; gap: 3.4mm; justify-items: start; border-top: 0.3mm solid rgba(255,122,26,0.4); padding-top: 4mm; }
.legal { font-size: 5.8pt; color: var(--mist); line-height: 1.4; }
`;

// ------------------------------------------------------------------ generar
async function main() {
  for (const id of Object.keys(FOTOS)) R[id] = await foto(id);
  // Cara exterior: solapa (se ve al abrir la portada), contraportada y portada. Cara interior: paneles 1, 2 y 3.
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>ART7 R7 · Tríptico FAIRINO España</title><style>${css}</style></head><body>
<div class="sheet">${P.serie()}${P.contacto()}${P.portada()}</div>
<div class="sheet">${P.brazo()}${P.plataforma()}${P.control()}</div>
</body></html>`;
  const htmlPath = join(CACHE, 'triptico.html');
  writeFileSync(htmlPath, html);

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    const req = createRequire(import.meta.url);
    ({ chromium } = req(join(execSync('npm root -g').toString().trim(), 'playwright')));
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Aviso si algún panel se sale de su sitio
  const desbordes = await page.evaluate(() =>
    [...document.querySelectorAll('.panel')].map((p, i) => (p.scrollHeight > p.clientHeight + 1 ? `panel ${i + 1}: ${p.scrollHeight - p.clientHeight}px de más` : null)).filter(Boolean),
  );
  if (desbordes.length) console.warn('¡Ojo! Texto que no cabe:', desbordes.join(' · '));
  mkdirSync(dirname(OUT_PDF), { recursive: true });
  await page.pdf({ path: OUT_PDF, width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true, tagged: true });
  // Portada (panel derecho de la cara exterior) para la web
  mkdirSync(dirname(OUT_COVER), { recursive: true });
  const cover = await page.locator('.cover').screenshot({ type: 'jpeg', quality: 88 });
  await sharp(cover).resize({ width: 420 }).jpeg({ quality: 84, mozjpeg: true }).toFile(OUT_COVER);
  if (process.argv.includes('--vistas')) {
    const sheets = page.locator('.sheet');
    for (let i = 0; i < 2; i++) await sheets.nth(i).screenshot({ path: join(CACHE, `cara-${i + 1}.png`) });
  }
  await browser.close();
  const kb = Math.round(statSync(OUT_PDF).size / 1024);
  writeFileSync(
    OUT_JSON,
    JSON.stringify({ archivo: 'descargas/fairino-art7-r7-triptico.pdf', titulo: 'Tríptico ART7 R7', paginas: 2, kb, portada: 'descargas/triptico-art7-r7-portada.jpg' }, null, 2) + '\n',
  );
  console.log(`tríptico: ${OUT_PDF.replace(ROOT + '/', '')} · ${kb} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
