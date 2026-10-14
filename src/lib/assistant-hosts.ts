import { GET } from '../pages/asistente/base-conocimiento.txt';
import { site } from '../data/site';

// Dominios que el asistente puede poner como enlace clicable en el chat: la web, sus otros dominios, el manual de FAIRINO
// publicado como web (de ahí salen los documentos del manual de la base de conocimiento) y todos los que aparecen en la
// base de conocimiento de la web (Google Drive, GitHub, fabricantes de accesorios…). Se calcula una vez por build, así
// que al añadir una descarga nueva su dominio entra solo. Los que no están aquí, el widget los enseña como «[blocked]».
let hosts: Promise<string[]> | undefined;

export function assistantLinkHosts(): Promise<string[]> {
  hosts ??= (GET({} as Parameters<typeof GET>[0]) as Promise<Response>)
    .then((r) => r.text())
    .then((text) => {
      const found = [...text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)].map((m) => m[1].toLowerCase());
      const own = [new URL(site.url).hostname, ...site.mirrors, 'fairino-doc-en.readthedocs.io'];
      return [...new Set([...own, ...found.map((h) => h.replace(/^www\./, ''))])];
    });
  return hosts;
}
