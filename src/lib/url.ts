// Construye rutas internas respetando la base del despliegue (dominio propio o subruta de GitHub Pages).
const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

export function url(path = '/'): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = path.replace(/^\/+/, '');
  return `${base}${clean}`;
}

export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

export function formatNumber(n: number): string {
  return nf.format(n);
}

export function formatPrice(n: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}
