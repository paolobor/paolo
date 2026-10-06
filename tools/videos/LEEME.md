# Vídeos oficiales de FAIRINO en las fichas

Las fichas de los cobots tienen una sección «Vídeos» con los vídeos del canal oficial de FAIRINO en YouTube
(https://www.youtube.com/@FAIRINOrobot) en los que sale ese modelo. Los datos están en `src/data/fairino-videos.ts`.

## Cómo se eligen

- Solo se asigna un vídeo a un modelo cuando el **título o la descripción oficial** nombra ese modelo
  (FR3, FR3-C, FR5, FR10, FR16, FR20, FR30, FR3WMS, FR3WML, FR5WML). No se adivina el modelo por la imagen.
- Los tutoriales generales («FR Robot …»), las ferias y las aplicaciones que no dicen el modelo no se asignan.
- FR5 Negro y FR10 Negro muestran los vídeos de su modelo, con un texto que avisa de que salen en blanco.

Revisión del 6-10-2026: 468 vídeos del canal (233 vídeos y 235 Shorts); 19 nombran un modelo del catálogo
(FR3C 1, FR5 7, FR10 5, FR20 5, FR30 1). FR3, FR16, FR3WMS, FR3WML y FR5WML no tienen ninguno con su nombre.
El FR5-C del vídeo de desempaquetado del FR3-C no está en el catálogo.

## Cómo añadir uno

1. Añadir la entrada en `src/data/fairino-videos.ts` (título en español, fiel al original; fecha de publicación).
2. Guardar la miniatura oficial como póster: `python3 tools/videos/miniaturas.py <id>` (Shorts: `s:<id>`).
   Necesita Pillow. Crea `src/assets/images/videos/yt-<id>.jpg` (1280×720).

## Privacidad

Hasta que se pulsa un vídeo solo se ve la miniatura guardada en la web. Al pulsar se abre una ventana con el
reproductor de `youtube-nocookie.com`, que se quita al cerrarla. Lo explica la política de cookies.
