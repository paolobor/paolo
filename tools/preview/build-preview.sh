#!/bin/bash
# Copia navegable de dist/ para la vista previa (Artifact), con el inicio de la web como página de entrada.
#   npm run build && bash tools/preview/build-preview.sh <carpeta de trabajo> [tienda]
# Con «tienda» como segundo argumento, la página de entrada es la tienda (enlace directo a la tienda).
# Deja <carpeta>/site-dist (raíz a publicar; index.html = inicio o tienda) y <carpeta>/site-files-final.json
# (lista de archivos a publicar junto a index.html).
set -e
REPO=$(cd "$(dirname "$0")/../.." && pwd)
WORK=${1:?Uso: build-preview.sh <carpeta de trabajo> [tienda]}
export ENTRADA=${2:-inicio}
mkdir -p "$WORK"
rm -rf "$WORK/site-dist" && cp -r "$REPO/dist" "$WORK/site-dist" && cd "$WORK/site-dist"
RELINK="$REPO/tools/preview/relink.py" python3 - <<'PY'
import os, re, glob, json
src = open(os.environ['RELINK']).read()
if os.environ['ENTRADA'] == 'tienda':
    # La tienda pasa a index.html y el inicio a inicio/index.html; los enlaces se reescriben igual.
    src = src.replace("os.rename('_astro', 'assets')\n", """os.rename('_astro', 'assets')
import shutil
os.makedirs('inicio', exist_ok=True)
shutil.move('index.html', 'inicio/index.html')
shutil.move('tienda/index.html', 'index.html')
REMAP = {'index.html': 'inicio/index.html', 'tienda/index.html': 'index.html'}
""", 1)
    src = src.replace("""    if f.endswith('.html') and f not in exists:""", """    f = REMAP.get(f, f)
    if f.endswith('.html') and f not in exists:""", 1)
    src = src.replace("""'<title>Web FAIRINO Spain</title>'""", """'<title>Tienda FAIRINO Spain</title>'""", 1)
exec(compile(src, 'relink', 'exec'))
# Las máscaras CSS (--mask:url(...)) se resuelven desde la hoja de estilos, que ya está en assets/.
for page in glob.glob('**/*.html', recursive=True):
    s = open(page).read()
    s2 = re.sub(r'--mask:url\((?:\.\./)*assets/([^)]+)\)', r'--mask:url(\1)', s)
    if s2 != s:
        open(page, 'w').write(s2)
# Fuera lo que nadie usa (p. ej. los PNG/JPG originales que Astro copia aunque las páginas solo piden WebP):
# la vista previa tiene un tope de archivos. Se busca el nombre de cada archivo en páginas, estilos y scripts.
textos = ''.join(open(t, errors='ignore').read() for t in glob.glob('**/*', recursive=True)
                 if os.path.isfile(t) and t.endswith(('.html', '.css', '.js', '.json', '.svg', '.webmanifest')))
# Los datos para buscadores (JSON-LD) enlazan a la web real (https://fairino.es/_astro/…), no a esta copia.
textos = re.sub(r'https://fairino\.es/_astro/[^"\s]+', '', textos)
sobran = [x for x in glob.glob('assets/**/*', recursive=True) + glob.glob('media/**/*', recursive=True)
          if os.path.isfile(x) and not x.endswith(('.css', '.js')) and os.path.basename(x) not in textos]
for x in sobran:
    os.remove(x)
print('sin usar, fuera:', len(sobran))
f = json.load(open('../site-files.json'))
f = [x for x in f if os.path.exists(x) and not x.endswith('.glb') and not x.startswith('models/')]
json.dump(f, open('../site-files-final.json', 'w'))
print('archivos', len(f))
PY
