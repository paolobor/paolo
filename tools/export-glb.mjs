// Exporta el modelo 3D a .glb usando Chromium sin interfaz.
// Requiere el servidor de desarrollo:  npx vite --port 5173
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:5173/tools/export/index.html');
await page.waitForFunction(() => window.exporterReady === true, null, { timeout: 60000 });
const out = await page.evaluate(() => window.exportAll());
await browser.close();

fs.mkdirSync(`${root}design`, { recursive: true });
fs.mkdirSync(`${root}tools/.cache`, { recursive: true });
const files = {
  web: `${root}tools/.cache/fdi-modular.raw.glb`,
  escuadra: `${root}design/FDI-MODULAR_escuadra-cubica_40x40-ranura10.glb`,
  logo: `${root}design/FDI-MODULAR_logo-3D.glb`,
  bancada: `${root}design/FDI-MODULAR_bancada-cobot.glb`,
};
for (const [k, path] of Object.entries(files)) {
  const buf = Buffer.from(out[k], 'base64');
  fs.writeFileSync(path, buf);
  console.log(`${path.replace(root, '')}  ${(buf.length / 1024).toFixed(0)} KB`);
}

// Optimización: vértices soldados (diseño) y compresión meshopt (web)
const run = (cmd) => execSync(`npx gltf-transform ${cmd}`, { cwd: root, stdio: 'inherit' });
run(`weld "${files.escuadra}" "${files.escuadra}"`);
run(`weld "${files.logo}" "${files.logo}"`);
run(`weld "${files.bancada}" "${files.bancada}"`);
run(`weld "${files.web}" tools/.cache/welded.glb`);
fs.mkdirSync(`${root}src/assets/models`, { recursive: true });
run('meshopt tools/.cache/welded.glb src/assets/models/fdi-modular.glb --level medium');
