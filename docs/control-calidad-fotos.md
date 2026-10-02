# Control de calidad de las fotos generadas (Higgsfield)

Cada escena parte del recorte oficial del modelo 3D con aros. Se revisa a tamaño completo antes de usarla.

- **Referencia**: `src/assets/products/<modelo>/<modelo>-provisional-3d.png`.
- **Modelo**: `nano_banana_2`, 2k.
- **Pie en la web**: «Imagen ilustrativa».

Comprobaciones de cada escena:

- **J1–J5**: aro naranja-rojo en cada tapa, con 4 tornillos y disco blanco.
- **Brida**: de aluminio. La garra solo puede ir montada sobre ella.
- **Forma**: proporciones, número de ejes y base iguales que el modelo 3D.
- **Limpieza**: sin textos, logotipos ni marcas de agua, y sin piezas inventadas en el brazo.

## FR5 (piloto, 2 de octubre de 2026)

| Archivo en la web | Trabajo | J1–J5 | Brida | Forma | Limpieza | Veredicto |
|---|---|---|---|---|---|---|
| `fairino-fr5-escena-producto.webp`: peana en sala de exposición | `4f1b50e0-7337-463b-82ef-77999fe357d7` | Bien | Bien | Bien, misma postura que el render | Bien | **Vale** |
| `fairino-fr5-escena-pick-and-place.webp`: célula de montaje con garra | `53dedc39-3b99-4253-8fd6-917291b51ebd` | Bien | Bien, garra montada encima | Bien. La muñeca se ve desde otro ángulo | Bien | **Vale** |
| `fairino-fr5-escena-celda.webp`: mesa iluminada con transportadores | `a4ce6377-bb76-404d-8d45-46ee6201ea92` | Bien | Bien, garra montada encima | Bien | Bien | **Vale** |
| Fondo vacío para componer el render real | `540b6f82-a0b6-4e18-845e-7e33911aa5f0` | — | — | La escala de la mesa no deja sitio al robot entero | Bien | **No se usa** |

- **Coste del piloto**: 4 imágenes × 2 créditos = 8 créditos (saldo antes del piloto: 949).
- **Descartado**: el piloto anterior `efbe8dff-…`, porque se generó con la referencia vieja, sin aros ni brida.
