// Renderiza tools/cad/nave.html fotograma a fotograma (PNG numerados) con Chromium sin pantalla.
// Requiere servir la raíz del repo: python3 -m http.server 4600 --bind 127.0.0.1
//   Q='shot=interior&dur=4' FPS=24 FROM=0 TO=96 OUT=/ruta/frames PW=/opt/node-tools/node_modules/playwright node tools/cad/render-nave.cjs
const { chromium } = require(process.env.PW);
const fs = require('fs');
(async () => {
  const W = Number(process.env.W || 1920), H = Number(process.env.H || 1080), FPS = Number(process.env.FPS || 24);
  const out = process.env.OUT;
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://127.0.0.1:4600/tools/cad/nave.html?w=${W}&h=${H}&${process.env.Q || ''}`);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 300000 }).catch(() => errs.push('timeout'));
  if (errs.length) console.log(errs.join(' | '));
  const from = Number(process.env.FROM || 0), to = Number(process.env.TO || 1);
  p.setDefaultTimeout(0);
  for (let f = from; f < to; f++) {
    const file = `${out}/f${String(f).padStart(4, '0')}.png`;
    if (fs.existsSync(file) && !process.env.FORCE) continue;
    // El lienzo se lee directamente (preserveDrawingBuffer): más rápido y fiable que una captura de pantalla.
    const url = await p.evaluate((t) => (window.renderAt(t), document.querySelector('canvas').toDataURL('image/png')), f / FPS);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    if (f === from) console.log(JSON.stringify(await p.evaluate(() => window.__info())));
  }
  await b.close();
})();
