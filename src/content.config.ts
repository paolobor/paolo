import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Un valor null en una spec se muestra como [DATO: …] hasta que se rellene con el dato oficial.
const spec = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]).nullable(),
  unit: z.string().optional(),
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    // Marca que se muestra en la tarjeta y la ficha (accesorios de terceros: Schmalz, IFM, Mirka…).
    brand: z.string().default('FAIRINO'),
    category: z.enum(['cobot', 'controlador', 'accesorio']),
    // Próximamente (p. ej. el ART7 R7): sale en la tienda y en el catálogo con el distintivo «Próximamente» y «Reserva
    // tu demo»; en el escaparate de la tienda va al final, y no sale en la validación de garantía.
    upcoming: z.boolean().default(false),
    // Accesorios: visión, garra, fuerza, control. Controladores: ac, dc.
    group: z.string().optional(),
    order: z.number(),
    tagline: z.string(),
    description: z.string(),
    highlights: z.array(z.string()).default([]),
    // illustrative: escena generada a partir del render oficial (se muestra a sangre y con el pie «Imagen ilustrativa»).
    images: z.array(z.object({ src: image(), alt: z.string(), illustrative: z.boolean().default(false) })).default([]),
    // Vídeo del producto: sale el primero en la galería de la ficha.
    // - Propio: mp4/webm en /public/media/ (p. ej. 'media/fairino-fr3.mp4'); se reproduce solo, en bucle y sin sonido.
    // - YouTube (canal oficial de FAIRINO): youtube = id del vídeo; se carga solo al pulsar «play» (youtube-nocookie).
    // El póster va en src/assets/images (p. ej. 'videos/…jpg'); en YouTube es su miniatura oficial.
    video: z
      .object({
        mp4: z.string().optional(),
        webm: z.string().optional(),
        youtube: z.string().optional(),
        poster: z.string(),
        alt: z.string(),
      })
      .refine((v) => Boolean(v.mp4 || v.youtube), 'El vídeo necesita mp4 o youtube')
      .optional(),
    // Campos normalizados para filtros y tarjetas.
    payloadKg: z.number().nullable().default(null),
    reachMm: z.number().nullable().default(null),
    repeatabilityMm: z.number().nullable().default(null),
    specs: z.array(spec).default([]),
    applications: z.array(z.string()).default([]),
    // Categorías de la tienda (src/data/shop.ts). Un accesorio puede estar en varias.
    shopCategories: z.array(z.string()).default([]),
    compatibleWith: z.array(z.string()).default([]),
    downloads: z
      .array(
        z.object({
          label: z.string(),
          type: z.enum(['ficha', 'manual', 'cad', 'certificado', 'software']),
          href: z.string().nullable(),
        }),
      )
      .default([]),
    configurator: z
      .object({
        // Hueco del configurador que ocupa el producto.
        slot: z.enum(['cobot', 'controlador', 'gripper', 'camara', 'fuerza', 'safety', 'smarttool', 'pendant']),
        versions: z.array(z.object({ id: z.string(), label: z.string(), note: z.string().optional() })).default([]),
        price: z.number().nullable().default(null),
      })
      .optional(),
    // Tienda: precio de venta (PVP en €), envío y versiones con su suplemento.
    store: z
      .object({
        sku: z.string().nullable().default(null),
        price: z.number().nullable().default(null),
        shipping: z.number().nullable().default(null),
        versions: z
          .array(z.object({ id: z.string(), label: z.string(), delta: z.number().default(0), note: z.string().optional() }))
          .default([]),
        // Para el pago con Shopify (enlace de carrito) cuando los productos estén dados de alta allí.
        shopifyVariantId: z.string().nullable().default(null),
      })
      .default({ sku: null, price: null, shipping: null, versions: [], shopifyVariantId: null }),
    // Uso interno: de dónde salen los datos y si están verificados contra la ficha oficial.
    source: z.object({ url: z.string().nullable(), verified: z.boolean() }).default({ url: null, verified: false }),
    seo: z.object({ title: z.string().optional(), description: z.string().optional() }).default({}),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    // Ruta relativa a src/assets/images (p. ej. 'blog/cobot-soldando.jpg') o a src/assets (escenas del catálogo).
    cover: z.string().nullable().default(null),
    coverAlt: z.string().default(''),
    draft: z.boolean().default(false),
  }),
});

export const collections = { products, blog };
