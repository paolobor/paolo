// Importa los recursos fotorrealistas generados con Higgsfield, los comprime
// para la web y activa public/assets/recursos.json.
//
//   node tools/import-higgsfield.mjs            (descarga de los resultados de Higgsfield)
//   node tools/import-higgsfield.mjs <carpeta>  (originales ya descargados, mismos nombres)
//
// Vídeos: MP4 (H.264) + WebM (VP9) < 4 MB cada uno, con póster WebP; negro puro.
// Imágenes: WebP. Requiere ffmpeg (libx264, libvpx-vp9, libwebp) e ImageMagick.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_3Jh4uS6rsReEZIkQWBXrQGZ4Ovb/';
// Resultados de Higgsfield (los prompts están en public/assets/PEDIDO_HIGGSFIELD.md)
const SOURCES = {
  'virutas-16x9.mp4': 'hf_20261001_075743_c654c458-9ee4-434a-ba8f-f5ac3f77feb7.mp4',
  'virutas-9x16.mp4': 'hf_20261001_075745_ad83416e-00b0-424b-8480-7fbcdd6959ab.mp4',
  'nave-estructura.mp4': 'hf_20261001_075754_e6433fd2-235e-4398-81fe-1e074efc6b8f.mp4',
  'fijacion.png': 'hf_20261001_075644_58eb33aa-1565-4ead-82eb-39ec1ddc6aff.png',
  'union.png': 'hf_20261001_075644_160d723d-0978-4a85-90c3-8fc96c78507f.png',
  'montaje.png': 'hf_20261001_075644_2f5d86da-1635-48ca-bd97-aee3f44904b0.png',
  'posicionamiento.png': 'hf_20261001_075644_359c32fa-051b-404e-8fed-46ff44ba1f46.png',
  'puertas.png': 'hf_20261001_075644_8e1473a8-b8e4-468a-89b9-bac1f7010bf1.png',
  'plasticos.png': 'hf_20261001_075644_b8ecfe6d-00ca-4f8c-87f5-524bd4a2cae3.png',
  'aluminio.png': 'hf_20261001_075644_2aa68779-dfa1-4b4e-830c-7fbe932c371b.png',
  'aluminio-cepillado.png': 'hf_20261001_075527_740846a1-94a8-49fb-8d95-659532a496f3.png',
};
const LIMIT = 3_900_000; // < 4 MB (decimal) con margen

const src = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'tools/.cache/higgsfield');
const out = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(root, 'public/assets');
fs.mkdirSync(src, { recursive: true });
for (const d of ['video', 'productos', 'texturas']) fs.mkdirSync(path.join(out, d), { recursive: true });
const sh = (cmd) => execSync(cmd, { stdio: ['ignore', 'pipe', 'inherit'] }).toString();
const size = (f) => fs.statSync(f).size;
const kb = (f) => `${(size(f) / 1024).toFixed(0)} KB`;

// 1) Originales
for (const [name, file] of Object.entries(SOURCES)) {
  const dst = path.join(src, name);
  if (fs.existsSync(dst) && size(dst) > 0) continue;
  if (process.argv[2]) throw new Error(`Falta ${dst}`);
  console.log('descargando', name);
  sh(`curl -sSf -o "${dst}" "${CDN}${file}"`);
}

// Negro puro: lo que está por debajo del 3,5 % pasa a 0 (fondo sin cortes con la web)
const BLACK = 'colorlevels=rimin=0.035:gimin=0.035:bimin=0.035';

