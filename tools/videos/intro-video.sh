#!/usr/bin/env bash
# Vídeos de la intro, a la máxima calidad que se puede servir en una web:
#   tools/videos/intro-video.sh <fotogramas> public/intro/assets
# <fotogramas>: la carpeta de PNG sin pérdidas que deja intro-fotogramas.sh con FORMATO=png SIN_PAQUETES=1 (lo mejor;
# ver README) o, si no, una de paquetes pNN.webp de 1920 (sale peor: esos fotogramas ya vienen comprimidos).
# Deja intro-1080.mp4 (ordenador y móvil), intro-720.mp4 (conexiones lentas o con ahorro de datos), intro-poster.webp
# (primer fotograma) e intro-still-1..3.webp (las tres imágenes fijas del movimiento reducido). Después, sube VIDEO.v en
# intro.js.
# H.264 de 8 bits porque lo reproduce el chip de vídeo de cualquier aparato (10 bits o AV1 irían más finos, pero muchos
# móviles y ordenadores tendrían que hacerlo a mano y volverían los tirones). Para exprimirlo: preset veryslow, CRF bajo,
# tune film (conserva el detalle y el grano) y aq-mode 3 (más bits en las zonas oscuras, que es casi todo el vídeo: evita
# las manchas y los escalones en los degradados de la noche). El techo de bitrate deja que se pueda ver mientras se
# descarga. Nivel 4.2 (1080p a 48 fps) y 4.0 (720p): con veryslow, x264 subiría a 5.1 por usar más fotogramas de
# referencia, y hay móviles que con 5.1 ya no lo hacen con el chip. Un fotograma clave por segundo y «faststart» para que
# empiece antes.
set -euo pipefail
SRC="$1"
OUT="$2"
FPS=48
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if ls "$SRC"/f0000.png >/dev/null 2>&1; then
  IN="$SRC/f%04d.png"
  EXT=png
else
  python3 - "$SRC" "$TMP" <<'PY'
import glob, os, struct, sys
src, out = sys.argv[1], sys.argv[2]
i = 0
for p in sorted(glob.glob(os.path.join(src, 'p*.webp'))):
    b = open(p, 'rb').read()
    n = struct.unpack_from('<I', b, 0)[0]
    off = 4 * (n + 1)
    for s in struct.unpack_from('<%dI' % n, b, 4):
        open(os.path.join(out, 'f%04d.webp' % i), 'wb').write(b[off:off + s])
        off += s
        i += 1
PY
  IN="$TMP/f%04d.webp"
  EXT=webp
  SRC="$TMP"
fi
N=$(ls "$SRC"/f*."$EXT" | wc -l)
LAST=$((N - 1))
mkdir -p "$OUT"
COMUN=(-c:v libx264 -preset veryslow -tune film -pix_fmt yuv420p -profile:v high -x264-params aq-mode=3:aq-strength=0.9 -g "$FPS" -movflags +faststart -an)
ffmpeg -v error -y -framerate "$FPS" -i "$IN" -vf "format=yuv420p" "${COMUN[@]}" -crf "${CRF_1080:-16}" -level:v 4.2 -maxrate 24M -bufsize 48M "$OUT/intro-1080.mp4"
ffmpeg -v error -y -framerate "$FPS" -i "$IN" -vf "scale=1280:720:flags=lanczos,format=yuv420p" "${COMUN[@]}" -crf "${CRF_720:-19}" -level:v 4.0 -maxrate 8M -bufsize 16M "$OUT/intro-720.mp4"
still() { ffmpeg -v error -y -i "$SRC/f$(printf %04d "$1").$EXT" -c:v libwebp -quality 88 "$OUT/$2"; }
still 0 intro-poster.webp
still $((FPS * 3 / 2)) intro-still-1.webp
still $((FPS * 17 / 2)) intro-still-2.webp
still "$LAST" intro-still-3.webp
ls -la "$OUT"/intro-*
