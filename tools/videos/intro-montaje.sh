#!/usr/bin/env bash
# Montaje del vídeo de la intro (public/intro/assets/fairino-intro*.mp4|webm), estilo cine:
#   1. EXTERIOR  exterior.mp4 (Higgsfield · Kling 3.0, sin robots: imagen ilustrativa), a 1,25×; al final la cámara
#                acelera hacia las puertas con desenfoque de movimiento y corte seco.
#   2. INTERIOR  render de tools/cad/nave.html?shot=interior (8 cobots FAIRINO reales) pasado a imagen real con
#                FLUX 3 Video Edit (misma geometría y movimiento) y escalado a 1080p (Topaz), 3,3 s; entra con un
#                pequeño empujón desenfocado y sale con un latigazo hacia el primer plano.
#   3. CERCA     render de tools/cad/nave.html?shot=cerca (tapa del codo con su aro naranja), igual que el interior, 3 s; el último
#                fotograma es donde se para la intro para entrar por el aro (RING en public/intro/js/intro.js).
# Corrección de color común (sombras frías, luces cálidas que hacen saltar el naranja #fc5220) y destellos
# anamórficos horizontales en las luces fuertes. El grano y la viñeta los pone la página (css/intro.css).
#
# Uso: tools/videos/intro-montaje.sh exterior.mp4 interior(.mp4|carpeta) cerca(.mp4|carpeta) carpeta-salida
set -euo pipefail
EXT=$1 INT=$2 CER=$3 OUT=$4
mkdir -p "$OUT"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
# Cada tramo por separado (casi sin pérdida), con sus empujones de cámara y desenfoque de movimiento.
seg() { ffmpeg -v error -y "$@" -an -c:v libx264 -preset fast -crf 10 -pix_fmt yuv420p; }
Z='crop=w=iw/(1+$A*pow(n/$N\,2)):h=ih/(1+$A*pow(n/$N\,2)),scale=1920:1080,setsar=1,tmix=frames=3'
zoom() { A=$1 N=$2; eval echo "\"$Z\""; }
E="setpts=PTS/1.25,fps=24,scale=1920:1080,setsar=1"
F="fps=24,scale=1920:1080:flags=lanczos,setsar=1"
# Interior y primer plano: carpeta de fotogramas (render 3D) o vídeo (el render pasado a imagen real).
src() { if [ -d "$1" ]; then echo "-framerate 24 -i $1/f%04d.png"; else echo "-i $1"; fi; }
read -ra INI <<< "$(src "$INT")"
read -ra CEI <<< "$(src "$CER")"
seg -i "$EXT" -vf "$E,trim=end_frame=85" "$TMP/1.mp4"
seg -i "$EXT" -vf "$E,trim=start_frame=85:end_frame=97,setpts=PTS-STARTPTS,$(zoom 0.9 11)" "$TMP/2.mp4"
seg "${INI[@]}" -vf "$F,trim=end_frame=4,crop=w=iw/(1.12-0.03*n):h=ih/(1.12-0.03*n),scale=1920:1080,setsar=1,tmix=frames=2" "$TMP/3.mp4"
seg "${INI[@]}" -vf "$F,trim=start_frame=4:end_frame=73,setpts=PTS-STARTPTS,setsar=1" "$TMP/4.mp4"
seg "${INI[@]}" -vf "$F,trim=start_frame=73:end_frame=79,setpts=PTS-STARTPTS,$(zoom 0.5 5)" "$TMP/5.mp4"
seg "${CEI[@]}" -vf "$F,trim=end_frame=66,tmix=frames=3,setsar=1" "$TMP/6.mp4"
seg "${CEI[@]}" -vf "$F,trim=start_frame=66,setpts=PTS-STARTPTS,setsar=1" "$TMP/7.mp4"
for k in 1 2 3 4 5 6 7; do echo "file '$TMP/$k.mp4'"; done > "$TMP/lista.txt"
# Color de cine común y destellos anamórficos (las luces fuertes se estiran en horizontal, en azul frío).
GRADE="eq=contrast=1.1:saturation=1.08:gamma=0.97,colorbalance=rs=-0.05:gs=-0.01:bs=0.07:rm=0.02:bm=-0.01:rh=0.07:gh=0.02:bh=-0.06,split[g0][g1];[g1]colorlevels=rimin=0.94:gimin=0.94:bimin=0.94,gblur=sigma=60:sigmaV=0.8,colorchannelmixer=rr=0.55:gg=0.8:bb=1.25[fl];[g0][fl]blend=all_mode=screen:all_opacity=0.45,format=yuv420p"
ffmpeg -v error -y -f concat -safe 0 -i "$TMP/lista.txt" -filter_complex "[0:v]$GRADE[v]" -map "[v]" -an -c:v libx264 -preset slow -crf 24 -profile:v high -g 24 -movflags +faststart "$OUT/fairino-intro.mp4"
ffmpeg -v error -y -i "$OUT/fairino-intro.mp4" -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -g 24 "$OUT/fairino-intro.webm"
ffmpeg -v error -y -i "$OUT/fairino-intro.mp4" -vf scale=-2:720:flags=lanczos -c:v libx264 -preset slow -crf 26 -profile:v high -g 24 -movflags +faststart "$OUT/fairino-intro-720.mp4"
ffmpeg -v error -y -i "$OUT/fairino-intro.mp4" -vf scale=-2:720:flags=lanczos -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 -g 24 "$OUT/fairino-intro-720.webm"
ls -la "$OUT"
