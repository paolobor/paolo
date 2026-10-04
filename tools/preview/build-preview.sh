#!/bin/bash
# Copia navegable de dist/ para la vista previa (Artifact), con el inicio de la web como página de entrada.
#   npm run build && bash tools/preview/build-preview.sh <carpeta de trabajo>
# Deja <carpeta>/site-dist (raíz a publicar; index.html = inicio) y <carpeta>/site-files-final.json
# (lista de archivos a publicar junto a index.html).
set -e
REPO=$(cd "$(dirname "$0")/../.." && pwd)
WORK=${1:?Uso: build-preview.sh <carpeta de trabajo>}
mkdir -p "$WORK"
rm -rf "$WORK/site-dist" && cp -r "$REPO/dist" "$WORK/site-dist" && cd "$WORK/site-dist"
RELINK="$REPO/tools/preview/relink.py" python3 - <<'PY'
import os, re, glob, json
src = open(os.environ['RELINK']).read()
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
