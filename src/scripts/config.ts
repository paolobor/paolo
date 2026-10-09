export interface ClientConfig {
  whatsapp: string;
  forms: { endpoint: string; accessKey: string | null; fallbackEmail: string };
  showPrices: boolean;
  currency: string;
  base: string;
  // Cuentas de cliente (src/scripts/account.ts). emulator: solo en pruebas locales con los emuladores de Firebase.
  accounts: { firebase: { apiKey: string; authDomain: string; projectId: string; appId: string } | null; emulator: boolean };
}

export function getConfig(): ClientConfig {
  const el = document.getElementById('site-config');
  return JSON.parse(el?.textContent || '{}');
}

export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
