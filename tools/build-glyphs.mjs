// Extrae los contornos de los glifos usados por los rótulos 3D y los guarda en
// formato "typeface" de three.js (solo los caracteres necesarios).
//  - Saira Expanded ExtraBold: rótulo cromado del montaje
//  - Archivo Black: rótulo del logotipo de marca (letras en bloque biseladas)
import fs from 'node:fs';
import opentype from 'opentype.js';

function extract(ttf, chars, family, outName) {
  const buf = fs.readFileSync(new URL(ttf, import.meta.url));
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const round = (v) => Math.round(v);
  const glyphs = {};
  for (const ch of chars) {
    const g = font.charToGlyph(ch);
    const p = g.getPath(0, 0, font.unitsPerEm);
    // opentype devuelve y hacia abajo: invertimos el eje Y.
    const o = [];
    for (const c of p.commands) {
      if (c.type === 'M') o.push('m', round(c.x), round(-c.y));
      else if (c.type === 'L') o.push('l', round(c.x), round(-c.y));
      else if (c.type === 'Q') o.push('q', round(c.x), round(-c.y), round(c.x1), round(-c.y1));
      else if (c.type === 'C') o.push('b', round(c.x), round(-c.y), round(c.x1), round(-c.y1), round(c.x2), round(-c.y2));
    }
    const bb = g.getBoundingBox();
    glyphs[ch] = { ha: round(g.advanceWidth), x_min: round(bb.x1), x_max: round(bb.x2), o: o.join(' ') };
  }
  const out = {
    glyphs,
    familyName: `${family} (subset)`,
    ascender: font.ascender,
    descender: font.descender,
    underlinePosition: font.tables.post.underlinePosition,
    underlineThickness: font.tables.post.underlineThickness,
    boundingBox: { yMin: font.tables.head.yMin, xMin: font.tables.head.xMin, yMax: font.tables.head.yMax, xMax: font.tables.head.xMax },
    resolution: font.unitsPerEm,
    capHeight: font.tables.os2.sCapHeight,
  };
  fs.writeFileSync(new URL(`../src/assets/${outName}`, import.meta.url), JSON.stringify(out));
  console.log(outName, Object.keys(glyphs).join(''), 'capHeight', out.capHeight, 'upm', out.resolution);
}

extract('./SairaExpanded-ExtraBold.ttf', 'FDIMOULAR', 'Saira Expanded ExtraBold', 'saira-glyphs.json');
extract('./ArchivoBlack-Regular.ttf', 'FDIMOULAR', 'Archivo Black', 'archivo-glyphs.json');
