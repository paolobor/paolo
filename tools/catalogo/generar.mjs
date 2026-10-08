// Catálogo y tarifa de FAIRINO España en PDF (A4), con la misma estética que la web.
//   node tools/catalogo/generar.mjs
// Lee las fichas de src/content/products y los precios de src/data/tarifa.json, prepara las fotos (JPEG
// sobre el fondo oscuro de las tarjetas, para que el PDF pese poco), monta el HTML y Chromium (Playwright) lo pasa a
// PDF. Deja:
//   public/descargas/catalogo-fairino-espana-<mes>-<año>.pdf  el catálogo (mes y año de «fecha» en la tarifa)
//   src/assets/images/descargas/catalogo-portada.jpg           la portada, para la página de descargas
//   src/data/catalogo.json                                     páginas, peso y cifras, para la página de descargas
// Necesita Playwright con Chromium (en este entorno está instalado de forma global).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CACHE = join(ROOT, 'tools/catalogo/.cache');
const tarifa = JSON.parse(readFileSync(join(ROOT, 'src/data/tarifa.json'), 'utf8'));
// «Octubre de 2026» → catalogo-fairino-espana-octubre-2026.pdf
const periodo = tarifa.fecha.toLowerCase().replace(/ de /g, '-').replace(/\s+/g, '-');
const OUT_PDF = join(ROOT, `public/descargas/catalogo-fairino-espana-${periodo}.pdf`);
const OUT_COVER = join(ROOT, 'src/assets/images/descargas/catalogo-portada.jpg');
const SITE = 'https://fairinocobot.com/';
mkdirSync(CACHE, { recursive: true });
mkdirSync(dirname(OUT_PDF), { recursive: true });
mkdirSync(dirname(OUT_COVER), { recursive: true });

