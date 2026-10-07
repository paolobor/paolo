import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../../data/site';
import { applications } from '../../data/applications';
import { industries } from '../../data/industries';
import { solutions } from '../../data/solutions';
import { advice } from '../../data/home';
import { shopCategories } from '../../data/shop';
import tarifa from '../../data/tarifa.json';

// Base de conocimiento para el asistente virtual (ElevenLabs Agents → Knowledge Base, con «Use RAG»).
// Sale de los mismos datos que la web y la tienda, así que se mantiene al día sola: se descarga de
// /asistente/base-conocimiento.txt después de cada build y se vuelve a subir al agente cuando cambie el catálogo.
// Solo datos publicados: lo que en la web es [DATO] o null no se incluye.

const pendiente = (s: string | null | undefined) => !s || /\[(DATO|FOTO|TESTIMONIO)/.test(s);
const eur = (n: number) => `${n.toLocaleString('de-DE')} €`;
type Spec = { label: string; value: string | number | null; unit?: string };
const specText = (s: Spec) => `${s.label}: ${s.value}${s.unit ? ` ${s.unit}` : ''}`;

export const GET: APIRoute = async () => {
  const base = site.url.replace(/\/$/, '');
  const products = (await getCollection('products')).sort((a, b) => a.data.order - b.data.order);
  const byId = new Map(products.map((p) => [p.id, p]));
  const out: string[] = [];
  const h = (t: string) => out.push('', `# ${t}`, '');
  const h2 = (t: string) => out.push('', `## ${t}`, '');

  out.push(`BASE DE CONOCIMIENTO DE ${site.name.toUpperCase()}`);
  out.push(`Datos de la web ${site.url}, tarifa de ${tarifa.fecha.toLowerCase()}. Precios PVP en euros.`);

  h('Empresa y contacto');
  out.push(site.description);
  const a = site.address;
  if (a.street) out.push(`Instalaciones y showroom: ${a.street}, ${a.postalCode} ${a.city} (${a.region}), ${a.country}.`);
  site.contacts.forEach((c) => out.push(`Contacto: ${c.email} · teléfono ${c.phone}.`));
  out.push(`WhatsApp: +${site.whatsapp.number}.`);
  out.push(`Formulario de contacto: ${base}/contacto/ · Reservar visita o videollamada: ${base}/reservar-cita/`);
  out.push(`Configurador de célula (elegir cobot, controlador y accesorios y pedir presupuesto): ${base}/configurador/`);
  out.push(`Tienda online: ${base}/tienda/ · Catálogo y tarifa en PDF: ${base}/descargas/`);

  h2(advice.title);
  out.push(advice.text);
  out.push(`Modalidades: ${advice.modes.map((m) => m.label.toLowerCase()).join(' o ')}.`);
  advice.steps.forEach((s, i) => out.push(`${i + 1}. ${s.title}: ${s.text}`));

  h2('Garantía');
  out.push(`Los cobots FAIRINO comprados en España, Portugal o Italia tienen 1 año de garantía. Se activa registrando la compra en ${base}/garantia/`);

  h2('Condiciones de la tarifa');
  tarifa.notas.cobots.forEach((n) => out.push(`- ${n}`));
  out.push(`- ${tarifa.notas.soldadura}`);
  out.push(`- ${tarifa.notas.aplicaciones}`);
  out.push('- Lo que no tiene precio en la tarifa se presupuesta a medida («Consultar»).');

  const producto = (p: (typeof products)[number]) => {
    const d = p.data;
    h2(`${d.name}${d.brand && d.brand !== 'FAIRINO' ? ` (${d.brand})` : ''}`);
    if (d.upcoming) out.push('Estado: próximamente (aún no a la venta; se puede reservar una demo).');
    if (!pendiente(d.tagline)) out.push(d.tagline);
    if (!pendiente(d.description) && d.description !== d.tagline) out.push(d.description);
    const specs = (d.specs as Spec[]).filter((s) => s.value != null && !pendiente(String(s.value)));
    if (specs.length) out.push(`Datos técnicos: ${specs.map(specText).join('; ')}.`);
    if (d.highlights.length) out.push(`Puntos clave: ${d.highlights.filter((x) => !pendiente(x)).join('; ')}.`);
    const price = d.store.price;
    if (d.upcoming) out.push('Precio: se anunciará.');
    else if (price != null && price > 0) {
      const versions = d.store.versions.filter((v) => v.delta).map((v) => `${v.label}: +${eur(v.delta)}`);
      out.push(`Precio (PVP): ${eur(price)}${versions.length ? ` (${versions.join('; ')})` : ''}${d.store.shipping ? `; envío ${eur(d.store.shipping)}` : ''}.`);
    } else out.push('Precio: consultar (presupuesto a medida).');
    const compat = d.compatibleWith.map((id) => byId.get(id)?.data.name).filter(Boolean);
    if (compat.length) out.push(`${d.category === 'cobot' ? 'Controladores compatibles' : 'Compatible con'}: ${compat.join(', ')}.`);
    else if (d.category === 'accesorio') out.push('Compatible con cualquier cobot FAIRINO de la gama FR.');
    const apps = d.applications.map((s) => applications.find((x) => x.slug === s)?.name).filter(Boolean);
    if (apps.length) out.push(`Aplicaciones: ${apps.join(', ')}.`);
    out.push(`Ficha: ${base}/productos/${p.id}/`);
  };

  h('Cobots FAIRINO');
  out.push('Robots colaborativos de seis ejes. Se programan con la consola o llevando el brazo con la mano (arrastre).');
  products.filter((p) => p.data.category === 'cobot').forEach(producto);

  h('Controladores');
  products.filter((p) => p.data.category === 'controlador').forEach(producto);

  h('Accesorios');
  const accessories = products.filter((p) => p.data.category === 'accesorio');
  const done = new Set<string>();
  for (const cat of shopCategories) {
    const keys = [cat.key, ...(cat.subs ?? []).map((s) => s.key)];
    const items = accessories.filter((p) => !done.has(p.id) && p.data.shopCategories.some((k) => keys.includes(k)));
    if (!items.length) continue;
    out.push('', `### ${cat.label}`);
    items.forEach((p) => {
      done.add(p.id);
      producto(p);
    });
  }
  const rest = accessories.filter((p) => !done.has(p.id));
  if (rest.length) {
    out.push('', '### Otros accesorios');
    rest.forEach(producto);
  }

  h('Soluciones llave en mano');
  out.push(`Células completas: diseño, montaje, programación, formación y soporte. Más información: ${base}/soluciones-llave-en-mano/`);
  solutions.forEach((s) => out.push(`- ${s.name}: ${s.summary}${s.includes?.length ? ` Incluye: ${s.includes.join(', ')}.` : ''}`));
  if (tarifa.estaciones?.length) {
    out.push('', 'Estaciones de la tarifa:');
    tarifa.estaciones.forEach((e: { nombre: string; detalle?: string; pvp?: number; incluye?: string }) =>
      out.push(`- ${e.nombre}${e.detalle ? ` (${e.detalle})` : ''}${e.incluye ? `, incluye ${e.incluye}` : ''}${e.pvp ? `: ${eur(e.pvp)}` : ''}.`),
    );
  }

  h('Aplicaciones');
  applications.forEach((ap) => {
    h2(ap.name);
    out.push(ap.intro);
    if (ap.tasks.length) out.push(`Tareas típicas: ${ap.tasks.join('; ')}.`);
    ap.benefits.forEach((b) => out.push(`- ${b.title}: ${b.text}`));
    if (ap.claims?.length) out.push(`Datos publicados por FAIRINO: ${ap.claims.join('; ')}.`);
    out.push(`Más información: ${base}/aplicaciones/${ap.slug}/`);
  });

  h('Sectores');
  industries.forEach((ind) => {
    h2(ind.name);
    out.push(ind.intro);
    if (ind.scenarios.length) out.push(`Casos de uso: ${ind.scenarios.join('; ')}.`);
  });

  const text = out
    .filter((l) => !pendiente(l) || l === '')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return new Response(`${text}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
