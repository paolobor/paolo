#!/bin/bash
# Copia navegable de dist/ para la vista previa (Artifact), con la tienda como página de entrada.
#   npm run build && bash tools/preview/build-preview.sh <carpeta de trabajo>
# Deja <carpeta>/site-dist (raíz a publicar; index.html = tienda) y <carpeta>/site-files-final.json
# (lista de archivos a publicar junto a index.html).
set -e
REPO=$(cd "$(dirname "$0")/../.." && pwd)
WORK=${1:?Uso: build-preview.sh <carpeta de trabajo>}
mkdir -p "$WORK"
rm -rf "$WORK/site-dist" && cp -r "$REPO/dist" "$WORK/site-dist" && cd "$WORK/site-dist"
RELINK="$REPO/tools/preview/relink.py" python3 - <<'PY'
import os, re, glob, json
src = open(os.environ['RELINK']).read()
src = src.replace("os.rename('_astro', 'assets')\n", """os.rename('_astro', 'assets')
import shutil
os.makedirs('inicio', exist_ok=True)
shutil.move('index.html', 'inicio/index.html')
shutil.move('tienda/index.html', 'index.html')
REMAP = {'index.html': 'inicio/index.html', 'tienda/index.html': 'index.html'}
""", 1)
src = src.replace("""    if f.endswith('.html') and f not in exists:""", """    f = REMAP.get(f, f)
    if f.endswith('.html') and f not in exists:""", 1)
src = src.replace("""open('index.html', 'w').write('<title>Web FAIRINO Spain</title>' + s)""", """open('index.html', 'w').write('<title>Tienda FAIRINO Spain</title>' + s)""", 1)
exec(compile(src, 'relink', 'exec'))
# Las máscaras CSS (--mask:url(...)) se resuelven desde la hoja de estilos, que ya está en assets/.
for page in glob.glob('**/*.html', recursive=True):
    s = open(page).read()
    s2 = re.sub(r'--mask:url\((?:\.\./)*assets/([^)]+)\)', r'--mask:url(\1)', s)
    if s2 != s:
        open(page, 'w').write(s2)
f = json.load(open('../site-files.json'))
f = [x for x in f if os.path.exists(x) and not x.endswith('.glb') and not x.startswith('models/')]
json.dump(f, open('../site-files-final.json', 'w'))
print('archivos', len(f))
PY
