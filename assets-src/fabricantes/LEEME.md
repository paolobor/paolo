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

## Pinzas eléctricas IR (JODELL, HITBOT, ChangingTek y DH-Robotics)

Las referencias IR son pinzas de otros fabricantes con nombre propio (carrera-fuerza: IR75-300 = 75 mm / 300 N).
Se ha buscado el fabricante de cada una y la foto y los datos son los suyos. Por decisión de FAIRINO España las fichas
se siguen llamando por la referencia IR; la marca que se muestra es la del fabricante y el texto cita su modelo.

| Producto (id)     | Fabricante y modelo           | Seguridad   | Foto y datos                                                         |
| ----------------- | ----------------------------- | ----------- | -------------------------------------------------------------------- |
| pinza-ir75-300    | JODELL RG75-300               | Alta        | jodell-robotics.com (product-detail?id=5); el STEP de fairino.es es un archivo de JODELL |
| pinza-ir120-130   | HITBOT Z-EFG-130              | Alta        | hitbotrobot.com, página Z-EFG-130                                   |
| pinza-ir20-80c    | HITBOT Z-ECG-20               | Alta        | hitbotrobot.com, página Z-ECG-20; el STEP de fairino.es es «Z-ECG-20» |
| pinza-ir20-100r   | HITBOT Z-ERG-20-100           | Alta        | hitbot.cc (foto, 800×450 sobre blanco, recortada); datos de hitbotrobot.com |
| pinza-ir100-25    | ChangingTek CTAG2F90-D        | Media-alta  | en.changingtek.com/diandong/147 (foto reducida de 7680 px)          |
| pinza-ir130-100c  | DH-Robotics CGI-100-170       | Media-alta  | en.dh-robotics.com/product/cg (solo la miniatura de 300×300)        |

Pendiente:
- IR100-25: ChangingTek da 90 mm de carrera; confirmar con el proveedor la carrera real de la que vendemos.
- IR130-100C: el cuerpo de la foto de DH es gris oscuro; la que se vende podría ser plateada. La foto grande
  (wp-content/uploads/2023/02/CGI-100-170.png) hay que bajarla a mano: la web de DH bloquea las descargas automáticas.
- El grado IP de la Z-EFG-130 y la Z-ECG-20 no se pone: la web inglesa y la china de HITBOT no coinciden.

## Sin foto de fabricante

- pinza-vacio-area: es de marca Inlux Robotics; su foto solo está en la web de Inlux. No se copia.
- sensor-fuerza-par-inlux, cambiador-rapido, adaptador-doble-herramienta y adaptador-antorcha: no se ha podido
  identificar un fabricante (los modelos 3D de fairino.es no lo dicen). Hacen falta fotos propias.

## FAIRINO: pintura con pistola (vídeo de YouTube)

Vídeo oficial «Spraying» del canal de FAIRINO en YouTube (@FAIRINOrobot, id dy-bvYYtOwA, un Short vertical): el cobot,
con su funda protectora, pinta con pistola dentro de su cabina. Se comprobó el canal con el oEmbed de YouTube.

- fairino/pintura/yt-dy-bvYYtOwA-oardefault-original.jpg: miniatura vertical oficial (1080×1920, i.ytimg.com/vi/<id>/oardefault.jpg).
- src/assets/images/videos/yt-dy-bvYYtOwA.jpg: la misma, como póster del vídeo en /aplicaciones/pintura/.
- src/assets/images/aplicaciones/fairino-pintura-cabina.jpg: recorte horizontal (1080×720, desde y = 420) para la
  foto de la aplicación «Pintura» (cabecera y tarjetas).

El vídeo se reproduce desde YouTube (youtube-nocookie) y solo al pulsar «play». No se descarga ni se aloja aquí.

## FAIRINO: humanoides (bloque «Próximamente» del inicio y de la tienda)

Dos vídeos oficiales de FAIRINO que facilitó el cliente (6 de octubre); el cliente confirma que los dos son oficiales
de FAIRINO. Datos y textos del bloque: `src/data/humanoid.ts`.

