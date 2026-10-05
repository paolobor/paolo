// Genera el mapa nocturno de España para la franja «Red de colaboradores» del inicio, al estilo del vídeo
// de FDI: tierra oscura, provincias apenas marcadas, costa y frontera con brillo naranja y luces de los municipios.
//   src/assets/images/mapa/espana-noche.webp  (la imagen; Astro saca de ella los tamaños que necesita)
//   src/data/mapa-espana.json                  (tamaño y proyección, para poner encima los puntos de cada colaborador)
// Uso:  npm i --prefix tools/mapa && node tools/mapa/generar-mapa.mjs
// Datos: límites de España del IGN (CC BY 4.0) vía es-atlas; países vecinos de Natural Earth (dominio público)
// vía world-atlas. Se pinta con el Chromium de Playwright (los filtros SVG dan el brillo) y se guarda con sharp.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { geoMercator, geoPath, geoCentroid } from 'd3-geo';
import { feature, mesh, merge } from 'topojson-client';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '../..');
const require = createRequire(import.meta.url);
const { chromium } = createRequire(join(execSync('npm root -g').toString().trim(), 'x.js'))('playwright');

const es = require('es-atlas/es/municipalities.json');
const world = require('world-atlas/countries-10m.json');

// Encuadre: península, Baleares, Ceuta y Melilla, con un margen de Portugal, Francia y el norte de África.
const W = 1100;
const corners = { type: 'MultiPoint', coordinates: [[-10.2, 35.0], [4.9, 35.0], [-10.2, 44.3], [4.9, 44.3]] };
const proj = geoMercator().fitWidth(W, corners);
const H = Math.ceil(geoPath(proj).bounds(corners)[1][1]);
const path = geoPath(proj);
const P = (lon, lat) => proj([lon, lat]).map((v) => +v.toFixed(1));

// España sin Canarias (fuera del encuadre) ni Gibraltar.
const fuera = (name) => /^Canarias|^Gibraltar/.test(name);
const regiones = { type: 'GeometryCollection', geometries: es.objects.autonomous_regions.geometries.filter((g) => !fuera(g.properties.name)) };
const tierra = merge(es, regiones.geometries);
const contorno = mesh(es, regiones, (a, b) => a === b);
const lineasRegion = mesh(es, regiones, (a, b) => a !== b);
const provincias = { type: 'GeometryCollection', geometries: es.objects.provinces.geometries.filter((g) => !['35', '38', '54'].includes(String(g.id))) };
const lineasProvincia = mesh(es, provincias, (a, b) => a !== b);

const vecinos = feature(world, world.objects.countries).features.filter((f) =>
  ['Portugal', 'France', 'Andorra', 'Morocco', 'Algeria', 'Gibraltar', 'Italy', 'Switzerland'].includes(f.properties.name),
);

// Luces: ciudades grandes (resplandor) y un punto por municipio, más vivo cuanto más cerca de una ciudad grande.
// [lon, lat, tamaño 1-3, país (1 = España, 0.5 = vecino)]
const ciudades = [
  [-3.7038, 40.4168, 3, 1], [2.1686, 41.3874, 3, 1], [-0.3763, 39.4699, 2, 1], [-5.9845, 37.3891, 2, 1],
  [-0.8891, 41.6488, 2, 1], [-4.4214, 36.7213, 2, 1], [-2.935, 43.263, 2, 1], [-1.1307, 37.9922, 1.5, 1],
  [2.6502, 39.5696, 1.5, 1], [-0.481, 38.3452, 1.5, 1], [-4.7794, 37.8882, 1.4, 1], [-4.7245, 41.6523, 1.4, 1],
  [-8.7207, 42.2406, 1.4, 1], [-5.6611, 43.5322, 1.2, 1], [-8.4115, 43.3623, 1.3, 1], [-2.6716, 42.8467, 1.1, 1],
  [-3.5986, 37.1773, 1.3, 1], [-5.8593, 43.3614, 1.1, 1], [-1.6458, 42.8125, 1.1, 1], [-1.9812, 43.3183, 1.1, 1],
  [-3.8099, 43.4623, 1.1, 1], [-0.9966, 37.6257, 1, 1], [-2.4637, 36.834, 1, 1], [-0.0513, 39.9864, 1, 1],
  [-3.6969, 42.3439, 1, 1], [-5.6635, 40.9701, 1, 1], [-2.4449, 42.4627, 1, 1], [-6.9707, 38.8794, 1, 1],
  [-6.9447, 37.2614, 1, 1], [-6.2886, 36.5271, 1, 1], [-6.1261, 36.685, 1, 1], [1.2445, 41.1189, 1, 1],
  [0.62, 41.6176, 1, 1], [2.8214, 41.9794, 1, 1], [-5.5671, 42.5987, 0.9, 1], [-4.0273, 39.8628, 0.9, 1],
  [-1.8585, 38.9943, 0.9, 1], [-3.7849, 37.7796, 0.9, 1], [-4.4208, 36.5101, 1, 1], [-8.5448, 42.8782, 1, 1],
  [-9.1393, 38.7223, 2, 0.5], [-8.6291, 41.1579, 1.6, 0.5], [-8.4265, 41.5454, 1, 0.5], [-8.4103, 40.2033, 0.9, 0.5],
  [-7.9304, 37.0194, 0.9, 0.5], [1.4442, 43.6047, 1.6, 0.5], [2.8948, 42.6887, 1, 0.5], [-1.4748, 43.4929, 1, 0.5],
  [3.8767, 43.6108, 1.2, 0.5], [-5.834, 35.7595, 1.3, 0.5], [-5.3626, 35.5889, 1, 0.5], [-2.9381, 35.1681, 0.8, 0.5],
];
const xy = ciudades.map(([lon, lat, t, k]) => [...P(lon, lat), t, k]);
const brillo = (x, y) => {
  let s = 0;
  for (const [cx, cy, t] of xy) {
    const r = 10 + 9 * t;
    s += Math.min(1, t / 2) * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * r * r));
  }
  return Math.min(1, s);
};
const municipios = es.objects.municipalities.geometries
  .filter((g) => !/^(35|38)/.test(String(g.id)))
  .map((g) => {
    const [x, y] = P(...geoCentroid(feature(es, g)));
    const b = brillo(x, y);
    return `<circle cx="${x}" cy="${y}" r="${(0.6 + 0.6 * b).toFixed(2)}" opacity="${(0.24 + 0.74 * b).toFixed(2)}"/>`;
  })
  .join('');
