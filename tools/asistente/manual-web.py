# Convierte el manual oficial de FAIRINO publicado como web (fairino-doc-en.readthedocs.io) en textos para la base de
# conocimiento del asistente de ElevenLabs, con las imágenes de cada apartado y el enlace a su página.
#   python3 tools/asistente/manual-web.py <carpeta de caché> <carpeta de salida>
# La caché guarda las páginas descargadas (si ya están, no se vuelven a pedir; bórrala para traer una versión nueva).
#
# Igual que extraer-manual.py (que sale del PDF y no lleva imágenes), cada bloque tiene unos 2.000 caracteres y empieza
# por una línea [Manual FAIRINO · página › apartado] y otra «Enlace:» con la dirección exacta del apartado, para que la
# búsqueda del agente (RAG) nunca devuelva un trozo sin saber de dónde sale. Las imágenes van en su sitio, en formato
# Markdown ![descripción](dirección): el chat del widget las enseña, y el prompt del agente le dice que las use solo en
# las conversaciones de texto ({{system__is_text_only}}). Las imágenes no se copian: se cargan de la web del fabricante.
# Los bloques van separados por una línea en blanco y por dentro no llevan ninguna, porque el agente trocea por ahí.

import os
import re
import sys
import time
import urllib.parse
import urllib.request

from bs4 import BeautifulSoup, NavigableString, Tag

BASE = 'https://fairino-doc-en.readthedocs.io/latest/'
CACHE, OUT = sys.argv[1], sys.argv[2]
OBJETIVO = 2000

# Documentos de salida: los mismos nombres que los del PDF, para cambiarlos uno por uno en ElevenLabs.
GRUPOS = [
    ('fairino-manual-cobot-completo.txt',
     'MANUAL DEL COBOT FAIRINO (completo: puesta en marcha, instalación, seguridad, consola, programación, aplicaciones, '
     'periféricos, apéndices y versiones), con imágenes',
     lambda p: p.startswith('CobotsManual/') or p in ('CapSoftware.html', 'download.html')),
    ('fairino-sdk-python.txt', 'MANUAL DEL SDK DE FAIRINO: PYTHON (y presentación general del SDK)',
     lambda p: p == 'SDKManual/index.html' or re.match(r'SDKManual/(python|Python)', p)),
    ('fairino-sdk-cpp.txt', 'MANUAL DEL SDK DE FAIRINO: C++', lambda p: re.match(r'SDKManual/(cpp|CPP)', p)),
    ('fairino-sdk-csharp.txt', 'MANUAL DEL SDK DE FAIRINO: C#', lambda p: re.match(r'SDKManual/(c|C)%23', p)),
    ('fairino-sdk-java.txt', 'MANUAL DEL SDK DE FAIRINO: JAVA', lambda p: re.match(r'SDKManual/(java|Java)', p)),
    ('fairino-sdk-codigos-error.txt', 'TABLA DE CÓDIGOS DE ERROR DEL SDK DE FAIRINO', lambda p: p == 'SDKManual/errcode.html'),
    ('fairino-maquina-virtual-frcap-lua-cnde-ros.txt',
     'FAIRINO: MÁQUINA VIRTUAL, PLUG-INS FRCAP, LUA, COMUNICACIÓN CNDE, ROS, ROS 2 Y MOVEIT2',
     lambda p: p.split('/')[0] in ('VMMachine', 'FRCap', 'LuaProgram', 'RobotCommunication', 'ROSGuide')),
]


def bajar(ruta):
    """HTML de una página del manual, de la caché o de la web."""
    local = os.path.join(CACHE, urllib.parse.unquote(ruta))
    if not os.path.exists(local):
        os.makedirs(os.path.dirname(local), exist_ok=True)
        req = urllib.request.Request(BASE + ruta, headers={'User-Agent': 'FAIRINO Espana - base de conocimiento'})
        with urllib.request.urlopen(req, timeout=60) as r:
            open(local, 'wb').write(r.read())
        time.sleep(0.3)
    return open(local, encoding='utf-8').read()


def limpio(t):
    t = re.sub(r'[\ue000-\uf8ff¶]', '', t)  # iconos del tema (zona de uso privado de Unicode)
    return re.sub(r'\s+', ' ', t).strip()


def imagen(img, url_pagina, titulo):
    src = img.get('src', '')
    if '_images/' not in src:
        return None  # logotipo del tema y demás adornos
    # Fuera los iconos de botones (en el manual van a 0,75 pulgadas o menos): no le sirven al cliente como imagen.
    medidas = re.findall(r'(?:width|height):\s*([\d.]+)in', img.get('style', ''))
    if any(float(m) <= 1 for m in medidas) or any(img.get(a, '').isdigit() and int(img[a]) <= 80 for a in ('width', 'height')):
        return None
    fig = img.find_parent('figure')
    cap = fig.find('figcaption') if fig else None
    desc = limpio(cap.get_text(' ')) if cap else ''
    desc = desc or f'Imagen de «{titulo}»'
    return f'![{desc.replace("]", ")").replace("[", "(")}]({urllib.parse.urljoin(url_pagina, src)})'


