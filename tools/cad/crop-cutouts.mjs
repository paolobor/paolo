// Recorta los renders transparentes (assets-src/renders/<modelo>/<modelo>-recorte-4x5.png) al robot, con un
// margen del 3 % de su altura, y los deja como imagen provisional de la web.
//   node tools/cad/crop-cutouts.mjs [fr5 …]
import sharp from 'sharp';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const only = process.argv.slice(2);
const models = readdirSync(join(ROOT, 'assets-src', 'renders')).filter((m) => !only.length || only.includes(m));

for (const m of models) {
  const src = join(ROOT, 'assets-src', 'renders', m, `${m}-recorte-4x5.png`);
  const out = join(ROOT, 'src', 'assets', 'products', m, `${m}-provisional-3d.png`);
  if (!existsSync(src) || !existsSync(dirname(out))) continue;
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  const pad = Math.round((y1 - y0 + 1) * 0.03);
  await sharp(src)
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`${m.padEnd(7)} ${x1 - x0 + 1 + 2 * pad}×${y1 - y0 + 1 + 2 * pad} → ${out.replace(ROOT + '/', '')}`);
}
