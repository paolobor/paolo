# Fotos oficiales de las fichas de cada cobot en fairino.com (https://www.fairino.com/FR/<n>.html) para la galería de
# las fichas de la web: los renders de estudio de cada modelo (PNG con transparencia) y las fotos de aplicaciones que
# FAIRINO pone en la ficha de ese modelo.
#   python3 tools/fotos/fairino-oficial.py <carpeta de caché>
# Las descargas se guardan en la caché (si ya están, no se vuelven a pedir). Salida:
#   src/assets/products/<modelo>/<modelo>-render-a-oficial.png (y -b): render recortado a la silueta, ≤ 1600 px
#   src/assets/products/fairino-oficial/*.jpg: fotos de aplicaciones (varias se repiten en fichas de la misma serie)
# Solo se asigna a un modelo lo que FAIRINO pone en la ficha de ese modelo (o de su serie: FR3/FR3-C/FR3-WMS/FR3-WML,
# FR5/FR5-WML). Las fotos que la web oficial repite en todas las fichas (articulación, botones de guiado) valen para
# todos los cobots FR. Lo que se usa de cada ficha está en src/content/products/<modelo>.json.

import os
import sys
import urllib.request

from PIL import Image, ImageChops, ImageFilter

BASE = 'https://www.fairino.com/public/uploads/images/'
CACHE = sys.argv[1]
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
PROD = os.path.join(ROOT, 'src/assets/products')
MAX = 1600

# Render oficial → archivo de la ficha. (FR/<n>.html: 1 FR20, 2 FR16, 3 FR10, 4 FR5, 5 FR3, 7 FR3-C, 8 FR30, 9 FR3-WMS,
# 10 FR3-WML, 11 FR5-WML.)
RENDERS = {
    '20230823/b4cffb28c4a5bbdfda9ad9f2e01cf5dc.png': 'fr3/fr3-render-a-oficial.png',
    '20240822/a243b793e0986985de0ef16b08f63b82.png': 'fr3c/fr3c-render-a-oficial.png',
    '20230823/ab20a70966555d0161f0afc893bb388e.png': 'fr5/fr5-render-a-oficial.png',
    '20260107/c9ac7877ed12a60033b31f266a4a4493.png': 'fr5wml/fr5wml-render-a-oficial.png',
    '20230823/a0f921f30921716549dff76e6c156c6a.png': 'fr10/fr10-render-a-oficial.png',
    '20230823/8b602a8d7695ba87820f82c76873f198.png': 'fr16/fr16-render-a-oficial.png',
    '20230823/795776c0fa93e915eca8a3e501996591.png': 'fr20/fr20-render-a-oficial.png',
    '20240822/effc92343ae247e0b456cf5c06dbf806.png': 'fr30/fr30-render-a-oficial.png',
    '20250630/bce7cddbebba989404f2803f02d3cd4c.png': 'fr3wms/fr3wms-render-a-oficial.png',
    '20250630/2fd82e6d8f6e17df87ef5c5402d30cac.png': 'fr3wml/fr3wml-render-a-oficial.png',
}

