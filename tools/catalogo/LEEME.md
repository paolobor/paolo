# Catálogo y tarifa en PDF

`node tools/catalogo/generar.mjs` monta el catálogo de FAIRINO España con la misma estética que la web y lo guarda en
`public/descargas/catalogo-fairino-espana-julio-2026.pdf`; la página `/descargas/` lo enlaza en «Catálogo online».

- **Precios:** `src/data/tarifa-julio-2026.json`, copiados tal cual de la tarifa del cliente
  («00. TARIFA FAIRINO. Julio 2026 new.pdf»). Cada línea con `producto` toma la foto y los datos de su ficha
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

Pendiente de confirmar:

- WR.RG (75-300): se ha asociado a la pinza JODELL RG75-300 (IR75-300) de la tienda.
- Sensor G2CX-6F-D80-H28 (tarifa) y GZCX-6F-75MM (tienda) se tratan como productos distintos.
