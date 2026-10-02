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
  versions: { id: string; label: string; delta: number }[];
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
      return { ...l, item: it, version: ver?.label ?? '', unit };
    });
  const count = rows.reduce((n, r) => n + r.q, 0);
  return { rows, count, subtotal, shipping, total: subtotal + shipping, unpriced, fmt: (n: number) => fmt.format(n) };
}

export function cartText(lines = readCart()) {
  const s = cartSummary(lines);
  return [
    ...s.rows.map((r) => `- ${r.q} × ${r.item.name}${r.version ? ` (${r.version})` : ''}${r.unit != null ? ` · ${s.fmt(r.unit)}/ud.` : ''}`),
    `Subtotal: ${s.fmt(s.subtotal)}${s.unpriced ? ' + artículos a consultar' : ''}`,
    `Envío: ${s.fmt(s.shipping)}`,
  ].join('\n');
}
