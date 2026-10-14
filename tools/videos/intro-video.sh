#!/usr/bin/env bash
# Vídeos de la intro a partir de los fotogramas de 1920 que saca intro-fotogramas.sh (en paquetes pNN.webp):
#   tools/videos/intro-video.sh <carpeta con los paquetes de 1920> public/intro/assets
# Deja intro-1080.mp4 (ordenador), intro-720.mp4 (móvil y conexión lenta), intro-poster.webp (primer fotograma) e
# intro-still-1..3.webp (las tres imágenes fijas del movimiento reducido). Después, sube VIDEO.v en intro.js.
# H.264 porque lo reproduce el chip de vídeo de cualquier aparato; un fotograma clave por segundo y «faststart» para que
# empiece a verse antes de terminar de descargar.
set -euo pipefail
PACKS="$1"
OUT="$2"
FPS=48
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

python3 - "$PACKS" "$TMP" <<'PY'
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
print(i, 'fotogramas')
PY

LAST=$(($(ls "$TMP"/f*.webp | wc -l) - 1))
mkdir -p "$OUT"
COMUN=(-c:v libx264 -preset slow -pix_fmt yuv420p -profile:v high -g "$FPS" -movflags +faststart -an)
ffmpeg -v error -y -framerate "$FPS" -i "$TMP/f%04d.webp" "${COMUN[@]}" -crf 20 "$OUT/intro-1080.mp4"
ffmpeg -v error -y -framerate "$FPS" -i "$TMP/f%04d.webp" -vf scale=1280:720:flags=lanczos "${COMUN[@]}" -crf 23 "$OUT/intro-720.mp4"
cp "$TMP/f0000.webp" "$OUT/intro-poster.webp"
cp "$TMP/f$(printf %04d $((FPS * 3 / 2)))".webp "$OUT/intro-still-1.webp"
cp "$TMP/f$(printf %04d $((FPS * 17 / 2)))".webp "$OUT/intro-still-2.webp"
cp "$TMP/f$(printf %04d "$LAST")".webp "$OUT/intro-still-3.webp"
ls -la "$OUT"/intro-*
