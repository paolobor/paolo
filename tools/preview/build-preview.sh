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
# Tope de archivos de la vista previa (511): cada imagen se queda con una sola anchura. De cada srcset se deja la
# misma imagen del src (o la más ancha hasta 1200 px), y el resto de anchuras cae abajo por no usarse.
# La web real conserva todas las anchuras.
def una_anchura(tag):
    m = re.search(r'\bsrcset="([^"]+)"', tag)
    if not m:
        return tag
    cands = []
    for c in m.group(1).split(','):
        parts = c.strip().split()
        if not parts:
            continue
        w = int(parts[1][:-1]) if len(parts) > 1 and parts[1].endswith('w') and parts[1][:-1].isdigit() else 0
        cands.append((parts[0], w, c.strip()))
    src = re.search(r'\bsrc="([^"]+)"', tag)
    keep = next((c for c in cands if src and c[0] == src.group(1)), None)
    if keep is None:
        fit = [c for c in cands if c[1] <= 1200] or cands
        keep = max(fit, key=lambda c: c[1])
    return tag[:m.start(1)] + keep[2] + tag[m.end(1):]
for page in glob.glob('**/*.html', recursive=True):
    s = open(page).read()
    s2 = re.sub(r'<(?:img|source)\b[^>]*>', lambda m: una_anchura(m.group(0)), s)
    if s2 != s:
        open(page, 'w').write(s2)
# Y cada imagen, una sola variante en toda la copia: si dos páginas piden anchuras distintas de la misma imagen
# (nombre.HASH_variante.webp), todas pasan a la más pesada (la más ancha) y el resto cae abajo por no usarse.
textos_img = glob.glob('**/*.html', recursive=True) + glob.glob('assets/**/*.js', recursive=True) + glob.glob('**/*.json', recursive=True)
todo = ''.join(open(t, errors='ignore').read() for t in textos_img)
grupos = {}
for x in glob.glob('assets/*.webp') + glob.glob('assets/*.avif') + glob.glob('assets/*.png') + glob.glob('assets/*.jpg'):
    b = os.path.basename(x)
    m = re.match(r'(.+\.[A-Za-z0-9_-]{8})_[A-Za-z0-9_-]+\.(webp|avif|png|jpg)$', b)
    if m and b in todo:
        grupos.setdefault((m.group(1), m.group(2)), []).append(b)
cambio = {}
for vs in grupos.values():
    if len(vs) > 1:
        mayor = max(vs, key=lambda v: os.path.getsize('assets/' + v))
        cambio.update({v: mayor for v in vs if v != mayor})
if cambio:
    patron = re.compile('|'.join(re.escape(v) for v in cambio))
    for t in textos_img:
        s = open(t, errors='ignore').read()
        s2 = patron.sub(lambda m: cambio[m.group(0)], s)
        if s2 != s:
            open(t, 'w').write(s2)
print('variantes de imagen unificadas:', len(cambio))
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
# Tope de archivos de la vista previa: fuera lo que los navegadores no necesitan. Las fuentes .woff sobran donde hay
# .woff2 (todos los navegadores actuales usan .woff2), y de cada vídeo con .webm y .mp4 se queda el .mp4: si falta el
# .webm, el navegador pasa al siguiente <source>. La web real conserva todo.
extra = [x for x in glob.glob('assets/**/*.woff', recursive=True)
         if any(os.path.basename(y).split('.')[0] == os.path.basename(x).split('.')[0] for y in glob.glob('assets/**/*.woff2', recursive=True))]
extra += [x for x in glob.glob('media/*.webm') if os.path.exists(x[:-5] + '.mp4')]
# Subconjuntos de letra que el español no usa (vietnamita y latín extendido: el navegador solo los pide para esos
# caracteres), la página 404 y la imagen para redes sociales, que la vista previa no usa.
extra += [x for x in glob.glob('assets/*-vietnamese-*.woff2') + glob.glob('assets/*-latin-ext-*.woff2')]
extra += [x for x in ['404.html', 'og-default.png'] if os.path.exists(x)]
for x in extra:
    os.remove(x)
print('duplicados para el navegador, fuera:', len(extra))
f = json.load(open('../site-files.json'))
f = [x for x in f if os.path.exists(x) and not x.endswith('.glb') and not x.startswith('models/')]
json.dump(f, open('../site-files-final.json', 'w'))
print('archivos', len(f))
PY