function encode(input, base, { w, h, pingpong = false }) {
  const mp4 = `${base}.mp4`, webm = `${base}.webm`, poster = `${base}.webp`;
  // Bitrate máximo según la duración para no pasar de 4 MB
  const dur = parseFloat(sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${input}"`)) * (pingpong ? 2 : 1);
  const kbps = Math.min(2800, Math.floor(((LIMIT * 8) / dur / 1000) * 0.9));
  const filter = (k) => {
    const W = Math.round((w * k) / 2) * 2, H = Math.round((h * k) / 2) * 2;
    const scale = `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},${BLACK},format=yuv420p`;
    return pingpong ? `[0:v]${scale},split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0[v]` : `[0:v]${scale}[v]`;
  };
  // Calidad primero; si no cabe en < 4 MB, baja la resolución
  const fit = (file, attempt) => {
    for (const k of [1, 0.8, 0.64, 0.5]) {
      for (const q of attempt.crfs) {
        sh(attempt.cmd(filter(k), q));
        if (size(file) < LIMIT) return k;
      }
    }
    throw new Error(`${file} no cabe en 4 MB`);
  };
  fit(mp4, {
    crfs: [22, 25, 28, 31],
    cmd: (vf, q) => `ffmpeg -y -v error -i "${input}" -filter_complex "${vf}" -map "[v]" -an -c:v libx264 -preset slow -crf ${q} -maxrate ${kbps}k -bufsize ${kbps * 2}k -movflags +faststart "${mp4}"`,
  });
  fit(webm, {
    crfs: [33, 38, 43],
    cmd: (vf, q) => `ffmpeg -y -v error -i "${input}" -filter_complex "${vf}" -map "[v]" -an -c:v libvpx-vp9 -b:v ${Math.round(kbps * 0.92)}k -crf ${q} -row-mt 1 -deadline good -cpu-used 3 "${webm}"`,
  });
  sh(`ffmpeg -y -v error -i "${mp4}" -frames:v 1 -c:v libwebp -quality 82 "${poster}"`);
  console.log(path.basename(base), 'mp4', kb(mp4), 'webm', kb(webm), 'poster', kb(poster));
  return { mp4: path.relative(out, mp4), webm: path.relative(out, webm), poster: path.relative(out, poster) };
}

// 2) Vídeos
const vid = (n) => path.join(src, n);
const virutasH = encode(vid('virutas-16x9.mp4'), path.join(out, 'video/virutas-16x9'), { w: 1920, h: 1080 });
const virutasV = encode(vid('virutas-9x16.mp4'), path.join(out, 'video/virutas-9x16'), { w: 1080, h: 1920 });
// La nave se reproduce ida y vuelta para que el bucle no tenga salto
const nave = encode(vid('nave-estructura.mp4'), path.join(out, 'video/nave-estructura'), { w: 1600, h: 900, pingpong: true });

// 3) Fotos de producto (WebP, negro puro)
const fotos = {};
for (const k of ['fijacion', 'union', 'montaje', 'posicionamiento', 'puertas', 'plasticos', 'aluminio']) {
  const o = path.join(out, `productos/${k}.webp`);
  sh(`convert "${path.join(src, `${k}.png`)}" -resize 1200x -level 3%,100% -strip -quality 84 -define webp:method=6 "${o}"`);
  fotos[k] = path.relative(out, o);
  console.log('foto', k, kb(o));
}

// 4) Textura de aluminio cepillado 2048 sin costuras (fundido con su copia desplazada)
{
  const t = path.join(src, 'aluminio-cepillado.png');
  const tmp = path.join(src, 'tex');
  fs.mkdirSync(tmp, { recursive: true });
  const N = 2048;
  sh(`convert "${t}" -resize ${N}x${N}! -colorspace sRGB "${tmp}/a.png"`);
  // Máscara sin^2: 0 en los bordes, 1 en el centro
  sh(`convert -size ${N}x1 xc: -fx "pow(sin(pi*i/w),2)" -scale ${N}x${N}! "${tmp}/mx.png"`);
  sh(`convert "${tmp}/mx.png" -rotate 90 "${tmp}/my.png"`);
  sh(`convert "${tmp}/a.png" -roll +${N / 2}+0 "${tmp}/ax.png"`);
  sh(`convert "${tmp}/ax.png" "${tmp}/a.png" "${tmp}/mx.png" -composite "${tmp}/b.png"`);
  sh(`convert "${tmp}/b.png" -roll +0+${N / 2} "${tmp}/by.png"`);
  sh(`convert "${tmp}/by.png" "${tmp}/b.png" "${tmp}/my.png" -composite "${tmp}/c.png"`);
  const o = path.join(out, 'texturas/aluminio-cepillado.webp');
  sh(`convert "${tmp}/c.png" -strip -quality 86 -define webp:method=6 "${o}"`);
  console.log('textura', kb(o));
}

// 5) Manifiesto
const manifest = {
  _comentario: 'Recursos fotorrealistas opcionales (rutas relativas a assets/). null = no disponible: la web usa el 3D y las imágenes del catálogo.',
  videoVirutas: { horizontal: virutasH, vertical: virutasV },
  videoNave: nave,
  fotosFamilias: fotos,
  texturaAluminio: 'texturas/aluminio-cepillado.webp',
};
fs.writeFileSync(path.join(out, 'recursos.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('recursos.json actualizado');
