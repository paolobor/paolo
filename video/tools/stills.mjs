// Renderiza fotogramas sueltos para revisión: node tools/stills.mjs out_prefix t1 t2 ... (segundos) o bN (pulsos)
import { chromium } from 'playwright';
const [,, prefix, ...times] = process.argv;
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 300)); });
p.on('pageerror', (e) => console.log('err:', e.message));
await p.goto('http://localhost:8765/src/index.html');
await p.waitForFunction(() => window.ready === true, null, { timeout: 180000 });
const info = await p.evaluate(() => window.info);
for (const ts of times) {
  const t = ts.startsWith('b') ? parseFloat(ts.slice(1)) * info.B : parseFloat(ts);
  const fr = Math.round(t * info.FPS);
  const t0 = Date.now();
  await p.evaluate((f) => window.renderFrame(f), fr);
  const t1 = Date.now();
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await p.screenshot({ path: `${prefix}_${ts}.jpg`, type: 'jpeg', quality: 88, timeout: 180000 });
  console.log(ts, 'frame', fr, 'render', t1 - t0, 'ms total', Date.now() - t0, 'ms');
}
await b.close();
