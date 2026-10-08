# Tríptico comercial del ART7 R7

`node tools/triptico/generar-art7-r7.mjs` monta el tríptico del ART7 R7 (serie ART de FAIRINO) con la estética de la
web y lo guarda en `public/descargas/fairino-art7-r7-triptico.pdf`: A4 apaisado, dos caras de tres paneles de 99 mm.

- **Cara exterior** (página 1): solapa con la serie ART · contraportada con la demo, el QR y el contacto · portada.
- **Cara interior** (página 2): 01 el brazo ART7 · 02 la plataforma de dos brazos · 03 control y software.
- Plegado en «envolvente»: la solapa (panel izquierdo de la cara exterior) se dobla hacia dentro y la portada encima.
  Para imprenta, pide que ajusten la solapa a 97 mm si la quieren más estrecha.

**Textos y cifras:** del documento del cliente «ART7. recopilatorio de inform para catalogo comercial.docx»
(traducción de Pedro Oreja, 02/10/2026, del artículo de Gaogong Robotics del 14/08/2026), del teaser oficial del
ART7 R7 y del anuncio oficial de los humanoides FAIRINO. La repetibilidad de fuerza y par (≤ 0,15 N · ≤ 0,05 N·m) es la
del documento y del anuncio oficial; el teaser en español dice «≤ 0,1 N·m» como precisión de control de fuerza.
El precio en yuanes del artículo no se usa (es del mercado chino): «Precio y disponibilidad: consúltanos».

**Fotos:** `assets-src/fabricantes/fairino/art7-r7/` (fotogramas de los vídeos oficiales y la foto del controlador del
documento), recortadas sin los rótulos de los vídeos. Caché en `tools/triptico/.cache/` (fuera de git).

**QR:** `qr-reservar-demo-art7-r7.svg` lleva a https://fairinocobot.com/reservar-cita/?demo=art7-r7. Si cambia la web:
`python3 -c "import segno; segno.make('URL', error='m').save('tools/triptico/qr-reservar-demo-art7-r7.svg', kind='svg', dark='#f5eee8', light=None, border=0, scale=4, xmldecl=False)"`

**Salida extra:** `src/assets/images/descargas/triptico-art7-r7-portada.jpg` (portada para el botón de descarga) y
`src/data/triptico-art7-r7.json` (ruta y peso del PDF para la web). Con `--vistas` deja también `.cache/cara-1.png` y
`.cache/cara-2.png` para revisarlo. Si un panel se queda sin sitio, el script avisa («Texto que no cabe»).
