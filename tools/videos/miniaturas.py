"""Descarga la miniatura oficial de un vídeo de YouTube y la guarda como póster 16:9 (1280×720) en
src/assets/images/videos/yt-<id>.jpg. Para los Shorts (vertical) compone el fotograma vertical sobre
una copia ampliada, desenfocada y oscurecida de sí mismo, como hace YouTube.

Uso:  python3 tools/videos/miniaturas.py <id> [<id> ...]      (necesita Pillow)
Los ids de los Shorts se marcan con el prefijo «s:» (p. ej. s:ees0UtTjlfE).
"""
import io
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

OUT = Path(__file__).resolve().parents[2] / 'src/assets/images/videos'
W, H = 1280, 720


def get(url):
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return Image.open(io.BytesIO(r.read())).convert('RGB')
    except Exception:
        return None


def horizontal(vid):
    for name in ('maxresdefault', 'sddefault', 'hqdefault'):
        im = get(f'https://i.ytimg.com/vi/{vid}/{name}.jpg')
        if im is None:
            continue
        # sddefault y hqdefault son 4:3 con franjas negras: se recorta a 16:9.
        w, h = im.size
        ch = round(w * 9 / 16)
        im = im.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch))
        return im.resize((W, H), Image.LANCZOS)
    return None


def vertical(vid):
    im = get(f'https://i.ytimg.com/vi/{vid}/oardefault.jpg')
    if im is None:
        return horizontal(vid)
    bg = im.resize((W, round(W * im.height / im.width)), Image.LANCZOS)
    top = (bg.height - H) // 2
    bg = bg.crop((0, top, W, top + H)).filter(ImageFilter.GaussianBlur(28))
    bg = ImageEnhance.Brightness(bg).enhance(0.45)
    fg = im.resize((round(H * im.width / im.height), H), Image.LANCZOS)
    bg.paste(fg, ((W - fg.width) // 2, 0))
    return bg


for arg in sys.argv[1:]:
    short = arg.startswith('s:')
    vid = arg[2:] if short else arg
    out = OUT / f'yt-{vid}.jpg'
    if out.exists():
        print('ya existe', out.name)
        continue
    im = vertical(vid) if short else horizontal(vid)
    if im is None:
        print('sin miniatura', vid)
        continue
    im.save(out, quality=85, optimize=True, progressive=True)
    print('guardada', out.name)
