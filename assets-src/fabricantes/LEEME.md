# Fotos de fabricantes

Fotos originales de productos de terceros, descargadas de la web de cada fabricante (nunca de distribuidores).
Se recortan con `tools/fotos/recorte-fondo-blanco.py` y el resultado va a `src/assets/products/<id>/<id>-oficial.png`.

Pendiente: confirmar con cada fabricante que FAIRINO España puede usar sus fotos en la tienda (lo normal es que
se las den a sus distribuidores).

## Soft Gripping (soft-gripping.com)

| Producto (id)                 | Archivo original                               | Origen                                                                 |
| ----------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| softgripper-parallel-finger   | soft-gripping/softgripper-parallel-finger-original.jpg | soft-gripping.com/assets/sg.il_.4p.35.75d.g1-img1.jpg (página SoftGripper)   |
| softgripper-centric-finger    | soft-gripping/softgripper-centric-finger-original.jpg  | soft-gripping.com/assets/sg.il_.3c.35.75d.g1-img1.jpg (página SoftGripper)   |
| softactuator-centric-finger   | soft-gripping/softactuator-centric-finger-original.jpg | soft-gripping.com/assets/products/pictures/renderings/jpg/softactuator/sg.ck_.p4.b1-img1.jpg (página SoftActuator) |
| controlbox-softgripping       | soft-gripping/controlbox-softgripping-original.jpg     | soft-gripping.com/assets/sg.bp_.1p.c1-img1-1.jpg, Controlbox P (página Pneumatics) |

## Schmalz (schmalz.com)

| Producto (id)          | Artículo de Schmalz                                         | Foto (media.schmalz.com)                                    |
| ---------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| pinza-vacio-electrica  | ROB-SET ECBPMi FAIRINO, 10.03.01.00987                      | …/10030100987/252c7644fd32_10.03.01.00987_00.jpg            |
| adaptador-pinza-vacio  | SLG 102x75.3 FSGA 4, 10.01.10.14041 (también FSGA 3 y 2)    | …/10011014041/6f6cd29480a5_10.01.10.14041_00.jpg            |
| pinza-vacio-230x120    | FQE-V Xc R 230x120 SW80 SPB2 F, 10.01.44.00580              | …/10014400580/f94292525aec_10.01.44.00580_00.jpg            |
| pinza-vacio-400x280    | FQE-V Xc R 400x280 SW80 SPB2 F, 10.01.44.00560              | …/10014400560/945cc7dda0a5_10.01.44.00560_00.jpg            |

Originales en `assets-src/fabricantes/schmalz/`. Schmalz también tiene el ROB-SET ECBPi FAIRINO (10.03.01.00988),
que todavía no está en la tienda.

## Mirka (mirka.com) e ifm (ifm.com)

| Producto (id)          | Modelo                                                     | Seguridad                     |
| ---------------------- | ---------------------------------------------------------- | ----------------------------- |
| kit-lijado-mirka       | Mirka AIROS 650 Ø150 mm (antes 650CV), img.mirka.com       | Alta (misma foto oficial)     |
| aspirador-lijado-mirka | Mirka Dust Extractor 1230 L AFC EU 230 V, ref. 8999200111  | Media-alta (podría ser el PC) |
| kit-vision-2d-ifm      | ifm O2D500 (familia O2D5xx), media.ifm.com                 | Familia segura; variante no   |
| kit-vision-3d-ifm      | ifm O3D303 (familia O3D3xx), media.ifm.com                 | Familia segura; variante no   |

Confirmar con el proveedor del kit qué variante exacta de ifm lleva cada kit de visión. El peso de la AIROS no se
pone: la web dice 1,4 kg y el folleto 1,3 kg. Originales en `assets-src/fabricantes/mirka/` e `ifm/`.

## Delta, IDEC y FAIRINO

| Producto (id)               | Modelo y origen de la foto                                                         |
| --------------------------- | ---------------------------------------------------------------------------------- |
| kit-hmi-delta               | Delta DOP-100 L Type (DOP-107L1-01 7" / DOP-110L1-01 10,1"), filecenter.deltaww.com |
| kit-escaner-seguridad-idec  | IDEC SE2L-H05LP (protección 5 m), almacén de imágenes de IDEC (apem.asset.akeneo.cloud) |
| tarjeta-profinet-ethernetip | Placa MiniPCIe de FAIRINO (FRJ-PCIeN-…-V10/V20); foto de banco del manual oficial (fairino-doc-en.readthedocs.io) |

Pendiente: confirmar el tamaño de pantalla del kit HMI (7" o 10,1"). No se pone el PFHd del SE2L porque la web y
el catálogo de IDEC no coinciden.

## Sin foto de fabricante

- pinza-vacio-area y las pinzas IR: son de marca Inlux Robotics; su foto solo está en la web de Inlux. No se copia.
