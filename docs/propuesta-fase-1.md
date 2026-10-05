# Nueva web FAIRINO España · Fase 1: mapa del sitio y dirección visual

Estado: **pendiente de aprobación**. No se programa nada hasta validar este documento.

## 0. Limitación de esta fase

El entorno de trabajo bloquea por política de red `fairino.es` e `inluxrobotics.es`. Por eso:

- La **paleta es provisional**: parte de la hipótesis de que la marca FAIRINO es azul. Hay que verificarla contra el logo y el CSS reales.
- El **logo** aparece como placeholder.
- La **estructura de referencia** se basa en el orden de secciones descrito en el brief, no en una inspección directa del competidor.
- Los textos y specs de producto se extraerán en la fase 3, cuando haya acceso a `fairino.es/productos/<slug>/` (o si se aportan las fichas).

Lo poco que sí se ha podido confirmar por búsqueda: las URLs `/productos/fr5/`, `/productos/ac-mini-controller-2kw/`, `/productos/teach-pendant/`, `/productos/orbbec-gemini-2/`, `/descargas/`, `/industrias/`, `/sobre-nosotros/`, `/contacto/`, y que la web actual tiene "Validar garantía".

## 1. Lectura estratégica

| Tomamos de la referencia | Nos diferenciamos en | No migramos |
|---|---|---|
| Hero de vídeo con carrusel y CTA claros | Paleta azul/navy FAIRINO, sin naranja | Menús ocultos de la plantilla de acero ("steel manufacturing", "Carbon Steel Plate", "Integrated Report"…) |
| Configurador como componente estrella | Datos técnicos en tipografía monoespaciada (lectura de ficha técnica) | Páginas `?page_id=` |
| Ritmo claro/oscuro alterno, prueba social, contadores | Peso en lo local: instalaciones en Toledo, cita, soporte | Cualquier texto, imagen, icono o código del competidor |
| CTA de cita y presupuesto repetidos | Retícula técnica tipo plano en las secciones oscuras | |

Nota: Inlux Robotics también distribuye FAIRINO en Europa. Vendemos el mismo producto, así que la web tiene que diferenciar por **servicio local** (visita, integración, soporte, formación), no por catálogo.

## 2. Mapa del sitio

```
/                                    Inicio
├── /cobots/                         Listado · filtros: carga útil, alcance, aplicación
├── /controladores/                  Listado · filtros: tipo (AC/DC), potencia
├── /accesorios/                     Listado · filtros: visión, garras, sensores de fuerza, control y seguridad
├── /productos/[slug]/               Ficha única (plantilla) · 20 fichas
│     cobots:        fr3wms, fr3wml, fr3c, fr3, fr5, fr10, fr16, fr20, fr30
│     controladores: dc-mini-controller-2kw, dc-controller-5kw, ac-mini-controller-2kw, ac-controller-5kw
│     accesorios:    orbbec-gemini-2, safety-box, smart-tool, teach-pendant, epg40-050,
│                    gzcx-6f-75mm, xjc-6f-d80-h28-a
├── /configurador/                   Configurador de célula (mismo componente que la home)
├── /aplicaciones/                   Hub de 8 aplicaciones
│     └── /aplicaciones/[slug]/      (propuesta) una página por aplicación, misma plantilla
├── /industrias/
├── /soluciones-llave-en-mano/       Células tipo producto [placeholders]
├── /descargas/                      Fichas técnicas, manuales, CAD, certificados · filtros
├── /sobre-nosotros/
├── /blog/
│     └── /blog/[slug]/
├── /reservar-cita/
├── /contacto/
├── /garantia/                       Validar garantía
├── /gracias/                        Confirmación de formularios (noindex)
├── /aviso-legal/
├── /politica-de-privacidad/
├── /politica-de-cookies/
├── /404
└── /en/…                            Espejo en inglés preparado, desactivado hasta tener traducciones
```