// ------------------------------------------------------------------ datos
const productos = Object.fromEntries(
  readdirSync(join(ROOT, 'src/content/products'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => [basename(f, '.json'), JSON.parse(readFileSync(join(ROOT, 'src/content/products', f), 'utf8'))]),
);
// Contacto (el mismo de src/data/site.ts)
const CONTACTO = {
  telefonos: [
    { tel: '+34627775294', txt: '+34 627 775 294', email: 'po@fairino.es' },
  ],
  direccion: 'Avenida de la Estación, 12 · 45520 Villaluenga de la Sagra (Toledo)',
};

const APLICACIONES = Object.fromEntries(
  [...readFileSync(join(ROOT, 'src/data/applications.ts'), 'utf8').matchAll(/slug: '([^']+)',\s*\n\s*name: '([^']+)'/g)].map((m) => [m[1], m[2]]),
);
// Puntos fuertes (los de la portada de la web, src/data/home.ts)
const VALORES = [
  { icono: 'map-pin', titulo: 'Visítanos en Toledo', texto: 'Ven a Villaluenga de la Sagra (Toledo) y mira los cobots FAIRINO funcionando antes de decidir.', url: 'reservar-cita/' },
  { icono: 'layers', titulo: 'Toda la gama FAIRINO', texto: 'Diez cobots, cuatro controladores y los accesorios oficiales. Eliges lo que necesitas y nada más.', url: 'cobots/' },
  { icono: 'wrench', titulo: 'Integración y soluciones completas', texto: 'De la idea a la célula funcionando: diseño, montaje, programación, formación y soporte técnico.', url: 'soluciones-llave-en-mano/' },
];
const eur = (n) => `${Math.round(n).toLocaleString('de-DE')} €`;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (n) => (n == null ? null : String(n).replace('.', ','));
const spec = (p, label) => p.specs?.find((s) => s.label === label);
const imgPath = (p) => (p.images?.[0]?.src ? join(ROOT, 'src/content/products', p.images[0].src) : null);
const fichaUrl = (id) => `${SITE}productos/${id}/`;

// ------------------------------------------------------------------ fotos
// Fondo de las tarjetas de la web: brillo naranja abajo y degradado oscuro.
const fondo = (w, h) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <radialGradient id="a" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#1c130d"/><stop offset="1" stop-color="#0b0705"/></radialGradient>
    <radialGradient id="b" cx="50%" cy="86%" r="55%" gradientTransform="translate(0 0.4) scale(1 0.55)"><stop offset="0" stop-color="#ff6a13" stop-opacity="0.34"/><stop offset="1" stop-color="#ff6a13" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#a)"/><rect width="100%" height="100%" fill="url(#b)"/></svg>`);

async function tarjeta(src, w, h, pad = 0.1) {
  const out = join(CACHE, `${basename(src).replace(/\.[a-z]+$/i, '')}-${w}x${h}.jpg`);
  if (existsSync(out) && statSync(out).mtimeMs > statSync(src).mtimeMs) return out;
  const iw = Math.round(w * (1 - pad * 2));
  const ih = Math.round(h * (1 - pad * 2));
  const pieza = await sharp(src).resize(iw, ih, { fit: 'inside' }).png().toBuffer();
  await sharp(fondo(w, h))
    .composite([{ input: pieza, gravity: 'center' }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out);
  return out;
}

async function foto(src, w, h) {
  const out = join(CACHE, `${basename(src).replace(/\.[a-z]+$/i, '')}-${w}x${h}-foto.jpg`);
  if (existsSync(out) && statSync(out).mtimeMs > statSync(src).mtimeMs) return out;
  await sharp(src).resize(w, h, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  return out;
}

// Portada: tres cobots sobre una peana de luz naranja.
async function portada() {
  const out = join(CACHE, 'portada-cobots.jpg');
  const W = 1600;
  const H = 1250;
  const piezas = [
    { id: 'fr3', h: 640, x: 170 },
    { id: 'fr10', h: 900, x: 560 },
    { id: 'fr20', h: 760, x: 1010 },
  ];
  const capas = [];
  for (const p of piezas) {
    const buf = await sharp(imgPath(productos[p.id])).resize({ height: p.h }).png().toBuffer();
    const meta = await sharp(buf).metadata();
    capas.push({ input: buf, left: Math.round(p.x + (380 - meta.width) / 2), top: H - 150 - p.h });
  }
  const luz = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff8a3d" stop-opacity="0.55"/><stop offset="0.5" stop-color="#ff5a14" stop-opacity="0.18"/><stop offset="1" stop-color="#ff5a14" stop-opacity="0"/></radialGradient>
      <radialGradient id="c" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#1d130c"/><stop offset="1" stop-color="#070504"/></radialGradient>
      <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070504" stop-opacity="0"/><stop offset="1" stop-color="#070504"/></linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#c)"/>
    <ellipse cx="${W / 2}" cy="${H - 150}" rx="760" ry="120" fill="url(#g)"/>
    <ellipse cx="${W / 2}" cy="${H - 150}" rx="600" ry="78" fill="none" stroke="#ff8a3d" stroke-opacity="0.75" stroke-width="3"/>
    <ellipse cx="${W / 2}" cy="${H - 150}" rx="690" ry="96" fill="none" stroke="#ff5a1f" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="2 14"/>
  </svg>`);
  const sombra = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect y="${H - 140}" width="${W}" height="140" fill="url(#f)"/><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070504" stop-opacity="0"/><stop offset="1" stop-color="#070504"/></linearGradient></defs></svg>`);
  await sharp(luz).composite([...capas, { input: sombra }]).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
  return out;
}

// ------------------------------------------------------------------ iconos (lucide-static, como en la web)
const icono = (name, size = 28) => {
  const raw = readFileSync(join(ROOT, 'node_modules/lucide-static/icons', `${name}.svg`), 'utf8');
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/width="24"/, `width="${size}"`)
    .replace(/height="24"/, `height="${size}"`)
    .replace(/stroke-width="2"/, 'stroke-width="1.6"');
};
const WORDMARK = readFileSync(join(ROOT, 'src/assets/brand/fairino-wordmark.svg'), 'utf8').replace('<svg ', '<svg fill="currentColor" ');
const logo = (h) => `<span class="logo" style="--h:${h}mm">${WORDMARK}<b>SPAIN</b></span>`;

// ------------------------------------------------------------------ contenido
const tarifaCobot = Object.fromEntries(tarifa.cobots.map((c) => [c.producto, c]));
const tarifaAcc = Object.fromEntries([...tarifa.accesorios, ...tarifa.ecosistema].filter((a) => a.producto).map((a) => [a.producto, a]));

const cobots = Object.entries(productos)
  .filter(([, p]) => p.category === 'cobot')
  .sort((a, b) => (a[1].upcoming ? 1 : 0) - (b[1].upcoming ? 1 : 0) || a[1].order - b[1].order)
  .map(([id, p]) => ({ id, p, t: tarifaCobot[id] }));

// Tarjeta de accesorio: producto de la tienda (con o sin precio de tarifa) o línea solo de tarifa.
const deProducto = (id, extra = {}) => {
  const p = productos[id];
  const t = tarifaAcc[id];
  return {
    id,
    nombre: t?.nombre && !p ? t.nombre : p.name,
    alias: t?.nombre && t.nombre !== p.name ? `En tarifa: ${t.nombre}` : null,
    marca: p.brand ?? 'FAIRINO',
    texto: p.tagline,
    img: imgPath(p),
    pvp: t?.pvp ?? null,
    envio: t?.envio ?? null,
    codigo: t?.codigo ?? null,
    nuevo: t?.nuevo ?? false,
    url: fichaUrl(id),
    icono: extra.icono ?? 'box',
    ...extra,
  };
};
const deTarifa = (t, icono) => ({
  id: null,
  nombre: t.nombre,
  marca: 'Tarifa FAIRINO España',
  texto: t.nota ?? t.detalle ?? '',
  img: null,
  pvp: t.pvp,
  envio: t.envio ?? null,
  codigo: t.codigo,
  nuevo: t.nuevo ?? false,
  url: null,
  icono,
  soloTarifa: true,
});
const usados = new Set();
const prod = (id, extra) => {
  usados.add(id);
  return deProducto(id, extra);
};
const tarifaSin = (filtro, icono) => tarifa.accesorios.filter((a) => !a.producto && filtro(a)).map((a) => deTarifa(a, icono));
const resto = (filtro, icono) =>
  Object.entries(productos)
    .filter(([id, p]) => p.category === 'accesorio' && !usados.has(id) && filtro(id, p))
    .sort((a, b) => a[1].order - b[1].order)
    .map(([id]) => prod(id, { icono }));

// Control: las controladoras van de dos en dos (una línea de tarifa para AC y DC).
const controladoras = tarifa.controladoras.map((c) => {
  c.productos.forEach((id) => usados.add(id));
  const ps = c.productos.map((id) => productos[id]);
  return {
    nombre: c.nombre,
    marca: 'FAIRINO',
    texto: `${ps.map((p) => p.name).join(' · ')}. Caja de control del cobot; versiones a red (AC) y en continua (DC).`,
    img: imgPath(ps[0]),
    pvp: c.pvp,
    codigo: c.codigo,
    url: fichaUrl(c.productos[0]),
    icono: 'cpu',
  };
});
const control = [
  ...controladoras,
  prod('teach-pendant', { icono: 'cpu' }),
  prod('smart-tool', { icono: 'hand' }),
  prod('tarjeta-profinet-ethernetip', { icono: 'cpu' }),
  prod('safety-box', { icono: 'shield-check' }),
  prod('modulo-seguridad', { icono: 'shield-check' }),
  ...tarifaSin((a) => a.grupo === 'control', 'shield-check'),
  prod('kit-escaner-seguridad-idec', { icono: 'shield-check' }),
  prod('kit-hmi-delta', { icono: 'cpu' }),
];
const garras = [
  prod('epg40-050', { icono: 'hand' }),
  prod('pinza-ir75-300', { icono: 'hand' }),
  ...tarifaSin((a) => a.grupo === 'garra', 'hand'),
  ...resto((id, p) => p.group === 'garra', 'hand'),
];
const sensores = [
  prod('xjc-6f-d80-h28-a', { icono: 'scan-eye' }),
  ...tarifaSin((a) => a.grupo === 'fuerza', 'scan-eye'),
  ...resto((id, p) => p.group === 'fuerza', 'scan-eye'),
  prod('orbbec-gemini-2', { icono: 'scan-eye' }),
  ...resto((id, p) => p.group === 'vision', 'scan-eye'),
];
const montaje = [
  ...tarifa.ecosistema.map((e) => {
    const icono = /Track/.test(e.nombre) ? 'move-horizontal' : 'columns';
    return e.producto ? prod(e.producto, { icono }) : deTarifa(e, icono);
  }),
  ...resto((id, p) => p.group === 'montaje', 'wrench'),
];
// Lo que quede (por si se añaden accesorios nuevos a la tienda).
const otros = resto(() => true, 'box');

// ------------------------------------------------------------------ maquetación
const A4 = { cobotsPorPagina: 3, accPrimera: 12, accResto: 12 };
const trozos = (arr, primera, resto) => {
  const out = [arr.slice(0, primera)];
  for (let i = primera; i < arr.length; i += resto) out.push(arr.slice(i, i + resto));
  return out.filter((t) => t.length);
};

const secciones = [
  { id: 'cobots', n: '01', titulo: 'Cobots FAIRINO', intro: 'Diez modelos de seis ejes, de 3 a 30 kg de carga útil y hasta 1.900 mm de alcance, y lo que viene: el ART7 R7.' },
  { id: 'control', n: '02', titulo: 'Control, programación y seguridad', intro: 'Controladoras, consola, mandos y seguridad para trabajar con el cobot de forma intuitiva y segura.', items: control },
  { id: 'garras', n: '03', titulo: 'Garras y pinzas', intro: 'Pinzas eléctricas, de vacío y flexibles para coger cualquier pieza: de la FAIRINO EPG40-50 a toda la gama eléctrica de W-Robot, de dos, tres y cuatro dedos y giratorias.', items: garras },
  { id: 'sensores', n: '04', titulo: 'Sensores, visión y lijado', intro: 'Fuerza y par de seis ejes, cámaras 2D y 3D y el equipo de lijado para acabados con fuerza constante.', items: sensores },
  { id: 'montaje', n: '05', titulo: 'Montaje, séptimo eje y transportadores', intro: 'Tracks lineales, columnas, mesas modulares y soportes para llevar el cobot donde haga falta, y transportadores de charnela que le llevan y recogen el producto.', items: [...montaje, ...otros] },
  { id: 'soluciones', n: '06', titulo: 'Soluciones llave en mano', intro: 'Estaciones de soldadura y paletizado listas para producir, y logística autónoma.' },
];

// Páginas: [{tipo, ...}] y número de página de cada sección para el índice.
const paginas = [{ tipo: 'portada' }, { tipo: 'presentacion' }, { tipo: 'gama' }];
const paginaDe = {};
paginaDe.gama = 3;
for (const s of secciones) {
  paginaDe[s.id] = paginas.length + 1;
  if (s.id === 'cobots') {
    trozos(cobots, 2, A4.cobotsPorPagina).forEach((items, i) => paginas.push({ tipo: 'cobots', s, items, primera: i === 0 }));
  } else if (s.id === 'soluciones') {
    paginas.push({ tipo: 'soluciones', s, primera: true });
    paginas.push({ tipo: 'logistica', s });
  } else {
    trozos(s.items, A4.accPrimera, A4.accResto).forEach((items, i) => paginas.push({ tipo: 'acc', s, items, primera: i === 0 }));
  }
}
paginas.push({ tipo: 'contraportada' });
const TOTAL = paginas.length;

const fontUrl = (rel) => pathToFileURL(join(ROOT, 'node_modules', rel)).href;
const rutas = {};
const img = (p) => (p ? pathToFileURL(p).href : '');

async function prepararFotos() {
  rutas.portada = await portada();
  for (const c of cobots) rutas[c.id] = await tarjeta(imgPath(c.p), 720, 720, 0.07);
  for (const s of secciones) for (const it of s.items ?? []) if (it.img && !rutas[it.img]) rutas[it.img] = await tarjeta(it.img, 420, 420, 0.1);
  rutas.soldadura = await foto(join(ROOT, 'src/assets/products/fr5-negro/fairino-fr5-negro-escena-estacion-soldadura.webp'), 1200, 640);
  rutas.paletizado = await foto(join(ROOT, 'src/assets/products/fr20/fairino-fr20-escena-paletizado.webp'), 1200, 640);
  rutas.art7 = await tarjeta(imgPath(productos['art7-r7']), 1100, 700, 0.06);
}

// ------------------------------------------------------------------ piezas HTML
const cabecera = (seccion) => `
  <header class="pg-head">
    ${logo(4.2)}
    <span class="pg-head-r">${esc(seccion ?? 'Catálogo y tarifa')}</span>
  </header>`;
const pie = (n) => `
  <footer class="pg-foot">
    <span>FAIRINO España · Catálogo y ${esc(tarifa.titulo.toLowerCase())}</span>
    <a href="${SITE}">fairinocobot.com</a>
    <span class="pg-num">${String(n).padStart(2, '0')} <i>/ ${String(TOTAL).padStart(2, '0')}</i></span>
  </footer>`;
const precio = (pvp, extra = '') =>
  pvp != null ? `<span class="price">${eur(pvp)}</span>${extra}` : `<span class="price price-q">Consultar</span>`;
const abrirSeccion = (s) => `
  <div class="sec-open">
    <span class="sec-n">${s.n}</span>
    <div><h2>${esc(s.titulo)}</h2><p>${esc(s.intro)}</p></div>
  </div>`;

const tarjetaCobot = ({ id, p, t }) => {
  const peso = spec(p, 'Peso')?.value;
  const datos = [
    [p.upcoming ? 'Carga por brazo' : 'Carga útil', p.payloadKg != null ? `${num(p.payloadKg)} kg` : '—'],
    ['Alcance', p.reachMm != null ? `${p.reachMm.toLocaleString('de-DE')} mm` : '—'],
    ['Repetibilidad', p.repeatabilityMm != null ? `±${num(p.repeatabilityMm)} mm` : '—'],
    ['Peso', peso != null ? `${String(peso).replace('≈ ', '')} kg` : '—'],
  ];
  const extra = ['Velocidad TCP típica', 'Protección', 'Grados de libertad', 'Ejes por brazo', 'Sensor de par', 'Controlador', 'Montaje']
    .map((l) => spec(p, l))
    .filter((x) => x && x.value != null)
    .slice(0, 4)
    .map((x) => [x.label.replace('Velocidad TCP típica', 'Velocidad TCP'), `${num(x.value)}${x.unit ? ` ${x.unit}` : ''}`]);
  const apps = (p.applications ?? []).map((a) => APLICACIONES[a]).filter(Boolean);
  const estado = p.upcoming ? '<span class="tag tag-soon">Próximamente</span>' : t?.nuevo ? '<span class="tag">Nuevo</span>' : '';
  const precioHtml = p.upcoming
    ? `<a class="price price-q" href="${SITE}reservar-cita/?demo=art7-r7">Reserva tu demo</a>`
    : precio(t?.pvp ?? null);
  return `
  <article class="cobot">
    <div class="cobot-img"><img src="${img(rutas[id])}" alt=""></div>
    <div class="cobot-body">
      <div class="cobot-top">
        <h3>${esc(p.name)}</h3>${estado}
        ${t?.codigo ? `<span class="code">Ref. ${esc(t.codigo)}</span>` : ''}
      </div>
      <p class="cobot-tag">${esc(p.tagline)}</p>
      <dl class="specs">${datos.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      ${extra.length ? `<dl class="specs specs-2" style="--n:${extra.length}">${extra.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${apps.length ? `<p class="apps"><span>Aplicaciones</span>${apps.map((a) => `<i>${esc(a)}</i>`).join('')}</p>` : ''}
      <div class="cobot-buy">
        <div class="buy-price">${precioHtml}${t?.pvp != null ? '<span class="price-note">PVP · IP54</span>' : ''}</div>
        <ul class="buy-meta">
          ${t?.envio != null ? `<li><b>Envío nacional</b> ${eur(t.envio)}</li>` : ''}
          ${t?.caja ? `<li><b>Caja</b> ${esc([t.caja.peso, t.caja.medidas].filter(Boolean).join(' · '))}</li>` : ''}
          ${!t && !p.upcoming ? '<li>Precio y plazo bajo consulta</li>' : ''}
          ${p.upcoming ? '<li>Certificación CE en proceso</li>' : ''}
        </ul>
        <a class="link" href="${fichaUrl(id)}">Ver ficha ↗</a>
      </div>
    </div>
  </article>`;
};

const tarjetaAcc = (it) => `
  <article class="acc${it.soloTarifa ? ' acc-t' : ''}">
    <div class="acc-img">${it.img ? `<img src="${img(rutas[it.img])}" alt="">` : `<span class="acc-ico">${icono(it.icono, 34)}</span>`}</div>
    <div class="acc-body">
      <p class="acc-brand">${esc(it.marca)}${it.nuevo ? ' <span class="tag">Nuevo</span>' : ''}</p>
      <h3>${esc(it.nombre)}</h3>
      ${it.alias ? `<p class="acc-alias">${esc(it.alias)}</p>` : ''}
      <p class="acc-txt">${esc(it.texto)}</p>
      <div class="acc-foot">
        ${precio(it.pvp)}
        ${it.codigo ? `<span class="code">Ref. ${esc(it.codigo)}</span>` : ''}
        ${it.envio != null ? `<span class="code">Envío ${eur(it.envio)}</span>` : ''}
        ${it.url ? `<a class="link" href="${it.url}">Ficha ↗</a>` : ''}
      </div>
    </div>
  </article>`;

const asesoria = (titulo, texto) => `
  <a class="help" href="${SITE}reservar-cita/">
    <span class="help-ico">${icono('calendar-check', 30)}</span>
    <div><p class="eyebrow"><span class="dot"></span>Asesoramiento gratuito</p><h3>${esc(titulo)}</h3><p>${esc(texto)}</p></div>
    <span class="help-cta">Reservar cita ↗</span>
  </a>`;

// ------------------------------------------------------------------ páginas
const conTarifa = cobots.filter((c) => c.t);
const desde = Math.min(...conTarifa.map((c) => c.t.pvp));

function pagina(pg, n) {
  switch (pg.tipo) {
    case 'portada':
      return `
  <section class="page cover">
    <img class="cover-bg" src="${img(rutas.portada)}" alt="">
    <div class="cover-grid"></div>
    <div class="cover-top">${logo(9)}<span class="cover-badge">Distribuidor oficial · España</span></div>
    <div class="cover-title">
      <p class="eyebrow"><span class="dot"></span>${esc(tarifa.fecha)}</p>
      <h1>Catálogo<br><span>y tarifa</span></h1>
      <p class="cover-lead">Cobots, controladoras, garras, sensores, accesorios y soluciones llave en mano, con sus precios.</p>
    </div>
    <div class="cover-foot">
      <div><b>${conTarifa.length} cobots</b> desde ${eur(desde)}</div>
      <div><b>${secciones.slice(1, 5).reduce((s, x) => s + x.items.length, 0)}</b> accesorios y equipos</div>
      <div><b>Estaciones</b> de soldadura y paletizado</div>
      <a href="${SITE}">fairinocobot.com</a>
    </div>
  </section>`;

    case 'presentacion':
      return `
  <section class="page">
    ${cabecera('Presentación')}
    <div class="pres">
      <div class="pres-intro">
        <p class="eyebrow"><span class="dot"></span>FAIRINO España</p>
        <h2 class="big">Automatiza con cobots <span>FAIRINO</span>, con quien los conoce.</h2>
        <p class="lead">Somos el distribuidor oficial de FAIRINO en España. Asesoramos, vendemos, integramos y damos soporte desde nuestras instalaciones de Villaluenga de la Sagra (Toledo). Este catálogo reúne la gama y su tarifa vigente.</p>
      </div>
      <nav class="toc">
        <p class="toc-k">Contenido</p>
        <a href="#gama"><span>00</span>La gama de un vistazo<i>${String(paginaDe.gama).padStart(2, '0')}</i></a>
        ${secciones.map((s) => `<a href="#${s.id}"><span>${s.n}</span>${esc(s.titulo)}<i>${String(paginaDe[s.id]).padStart(2, '0')}</i></a>`).join('')}
      </nav>
      <div class="keys">
        <p class="toc-k">Cómo leer el catálogo</p>
        <ul>
          <li><span class="price">4.988 €</span> Precio de venta al público (PVP) de la ${esc(tarifa.titulo.toLowerCase())}, en euros.</li>
          <li><span class="price price-q">Consultar</span> Disponible en la tienda; te damos precio y plazo.</li>
          <li><span class="tag">Nuevo</span> Novedad en la tarifa.</li>
          <li><span class="link">Ficha ↗</span> Enlace a la ficha completa en fairinocobot.com: especificaciones, descargas y vídeos.</li>
        </ul>
      </div>
      <div class="values">${VALORES.map((v) => `<a href="${SITE}${v.url}"><span>${icono(v.icono, 22)}</span><b>${esc(v.titulo)}</b><p>${esc(v.texto)}</p></a>`).join('')}</div>
      <div class="notes">
        <p class="toc-k">Condiciones de la tarifa</p>
        <ul>${tarifa.notas.cobots.map((t) => `<li>${esc(t)}</li>`).join('')}<li>${esc(tarifa.notas.soldadura)}</li></ul>
      </div>
    </div>
    ${pie(n)}
  </section>`;

    case 'gama':
      return `
  <section class="page" id="gama">
    ${cabecera('La gama de un vistazo')}
    <div class="sec-open sec-open-s">
      <span class="sec-n">00</span>
      <div><h2>La gama de un vistazo</h2><p>Todos los cobots con sus datos clave y su precio. Ordenados por carga útil.</p></div>
    </div>
    <table class="range">
      <thead><tr><th></th><th>Modelo</th><th>Carga</th><th>Alcance</th><th>Repetib.</th><th>PVP</th><th>Envío</th></tr></thead>
      <tbody>
        ${cobots
          .map(
            ({ id, p, t }) => `<tr>
          <td><img src="${img(rutas[id])}" alt=""></td>
          <td><a href="${fichaUrl(id)}"><b>${esc(p.name)}</b></a>${t?.nuevo ? ' <span class="tag">Nuevo</span>' : ''}${p.upcoming ? ' <span class="tag tag-soon">Próximamente</span>' : ''}</td>
          <td>${p.payloadKg != null ? `${num(p.payloadKg)} kg` : '—'}${p.upcoming ? '<small> /brazo</small>' : ''}</td>
          <td>${p.reachMm != null ? `${p.reachMm.toLocaleString('de-DE')} mm` : '—'}</td>
          <td>${p.repeatabilityMm != null ? `±${num(p.repeatabilityMm)}` : '—'}</td>
          <td class="t-price">${t ? eur(t.pvp) : p.upcoming ? '—' : 'Consultar'}</td>
          <td>${t ? eur(t.envio) : '—'}</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>
    <p class="fine">${esc(tarifa.notas.cobots[0])} ${esc(tarifa.notas.cobots[1])}</p>
    ${pie(n)}
  </section>`;

    case 'cobots':
      return `
  <section class="page"${pg.primera ? ` id="${pg.s.id}"` : ''}>
    ${cabecera(pg.s.titulo)}
    ${pg.primera ? abrirSeccion(pg.s) : ''}
    <div class="cobots${pg.primera ? ' cobots-2' : ''}">${pg.items.map(tarjetaCobot).join('')}</div>
    ${!pg.primera && pg.items.length < A4.cobotsPorPagina ? asesoria('¿No sabes qué modelo elegir?', 'Cuéntanos la pieza, el ciclo y el espacio y te decimos qué cobot encaja. Visita nuestras instalaciones o hablamos por videollamada.') : ''}
    ${pie(n)}
  </section>`;

    case 'acc':
      return `
  <section class="page"${pg.primera ? ` id="${pg.s.id}"` : ''}>
    ${cabecera(pg.s.titulo)}
    ${pg.primera ? abrirSeccion(pg.s) : `<p class="cont">${esc(pg.s.titulo)} <span>· continuación</span></p>`}
    <div class="accs">${pg.items.map(tarjetaAcc).join('')}</div>
    ${pg.items.length <= 6 ? asesoria('¿Buscas algo que no está aquí?', 'Soportes, utillajes y garras a medida: te proponemos la solución y la integramos en tu célula.') : ''}
    ${pie(n)}
  </section>`;

    case 'soluciones': {
      const est = tarifa.estaciones;
      return `
  <section class="page" id="${pg.s.id}">
    ${cabecera(pg.s.titulo)}
    ${abrirSeccion(pg.s)}
    <div class="modes">${tarifa.modalidades.map((m, i) => `<div class="mode${i === 0 ? ' mode-on' : ''}"><b>${esc(m.nombre)}</b><p>${esc(m.texto)}</p></div>`).join('')}</div>
    <p class="fine">${esc(tarifa.notas.aplicaciones)}</p>
    <div class="stations">
      <div class="st-photo"><img src="${img(rutas.soldadura)}" alt=""><span>Estación de soldadura · imagen ilustrativa</span></div>
      <table class="st-table">
        <thead><tr><th>Estación</th><th>Incluye</th><th>Ref.</th><th>PVP CORE</th></tr></thead>
        <tbody>
        ${est
          .filter((e) => e.soldadura)
          .map((e) => `<tr><td><b>${esc(e.nombre.replace('Estación de soldadura ', 'Soldadura '))}</b>${e.nuevo ? ' <span class="tag">Nuevo</span>' : ''}<small>${esc(e.detalle)} · CE no incluido</small></td><td>${esc(e.incluye)}</td><td class="mono">${esc(e.codigo)}</td><td class="t-price">${eur(e.pvp)}</td></tr>`)
          .join('')}
        </tbody>
      </table>
      <p class="fine">${esc(tarifa.notas.soldadura)}</p>
    </div>
    ${pie(n)}
  </section>`;
    }

    case 'logistica': {
      const pal = tarifa.estaciones.filter((e) => !e.soldadura);
      const agv = tarifa.logistica[0];
      const art7 = productos['art7-r7'];
      return `
  <section class="page">
    ${cabecera(pg.s.titulo)}
    <p class="cont">Paletizado y logística autónoma</p>
    <div class="pal">
      <div class="st-photo st-photo-s"><img src="${img(rutas.paletizado)}" alt=""><span>Paletizado con FR20 · imagen ilustrativa</span></div>
      <div class="pal-list">
        ${pal
          .map(
            (e) => `<div class="pal-item"><div><b>${esc(e.nombre)}</b>${e.detalle ? `<small>${esc(e.detalle)}</small>` : ''}${e.nota ? `<small>${esc(e.nota)}</small>` : ''}<span class="code">Ref. ${esc(e.codigo)}${e.envio != null ? ` · envío ${eur(e.envio)}` : ''}</span></div>${precio(e.pvp)}</div>`,
          )
          .join('')}
        <div class="pal-item"><div><b>${esc(agv.nombre)}</b> <span class="tag">Nuevo</span><small>${esc(agv.nota)}</small><span class="code">Ref. ${esc(agv.codigo)}</span></div>${precio(agv.pvp)}</div>
      </div>
    </div>
    <a class="soon" href="${SITE}reservar-cita/?demo=art7-r7">
      <img src="${img(rutas.art7)}" alt="">
      <div>
        <p class="eyebrow"><span class="dot"></span>Próximamente · Robótica humanoide FAIRINO</p>
        <h3>ART7 R7</h3>
        <p>${esc(art7.tagline)}</p>
        <p class="soon-cta">Reserva tu demo ↗</p>
      </div>
    </a>
    ${pie(n)}
  </section>`;
    }

    case 'contraportada':
      return `
  <section class="page back">
    <img class="cover-bg back-bg" src="${img(rutas.portada)}" alt="">
    <div class="cover-grid"></div>
    <div class="back-main">
      ${logo(11)}
      <h2 class="big">Hablemos de tu <span>proyecto</span>.</h2>
      <p class="lead">Te asesoramos sin compromiso: qué modelo encaja, qué necesitas alrededor y cuánto cuesta. Ven a vernos o lo vemos por videollamada.</p>
      <div class="back-grid">
        ${CONTACTO.telefonos.map((c) => `<div><span class="k">Teléfono</span><a href="tel:${c.tel}">${c.txt}</a><a href="mailto:${c.email}">${c.email}</a></div>`).join('')}
        <div><span class="k">Instalaciones</span><p>${esc(CONTACTO.direccion)}</p></div>
        <div><span class="k">Web y tienda</span><a href="${SITE}">fairinocobot.com</a><a href="${SITE}reservar-cita/">Reservar cita ↗</a></div>
      </div>
    </div>
    <p class="back-legal">Precios de venta al público de la ${esc(tarifa.titulo.toLowerCase())} de FAIRINO Cobot S.L., en euros, sujetos a cambios sin previo aviso. Imágenes orientativas. Especificaciones según la documentación de FAIRINO.</p>
  </section>`;
  }
  return '';
}

// ------------------------------------------------------------------ CSS
const css = `
@font-face { font-family: 'Archivo'; src: url('${fontUrl('@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2')}') format('woff2'); font-weight: 100 900; font-stretch: 62% 125%; }
@font-face { font-family: 'Plex'; src: url('${fontUrl('@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2')}') format('woff2'); font-weight: 400; }
@font-face { font-family: 'Plex'; src: url('${fontUrl('@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2')}') format('woff2'); font-weight: 500; }
@font-face { font-family: 'Plex'; src: url('${fontUrl('@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2')}') format('woff2'); font-weight: 600 700; }
@font-face { font-family: 'PlexMono'; src: url('${fontUrl('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2')}') format('woff2'); font-weight: 500; }
@page { size: A4; margin: 0; }
:root { --ink:#070504; --paper:#0f0a07; --card:#120d0a; --card2:#1a130e; --line:#2a1f18; --text:#f5eee8; --muted:#c4b7ac; --mist:#9c8f84; --signal:#ff7a1a; --brand:#ff8a3d; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { background: var(--ink); color: var(--text); font: 400 8.6pt/1.45 'Plex', sans-serif; }
a { color: inherit; text-decoration: none; }
img { display: block; }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; break-after: page; padding: 20mm 13mm 16mm;
  background:
    linear-gradient(rgba(255,122,26,0.035) 1px, transparent 1px) 0 0 / 9mm 9mm,
    linear-gradient(90deg, rgba(255,122,26,0.035) 1px, transparent 1px) 0 0 / 9mm 9mm,
    radial-gradient(ellipse 80% 45% at 85% 0%, rgba(255,106,19,0.10), transparent 70%),
    var(--ink); }
.page:last-child { break-after: auto; }
.logo { display: inline-flex; flex-direction: column; align-items: flex-end; gap: calc(var(--h) * 0.18); color: #fff; }
.logo svg { height: var(--h); width: auto; }
.logo b { font: 500 calc(var(--h) * 0.36)/1 'Plex', sans-serif; letter-spacing: 0.5em; margin-right: -0.5em; color: var(--signal); }
.pg-head { position: absolute; top: 8mm; left: 13mm; right: 13mm; display: flex; justify-content: space-between; align-items: center; padding-bottom: 3mm; border-bottom: 0.3mm solid var(--line); }
.pg-head-r, .pg-foot, .eyebrow, .code, .toc-k, .k, dt, th, .acc-brand, .cont, .price-note, .tag { font-family: 'PlexMono', monospace; text-transform: uppercase; letter-spacing: 0.14em; }
.pg-head-r { font-size: 6.4pt; color: var(--mist); }
.pg-foot { position: absolute; bottom: 7mm; left: 13mm; right: 13mm; display: flex; justify-content: space-between; align-items: center; font-size: 6.2pt; color: var(--mist); border-top: 0.3mm solid var(--line); padding-top: 2.6mm; }
.pg-foot a { color: var(--brand); }
.pg-num { color: var(--text); font-size: 7.4pt; } .pg-num i { font-style: normal; color: var(--mist); }
.eyebrow { display: flex; align-items: center; gap: 2mm; font-size: 6.8pt; color: var(--brand); }
.dot { width: 1.6mm; height: 1.6mm; border-radius: 50%; background: var(--signal); box-shadow: 0 0 2mm rgba(255,122,26,0.9); }
h1, h2, h3 { font-family: 'Archivo', sans-serif; font-stretch: 125%; font-weight: 800; line-height: 1; letter-spacing: -0.005em; }
.big { font-size: 25pt; } .big span, h1 span { color: var(--signal); }
.lead { font-size: 10pt; color: var(--muted); line-height: 1.5; }
.tag { display: inline-block; padding: 0.5mm 1.8mm; border-radius: 9mm; font-size: 5.6pt; color: var(--ink); background: var(--signal); vertical-align: middle; font-weight: 500; }
.tag-soon { background: transparent; color: var(--brand); border: 0.25mm solid rgba(255,122,26,0.6); }
.code { font-size: 5.8pt; color: var(--mist); letter-spacing: 0.1em; }
.price { display: inline-block; font: 500 12pt/1 'PlexMono', monospace; color: var(--ink); background: linear-gradient(180deg, #ff9a52, var(--signal)); padding: 1.4mm 2.6mm; border-radius: 1.8mm; white-space: nowrap; }
.price-q { background: transparent; color: var(--brand); border: 0.3mm solid rgba(255,138,61,0.55); font-size: 8.5pt; padding: 1.2mm 2.4mm; }
.link { font: 500 7pt 'Plex', sans-serif; color: var(--brand); }
.fine { font-size: 6.8pt; color: var(--mist); margin-top: 3mm; }

/* Portada */
.cover { padding: 0; background: var(--ink); }
.cover-bg { position: absolute; left: 0; right: 0; bottom: 18mm; width: 100%; height: auto; }
.cover-grid { position: absolute; inset: 0; background:
  linear-gradient(rgba(255,122,26,0.05) 1px, transparent 1px) 0 0 / 12mm 12mm,
  linear-gradient(90deg, rgba(255,122,26,0.05) 1px, transparent 1px) 0 0 / 12mm 12mm,
  linear-gradient(180deg, var(--ink) 0%, rgba(7,5,4,0.85) 30%, rgba(7,5,4,0) 55%, rgba(7,5,4,0) 85%, var(--ink) 100%);
  -webkit-mask-image: none; }
.cover-top { position: absolute; top: 15mm; left: 15mm; right: 15mm; display: flex; justify-content: space-between; align-items: flex-start; }
.cover-badge { font: 500 6.6pt 'PlexMono', monospace; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); border: 0.3mm solid var(--line); padding: 1.6mm 3mm; border-radius: 9mm; background: rgba(7,5,4,0.6); }
.cover-title { position: absolute; top: 46mm; left: 15mm; right: 15mm; }
.cover-title h1 { font-size: 54pt; margin-top: 5mm; line-height: 0.92; }
.cover-lead { margin-top: 6mm; max-width: 110mm; font-size: 11pt; color: var(--muted); }
.cover-foot { position: absolute; bottom: 12mm; left: 15mm; right: 15mm; display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: 6mm; align-items: end; font-size: 8pt; color: var(--muted); border-top: 0.3mm solid rgba(255,122,26,0.4); padding-top: 4mm; }
.cover-foot b { display: block; font: 800 13pt 'Archivo', sans-serif; font-stretch: 120%; color: var(--text); }
.cover-foot a { font: 500 8pt 'PlexMono', monospace; color: var(--brand); letter-spacing: 0.12em; }

/* Presentación */
.pres { display: grid; gap: 9mm; margin-top: 4mm; }
.pres-intro { display: grid; gap: 4mm; }
.toc { display: grid; border-top: 0.3mm solid var(--line); }
.toc-k { font-size: 6.6pt; color: var(--mist); margin-bottom: 2mm; }
.toc a { display: grid; grid-template-columns: 12mm 1fr auto; align-items: baseline; padding: 2.6mm 0; border-bottom: 0.3mm solid var(--line); font: 700 12pt 'Archivo', sans-serif; font-stretch: 115%; }
.toc a span { font: 500 8pt 'PlexMono', monospace; color: var(--signal); }
.toc a i { font: 500 8pt 'PlexMono', monospace; font-style: normal; color: var(--mist); }
.toc .toc-k { margin: 0; padding-top: 3mm; }
.keys ul, .notes ul { list-style: none; display: grid; gap: 2.4mm; }
.keys li { display: grid; grid-template-columns: 26mm 1fr; align-items: center; gap: 3mm; color: var(--muted); }
.keys li > :first-child { justify-self: start; }
.notes { padding: 4mm 5mm; border: 0.3mm solid var(--line); border-radius: 3mm; background: rgba(255,255,255,0.02); }
.notes li { position: relative; padding-left: 4mm; color: var(--muted); }
.notes li::before { content: ''; position: absolute; left: 0; top: 1.6mm; width: 1.4mm; height: 1.4mm; border-radius: 50%; background: var(--signal); }

/* Apertura de sección */
.sec-open { display: grid; grid-template-columns: auto 1fr; gap: 6mm; align-items: end; padding: 3mm 0 6mm; margin-bottom: 5mm; border-bottom: 0.3mm solid rgba(255,122,26,0.35); }
.sec-n { font: 800 44pt/0.8 'Archivo', sans-serif; font-stretch: 125%; color: transparent; -webkit-text-stroke: 0.35mm var(--signal); }
.sec-open h2 { font-size: 21pt; } .sec-open p { margin-top: 2mm; color: var(--muted); font-size: 9pt; max-width: 120mm; }
.sec-open-s { margin-bottom: 4mm; }
.cont { font-size: 7pt; color: var(--brand); margin-bottom: 4mm; } .cont span { color: var(--mist); }

/* Tabla de la gama */
.range { width: 100%; border-collapse: collapse; }
.range th { font-size: 5.8pt; color: var(--mist); text-align: left; padding: 0 2mm 2mm; font-weight: 500; border-bottom: 0.3mm solid var(--line); }
.range td { padding: 1.2mm 2mm; border-bottom: 0.3mm solid var(--line); font-size: 8.4pt; vertical-align: middle; }
.range td:first-child { width: 15mm; padding-left: 0; } .range img { width: 13mm; height: 13mm; border-radius: 1.6mm; object-fit: cover; }
.range td b { font: 800 10.5pt 'Archivo', sans-serif; font-stretch: 120%; }
.range small { color: var(--mist); font-size: 6.5pt; }
.t-price { font: 500 9.5pt 'PlexMono', monospace; color: var(--brand); white-space: nowrap; }

/* Cobots */
.cobots { display: grid; gap: 5mm; }
.cobot { display: grid; grid-template-columns: 72mm 1fr; gap: 6mm; height: 81mm; padding: 4mm; border: 0.3mm solid var(--line); border-radius: 4mm; background: linear-gradient(160deg, var(--card2), var(--card)); }
.cobot-img { border-radius: 3mm; overflow: hidden; } .cobot-img img { width: 100%; height: 100%; object-fit: cover; }
.cobot-body { display: grid; grid-template-rows: auto auto auto auto auto 1fr; gap: 2.2mm; min-width: 0; }
.specs-2 { grid-template-columns: repeat(var(--n), 1fr); background: rgba(255,255,255,0.02); }
.specs-2 dd { font-size: 7.6pt; white-space: normal; line-height: 1.25; }
.apps { display: flex; flex-wrap: wrap; gap: 1.2mm; align-items: center; font-size: 6.6pt; }
.apps span { font: 500 5.4pt 'PlexMono', monospace; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mist); margin-right: 1mm; }
.apps i { font-style: normal; padding: 0.5mm 1.8mm; border: 0.25mm solid var(--line); border-radius: 9mm; color: var(--muted); }
.cobot-top { display: flex; align-items: center; gap: 3mm; flex-wrap: wrap; }
.cobot-top h3 { font-size: 22pt; } .cobot-top .code { margin-left: auto; }
.cobot-tag { color: var(--muted); font-size: 8.6pt; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.specs { display: grid; grid-template-columns: repeat(4, 1fr); border: 0.3mm solid var(--line); border-radius: 2.4mm; overflow: hidden; }
.specs div { padding: 2mm 2.4mm; border-right: 0.3mm solid var(--line); } .specs div:last-child { border-right: 0; }
dt { font-size: 5.4pt; color: var(--mist); } dd { font: 500 9.4pt 'PlexMono', monospace; margin-top: 0.8mm; white-space: nowrap; }
.cobot-buy { align-self: end; display: grid; grid-template-columns: auto 1fr auto; gap: 4mm; align-items: end; }
.buy-price { display: grid; gap: 1.2mm; justify-items: start; } .buy-price .price { font-size: 15pt; padding: 1.8mm 3.2mm; }
.price-note { font-size: 5.4pt; color: var(--mist); }
.buy-meta { list-style: none; display: grid; gap: 0.8mm; color: var(--muted); font-size: 7.6pt; }
.buy-meta b { font: 500 5.8pt 'PlexMono', monospace; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mist); margin-right: 1mm; }

/* Accesorios */
.accs { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
.acc { display: grid; grid-template-columns: 29mm 1fr; gap: 3.2mm; height: 35mm; padding: 2.6mm; border: 0.3mm solid var(--line); border-radius: 3.4mm; background: linear-gradient(160deg, var(--card2), var(--card)); }
.acc-img { border-radius: 2.4mm; overflow: hidden; background: radial-gradient(ellipse at 50% 85%, rgba(255,106,19,0.25), transparent 60%), radial-gradient(circle at 50% 40%, #1c130d, #0b0705 75%); display: grid; place-items: center; }
.acc-img img { width: 100%; height: 100%; object-fit: cover; }
.acc-ico { color: var(--brand); opacity: 0.85; }
.acc-body { display: grid; grid-template-rows: auto auto auto 1fr auto; gap: 0.7mm; min-width: 0; }
.acc-brand { font-size: 5.6pt; color: var(--mist); }
.acc h3 { font-size: 9.6pt; font-stretch: 110%; line-height: 1.1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.acc-alias { font-size: 6.6pt; color: var(--brand); }
.acc-txt { font-size: 7.2pt; color: var(--muted); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.acc-foot { display: flex; align-items: center; gap: 2.4mm; flex-wrap: wrap; }
.acc-foot .price { font-size: 9.5pt; padding: 1.1mm 2mm; } .acc-foot .price-q { font-size: 7pt; }
.acc-foot .link { margin-left: auto; }
.acc-t { border-style: dashed; border-color: rgba(255,122,26,0.28); }

/* Bloque de asesoramiento */
.help { margin-top: 5mm; display: grid; grid-template-columns: auto 1fr auto; gap: 5mm; align-items: center; padding: 5mm 6mm; border: 0.3mm solid rgba(255,122,26,0.45); border-radius: 4mm; background: linear-gradient(120deg, #24150b, #0b0705 70%); }
.help-ico { display: grid; place-items: center; width: 16mm; height: 16mm; border-radius: 4mm; background: rgba(255,122,26,0.12); color: var(--brand); }
.help h3 { font-size: 15pt; margin: 1.6mm 0 1.2mm; } .help p:last-child { color: var(--muted); font-size: 8.4pt; max-width: 110mm; }
.help-cta { font: 600 9pt 'Plex', sans-serif; color: var(--ink); background: var(--signal); padding: 2.4mm 4mm; border-radius: 2mm; white-space: nowrap; }
.values { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
.values a { display: grid; gap: 1.6mm; align-content: start; padding: 4mm; border: 0.3mm solid var(--line); border-radius: 3mm; background: linear-gradient(160deg, var(--card2), var(--card)); }
.values span { color: var(--brand); } .values b { font: 800 10pt 'Archivo', sans-serif; font-stretch: 115%; } .values p { font-size: 7.4pt; color: var(--muted); }

/* Soluciones */
.modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
.mode { padding: 3.4mm; border: 0.3mm solid var(--line); border-radius: 3mm; background: var(--card); }
.mode b { font: 800 10pt 'Archivo', sans-serif; font-stretch: 115%; color: var(--brand); } .mode p { margin-top: 1.4mm; font-size: 7.4pt; color: var(--muted); }
.mode-on { border-color: rgba(255,122,26,0.55); background: linear-gradient(160deg, #24150b, var(--card)); }
.stations { margin-top: 5mm; display: grid; gap: 4mm; }
.st-photo { position: relative; height: 62mm; border-radius: 3.4mm; overflow: hidden; border: 0.3mm solid var(--line); }
.st-photo img { width: 100%; height: 100%; object-fit: cover; }
.st-photo span { position: absolute; right: 2.4mm; bottom: 2.4mm; font: 500 5.6pt 'PlexMono', monospace; letter-spacing: 0.12em; text-transform: uppercase; background: rgba(7,5,4,0.65); padding: 1mm 2mm; border-radius: 9mm; color: var(--muted); }
.st-photo-s { height: 56mm; }
.st-table { width: 100%; border-collapse: collapse; }
.st-table th { font-size: 5.8pt; color: var(--mist); text-align: left; font-weight: 500; padding: 0 2mm 1.6mm; border-bottom: 0.3mm solid var(--line); }
.st-table td { padding: 2mm; border-bottom: 0.3mm solid var(--line); font-size: 8pt; color: var(--muted); vertical-align: top; }
.st-table td b { font: 800 10pt 'Archivo', sans-serif; font-stretch: 115%; color: var(--text); }
.st-table small { display: block; font-size: 6.6pt; color: var(--mist); margin-top: 0.6mm; }
.mono { font: 500 7pt 'PlexMono', monospace; letter-spacing: 0.06em; }
.pal { display: grid; gap: 4mm; }
.pal-list { display: grid; gap: 2.6mm; }
.pal-item { display: grid; grid-template-columns: 1fr auto; gap: 4mm; align-items: center; padding: 3mm 3.6mm; border: 0.3mm solid var(--line); border-radius: 3mm; background: var(--card); }
.pal-item b { font: 800 10.5pt 'Archivo', sans-serif; font-stretch: 115%; } .pal-item small { display: block; font-size: 7pt; color: var(--muted); margin-top: 0.8mm; } .pal-item .code { display: block; margin-top: 1.2mm; }
.soon { position: absolute; left: 13mm; right: 13mm; bottom: 19mm; display: grid; grid-template-columns: 78mm 1fr; gap: 5mm; align-items: center; padding: 4mm; border: 0.3mm solid rgba(255,122,26,0.45); border-radius: 4mm; background: linear-gradient(120deg, #1d120a, #0b0705); }
.soon img { width: 100%; border-radius: 2.4mm; }
.soon h3 { font-size: 26pt; margin: 2mm 0; } .soon p { color: var(--muted); font-size: 8.4pt; } .soon-cta { margin-top: 2mm; color: var(--brand) !important; font-weight: 600; }

/* Contraportada */
.back { padding: 0; }
.back-bg { opacity: 0.55; }
.back-main { position: absolute; top: 24mm; left: 15mm; right: 15mm; display: grid; gap: 7mm; justify-items: start; }
.back-main .big { font-size: 34pt; margin-top: 8mm; }
.back-main .lead { max-width: 135mm; }
.back-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm 10mm; margin-top: 2mm; width: 100%; }
.back-grid div { display: grid; gap: 1mm; border-top: 0.3mm solid rgba(255,122,26,0.4); padding-top: 2.6mm; }
.k { font-size: 6pt; color: var(--mist); }
.back-grid a, .back-grid p { font-size: 11pt; color: var(--text); } .back-grid a + a { color: var(--brand); font-size: 9.5pt; }
.back-legal { position: absolute; left: 15mm; right: 15mm; bottom: 10mm; font-size: 6.4pt; color: var(--mist); }
`;

// ------------------------------------------------------------------ generar
async function main() {
  await prepararFotos();
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Catálogo y tarifa FAIRINO España · ${esc(tarifa.fecha)}</title><style>${css}</style></head><body>
${paginas.map((pg, i) => pagina(pg, i + 1)).join('\n')}
</body></html>`;
  const htmlPath = join(CACHE, 'catalogo.html');
  writeFileSync(htmlPath, html);

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    const req = createRequire(import.meta.url);
    ({ chromium } = req(join(execSync('npm root -g').toString().trim(), 'playwright')));
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: OUT_PDF, format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
  // Portada para la página de descargas
  const cover = await page.locator('.cover').screenshot({ type: 'jpeg', quality: 86 });
  await sharp(cover).resize({ width: 900 }).jpeg({ quality: 84, mozjpeg: true }).toFile(OUT_COVER);
  await browser.close();
  const kb = Math.round(statSync(OUT_PDF).size / 1024);
  // Datos para la página de descargas (src/pages/descargas.astro)
  writeFileSync(
    join(ROOT, 'src/data/catalogo.json'),
    JSON.stringify(
      {
        archivo: 'descargas/' + basename(OUT_PDF),
        titulo: `Catálogo y tarifa FAIRINO España · ${tarifa.fecha.replace('de ', '')}`,
        fecha: tarifa.fecha,
        paginas: TOTAL,
        kb,
        cobots: conTarifa.length,
        desde,
        accesorios: secciones.slice(1, 5).reduce((n, x) => n + x.items.length, 0),
        portada: 'descargas/catalogo-portada.jpg',
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`catálogo: ${OUT_PDF.replace(ROOT + '/', '')} · ${TOTAL} páginas · ${kb} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
