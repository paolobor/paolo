# Uso: python3 tools/fotos/recorte-fondo-blanco.py <foto-del-fabricante.jpg> src/assets/products/<id>/<id>-oficial.png
# Necesita numpy, Pillow y scipy (pip install scipy).
# Quita el fondo blanco liso de una foto de producto: relleno desde los bordes con tolerancia y borde suavizado.
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def cutout(src, dst, T=22, soft=10, maxside=582):
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    d = (255 - im).max(axis=2)              # distancia al blanco
    cand = d < T                             # posible fondo
    lab, n = ndimage.label(cand)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    # huecos cerrados de blanco puro (entre dedos, etc.): también son fondo
    lab2, _ = ndimage.label(d < 8)
    sizes = ndimage.sum(np.ones_like(d), lab2, index=np.arange(lab2.max() + 1))
    holes = (lab2 > 0) & (sizes[lab2] > 30) & ~bg
    bg = bg | ndimage.binary_dilation(holes, iterations=3) & cand
    # alfa: 0 en el fondo claro, rampa en la franja cercana al borde del objeto
    a = np.ones(d.shape, np.float32)
    a[bg] = np.clip((d[bg] - (T - soft)) / soft, 0, 1)
    # borde exterior del objeto un pelín suavizado
    a = np.minimum(a, ndimage.uniform_filter(a, 3) * 1.0 + (1 - ndimage.uniform_filter(bg.astype(np.float32), 3)))
    a = np.clip(a, 0, 1)
    # motas sueltas: fuera todo lo que no esté unido a la pieza principal
    lab3, n3 = ndimage.label(a > 0.1)
    if n3 > 1:
        sz = ndimage.sum(np.ones_like(a), lab3, index=np.arange(n3 + 1)); sz[0] = 0
        keep = sz >= sz.max() * 0.005
        a[~keep[lab3]] = 0
    # descontaminar el blanco del borde
    rgb = im.copy()
    m = (a > 0) & (a < 1)
    rgb[m] = np.clip((im[m] - (1 - a[m, None]) * 255) / a[m, None], 0, 255)
    out = np.dstack([rgb, a * 255]).astype(np.uint8)
    img = Image.fromarray(out, 'RGBA')
    bbox = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    img = img.crop(bbox)
    img.thumbnail((498, maxside), Image.LANCZOS)
    pad = Image.new('RGBA', (img.width + 32, img.height + 32), (0, 0, 0, 0))
    pad.paste(img, (16, 16))
    pad.save(dst, optimize=True)
    print(dst, pad.size, 'fondo %.0f%%' % (100 * bg.mean()))

if __name__ == '__main__':
    cutout(sys.argv[1], sys.argv[2])
