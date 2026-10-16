// Carrito de la tienda: se guarda en el navegador y se comparte entre páginas.
export interface CartLine {
  id: string;
  v: string; // versión
  q: number; // cantidad
}
interface StoreItem {
  id: string;
  name: string;
  category: string;
  price: number | null;
  shipping: number | null;
  versions: { id: string; label: string; delta: number; includes?: string }[];
  includes: string | null;
  img: string | null;
  href: string;
  shopifyVariantId: string | null;
}

const KEY = 'fairino-cart';
const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const storeData = (): Record<string, StoreItem> => JSON.parse(document.getElementById('store-data')?.textContent || '{}');

export function readCart(): CartLine[] {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(c) ? c.filter((l) => l && l.id && l.q > 0) : [];
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* sin almacenamiento: el carrito vive solo en esta página */
  }
  window.dispatchEvent(new CustomEvent('cart:change', { detail: lines }));
}

export function addToCart(id: string, v = '', q = 1) {
  const lines = readCart();
  const found = lines.find((l) => l.id === id && l.v === v);
  if (found) found.q += q;
  else lines.push({ id, v, q });
  writeCart(lines);
  // Para SignInNudge: sin sesión iniciada, invita a entrar o registrarse.
  window.dispatchEvent(new CustomEvent('cart:add', { detail: { id, v, q } }));
}

// Versión elegida en la página para un producto: la de su selector de versión y, en los cobots, la controladora AC o DC
// («estandar~dc»). Si la página no tiene selector, `base` y `power`.
export function chosenVersion(id: string, base = '', power?: string) {
  const sel = document.querySelector<HTMLSelectElement | HTMLInputElement>(`[data-version-for="${id}"]:is(select, input:checked)`);
  const pw = document.querySelector<HTMLInputElement>(`[data-power-for="${id}"]:checked`)?.value ?? power;
  const v = sel?.value ?? base;
  return pw ? (v ? `${v}~${pw}` : pw) : v;
}

export function setQty(id: string, v: string, q: number) {
  writeCart(readCart().map((l) => (l.id === id && l.v === v ? { ...l, q } : l)).filter((l) => l.q > 0));
}

export const clearCart = () => writeCart([]);

export function cartSummary(lines = readCart()) {
  const data = storeData();
  let subtotal = 0;
  let shipping = 0;
  let unpriced = false;
  const rows = lines
    .filter((l) => data[l.id])
    .map((l) => {
      const it = data[l.id];
      const ver = it.versions.find((x) => x.id === l.v);
      const unit = it.price == null ? null : it.price + (ver?.delta ?? 0);
      if (unit == null) unpriced = true;
      else subtotal += unit * l.q;
      shipping += (it.shipping ?? 0) * l.q;
      return { ...l, item: it, version: ver?.label ?? '', includes: ver?.includes ?? it.includes ?? '', unit };
    });
  const count = rows.reduce((n, r) => n + r.q, 0);
  return { rows, count, subtotal, shipping, total: subtotal + shipping, unpriced, fmt: (n: number) => fmt.format(n) };
}

// Baleares (código postal 07…) y Canarias (35…, 38…): el envío sale más caro y se presupuesta aparte («a consultar»).
// Sin código postal válido se mira la provincia.
export function islandOf(cp = '', provincia = ''): 'Baleares' | 'Canarias' | null {
  const c = cp.replace(/\s/g, '');
  if (/^07\d{3}$/.test(c)) return 'Baleares';
  if (/^3[58]\d{3}$/.test(c)) return 'Canarias';
  if (/^\d{5}$/.test(c)) return null;
  const p = provincia
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (/balear|mallorca|menorca|ibiza|eivissa|formentera/.test(p)) return 'Baleares';
  if (/canaria|las palmas|tenerife|lanzarote|fuerteventura|gomera|hierro/.test(p)) return 'Canarias';
  return null;
}

// Texto del pedido para el correo. Con «pickup» (lugar de recogida) no hay envío; con «island», portes a consultar.
export function cartText(lines = readCart(), pickup: string | null = null, island: string | null = null) {
  const s = cartSummary(lines);
  return [
    ...s.rows.flatMap((r) => [
      `- ${r.q} × ${r.item.name}${r.version ? ` (${r.version})` : ''}${r.unit != null ? ` · ${s.fmt(r.unit)}/ud.` : ''}`,
      ...(r.includes ? [`  ${r.includes}.`] : []),
    ]),
    `Subtotal: ${s.fmt(s.subtotal)}${s.unpriced ? ' + artículos a consultar' : ''}`,
    pickup ? `Envío: no (recogida sin gastos en ${pickup})` : island ? `Envío: a consultar (${island})` : `Envío: ${s.fmt(s.shipping)}`,
  ].join('\n');
}
