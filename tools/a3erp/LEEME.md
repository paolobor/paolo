# Conexión con a3ERP (propuesta enviada al distribuidor, 16-10-2026)

Muestras en esta carpeta: `muestra-stock-fairino.csv` y `muestra-pedido-web-fairino.csv`. Formato de las dos: CSV con
`;`, UTF-8, primera fila con los nombres de las columnas, decimales con coma, precios sin IVA.

## 1. Stock: a3ERP → web
- a3ERP genera `stock-fairino.csv` cada 15-60 minutos (o al cambiar el stock) y lo sube por FTP a la carpeta `/stock/`
  de fairino.es, siempre con el mismo nombre. Mejor subirlo como `.tmp` y renombrarlo al terminar.
- Columnas: `codigo_articulo`, `descripcion` (opcional), `unidades_disponibles` (entero ≥ 0: lo que se puede vender).
- Solo código y unidades: la web lo lee desde el navegador, así que el fichero es público (ni precios ni costes).
- Usuario de FTP propio para a3ERP, limitado a `/stock/` (y `/pedidos-a3erp/` si se hacen los pedidos).
- Pendiente en la web: que `src/scripts/stock.ts` lea `/stock/stock-fairino.csv` en lugar de la hoja de Google (acepta
  `;` y el BOM) y una tabla de equivalencias código a3ERP → producto de la web si los códigos no coinciden con los `sku`.

## 2. Pedidos: web → a3ERP (más adelante)
- Un fichero por pedido, `pedido-<referencia>.csv`, en una carpeta privada del servidor (`/pedidos-a3erp/`, fuera de la
  web pública). a3ERP lo recoge por FTP y lo borra o lo mueve a `procesados/`.
- Una fila por línea; los datos del pedido y del cliente se repiten en cada fila. `pedido_web` es la referencia del
  pedido en Firebase (la que ve el cliente en «Mi cuenta»). `entrega`: `envio` o `recogida` (sin portes).
  `precio_unitario` vacío = producto «Consultar» (precio pendiente). El IVA lo aplica a3ERP.
- Pendiente en la web: un script PHP en Dinahosting que reciba el pedido (comprobando la sesión de Firebase del cliente)
  y escriba el fichero.
