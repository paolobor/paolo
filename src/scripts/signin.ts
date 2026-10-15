// Invitar a iniciar sesión o registrarse (SignInNudge, carrito, cabecera) sin cargar Firebase: si hay sesión se sabe por
// el nombre que guarda src/scripts/account.ts en localStorage («fairino-cuenta») al entrar.
import { getConfig } from './config';

export function signedIn() {
  try {
    return Boolean(localStorage.getItem('fairino-cuenta'));
  } catch {
    return false;
  }
}

// /cuenta/ con la pestaña que toca («registro» abre «Registrarse») y la página a la que volver al entrar.
export function accountHref(register = false) {
  const base = getConfig().base.replace(/\/?$/, '/');
  const q = new URLSearchParams();
  if (register) q.set('registro', '1');
  if (!location.pathname.startsWith(`${base}cuenta`)) q.set('volver', location.pathname + location.search);
  const s = q.toString();
  return `${base}cuenta/${s ? `?${s}` : ''}`;
}

// La página a la que volver tras entrar (?volver=), solo si es de esta misma web.
export function backTo(): string | null {
  const v = new URLSearchParams(location.search).get('volver');
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.includes('\\')) return null;
  const u = new URL(v, location.origin);
  return u.origin === location.origin && !/\/cuenta\/?$/.test(u.pathname) ? u.pathname + u.search : null;
}