const resplandores = xy
  .map(([x, y, t, k]) => `<circle cx="${x}" cy="${y}" r="${(8 + 11 * t).toFixed(1)}" fill="url(#halo)" opacity="${(0.55 * k).toFixed(2)}"/>` +
    `<circle cx="${x}" cy="${y}" r="${(0.8 + 0.5 * t).toFixed(1)}" fill="#fff1dc" opacity="${(0.9 * k).toFixed(2)}"/>`)
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <radialGradient id="halo"><stop offset="0" stop-color="#ffc98a" stop-opacity=".75"/><stop offset=".35" stop-color="#ff9a3c" stop-opacity=".28"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
  <pattern id="puntos" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".55" fill="#ffd2a8" opacity=".14"/></pattern>
  <filter id="brillo" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>
  <filter id="brillo-ancho" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
  <!-- Los países vecinos se apagan hacia los bordes de la imagen para que no se vea el corte. -->
  <linearGradient id="borde-x"><stop offset="0" stop-color="#fff"/><stop offset=".86" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
  <linearGradient id="borde-y" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".1" stop-color="#fff"/></linearGradient>
  <mask id="borde-der" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#borde-x)"/></mask>
  <mask id="borde-sup" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#borde-y)"/></mask>
  <clipPath id="espana"><path d="${path(tierra)}"/></clipPath>
</defs>
<g mask="url(#borde-der)"><g mask="url(#borde-sup)">
  <g fill="#140f0b" stroke="#ff9a50" stroke-opacity=".22" stroke-width=".6">${vecinos.map((f) => `<path d="${path(f)}"/>`).join('')}</g>
  <g fill="url(#puntos)">${vecinos.map((f) => `<path d="${path(f)}"/>`).join('')}</g>
</g></g>
<path d="${path(tierra)}" fill="#1b130e"/>
<g clip-path="url(#espana)">
  <path d="${path(lineasProvincia)}" fill="none" stroke="#ff9a50" stroke-opacity=".14" stroke-width=".5"/>
  <path d="${path(lineasRegion)}" fill="none" stroke="#ff9a50" stroke-opacity=".3" stroke-width=".8"/>
  <g fill="#ffbf80">${municipios}</g>
</g>
<g style="mix-blend-mode:screen">${resplandores}</g>
<path d="${path(contorno)}" fill="none" stroke="#ff6a13" stroke-width="7" stroke-opacity=".35" filter="url(#brillo-ancho)"/>
<path d="${path(contorno)}" fill="none" stroke="#ff7a1a" stroke-width="2.6" stroke-opacity=".7" filter="url(#brillo)"/>
<path d="${path(contorno)}" fill="none" stroke="#ff8f3a" stroke-width="1.1" stroke-linejoin="round"/>
<path d="${path(contorno)}" fill="none" stroke="#ffd9b0" stroke-width=".35" stroke-opacity=".7" stroke-linejoin="round"/>
</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
const png = await page.locator('svg').screenshot({ omitBackground: true });
await browser.close();

const outImg = join(repo, 'src/assets/images/mapa/espana-noche.webp');
mkdirSync(dirname(outImg), { recursive: true });
await sharp(png).webp({ quality: 90, alphaQuality: 90, effort: 6 }).toFile(outImg);
writeFileSync(
  join(repo, 'src/data/mapa-espana.json'),
  JSON.stringify({ width: W, height: H, scale: +proj.scale().toFixed(4), translate: proj.translate().map((v) => +v.toFixed(4)) }, null, 2) + '\n',
);
console.log('mapa', W, 'x', H, '→', outImg);
