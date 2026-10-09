// Envío de formularios sin servidor (Web3Forms). Si aún no hay clave configurada, se ofrece correo y WhatsApp.
import { getConfig, whatsappUrl } from './config';

// Envía datos al correo de FAIRINO España sin formulario en pantalla (p. ej. el aviso de cada cliente nuevo).
export async function sendToInbox(data: Record<string, string>): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg.forms.accessKey) return false;
  try {
    const res = await fetch(cfg.forms.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: cfg.forms.accessKey, ...data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function submitForm(form: HTMLFormElement, extra: Record<string, string> = {}): Promise<'sent' | 'fallback' | 'error'> {
  const cfg = getConfig();
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
  Object.assign(data, extra);
  // Trampa antispam marcada: es un robot. Se le dice que ha ido bien y no se envía nada.
  if (data.botcheck) {
    if (status) status.textContent = 'Recibido.';
    return 'sent';
  }

  if (!cfg.forms.accessKey) {
    const body = Object.entries(data)
      .filter(([k]) => !['privacidad', 'subject'].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    const mailto = `mailto:${cfg.forms.fallbackEmail}?subject=${encodeURIComponent(data.subject || 'Consulta web')}&body=${encodeURIComponent(body)}`;
    if (status) {
      status.innerHTML = '';
      status.append('El envío automático aún no está activado. ');
      const a = document.createElement('a');
      a.href = mailto;
      a.textContent = `Envíalo por correo a ${cfg.forms.fallbackEmail}`;
      a.className = 'underline font-semibold';
      const w = document.createElement('a');
      w.href = whatsappUrl(cfg.whatsapp, body);
      w.target = '_blank';
      w.rel = 'noopener';
      w.textContent = 'por WhatsApp';
      w.className = 'underline font-semibold';
      status.append(a, ' o ', w, '.');
    }
    return 'fallback';
  }

  try {
    if (status) status.textContent = 'Enviando…';
    const res = await fetch(cfg.forms.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: cfg.forms.accessKey, ...data }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success !== false) {
      if (status) status.textContent = 'Recibido. Te responderemos lo antes posible.';
      form.reset();
      return 'sent';
    }
    throw new Error(json.message || res.statusText);
  } catch {
    if (status) status.textContent = `No se ha podido enviar. Escríbenos a ${cfg.forms.fallbackEmail}.`;
    return 'error';
  }
}

document.querySelectorAll<HTMLFormElement>('form[data-form]:not([data-form="configurator"]):not([data-form="order"])').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    // data-success: página a la que ir cuando el envío automático funciona (p. ej. /gracias/).
    submitForm(form).then((r) => {
      if (r === 'sent' && form.dataset.success) window.location.href = form.dataset.success;
    });
  });
});
