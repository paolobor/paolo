"""Comprime el catálogo PDF re-codificando sus imágenes (las páginas son
escaneos JPEG a 150 ppp). Uso: python3 tools/compress-pdf.py entrada.pdf salida.pdf [ppp] [calidad]"""
import io, sys
import pikepdf
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
DPI = float(sys.argv[3]) if len(sys.argv) > 3 else 120
Q = int(sys.argv[4]) if len(sys.argv) > 4 else 64

pdf = pikepdf.open(src)
done = set()
for page in pdf.pages:
    for raw in page.get_images().values():
        if raw.objgen in done:
            continue
        done.add(raw.objgen)
        if raw.get('/SMask') is not None or raw.get('/ImageMask', False):
            continue  # imágenes con transparencia: se dejan igual
        img = pikepdf.PdfImage(raw).as_pil_image()
        if img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')
        # Las páginas completas (1240 px de ancho a 150 ppp) se bajan a DPI
        scale = DPI / 150 if img.width >= 1200 else 1
        if scale < 1:
            img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, 'JPEG', quality=Q, optimize=True, progressive=True)
        if buf.tell() >= len(raw.read_raw_bytes()):
            continue  # no merece la pena
        raw.write(buf.getvalue(), filter=pikepdf.Name.DCTDecode)
        raw.Width, raw.Height = img.width, img.height
        raw.ColorSpace = pikepdf.Name.DeviceRGB if img.mode == 'RGB' else pikepdf.Name.DeviceGray
        raw.BitsPerComponent = 8
        for k in ('/DecodeParms', '/Decode'):
            if k in raw:
                del raw[k]
pdf.remove_unreferenced_resources()
pdf.save(dst, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
print('ok', dst)