def render(el, url_pagina, titulo):
    """Líneas de texto de un elemento, con las imágenes en su sitio."""
    if isinstance(el, NavigableString):
        t = limpio(str(el))
        return [t] if t else []
    if not isinstance(el, Tag) or el.name in ('script', 'style', 'section', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
        return []
    if el.name == 'img':
        i = imagen(el, url_pagina, titulo)
        return [i] if i else []
    if el.name == 'figcaption':
        return []  # ya va como descripción de la imagen
    if el.name == 'pre':
        codigo = [l.rstrip() for l in el.get_text().split('\n') if l.strip()]
        return ['Código:'] + codigo if codigo else []
    if el.name == 'table':
        filas = []
        for tr in el.find_all('tr'):
            celdas = [limpio(c.get_text(' ')) for c in tr.find_all(['th', 'td'])]
            if any(celdas):
                filas.append(' | '.join(celdas))
            filas += [i for i in (imagen(im, url_pagina, titulo) for im in tr.find_all('img')) if i]
        return filas
    if el.name in ('ul', 'ol'):
        out = []
        for li in el.find_all('li', recursive=False):
            sub = render_hijos(li, url_pagina, titulo)
            if sub:
                out.append('- ' + sub[0])
                out += sub[1:]
        return out
    if el.name in ('p', 'dt', 'dd', 'td', 'th', 'span', 'a', 'strong', 'em', 'code', 'b', 'i'):
        # Texto en línea: las imágenes que lleve dentro van en líneas propias, después del texto.
        imgs = [i for i in (imagen(im, url_pagina, titulo) for im in el.find_all('img')) if i]
        for im in el.find_all('img'):
            im.extract()
        t = limpio(el.get_text(' '))
        if 'admonition-title' in (el.get('class') or []):
            t = t + ':'
        return ([t] if t else []) + imgs
    return render_hijos(el, url_pagina, titulo)


def render_hijos(el, url_pagina, titulo):
    out = []
    for h in el.children:
        out += render(h, url_pagina, titulo)
    return out


def apartados(seccion, ruta_titulos, url_pagina):
    """(ruta de títulos, enlace, líneas) de una sección y de sus subsecciones, en orden."""
    cab = seccion.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], recursive=False)
    titulo = limpio(cab.get_text(' ')) if cab else ''
    ruta = ruta_titulos + ([titulo] if titulo else [])
    enlace = url_pagina + (f'#{seccion["id"]}' if seccion.get('id') and ruta_titulos else '')
    lineas = []
    for h in seccion.children:
        lineas += render(h, url_pagina, titulo or (ruta[-1] if ruta else ''))
    res = [(ruta, enlace, lineas)] if lineas else []
    for sub in seccion.find_all('section', recursive=False):
        res += apartados(sub, ruta, url_pagina)
    return res


def bloques(ruta, enlace, lineas):
    cab = f'[Manual FAIRINO · {" › ".join(ruta)}]\nEnlace: {enlace}'
    out, actual = [], []
    for l in lineas:
        while len(l) > OBJETIVO:  # una línea larguísima (tabla o código sin saltos) se parte a trozos
            out.append(cab + '\n' + '\n'.join(actual + [l[:OBJETIVO]]))
            actual, l = [], l[OBJETIVO:]
        if actual and sum(len(x) + 1 for x in actual) + len(l) > OBJETIVO:
            out.append(cab + '\n' + '\n'.join(actual))
            actual = []
        actual.append(l)
    if actual:
        out.append(cab + '\n' + '\n'.join(actual))
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    indice = BeautifulSoup(bajar('index.html'), 'html.parser')
    paginas = []
    for a in indice.select('a.reference.internal[href]'):
        p = a['href'].split('#')[0]
        if p.endswith('.html') and p not in paginas:
            paginas.append(p)
    usadas = set()
    for nombre, titulo, entra in GRUPOS:
        todos, n_img = [], 0
        for p in paginas:
            if not entra(p):
                continue
            usadas.add(p)
            sopa = BeautifulSoup(bajar(p), 'html.parser')
            cuerpo = sopa.select_one('div[itemprop=articleBody]') or sopa.select_one('div.document')
            # Fuera el icono de enlace de cada título y los índices de capítulos (toctree), que solo repiten títulos.
            for basura in cuerpo.select('a.headerlink, div.toctree-wrapper, nav'):
                basura.decompose()
            url = BASE + p
            for sec in cuerpo.find_all('section', recursive=False):
                for ruta, enlace, lineas in apartados(sec, [], url):
                    for b in bloques(ruta, enlace, lineas):
                        todos.append(b)
                        n_img += b.count('](' + BASE + '_images/')
        texto = f'{titulo}\nFuente: manual oficial de FAIRINO, {BASE} (en inglés).\n\n' + '\n\n'.join(todos) + '\n'
        open(os.path.join(OUT, nombre), 'w', encoding='utf-8').write(texto)
        print(f'{nombre:48s} {len(texto.encode()):9d} bytes  {len(todos):5d} bloques  {n_img:5d} imágenes')
    sueltas = [p for p in paginas if p not in usadas]
    if sueltas:
        print('Páginas sin documento:', ', '.join(sueltas))


main()
