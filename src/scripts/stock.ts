// Stock y plazos: lee la hoja de Google «Stock web FAIRINO España» (site.stock) y rellena las etiquetas
// [data-stock="<id del producto>"] de la tienda, las fichas y el carrito:
//   En stock · Últimas X unidades (con site.stock.lastUnits o menos) · Bajo pedido (con el plazo, si se sabe).
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
    const k = (r[id] ?? '').trim();
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

// Texto y tono de un producto. «cat» es la categoría (cobot, controlador, accesorio) para el plazo de la tarifa.
function info(row: Row | undefined, cat: string, full: boolean) {
  const units = row?.units ?? 0;
  if (units > 0) {
    const label = units <= cfg.lastUnits ? (units === 1 ? 'Última unidad' : `Últimas ${units} unidades`) : 'En stock';
    const when = full && cfg.inStockDelivery ? ` · entrega en ${cfg.inStockDelivery}` : '';
    return { tone: units <= cfg.lastUnits ? 'last' : 'in', text: label + when };
  }
  const days = row?.days ?? (cat === 'cobot' ? cfg.cobotOnOrderDays : null);
  const when = days ? (full ? ` · plazo de suministro de unos ${days} días` : ` · ${days} días`) : '';
  return { tone: 'order', text: 'Bajo pedido' + when };
}

export async function fillStock(root: ParentNode = document) {
  const els = [...root.querySelectorAll<HTMLElement>('[data-stock]')];
  if (!els.length) return;
  const map = await load();
  if (!map) return;
  for (const el of els) {
    const r = info(map.get(el.dataset.stock!), (el.dataset.stockCat ?? '').toLowerCase(), el.hasAttribute('data-stock-full'));
    el.dataset.tone = r.tone;
    el.querySelector('[data-stock-text]')!.textContent = r.text;
    el.hidden = false;
  }
}

if (cfg?.sheetId) {
  fillStock();
  // El carrito pinta sus líneas cada vez que cambia: avisa con «stock:scan».
  window.addEventListener('stock:scan', (e) => fillStock((e as CustomEvent).detail ?? document));
}
