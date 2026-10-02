export interface ClientConfig {
  whatsapp: string;
  forms: { endpoint: string; accessKey: string | null; fallbackEmail: string };
  showPrices: boolean;
  currency: string;
  base: string;
}

export function getConfig(): ClientConfig {
  const el = document.getElementById('site-config');
  return JSON.parse(el?.textContent || '{}');
}

export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
