#!/usr/bin/env bash
# Convierte el plano secuencia de la intro (assets-src/intro/recorrido-1080.mp4) en los fotogramas que pinta el lienzo,
# con el acabado de cine ya puesto, y los junta en paquetes (public/intro/assets/packs/1920/ y packs/960/, p00.webp…):
#   - corrección de color común: sombras frías, luces cálidas que hacen saltar el naranja #fc5220;
#   - destellos anamórficos horizontales y discretos en las luces fuertes;
#   - un enfoque suave (unsharp) después de escalar, y calidad alta, para que no se vea borroso;
#   - el desenfoque de movimiento de los tramos rápidos ya viene en el vídeo (sin mezclar fotogramas: duplicaría los robots);
#   - 48 fotogramas por segundo: el vídeo de 24 se interpola antes por movimiento (ver README) para que vaya fluido.
# El grano y la viñeta los pone la página (css/intro.css), así los fotogramas pesan menos.
# Paquetes: PACK fotogramas WebP seguidos en un solo archivo (extensión .webp: el servidor frena con 429 las
# extensiones que no conoce, como .bin), para que el navegador haga unas 30 peticiones en vez de
# 719 (el servidor frena con «429 Too Many Requests» si llegan cientos seguidas, y cada petición tarda). Formato de
# cada paquete: nº de fotogramas (uint32, little-endian), el tamaño de cada uno (uint32) y los WebP uno tras otro.
# Al terminar dice cuántos fotogramas hay: ese número va en FRAMES.count de public/intro/js/intro.js (y PACK en
# FRAMES.pack).
#
# Uso: tools/videos/intro-fotogramas.sh assets-src/intro/recorrido-1080.mp4 public/intro/assets/packs
set -euo pipefail
SRC=$1 PACKS=$2
FPS=${FPS:-48}
PACK=${PACK:-24}
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
# Fuera de día, tal cual; al cruzar las puertas (3,8 s → 5,2 s) se hace de noche y la nave se va oscureciendo
# según se entra (brillo en función del segundo t), sin perder el color: dentro se sube la saturación y se calienta
# un poco, para que la nave no se vea en blanco y negro. Color: medios cálidos y algo de viveza para que las cajas se vean
# de cartón y los robots blancos; los rojos más intensos se apagan un poco para que los aros no brillen.
NIGHT="eq=eval=frame:brightness='if(lt(t,3.8),0,if(lt(t,5.2),-0.12*(t-3.8)/1.4,-0.09-0.005*t))':contrast='if(lt(t,3.8),1,1.1)':saturation='if(lt(t,3.8),1,1.45)'"
GRADE="fps=$FPS,$NIGHT,eq=contrast=1.06:saturation=1.06:gamma=0.98,colorbalance=rs=-0.02:bs=0.03:rm=0.06:gm=0.025:bm=-0.05:rh=0.05:gh=0.02:bh=-0.04,vibrance=0.3,huesaturation=colors=r:intensity=-0.3:saturation=-0.25:strength=12,colorbalance=rs=0.04:gs=0.01:bs=-0.06:rm=0.05:bm=-0.04,split[g0][g1];[g1]colorlevels=rimin=0.93:gimin=0.93:bimin=0.93,gblur=sigma=70:sigmaV=0.8,colorchannelmixer=rr=0.6:gg=0.8:bb=1.2[fl];[g0][fl]blend=all_mode=screen:all_opacity=0.25"
for W in 1920 960; do
  rm -rf "$OUT/$W" && mkdir -p "$OUT/$W"
  Q=$([ $W = 1920 ] && echo 72 || echo 68)
  ffmpeg -v error -y -i "$SRC" -filter_complex "[0:v]$GRADE,scale=$W:-2:flags=lanczos,unsharp=5:5:0.7:5:5:0,setsar=1[v]" -map "[v]" -an \
    -c:v libwebp -quality "$Q" -compression_level 5 -preset photo -start_number 0 "$OUT/$W/f%04d.webp"
done
for W in 1920 960; do
  rm -rf "${PACKS:?}/$W" && mkdir -p "$PACKS/$W"
  python3 - "$OUT/$W" "$PACKS/$W" "$PACK" <<'PY'
import os, struct, sys
src, dst, n = sys.argv[1], sys.argv[2], int(sys.argv[3])
files = sorted(f for f in os.listdir(src) if f.endswith('.webp'))
for k in range(0, len(files), n):
    blobs = [open(os.path.join(src, f), 'rb').read() for f in files[k:k + n]]
    with open(os.path.join(dst, 'p%02d.webp' % (k // n)), 'wb') as out:
        out.write(struct.pack('<%dI' % (len(blobs) + 1), len(blobs), *map(len, blobs)))
        for b in blobs:
            out.write(b)
PY
done
echo "fotogramas: $(ls "$OUT/1920" | wc -l)  ·  paquetes: $(ls "$PACKS/1920" | wc -l)  ·  1920 px: $(du -sh "$PACKS/1920" | cut -f1)  ·  960 px: $(du -sh "$PACKS/960" | cut -f1)"
