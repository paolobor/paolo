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
    category: z.enum(['cobot', 'controlador', 'accesorio']),
    // Accesorios: visión, garra, fuerza, control. Controladores: ac, dc.
    group: z.string().optional(),
    order: z.number(),
    tagline: z.string(),
    description: z.string(),
    highlights: z.array(z.string()).default([]),
    images: z.array(z.object({ src: image(), alt: z.string() })).default([]),
    // Campos normalizados para filtros y tarjetas.
    payloadKg: z.number().nullable().default(null),
    reachMm: z.number().nullable().default(null),
    repeatabilityMm: z.number().nullable().default(null),
    specs: z.array(spec).default([]),
    applications: z.array(z.string()).default([]),
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
    // Ruta relativa a src/assets/images (p. ej. 'blog/cobot-soldando.jpg').
    cover: z.string().nullable().default(null),
    coverAlt: z.string().default(''),
    draft: z.boolean().default(false),
  }),
});

export const collections = { products, blog };
