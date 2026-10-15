// Stock y plazos: lee la hoja de Google «Stock web FAIRINO España» (site.stock) y rellena las etiquetas
// [data-stock="<id del producto>"] de la tienda, las fichas, el carrito y el pedido:
//   En stock · ¡Últimas X unidades! (con site.stock.lastUnits o menos, en una etiqueta naranja) · Bajo pedido (con el plazo).
// La versión IP65 de los cobots lleva su propia fila en la hoja («fr5-ip65»); sin esa fila sale «Bajo pedido», porque el
// stock de la fila normal es de la versión estándar (IP54). data-stock-version dice la versión elegida.
// Si la hoja no se puede leer (sin red, sin compartir…) no se enseña nada: mejor nada que un stock equivocado.
// La lectura se guarda 2 minutos en sessionStorage («fairino-stock») para no pedirla en cada página.
import { getConfig } from './config';

interface Row {
  units: number | null;
  days: number | null;
}

const KEY = 'fairino-stock';
const TTL = 2 * 60 * 1000;
const cfg = getConfig().stock;
let data: Promise<Map<string, Row> | null> | null = null;

// CSV con comillas («"a","b, c"»), como lo da Google.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
const num = (s: string | undefined) => {
  const n = parseFloat(String(s ?? '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

function toMap(csv: string): Map<string, Row> | null {
  const [head, ...rows] = parseCsv(csv);
  if (!head) return null;
  const h = head.map(norm);
  const id = h.findIndex((x) => x.startsWith('codigo'));
  const units = h.findIndex((x) => x.startsWith('unidades'));
  const days = h.findIndex((x) => x.startsWith('plazo'));
  if (id < 0 || units < 0) return null;
  const map = new Map<string, Row>();
  for (const r of rows) {
    const k = (r[id] ?? '').trim().toLowerCase().replace(/\s+/g, '-');
    if (k) map.set(k, { units: num(r[units]), days: days >= 0 ? num(r[days]) : null });
  }
  return map;
}

function load(): Promise<Map<string, Row> | null> {
  if (!cfg?.sheetId) return Promise.resolve(null);
  if (data) return data;
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (saved && Date.now() - saved.t < TTL) return (data = Promise.resolve(toMap(saved.csv)));
  } catch {
    /* sin almacenamiento */
  }
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(cfg.sheetId)}/gviz/tq?tqx=out:csv&headers=1`;
  data = fetch(url, { credentials: 'omit' })
    .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
    .then((csv) => {
      const map = toMap(csv);
      if (map) {
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), csv }));
        } catch {
          /* sin almacenamiento */
        }
      }
      return map;
    })
    .catch(() => null);
  return data;
}

// Fila de un producto en la versión elegida: la IP65 solo cuenta con su propia fila.
function rowOf(map: Map<string, Row>, id: string, version: string) {
  return /ip65/.test(version) ? map.get(`${id}-ip65`) : map.get(id);
}

// Texto y tono. «ip54»: el producto tiene versión IP65 y no se ha elegido; el stock es de la estándar y se dice.
function info(row: Row | undefined, full: boolean, ip54: boolean) {
  const units = row?.units ?? 0;
  if (units > 0) {
    const last = units <= cfg.lastUnits;
    const label = last ? (units === 1 ? '¡Última unidad!' : `¡Últimas ${units} unidades!`) : 'En stock';
    const which = full && ip54 ? ' (versión estándar IP54)' : '';
    const when = full && cfg.inStockDelivery ? ` · entrega en ${cfg.inStockDelivery}` : '';
    return { tone: last ? 'last' : 'in', label, rest: which + when };
  }
  const days = row?.days ?? cfg.onOrderDays;
  const when = days ? (full ? ` · plazo de suministro de unos ${days} días` : ` · ${days} días`) : '';
  return { tone: 'order', label: 'Bajo pedido', rest: when };
}

export async function fillStock(root: ParentNode = document) {
  const els = [...root.querySelectorAll<HTMLElement>('[data-stock]')];
  if (!els.length) return;
  const map = await load();
  if (!map) return;
  for (const el of els) {
    const version = el.dataset.stockVersion ?? '';
    const ip54 = el.hasAttribute('data-stock-ip65') && !/ip65/.test(version);
    const r = info(rowOf(map, el.dataset.stock!, version), el.hasAttribute('data-stock-full'), ip54);
    el.dataset.tone = r.tone;
    const text = el.querySelector('[data-stock-text]')!;
    // «Últimas unidades» va en una etiqueta naranja para que no pase desapercibido.
    if (r.tone === 'last') {
      const flag = document.createElement('span');
      flag.className = 'stock-flag';
      flag.textContent = r.label;
      text.replaceChildren(flag, r.rest);
    } else text.textContent = r.label + r.rest;
    el.hidden = false;
  }
}

if (cfg?.sheetId) {
  fillStock();
  // El carrito pinta sus líneas cada vez que cambia: avisa con «stock:scan».
  window.addEventListener('stock:scan', (e) => fillStock((e as CustomEvent).detail ?? document));
  // Escaparate de cobots: al cambiar entre estándar e IP65 cambia su etiqueta.
  document.addEventListener('change', (e) => {
    const r = e.target as HTMLInputElement;
    if (!r.matches?.('[data-version-for]')) return;
    const box = r.closest('article, section') ?? document;
    box.querySelectorAll<HTMLElement>(`[data-stock="${r.dataset.versionFor}"]`).forEach((el) => (el.dataset.stockVersion = r.value));
    fillStock(box);
  });
}
