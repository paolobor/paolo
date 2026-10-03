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

## Resto de modelos (3 de octubre de 2026)

Mismo método que el piloto: una referencia por modelo (su recorte con aros) y tres escenas. Todas con la misma tanda de prompts: peana de exposición más dos aplicaciones típicas del modelo.

| Archivo en la web | Trabajo | J1–J5 | Brida | Forma | Limpieza | Veredicto |
|---|---|---|---|---|---|---|
| `fairino-fr3-escena-producto.webp` | `280a6c21-c001-43e4-a3f4-4591198e9870` | Bien | Bien | Bien | Bien | **Vale** |
| `fairino-fr3-escena-pick-and-place.webp` | `8b710814-88f6-490b-b7e8-7d4e54e30c2c` | Bien | Bien, garra encima | Bien | Bien | **Vale** |
| `fairino-fr3-escena-dosificacion.webp` | `4be4c1f0-7c46-46ce-abeb-c59e0b5cc3c8` | Bien | Bien, dosificador encima | Bien. Otra postura | Bien | **Vale** |
| `fairino-fr3wms-escena-producto.webp` | `abe85a29-d5ec-4ed5-ba34-52b81504f366` | Bien | Bien | Bien | Bien | **Vale** |
| `fairino-fr3wms-escena-soldadura.webp` | `ad3587eb-0af6-469a-8823-4c8527d3256c` | Bien | Bien, antorcha con soporte | Bien | Rótulo inventado en el lateral de la soldadora: **difuminado** | **Vale** |
| `fairino-fr3wms-escena-soldadura-movil.webp` | `68f54124-f339-4edb-a586-0e7bcf9869cf` | Bien | Bien | Bien. Robot más pequeño en el encuadre | Bien (marcas ilegibles en el panel) | **Vale** |
| `fairino-fr3wml-escena-producto.webp` | `a06ad70a-6af8-40e9-8e54-a34804d775fc` | Bien | Bien | Bien | Bien (robots genéricos desenfocados al fondo, sin marca) | **Vale** |
| `fairino-fr3wml-escena-soldadura-tuberia.webp` | `8bd74fa6-8eb0-49ca-a87e-c0c746a07510` | Bien | Bien, antorcha TIG con soporte | Bien | Mancha roja tipo rótulo en el fondo: **difuminada** | **Vale** |
| `fairino-fr3wml-escena-soldadura.webp` | `ab0774b2-0ea5-400a-91c2-e2e4e82d01fa` | Bien | Bien | Bien | Bien | **Vale** |
| `fairino-fr5wml-escena-producto.webp` | `c66fb85d-257e-48e2-acd0-b07810ce0769` | Bien | Bien | Bien | Bien | **Vale** |
| Primera soldadura del FR5WML | `503e8cb1-2f0c-40b5-9666-8e469245df38` | Muñeca sin aros, cambiada | Bien | Muñeca simplificada | Bien | **Descartada** |
| `fairino-fr5wml-escena-soldadura.webp` (repetida con la postura de la referencia) | `acb4e78c-2b51-4d5b-b706-e4a3b76aba66` | Bien. Los aros de la muñeca se ven de canto, como en la referencia | Bien, antorcha debajo | Bien | Bien | **Vale** |
| `fairino-fr5wml-escena-manipulacion.webp` | `53f57f1d-ef5d-4ee4-bf2f-e8f497487326` | Bien | Bien, garra encima | Bien | Bien | **Vale** |
| `fairino-fr10-escena-producto.webp` | `26248401-0f76-4bf4-9131-519dda971d10` | Bien | Bien | Bien | Bien | **Vale** |
| `fairino-fr10-escena-carga-de-maquinas.webp` | `3e0883da-a456-45f4-91dc-3f0d52e9b7c5` | Bien | Bien, garra con escuadra | Bien | Bien (hoja ilegible en el CNC) | **Vale** |
| `fairino-fr10-escena-manipulacion.webp` | `d0fceac1-56cc-4f44-b22b-d671da68c5a4` | Bien | Bien, garra encima | Bien | Bien | **Vale** |
| `fairino-fr16-escena-producto.webp` | `9c579d44-0f59-4858-a834-9fe8850d87bd` | Bien | Bien | Bien | Bien | **Vale** |
| `fairino-fr16-escena-carga-de-maquinas.webp` | `e2a351c7-ba81-4e43-963e-70e3c39628ad` | Bien | Bien, garra encima | Bien | Bien | **Vale** |
| `fairino-fr16-escena-manipulacion.webp` | `a25663d0-40b7-4141-99cc-920e85fcc29c` | Bien | Bien, garra encima | Bien | Bien | **Vale** |
| `fairino-fr20-escena-producto.webp` | `61451ef1-f18f-46aa-846a-abd58233170c` | Bien | Bien | Bien | Bien | **Vale** |
| `fairino-fr20-escena-paletizado.webp` | `27de7801-a9fe-4064-a5e3-0bdc0678f433` | Bien | Bien, ventosas encima | Bien | Bien | **Vale** |
| `fairino-fr20-escena-paletizado-doble.webp` | `4763f311-df47-4f6a-81c8-3c98c1ea2742` | Bien | Bien, ventosas encima | Bien | Bien | **Vale** |
| `fairino-fr30-escena-producto.webp` | `dba93c3a-9b48-4b85-8972-6c7590608af0` | Bien | Bien | Bien | Bien | **Vale** |
| `fairino-fr30-escena-paletizado.webp` | `3a3284d3-d1f9-498e-aff6-c770444ec72e` | Bien | Bien, ventosas encima | Bien | Bien (sacos sin rotular) | **Vale** |
| `fairino-fr30-escena-manipulacion.webp` | `3ef34155-2991-4b24-8f89-236d80b934ff` | Bien | Bien, garra encima | Bien | Bien | **Vale** |

- **Coste**: 25 imágenes × 2 créditos = 50 créditos (24 de la tanda y 1 repetida). Saldo: 941 → 891.
- **Retoques**: solo difuminado local de dos rótulos inventados por la IA en máquinas del fondo. El robot no se ha tocado.
- **FR3C**: sin fotos. No tiene modelo 3D en el repositorio oficial y no se genera nada sin una referencia oficial; sigue el marcador `[FOTO: FR3C]`.