# Foto oficial → archivo (con el nombre de la solución con la que la presenta FAIRINO: «Rehabilitation Robot», «Laser
# welding», «Pick & place», «Plasma Cutting Robot», «Moxibustion Robot», «Welding Robot», «Screw-Locking Robot»,
# «Coffee/Tea Robot», «Ice-cream Robot»), y recorte vertical opcional (de, a) en píxeles para dejar en 4:3 las fotos verticales (la
# galería las muestra a sangre en 4:3 y el centro cortaría lo importante).
FOTOS = {
    '20230811/5c62b02c437762fee1254e259b89db77.png': ('fr16-rehabilitacion.jpg', None),
    '20230815/603961dc9f17dc6571cb858212ce7443.png': ('fr20-soldadura-laser.jpg', None),
    '20230815/c97dd85052e51a6fbbf7bd6744b25c5b.png': ('fr10-pick-and-place.jpg', None),
    '20230815/46bf86b450af7ee701a11c43d8eaa66b.png': ('corte-plasma.jpg', None),
    '20230823/237e478062dd6e01b84539e44a722456.jpg': ('fr5-moxibustion.jpg', None),
    '20230823/3832a2ab993fbbb6838dc1fead027e2d.jpg': ('fr5-atornillado.jpg', None),
    '20230823/daf762d88d2148ed8ffdafb15cc0f681.jpg': ('fr5-soldadura.jpg', None),
    '20230811/959ef6ae943b367e014c9221e961e139.jpg': ('fr3-helados.jpg', None),
    '20230811/c2dac00b70f13614f89972699442cf53.jpg': ('fr3-bebidas.jpg', None),
    '20230815/fdc3b854b199f6bd0d5fe8845bd5d4bc.png': ('fr3-helado-detalle.jpg', (270, 780)),
    '20230815/331119b384c559b4f3ed2d42ddbd5d8b.png': ('detalle-articulacion.jpg', (135, 645)),
    '20230815/4c09de83f5e6e238fb42bef85d08cfe0.png': ('guiado-manual.jpg', (60, 570)),
    '20240816/ccb1c1293fc328ba2dcbb8cc756e5455.jpg': ('fr30-render-sala.jpg', None),
    '20240816/7a967c7b6f59badb1a980515f696ef72.jpg': ('fr30-presentacion.jpg', None),
}


def bajar(ruta):
    local = os.path.join(CACHE, ruta.replace('/', '-'))
    if not os.path.exists(local):
        os.makedirs(CACHE, exist_ok=True)
        req = urllib.request.Request(BASE + ruta, headers={'User-Agent': 'Mozilla/5.0 (FAIRINO Espana)'})
        with urllib.request.urlopen(req, timeout=60) as r:
            open(local, 'wb').write(r.read())
    return local


def render(src, dst):
    im = Image.open(bajar(src)).convert('RGBA')
    if max(im.size) > 2 * MAX:
        k = 2 * MAX / max(im.size)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    # Fuera la sombra del suelo (gris semitransparente, en el fondo oscuro de la web se ve como una mancha): se queda
    # solo lo opaco (el robot) y un borde de unos píxeles para no perder el suavizado de la silueta.
    a = im.split()[3]
    robot = a.point(lambda v: 255 if v > 200 else 0)
    borde = robot.filter(ImageFilter.MaxFilter(2 * max(2, round(max(im.size) / 400)) + 1))
    im.putalpha(ImageChops.multiply(a, borde))
    im = im.crop(robot.getbbox())
    m = round(max(im.size) * 0.03)  # un poco de aire alrededor de la silueta
    lienzo = Image.new('RGBA', (im.width + 2 * m, im.height + 2 * m), (0, 0, 0, 0))
    lienzo.alpha_composite(im, (m, m))
    if max(lienzo.size) > MAX:
        k = MAX / max(lienzo.size)
        lienzo = lienzo.resize((round(lienzo.width * k), round(lienzo.height * k)), Image.LANCZOS)
    out = os.path.join(PROD, dst)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    lienzo.save(out, optimize=True)
    return out, lienzo.size


def foto(src, dst, corte):
    im = Image.open(bajar(src)).convert('RGB')
    if corte:
        im = im.crop((0, corte[0], im.width, corte[1]))
    out = os.path.join(PROD, 'fairino-oficial', dst)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, quality=90, optimize=True, progressive=True)
    return out, im.size


for src, dst in RENDERS.items():
    out, size = render(src, dst)
    print(f'{os.path.relpath(out, ROOT):60s} {size[0]}×{size[1]}')
for src, (dst, corte) in FOTOS.items():
    out, size = foto(src, dst, corte)
    print(f'{os.path.relpath(out, ROOT):60s} {size[0]}×{size[1]}')
