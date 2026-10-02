// Renderiza el estudio 3D (tools/cad/studio.html) con Chromium sin pantalla.
// Requiere servir la raíz del repo: python3 -m http.server 4600 --bind 127.0.0.1
//   JOBS='[{"w":1000,"h":1250,"out":"/ruta/fr5.png","q":{"model":"fr5","pose":"0.5,-1.95,1.75,-1.35,-1.57,0","cam":"-35,8,2.75","ty":"1.0","fov":"30","alpha":"1","platform":"0"}}]' PW=$(npm root -g)/playwright node tools/cad/render.cjs
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const jobs = JSON.parse(process.env.JOBS);
  for (const j of jobs) {
    const [w, h] = [j.w, j.h];
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(String(e)));
    p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    const qs = new URLSearchParams({ ...j.q, w, h }).toString();
    await p.goto(`http://127.0.0.1:4600/tools/cad/studio.html?${qs}`);
    await p.waitForFunction(() => window.__done === true, null, { timeout: 180000 }).catch(() => errs.push('timeout'));
    const info = await p.evaluate(() => window.__info);
    await p.screenshot({ path: j.out, omitBackground: j.q.alpha === '1' });
    console.log(j.out, JSON.stringify(info), errs.join(' | '));
    await p.close();
  }
  await b.close();
})();