- Se **mantienen los slugs actuales** de `/productos/<slug>/` para no perder posicionamiento. Los slugs no verificados se confirmarán en la fase 3.
- URLs antiguas que cambien: página de redirección (GitHub Pages no admite redirecciones de servidor).

### Navegación

- **Productos** (mega-menú): Cobots (9, con carga útil) · Controladores (4) · Accesorios (4 grupos) · tarjeta destacada "Configura tu célula".
- **Soluciones** (mega-menú): Aplicaciones (8) · Industrias · Llave en mano · tarjeta destacada.
- Descargas · Nosotros · Contacto.
- Derecha: enlace "Validar garantía" + botón "Reservar cita".
- El blog se enlaza desde la home (sección 13) y el footer.
- Móvil: menú a pantalla completa con acordeones; "Reservar cita" fijo abajo del panel.

## 3. Home (orden del brief)

| # | Sección | Componente | Notas |
|---|---|---|---|
| 1 | Header fijo | Barra + mega-menús | Transparente sobre el hero, blanca con sombra al hacer scroll |
| 2 | Hero | Vídeo de fondo + carrusel de 3 diapositivas | [VÍDEO: cobot FAIRINO trabajando, 10–15 s, sin audio, ≤ 3 MB]; póster WebP; autoplay 7 s con pausa |
| 3 | Propuesta de valor | 3 tarjetas | Visita en Toledo · Gama completa · Integración llave en mano |
| 4 | Logos | Marquee CSS infinito | [LOGO: partner/certificación/cliente] ×8 |
| 5 | **Configurador de célula** | Pasos + resumen visual | Cobot → versión → controlador → accesorios → presupuesto (formulario o WhatsApp). Precios ocultos por defecto |
| 6 | Monta tu sistema | Banda imagen + texto | 100 % compatible FAIRINO · CTA catálogo |
| 7 | Cifras | 4 contadores animados | [DATO: instalaciones] [DATO: años de experiencia] [DATO: …] [DATO: …] |
| 8 | Asesoramiento gratuito | Split con imagen grande | CTA /reservar-cita |
| 9 | Testimonio | Cita sobre render | [TESTIMONIO REAL] |
| 10 | Aplicaciones | Grid 4×2 con hover | Soldadura, paletizado, pick & place, carga de máquinas, manipulación, lijado/pulido, dosificación/encolado, pintura |
| 11 | Llave en mano | Tarjetas tipo producto | Célula de soldadura, célula de paletizado… [placeholders] |
| 12 | Por qué FAIRINO | 6 características | Copy comercial reescrito |
| 13 | Noticias | 3 últimas del blog | Desde la colección del blog |
| 14 | Contacto final | Banda con foto | [FOTO: instalaciones de Yuncler (Toledo)] · dudas / cita / presupuesto |
| 15 | Footer | 4 columnas + newsletter | Enlaces, contacto, redes, legales |
| + | WhatsApp | Botón flotante | Todas las páginas |

## 4. Dirección visual

Industrial y preciso, sensación premium por contención: mucho blanco, secciones navy con retícula técnica tipo plano, producto recortado sobre fondo limpio, y datos técnicos con aspecto de ficha (`5 kg · 922 mm · ±0,02 mm`).

### Paleta (provisional hasta verificar el logo)

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `ink` Acero nocturno | `#0A1626` | Hero, configurador, footer | Blanco encima 18:1 |
| `navy` | `#10233D` | Superficies oscuras secundarias | |
| `brand` Azul FAIRINO | `#1557C0` | Botones, enlaces, acentos | Blanco encima 6,7:1 (AA) |
| `brand-hi` | `#4D8EF0` | Enlaces y hover sobre oscuro | Sobre ink 5,6:1 |
| `signal` Cian señal | `#22B8CF` | Selección del configurador, contadores, foco. **Solo sobre oscuro** | Sobre ink 7,6:1; sobre blanco no apto para texto |
| `paper` | `#F4F6F9` | Fondo de secciones alternas | |
| `line` | `#DCE2EA` | Bordes y divisores | |
| `text` | `#0E1A2B` | Texto principal | |
| `muted` | `#56657A` | Texto secundario | Sobre blanco 5,9:1 |
| `whatsapp` | `#25D366` | Solo el botón flotante | |

