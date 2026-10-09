#!/usr/bin/env bash
# Convierte el plano secuencia de la intro (public/intro/assets/recorrido.mp4) en los fotogramas que pinta el lienzo
# (public/intro/assets/frames/1920/ y frames/960/, f0000.webp…), con el acabado de cine ya puesto:
#   - corrección de color común: sombras frías, luces cálidas que hacen saltar el naranja #fc5220;
#   - destellos anamórficos horizontales y discretos en las luces fuertes;
#   - el desenfoque de movimiento de los tramos rápidos ya viene en el vídeo (sin mezclar fotogramas: duplicaría los robots).
# El grano y la viñeta los pone la página (css/intro.css), así los fotogramas pesan menos.
# Al terminar dice cuántos fotogramas hay: ese número va en FRAMES.count de public/intro/js/intro.js.
#
# Uso: tools/videos/intro-fotogramas.sh public/intro/assets/recorrido.mp4 public/intro/assets/frames
set -euo pipefail
SRC=$1 OUT=$2
FPS=${FPS:-24}
GRADE="fps=$FPS,eq=contrast=1.06:saturation=1.06:gamma=0.98,colorbalance=rs=-0.04:gs=-0.01:bs=0.06:rm=0.02:bm=-0.01:rh=0.06:gh=0.02:bh=-0.05,split[g0][g1];[g1]colorlevels=rimin=0.93:gimin=0.93:bimin=0.93,gblur=sigma=70:sigmaV=0.8,colorchannelmixer=rr=0.6:gg=0.8:bb=1.2[fl];[g0][fl]blend=all_mode=screen:all_opacity=0.4"
for W in 1920 960; do
  rm -rf "$OUT/$W" && mkdir -p "$OUT/$W"
  Q=$([ $W = 1920 ] && echo 54 || echo 52)
  ffmpeg -v error -y -i "$SRC" -filter_complex "[0:v]$GRADE,scale=$W:-2:flags=lanczos,setsar=1[v]" -map "[v]" -an \
    -c:v libwebp -quality "$Q" -compression_level 5 -preset photo -start_number 0 "$OUT/$W/f%04d.webp"
done
echo "fotogramas: $(ls "$OUT/1920" | wc -l)  ·  1920 px: $(du -sh "$OUT/1920" | cut -f1)  ·  960 px: $(du -sh "$OUT/960" | cut -f1)"