- **Teaser ART7 R7** (español, 58 s, 1920x1080, con sonido): `public/media/fairino-art7-r7-teaser.mp4`, recodificado a
  1280x720 (H.264 CRF 25, AAC 128 k), completo y sin recortes. Portada: fotograma de 45,3 s, el destello dorado sin
  texto (`src/assets/images/videos/fairino-art7-r7-poster.jpg`). Los textos y las cifras del bloque salen de este vídeo,
  igual que la nota «Certificación CE en proceso. Uso: I+D, investigación, educación, demostración y prototipos.».
- **Humanoides FAIRINO** (inglés, 90 s, 1920x1080, con sonido): `public/media/fairino-humanoide.mp4`, 1280x720 a dos
  pasadas (520 kb/s, AAC 96 k), completo. Portada: fotograma de 82,5 s (`fairino-humanoide-familia.jpg`).
- **Fondo** (`public/media/fairino-humanoide-fondo.{webm,mp4}`, 8,5 s, sin sonido, en bucle): solo planos oscuros (el
  cliente pidió que no pasara a los planos blancos) y sin texto: 0–5,9 s (los ojos en la oscuridad y el torso FAIRINO)
  y 18,2–21,4 s (el humanoide de cuerpo entero sobre negro, recortado a 1280×720 desde x = 650 para dejar fuera el
  rótulo de la izquierda), con un fundido de 0,6 s entre los dos y fundido a negro al final. Fotograma fijo: 4,6 s
  (`fairino-humanoide-poster.jpg`).

## FAIRINO: lijado y pulido (vídeo de YouTube)

Vídeo oficial «🇹🇭 Thailand | Robotic Polishing» del canal de FAIRINO en YouTube (@FAIRINOrobot, id 3XZFIwvE5ZM,
20 s; canal comprobado con el oEmbed de YouTube): un cobot FAIRINO con una lijadora orbital en la brida pule una chapa
sobre la mesa de trabajo de un taller.

- src/assets/images/aplicaciones/fairino-lijado-pulido.jpg: miniatura oficial (1280×720,
  i.ytimg.com/vi/<id>/maxresdefault.jpg), como foto de la aplicación (cabecera y tarjetas; encuadre en `imagePosition`
  de `src/data/applications.ts`) y como póster del vídeo en /aplicaciones/lijado-y-pulido/.

## FAIRINO: IA física en la WRC 2026 (vídeo de YouTube)

Vídeo oficial «WRC 2026｜FAIRINO’s New Innovation Takes the Stage #EmbodiedAI» del canal de FAIRINO (id DCkKewMlc3s,
44 s; canal comprobado con el oEmbed): el humanoide de FAIRINO en su stand de la World Robot Conference 2026. Va
destacado en el bloque «Próximamente» de los humanoides; se carga desde youtube-nocookie solo al pulsar.

- src/assets/images/videos/yt-DCkKewMlc3s.jpg: miniatura oficial (1280×720).

El cliente pasó además una página guardada de inluxrobotics.es («Physical AI») con otro vídeo alojado allí; no se ha
usado porque no se puede descargar desde ese sitio. Si el cliente pasa el archivo del vídeo y confirma que es oficial
de FAIRINO, se puede añadir al bloque como los otros.

## W-Robot (w-robot.com)

Pinzas eléctricas de ShenZhen W-Robot Industry Co., Ltd. (la «WR» de la tarifa: WR.EPG2, WR.EPG3, WR.EPG4). Lista de
modelos: la tabla que pasó el cliente (7 de octubre de 2026). Datos: tabla general del «W-Robot Electric Gripper
Selection Manual» (w-robot.com → Download → Product Catalog), que es coherente; en las fichas de su web hay cifras
copiadas de otro modelo (p. ej. el EPG3-10-10 con 50 N). Fotos: render oficial de la ficha de su web (1000–2700 px
sobre blanco, recortado con `tools/fotos/recorte-fondo-blanco.py`) o, si el modelo no tiene ficha en la web, la
imagen del manual (ya recortada).