Todo color vive como token en la configuración de Tailwind: si el azul real del logo es otro, se cambia en un sitio.

### Tipografía (autoalojada con Fontsource, subset latin, `font-display: swap`)

- **Titulares:** Archivo variable en anchura expandida (wdth 112–125), pesos 600–800. Aire industrial y de ingeniería.
- **Texto:** IBM Plex Sans 400/500/600. Muy legible, tono técnico sin frialdad.
- **Datos técnicos:** IBM Plex Mono 500, solo en specs, contadores y etiquetas.
- Escala: 14 · 16 · 18 · 22 · 28 · 36 · 48 · 64 px (fluida con `clamp`).

### Componentes

- Botones: radio 10 px; primario azul, secundario con borde, fantasma blanco sobre oscuro.
- Tarjetas: radio 16 px, borde `line`, sombra solo al hover (elevación 4 px).
- Tarjeta de producto: imagen recortada sobre `paper`, nombre, línea de specs en mono, chips de aplicación, "Ver ficha" + "Añadir al configurador".
- Aplicación: imagen 4:5 con degradado inferior, zoom 1,05 al hover.
- Placeholders: borde discontinuo, fondo rayado y etiqueta mono visible.
- Iconos: SVG lineales propios (trazo 1,5 px), sin librería externa.

### Movimiento y rendimiento

- Aparición al hacer scroll con IntersectionObserver (fade + 16 px), una sola vez, sin dejar contenido oculto si falla JS.
- Contadores con `requestAnimationFrame`; carrusel con `scroll-snap` y JS mínimo; marquee solo CSS.
- `prefers-reduced-motion` desactiva vídeo autoplay, marquee y contadores.
- Objetivo Lighthouse > 90: imágenes `astro:assets` → WebP/AVIF con `srcset`, lazy salvo el póster del hero, sin frameworks de UI en cliente.

## 5. Arquitectura técnica

- Astro 7 (estático) + Tailwind CSS 4, despliegue con GitHub Actions a GitHub Pages.
- Catálogo en content collections con esquema validado: un JSON por producto (categoría, specs, imágenes, descargas, aplicaciones, accesorios compatibles, versiones y `precio` opcional). Las 20 fichas salen de una única plantilla.
- Configurador: isla en TypeScript sin framework. Estado en la URL (enlace compartible) y `localStorage`, para que "Añadir al configurador" desde una ficha lo precargue. Precios activables con `showPrices` en la configuración del sitio.
- SEO: title y description por página, Open Graph, canonical, JSON-LD (Organization, LocalBusiness, Product, BreadcrumbList), `@astrojs/sitemap`, `robots.txt`, `hreflang` preparado.
- Cookies: banner propio ligero (aceptar / rechazar / configurar) que bloquea scripts no esenciales hasta el consentimiento.

## 6. Decisiones pendientes

1. **Acceso a fairino.es**: añadir `fairino.es` (e `inluxrobotics.es`) a los dominios permitidos del entorno, o aportar logo SVG, imágenes y fichas.
2. **Paleta**: confirmar el azul real de marca.
3. **Formularios** (GitHub Pages no tiene backend): Formspree, Web3Forms u otro proveedor; WhatsApp como alternativa.
4. **Número de WhatsApp**: +34 627 775 294 o +34 630 832 586.
5. **Reservar cita**: formulario propio con fecha preferida, o calendario externo (Cal.com / Calendly, que exige consentimiento de cookies).
6. **Validar garantía**: qué datos se piden hoy (nº de serie, factura…) y a quién llegan.
7. **Aplicaciones**: una página por aplicación (recomendado para SEO) o una sola página con anclas.
8. **Dominio y despliegue**: dominio propio `fairino.es` en GitHub Pages o subruta temporal de GitHub.
