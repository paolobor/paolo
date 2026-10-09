#!/usr/bin/env bash
# Convierte el plano secuencia de la intro (assets-src/intro/recorrido-1080.mp4) en los fotogramas que pinta el lienzo
# (public/intro/assets/frames/1920/ y frames/960/, f0000.webp…), con el acabado de cine ya puesto:
#   - corrección de color común: sombras frías, luces cálidas que hacen saltar el naranja #fc5220;
#   - destellos anamórficos horizontales y discretos en las luces fuertes;
#   - un enfoque suave (unsharp) después de escalar, y calidad alta, para que no se vea borroso;
#   - el desenfoque de movimiento de los tramos rápidos ya viene en el vídeo (sin mezclar fotogramas: duplicaría los robots);
#   - 48 fotogramas por segundo: el vídeo de 24 se interpola antes por movimiento (ver README) para que vaya fluido.
# El grano y la viñeta los pone la página (css/intro.css), así los fotogramas pesan menos.
# Al terminar dice cuántos fotogramas hay: ese número va en FRAMES.count de public/intro/js/intro.js.
#
# Uso: tools/videos/intro-fotogramas.sh assets-src/intro/recorrido-1080.mp4 public/intro/assets/frames
set -euo pipefail
SRC=$1 OUT=$2
FPS=${FPS:-48}
# Fuera de día, tal cual; al cruzar las puertas (3,8 s → 5,2 s) se hace de noche y la nave se va oscureciendo
# según se entra (brillo en función del segundo t). Los aros naranjas de los ejes, mate y sin brillo (se apagan los
# rojos y amarillos más intensos).
NIGHT="eq=eval=frame:brightness='if(lt(t,3.8),0,if(lt(t,5.2),-0.17*(t-3.8)/1.4,-0.13-0.008*t))':contrast='if(lt(t,3.8),1,1.12)':saturation=0.95,huesaturation=colors=r+y:intensity=-0.4:saturation=-0.35:strength=50"
GRADE="fps=$FPS,$NIGHT,eq=contrast=1.06:saturation=1.06:gamma=0.98,colorbalance=rs=-0.04:gs=-0.01:bs=0.06:rm=0.02:bm=-0.01:rh=0.06:gh=0.02:bh=-0.05,split[g0][g1];[g1]colorlevels=rimin=0.93:gimin=0.93:bimin=0.93,gblur=sigma=70:sigmaV=0.8,colorchannelmixer=rr=0.6:gg=0.8:bb=1.2[fl];[g0][fl]blend=all_mode=screen:all_opacity=0.25"
for W in 1920 960; do
  rm -rf "$OUT/$W" && mkdir -p "$OUT/$W"
  Q=$([ $W = 1920 ] && echo 72 || echo 68)
  ffmpeg -v error -y -i "$SRC" -filter_complex "[0:v]$GRADE,scale=$W:-2:flags=lanczos,unsharp=5:5:0.7:5:5:0,setsar=1[v]" -map "[v]" -an \
    -c:v libwebp -quality "$Q" -compression_level 5 -preset photo -start_number 0 "$OUT/$W/f%04d.webp"
done
echo "fotogramas: $(ls "$OUT/1920" | wc -l)  ·  1920 px: $(du -sh "$OUT/1920" | cut -f1)  ·  960 px: $(du -sh "$OUT/960" | cut -f1)"
