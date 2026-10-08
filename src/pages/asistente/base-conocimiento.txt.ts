import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../../data/site';
import { applications } from '../../data/applications';
import { industries } from '../../data/industries';
import { solutions } from '../../data/solutions';
import { advice } from '../../data/home';
import { shopCategories } from '../../data/shop';
import tarifa from '../../data/tarifa.json';
import catalogo from '../../data/catalogo.json';
import { downloadGroups } from '../../data/downloads';
import { kits } from '../../data/kits';

// Base de conocimiento para el asistente virtual (ElevenLabs Agents → Knowledge Base, con «Use RAG»).
// Sale de los mismos datos que la web y la tienda, así que se mantiene al día sola: se descarga de
// /asistente/base-conocimiento.txt después de cada build y se vuelve a subir al agente cuando cambie el catálogo.
// Solo datos publicados: lo que en la web es [DATO] o null no se incluye.
// Preparada para la búsqueda del agente (RAG), que trocea por párrafos: cada título va pegado a su texto y cada línea
// dice de qué producto o documento habla, para que ningún trozo suelto llegue al agente sin contexto.

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
  out.push(`Los cobots FAIRINO comprados en España tienen 1 año de garantía. Se activa registrando la compra en ${base}/garantia/`);

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
    if (specs.length) out.push(`Datos técnicos de ${d.name}: ${specs.map(specText).join('; ')}.`);
    if (d.highlights.length) out.push(`Puntos clave de ${d.name}: ${d.highlights.filter((x) => !pendiente(x)).join('; ')}.`);
    const price = d.store.price;
    if (d.upcoming) out.push(`Precio de ${d.name}: se anunciará.`);
    else if (price != null && price > 0) {
      const versions = d.store.versions.filter((v) => v.delta).map((v) => `${v.label}: +${eur(v.delta)}`);
      out.push(`Precio de ${d.name} (PVP): ${eur(price)}${versions.length ? ` (${versions.join('; ')})` : ''}${d.store.shipping ? `; envío ${eur(d.store.shipping)}` : ''}.`);
    } else out.push(`Precio de ${d.name}: consultar (presupuesto a medida).`);
    const compat = d.compatibleWith.map((id) => byId.get(id)?.data.name).filter(Boolean);
    if (compat.length) out.push(`${d.category === 'cobot' ? `Controladores compatibles con ${d.name}` : `${d.name} es compatible con`}: ${compat.join(', ')}.`);
    else if (d.category === 'accesorio') out.push(`${d.name} es compatible con cualquier cobot FAIRINO de la gama FR.`);
    const apps = d.applications.map((s) => applications.find((x) => x.slug === s)?.name).filter(Boolean);
    if (apps.length) out.push(`Aplicaciones de ${d.name}: ${apps.join(', ')}.`);
    out.push(`Ficha de ${d.name} en la web: ${base}/productos/${p.id}/`);
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

  h('Soluciones de aplicación FAIRINO');
  out.push(`Equipos completos de FAIRINO, listos para trabajar. Precio: se pide propuesta. Todas: ${base}/aplicaciones/soluciones/`);
  kits.forEach((k) => {
    h2(k.name);
    out.push(`${k.intro} Dónde se usa: ${k.scenarios.join('; ')}.`);
    out.push(`Ventajas de ${k.name}: ${k.benefits.map((b) => `${b.title} (${b.text.replace(/\.$/, '')})`).join('; ')}.`);
    out.push(`Equipo de ${k.name}: ${k.parts.join(', ')}.`);
    out.push(k.model ? `Modelo de ${k.name}: ${k.model}.` : `Cobots compatibles con ${k.name}: ${k.cobots.map((id) => id.toUpperCase()).join(', ')}.${k.cobotsNote ? ` ${k.cobotsNote}` : ''}`);
    out.push(`Ficha de ${k.name}: ${base}/aplicaciones/soluciones/${k.slug}/`);
  });

  h('Descargas y documentación técnica');
  out.push(
    `Todo está en el centro de descargas de la web: ${base}/descargas/ . La documentación oficial de FAIRINO está en inglés; ` +
      `si el cliente necesita ayuda en español con un documento, FAIRINO España se la da (${site.contacts[0].email}).`,
  );
  out.push(`Catálogo y tarifa de FAIRINO España (${catalogo.fecha.toLowerCase()}, PDF de ${catalogo.paginas} páginas): ${base}/${catalogo.archivo.replace(/^\//, '')}`);
  out.push('Manual completo del cobot en línea (incluye instalación, seguridad, programación, Modbus y códigos de error): https://fairino-doc-en.readthedocs.io/latest/');
  out.push('Manual completo en PDF (más de 3.000 páginas): https://fairino-doc-en.readthedocs.io/_/downloads/en/latest/pdf/');
  for (const g of downloadGroups) {
    h2(g.title);
    out.push(g.text);
    g.items.forEach((it) => out.push(`- ${g.title} · ${it.label}${it.note ? ` (${it.note})` : ''}: ${it.href}`));
  }
  h2('Documentos de cada producto');
  for (const p of products) {
    const docs = p.data.downloads.filter((d) => d.href);
    const abs = (href: string) => (href.startsWith('http') ? href : `${base}/${href.replace(/^\//, '')}`);
    if (docs.length) out.push(`- Descargas de ${p.data.name}: ${docs.map((d) => `${d.label} ${abs(d.href!)}`).join(' · ')}`);
  }

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
    .replace(/^(#+ .+)\n\n/gm, '$1\n')
    .trim();
  return new Response(`${text}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
