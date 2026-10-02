// "Añadir al configurador": guarda el producto en la configuración y abre /configurador/.
const KEY = 'fairino-config';

export function addToConfig(slug: string, slot: string, compat: string[] = []) {
  let params = new URLSearchParams();
  try {
    params = new URLSearchParams(localStorage.getItem(KEY) || '');
  } catch {
    /* sin almacenamiento: se pasa por la URL */
  }
  if (slot === 'cobot') {
    params.set('cobot', slug);
    params.delete('version');
    // El controlador elegido deja de valer si no es compatible con el nuevo cobot.
    const ctrl = params.get('controlador');
    if (ctrl && compat.length && !compat.includes(ctrl) && ctrl !== 'asesoramiento') params.delete('controlador');
  } else if (slot === 'controlador') {
    params.set('controlador', slug);
  } else {
    const acc = new Set((params.get('acc') || '').split(',').filter(Boolean));
    acc.add(slug);
    params.set('acc', [...acc].join(','));
  }
  try {
    localStorage.setItem(KEY, params.toString());
  } catch {
    /* ignorado */
  }
  const cfg = JSON.parse(document.getElementById('site-config')?.textContent || '{}');
  const base = (cfg.base || '/').replace(/\/?$/, '/');
  location.href = `${base}configurador/?${params.toString()}`;
}

document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-add-config]');
  if (!btn) return;
  addToConfig(btn.dataset.addConfig!, btn.dataset.slot || '', (btn.dataset.compat || '').split(',').filter(Boolean));
});
