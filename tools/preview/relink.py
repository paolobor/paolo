# Convierte la web compilada en una copia navegable con rutas relativas (para la vista previa).
import os, re, glob, json
root = os.getcwd()
os.rename('_astro', 'assets')
pages = [p for p in glob.glob('**/*.html', recursive=True)]
exists = set(pages)

SOON = 'proximamente.html'
open(SOON, 'w').write('''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>En construcción</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070504;color:#f5eee8;font:16px/1.6 system-ui,sans-serif;padding:24px}
.c{max-width:520px;text-align:center}h1{font-size:2rem;margin:.2em 0}a{color:#ff7a1a}</style></head>
<body><div class="c"><p style="color:#ff7a1a;letter-spacing:.2em;font-size:.75rem">FAIRINO SPAIN</p><h1>Página en construcción</h1>
<p>Esta página todavía no existe en la vista previa.</p>
<p><a href="javascript:history.back()">Volver</a> · <a href="index.html">Inicio</a> · <a href="tienda/index.html">Tienda</a></p></div></body></html>''')

def target(path):
    # path empieza por "/" (sin dominio). Devuelve la ruta del archivo en la copia y el resto (#, ?).
    m = re.match(r'^/(\./)?([^?#]*)(.*)$', path)
    p, rest = m.group(2), m.group(3)
    if p.startswith('_astro/'):
        return 'assets/' + p[len('_astro/'):], rest
    if p == '' or p.endswith('/'):
        f = p + 'index.html'
    elif '.' in os.path.basename(p):
        f = p
    else:
        f = p + '/index.html'
    if f.endswith('.html') and f not in exists:
        return SOON, ''
    return f, rest

def rel(page, path):
    depth = page.count('/')
    pre = '../' * depth
    f, rest = target(path)
    return pre + f + rest

for page in pages:
    s = open(page).read()
    s = re.sub(r'(href|src|poster|action|data-success)="(/[^"/][^"]*|/)"', lambda m: f'{m.group(1)}="{rel(page, m.group(2))}"', s)
    s = re.sub(r'srcset="([^"]+)"', lambda m: 'srcset="' + ', '.join(
        (rel(page, part.strip().split(' ')[0]) + (' ' + ' '.join(part.strip().split(' ')[1:]) if len(part.strip().split(' ')) > 1 else ''))
        if part.strip().startswith('/') else part.strip() for part in m.group(1).split(',')) + '"', s)
    s = re.sub(r'url\((/_astro/[^)]+)\)', lambda m: f'url({rel(page, m.group(1))})', s)
    # Rutas dentro de JSON incrustado (datos del carrito, configuración)
    s = re.sub(r'"(/(?:\./)?(?:_astro|productos|tienda|cobots|controladores|accesorios|configurador)[^"]*)"', lambda m: '"' + rel(page, m.group(1)) + '"', s)
    s = s.replace('"base":"./"', '"base":"' + ('../' * page.count('/') or './') + '"').replace('"base":"/"', '"base":"' + ('../' * page.count('/') or './') + '"')
    open(page, 'w').write(s)

for c in glob.glob('assets/*.css'):
    x = open(c).read(); open(c, 'w').write(x.replace('/_astro/', './'))
for j in glob.glob('assets/*.js'):
    x = open(j).read()
    x2 = x.replace('configurador/?', 'configurador/index.html?')
    if x2 != x: open(j, 'w').write(x2)

# Página principal del artefacto: inicio sin el esqueleto propio (el visor lo añade).
s = open('index.html').read()
s = re.sub(r'<!DOCTYPE html>', '', s, flags=re.I)
s = re.sub(r'<html[^>]*>', '', s, 1).replace('</html>', '')
s = s.replace('<head>', '', 1).replace('</head>', '', 1)
s = re.sub(r'<body[^>]*>', '', s, 1).replace('</body>', '')
s = re.sub(r'<title>.*?</title>', '', s, 1)
open('index.html', 'w').write('<title>Web FAIRINO Spain</title>' + s)

files = [f for f in glob.glob('**/*', recursive=True) if os.path.isfile(f) and f != 'index.html' and not f.endswith(('.xml', '.txt', '.md'))]
json.dump(sorted(files), open('../site-files.json', 'w'))
print(len(pages), 'páginas;', len(files), 'archivos;', sum(os.path.getsize(f) for f in files) // 1024, 'KB')
