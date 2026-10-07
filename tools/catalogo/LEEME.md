# Catálogo y tarifa en PDF

`node tools/catalogo/generar.mjs` monta el catálogo de FAIRINO España con la misma estética que la web y lo guarda en
`public/descargas/catalogo-fairino-espana-octubre-2026.pdf` (el nombre sale de «fecha» en la tarifa); la página `/descargas/` lo enlaza en «Catálogo online».

- **Precios:** `src/data/tarifa.json`, copiados tal cual de la tarifa del cliente
  («00. TARIFA FAIRINO. Julio 2026 new.pdf»); el catálogo sale con fecha de octubre de 2026 a petición del cliente. Cada línea con `producto` toma la foto y los datos de su ficha
  (`src/content/products/<id>.json`); las líneas sin `producto` solo están en la tarifa (borde discontinuo e icono).
  Los productos de la tienda que no están en la tarifa salen con «Consultar». No se inventan precios.
- **Fotos:** se pasan a JPEG sobre el fondo oscuro de las tarjetas (caché en `tools/catalogo/.cache/`, fuera de git),
  para que el PDF pese poco.
- **Salida extra:** `src/assets/images/descargas/catalogo-portada.jpg` (portada para la web) y
  `src/data/catalogo.json` (páginas, peso y cifras que enseña la página de descargas).
- **Nueva tarifa:** copia el JSON con la fecha nueva, cambia la ruta en `generar.mjs` (TARIFA y nombre del PDF) y vuelve
  a generar. Para añadir un producto basta con crear su ficha en la tienda: entra solo en su sección.

Necesita Playwright con Chromium (en este entorno está instalado de forma global; `npm i -g playwright` si falta).

## Dudas de la tarifa

Confirmado por el cliente (7 de octubre de 2026):

- FR3 WML: alcance 922 mm (la tarifa dice 1000 mm en la primera página).
- «Track 25 mtr»: 25 m.
- Escáner de seguridad 270° (SAF-SCAN-270) = escáner IDEC SE2L de la tienda.
- Módulo de seguridad (seta, 129 €) y Safety Box (tienda) son productos distintos.

- WR.RG (75-300) = pinza JODELL RG75-300 (IR75-300) de la tienda.
- Sensor G2CX-6F-D80-H28 (tarifa) = GZCX-6F-75MM de la tienda.
- WR.EPG2 / WR.EPG3 / WR.EPG4 = pinzas W-Robot EPG2-50-150, EPG3-10-10 y EPG4-10-50.

Las líneas de la tarifa con `producto` (también las de `ecosistema`, como los tracks y la columna con base en H) salen
en el catálogo con la foto y el enlace de su ficha y el precio de la tarifa; las que no lo tienen, solo con el texto.
