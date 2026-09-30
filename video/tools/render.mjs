// Render completo del vídeo a JPEG (reanudable): node tools/render.mjs [workers=2] [outDir=out/frames]
// Levanta su propio servidor estático, reparte el trabajo en bloques de 30 fotogramas entre
// varios navegadores y se salta los fotogramas ya existentes.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORKERS = parseInt(process.argv[2] || '2', 10);
const OUT = path.resolve(ROOT, process.argv[3] || 'out/frames');
const CHUNK = 30;
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL = `http://127.0.0.1:${server.address().port}/src/index.html`;

const browsers = [];
async function openPage() {
  // un navegador por worker: cada uno tiene su propio proceso de GPU (SwiftShader)
  const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  browsers.push(br);
  const p = await br.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.log('pageerror:', e.message));
  await p.goto(URL);
  await p.waitForFunction(() => window.ready === true, null, { timeout: 300000 });
  return p;
}
const first = await openPage();
const info = await first.evaluate(() => window.info);
const total = info.frames;
const name = (i) => path.join(OUT, `f_${String(i).padStart(5, '0')}.jpg`);
const chunks = [];
for (let s = 0; s < total; s += CHUNK) chunks.push([s, Math.min(total, s + CHUNK)]);
let done = 0; for (let i = 0; i < total; i++) if (fs.existsSync(name(i))) done++;
console.log(`frames ${total}, ya hechos ${done}, workers ${WORKERS}`);
const t0 = Date.now();

async function worker(k, page) {
  for (let c = k; c < chunks.length; c += WORKERS) {
    const [a, z] = chunks[c];
    for (let i = a; i < z; i++) {
      if (fs.existsSync(name(i))) continue;
      await page.evaluate((f) => window.renderFrame(f), i);
      const tmp = name(i) + '.tmp';
      await page.screenshot({ path: tmp, type: 'jpeg', quality: 94, timeout: 300000 });
      fs.renameSync(tmp, name(i));
      done++;
      if (done % 20 === 0) {
        const el = (Date.now() - t0) / 1000;
        console.log(`${done}/${total}  ${el.toFixed(0)}s`);
      }
    }
  }
}
const pages = [first];
for (let k = 1; k < WORKERS; k++) pages.push(await openPage());
await Promise.all(pages.map((p, k) => worker(k, p)));
console.log('FIN', ((Date.now() - t0) / 60000).toFixed(1), 'min');
for (const br of browsers) await br.close();
server.close();