| Producto (id)     | Foto                                   | Nota                                                     |
| ----------------- | -------------------------------------- | -------------------------------------------------------- |
| wr-epgs-6-10      | web, EPGS-6-10 (1.ª foto)              |                                                          |
| wr-epgs-8-10      | manual, pág. 12                        |                                                          |
| wr-epgs-8p-10     | web, EPGS-8P-10 (9.ª foto)             |                                                          |
| wr-epgs-12p-15    | web, EPGS-12P-15 (1.ª foto)            |                                                          |
| wr-epgs-16-15     | manual, pág. 14                        |                                                          |
| wr-epg2-26-15     | web, EPG2-26-15 (8.ª foto)             |                                                          |
| wr-epg2-26-50     | manual, pág. 25                        |                                                          |
| wr-epg2-50-50     | manual, pág. 28                        |                                                          |
| wr-epg2-50-150    | manual, pág. 31                        | Tarifa: WR.EPG2 (50-150), 690 €                          |
| wr-epg3-10-10     | web, EPG3-10-10 (1.ª foto)             | La tabla del cliente dice EFG3-10-10; tarifa WR.EPG3, 620 € |
| wr-epg4-10-50     | web, EPG4-10-50 (1.ª foto)             | Tarifa: WR.EPG4 (10-50), 660 €                           |
| wr-epgc-50-150    | web, EPGC-50-150 (1.ª foto)            |                                                          |
| wr-epg2-100-50    | web, EPG2-100-50 (1.ª foto)            |                                                          |
| wr-erg-20-80      | web, ERG-20-80 (1.ª foto)              |                                                          |
| wr-ergd-25-35     | web, ERGD-30-35 (foto de la serie)     | W-Robot solo publica el ERGD-30-35: confirmar el modelo  |
| wr-epgl-160-1200  | web, EPGL-200-1200 (foto de la serie)  | W-Robot publica el EPGL-200 y el EPGL-220: confirmar     |
| wr-epgl-220-1200  | web, EPGL-200-1200 (foto de la serie)  |                                                          |

Originales (reducidos a 1600 px) en `assets-src/fabricantes/w-robot/`.

## Fotos de FAIRINO España mejoradas con Higgsfield

Fotos que pasó el cliente el 7 de octubre de 2026. En Higgsfield solo se escalaron a 2K (bytedance_image_upscale) y
se les quitó el fondo (image_background_remover); el producto no se generó ni se retocó. Al track grande se le quitó
el reflejo verde del suelo de los bordes. Coste: unos 20 créditos. Originales en `assets-src/fabricantes/fairino-espana/`.

| Producto (id)     | Foto original                       | Trabajos de Higgsfield (escalado → sin fondo)                                 |
| ----------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| track-7-eje-25m   | track-7-eje-25m-original.jpg        | 3eba81e0-dc7c-4b42-8d00-9dd53bbbf67d → b0dd8507-36c8-4a06-8349-183839ad121d   |
| track-7-eje-1m    | track-7-eje-1m-original.jpg         | d587524b-2d2c-4ef6-8f7f-7946d8876a91 → 8c96ab82-3971-48b6-a28b-cfdc9e9747b4   |
| columna-base-h    | columna-base-h-original.jpg         | a2fef581-8df8-43b9-b98b-82221533fb13 → 0211b109-7ab9-4f38-ae09-27eac3799ef2   |
| gzcx-6f-75mm      | sensor-g2cx-fairino-original.jpg    | b838c812-c95c-4ab9-920d-a1b379ce315d → b07c112d-5d4f-4f71-a7c5-134099eb572b   |
| modulo-seguridad  | modulo-seguridad-original.jpg       | da044676-d7e6-43b1-9fe2-594218895601 → bd71d726-da4b-46a6-b572-0457a0dbdfe8   |

Pendiente: la cámara 3D negra con dos proyectores (el cliente dice que todavía no se ponga).
