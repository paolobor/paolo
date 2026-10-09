#!/usr/bin/env bash
# Montaje del vídeo de la intro (public/intro/assets/fairino-intro*.mp4|webm), estilo cine:
#   1. EXTERIOR  exterior.mp4 (Higgsfield · Kling 3.0, sin robots: imagen ilustrativa), a 1,25×; al final la cámara
#                acelera hacia las puertas con desenfoque de movimiento y corte seco.
#   2. INTERIOR  fotogramas de tools/cad/nave.html?shot=interior (8 cobots FAIRINO reales), 3,3 s; entra con un
#                pequeño empujón desenfocado y sale con un latigazo hacia el primer plano.
#   3. CERCA     fotogramas de tools/cad/nave.html?shot=cerca (tapa del codo con su aro naranja), 3 s; el último
#                fotograma es donde se para la intro para entrar por el aro (RING en public/intro/js/intro.js).
# Corrección de color común (sombras frías, luces cálidas que hacen saltar el naranja #fc5220) y destellos
# anamórficos horizontales en las luces fuertes. El grano y la viñeta los pone la página (css/intro.css).
#
# Uso: tools/videos/intro-montaje.sh exterior.mp4 carpeta-interior carpeta-cerca carpeta-salida
set -euo pipefail
EXT=$1 INT=$2 CER=$3 OUT=$4
mkdir -p "$OUT"
FC="
[0:v]setpts=PTS/1.25,fps=24,scale=1920:1080,setsar=1,split[e0][e1];
[e0]trim=end_frame=85,setpts=PTS-STARTPTS[ea];
[e1]trim=start_frame=85:end_frame=97,setpts=PTS-STARTPTS,crop=w='iw/(1+0.9*pow(n/11\,2))':h='ih/(1+0.9*pow(n/11\,2))',scale=1920:1080,tmix=frames=3[eb];
[1:v]fps=24,scale=1920:1080,setsar=1,split=3[i0][i1][i2];
[i0]trim=end_frame=4,setpts=PTS-STARTPTS,crop=w='iw/(1.12-0.03*n)':h='ih/(1.12-0.03*n)',scale=1920:1080,tmix=frames=2[ia];
[i1]trim=start_frame=4:end_frame=73,setpts=PTS-STARTPTS[ib];
[i2]trim=start_frame=73:end_frame=79,setpts=PTS-STARTPTS,crop=w='iw/(1+0.5*pow(n/5\,2))':h='ih/(1+0.5*pow(n/5\,2))',scale=1920:1080,tmix=frames=3[ic];
[2:v]fps=24,scale=1920:1080,setsar=1,split[c0][c1];
[c0]trim=end_frame=66,setpts=PTS-STARTPTS,tmix=frames=3[ca];
[c1]trim=start_frame=66,setpts=PTS-STARTPTS[cb];
[ea][eb][ia][ib][ic][ca][cb]concat=n=7:v=1:a=0,
eq=contrast=1.1:saturation=1.08:gamma=0.97,
colorbalance=rs=-0.05:gs=-0.01:bs=0.07:rm=0.02:bm=-0.01:rh=0.07:gh=0.02:bh=-0.06,split[g0][g1];
[g1]colorlevels=rimin=0.8:gimin=0.8:bimin=0.8,gblur=sigma=60:sigmaV=0.8,colorchannelmixer=rr=0.55:gg=0.8:bb=1.25[fl];
[g0][fl]blend=all_mode=screen:all_opacity=0.55,format=yuv420p"
IN=(-i "$EXT" -framerate 24 -i "$INT/f%04d.png" -framerate 24 -i "$CER/f%04d.png")
ffmpeg -v error -y "${IN[@]}" -filter_complex "$FC[v]" -map "[v]" -an -c:v libx264 -preset slow -crf 24 -profile:v high -g 24 -movflags +faststart "$OUT/fairino-intro.mp4"
ffmpeg -v error -y -i "$OUT/fairino-intro.mp4" -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -g 24 "$OUT/fairino-intro.webm"
ffmpeg -v error -y -i "$OUT/fairino-intro.mp4" -vf scale=-2:720:flags=lanczos -c:v libx264 -preset slow -crf 26 -profile:v high -g 24 -movflags +faststart "$OUT/fairino-intro-720.mp4"
ffmpeg -v error -y -i "$OUT/fairino-intro.mp4" -vf scale=-2:720:flags=lanczos -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 -g 24 "$OUT/fairino-intro-720.webm"
ls -la "$OUT"
