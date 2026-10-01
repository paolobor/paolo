// Capa DOM sobre el lienzo WebGL: titulares con glitch, rótulos, tarjetas del mapa y fichas de datos.
import { clamp, easeOutCubic, easeOutExpo, hash, range } from './util.js';

export const ORANGE = '#ff7a1a';

// Logotipo FAIRINO en trazos (recreación vectorial del wordmark)
export function fairinoLogo({ color = '#fff', sub = 'COBOT ESPAÑA', width = 420, subColor } = {}) {
  const sw = 13;
  const paths = [
    'M4,16 H150', 'M4,76 H126', 'M10,76 V136',                                  // F
    'M186,136 L262,16 L338,136', 'M262,130 H338',                               // A
    'M378,16 V136',                                                              // I
    'M424,136 V16 H528 Q560,16 560,46 Q560,76 528,76 H440', 'M478,76 L562,136', // R
    'M604,16 V136',                                                              // I
    'M650,136 V16 L782,136 V16',                                                 // N
    'M872,16 H950 Q994,16 994,60 V92 Q994,136 950,136 H872 Q828,136 828,92 V60 Q828,16 872,16 Z', // O
  ];
  const svg = `<svg viewBox="0 0 1000 152" width="${width}" height="${width * 0.152}" style="display:block;overflow:visible">
    <g fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="miter" stroke-linecap="butt">${paths.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`;
  const subHtml = sub ? `<div class="logo-sub" style="color:${subColor || color};font-size:${width * 0.058}px;letter-spacing:${width * 0.032}px;margin-top:${width * 0.03}px">${sub}</div>` : '';
  return `<div class="logo" style="width:${width}px">${svg}${subHtml}</div>`;
}

const CSS = `
.ov{position:absolute;inset:0;width:1920px;height:1080px;overflow:hidden;pointer-events:none;font-family:Anton,Impact,sans-serif;color:#fff}
.ov *{box-sizing:border-box}
.hl{position:absolute;left:0;right:0;text-align:center;text-transform:uppercase;line-height:1.0;letter-spacing:.012em}
.hl .ln{display:block;position:relative;white-space:nowrap}
.hl .o{color:${ORANGE};text-shadow:0 0 28px rgba(255,110,20,.45),0 0 60px rgba(0,0,0,.5)}
.hl .w{color:#fff;text-shadow:0 0 30px rgba(0,0,0,.65),0 0 3px rgba(0,0,0,.4)}
.gl{position:relative;display:inline-block}
.gl .c{position:absolute;left:0;top:0;mix-blend-mode:screen;opacity:0}
.cap{position:absolute;left:78px;bottom:92px;text-transform:uppercase}
.cap .lab{font-family:Inter,sans-serif;font-weight:700;font-size:23px;letter-spacing:.2em;color:rgba(255,255,255,.92);margin-bottom:14px}
.cap .bar{width:86px;height:4px;background:${ORANGE};margin:18px 0 20px}
.cap .big{font-size:66px;line-height:1.02;letter-spacing:.01em;text-shadow:0 0 30px rgba(0,0,0,.7)}
.shade{position:absolute;left:0;bottom:0;width:1300px;height:520px;background:radial-gradient(ellipse at 0% 100%,rgba(0,0,0,.75),rgba(0,0,0,0) 70%)}
.tag{position:absolute;right:56px;top:48px;font-family:Inter,sans-serif;font-weight:600;font-size:17px;letter-spacing:.16em;color:rgba(255,255,255,.88);
  background:rgba(20,20,22,.55);border:1px solid rgba(255,255,255,.18);padding:9px 16px 8px;border-radius:4px;backdrop-filter:blur(2px)}
.logo-sub{font-family:Inter,sans-serif;font-weight:500;text-align:center;white-space:nowrap}
.card{position:absolute;min-width:430px;transform-origin:50% 100%}
.card .top{padding:0 30px}
.card .top{background:#f4f4f2;height:132px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-top:4px solid ${ORANGE};box-shadow:0 10px 40px rgba(0,0,0,.45)}
.card .kind{font-family:Inter,sans-serif;font-weight:700;font-size:15px;letter-spacing:.3em;color:#8a8a8a;margin-bottom:8px}
.card .nm{font-size:42px;color:#141414;letter-spacing:.01em;line-height:1;white-space:nowrap}
.card .strip{background:#0d0d0f;display:flex;align-items:center;padding:12px 18px 13px;gap:16px}
.card .num{font-size:38px;color:${ORANGE};line-height:1}
.card .sep{width:2px;height:40px;background:rgba(255,255,255,.25)}
.card .ct{font-size:27px;color:#fff;line-height:1;letter-spacing:.02em;white-space:nowrap}
.card .co{font-family:Inter,sans-serif;font-weight:600;font-size:13px;letter-spacing:.2em;color:#9a9a9a;margin-top:6px;white-space:nowrap}
.pinline{position:absolute;width:2px;background:linear-gradient(to bottom,rgba(255,255,255,.9),rgba(255,140,60,.9));transform-origin:50% 0}
.coord{position:absolute;font-family:'JetBrains Mono',Consolas,monospace;font-size:15px;letter-spacing:.12em;color:rgba(255,255,255,.75);white-space:nowrap;text-shadow:0 0 6px #000}
.badge{position:absolute;font-size:23px;line-height:1;color:#111;background:#f4f4f2;border-bottom:3px solid ${ORANGE};padding:5px 7px 3px;transform:translate(-50%,-50%);box-shadow:0 4px 16px rgba(0,0,0,.6)}
.bline{position:absolute;height:2px;background:rgba(255,255,255,.85);transform-origin:0 50%}
.legend{position:absolute;left:1330px;top:236px;width:520px;background:rgba(8,8,10,.72);border-top:4px solid ${ORANGE};padding:22px 28px 18px}
.legend .hd{font-size:46px;line-height:1;margin-bottom:6px}
.legend .sub{font-family:Inter,sans-serif;font-weight:700;font-size:15px;letter-spacing:.26em;color:#d8d8d8;margin-bottom:12px}
.sec{position:absolute;left:78px;top:64px;padding-left:22px;border-left:5px solid ${ORANGE}}
.sec .lab{font-family:Inter,sans-serif;font-weight:700;font-size:17px;letter-spacing:.24em;color:rgba(255,255,255,.88);margin-bottom:8px;text-shadow:0 0 12px #000}
.sec .big{font-size:52px;line-height:1;letter-spacing:.015em;text-shadow:0 0 24px rgba(0,0,0,.85)}
.legend .hd span{color:${ORANGE}}
.legend .rw{display:flex;align-items:baseline;gap:14px;padding:6px 0;border-top:1px solid rgba(255,255,255,.08)}
.legend .rn{font-size:24px;color:${ORANGE};width:32px}
.legend .rt{font-size:24px;white-space:nowrap}
.legend .rc{font-family:Inter,sans-serif;font-weight:600;font-size:12px;letter-spacing:.18em;color:#9a9a9a;margin-left:auto;white-space:nowrap}
.spec{position:absolute;width:300px}
.spec .top{background:#f4f4f2;border-top:4px solid ${ORANGE};padding:14px 20px 10px;display:flex;align-items:baseline;justify-content:space-between;box-shadow:0 10px 40px rgba(0,0,0,.5)}
.spec .model{font-size:64px;color:#131313;line-height:1}
.spec .brand{font-family:Inter,sans-serif;font-weight:700;font-size:13px;letter-spacing:.28em;color:#8d8d8d}
.spec .row{background:#0d0d0f;display:flex;align-items:baseline;gap:14px;padding:14px 20px;border-top:1px solid rgba(255,255,255,.08)}
.spec .val{font-size:48px;line-height:1;color:#fff}
.spec .unit{font-size:28px;color:#fff}
.spec .k{font-family:Inter,sans-serif;font-weight:700;font-size:14px;letter-spacing:.28em;color:#9a9a9a;margin-left:auto}
.lead{position:absolute;height:2px;background:rgba(255,255,255,.85);transform-origin:0 50%}
.leaddot{position:absolute;width:12px;height:12px;border-radius:50%;background:${ORANGE};box-shadow:0 0 12px ${ORANGE};transform:translate(-50%,-50%)}
.end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#111}
.end .l1{font-size:64px;letter-spacing:.012em;margin-top:58px;text-transform:uppercase}
.end .l2{font-size:148px;color:${ORANGE};line-height:1;margin-top:8px;letter-spacing:.01em}
.end .rule{width:120px;height:4px;background:${ORANGE};margin:26px 0 24px}
.end .web{font-family:Inter,sans-serif;font-weight:700;font-size:28px;letter-spacing:.06em;color:#222}
.end .edu{font-family:Inter,sans-serif;font-weight:600;font-size:17px;letter-spacing:.3em;color:#8a8a8a;margin-top:14px}
`;

// Texto con palabras clave en naranja: "APOYAMOS A LA *ENSEÑANZA*." -> spans
function kw(s) {
  return s.replace(/\*([^*]+)\*/g, '<span class="o">$1</span>');
}

export function createOverlay(root) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  const ov = document.createElement('div'); ov.className = 'ov'; root.appendChild(ov);
  const items = [];

  // ---------------------------------------------------------------- titulares
  function headline({ t0, t1, lines, size = 112, y = 540, gap = 0.9, outGlitch = true, id }) {
    const el = document.createElement('div'); el.className = 'hl'; ov.appendChild(el);
    el.style.fontSize = size + 'px';
    const lineEls = lines.map((ln) => {
      const d = document.createElement('div'); d.className = 'ln';
      const html = `<span class="w">${kw(ln.text)}</span>`;
      d.innerHTML = `<span class="gl"><span class="b">${html}</span><span class="c cr">${html}</span><span class="c cc">${html}</span></span>`;
      el.appendChild(d);
      d.querySelector('.cr').style.color = '#ff2a2a'; d.querySelector('.cc').style.color = '#20e0ff';
      d.querySelectorAll('.cr .o, .cc .o').forEach((o) => { o.style.color = 'inherit'; o.style.textShadow = 'none'; });
      d.querySelectorAll('.cr .w, .cc .w').forEach((o) => { o.style.textShadow = 'none'; });
      return { d, at: ln.at ?? 0, b: d.querySelector('.b'), cr: d.querySelector('.cr'), cc: d.querySelector('.cc') };
    });
    const it = { kind: 'hl', el, lineEls, t0, t1, y, size, outGlitch, seed: hash(t0 * 7.7 + (id || 0)) * 1000 };
    items.push(it); return it;
  }

  function glitchState(t, t0, seed, dur = 0.34) {
    const g = (t - t0) / dur;
    if (g < 0) return null;
    if (g >= 1) return { on: true, amt: 0 };
    const f = Math.floor((t - t0) * 30);
    const r = (k) => hash(seed + f * 13.1 + k * 71.3);
    const amt = Math.pow(1 - g, 1.4);
    const on = f < 1 ? true : r(1) > 0.12 * amt;
    return { on, amt, r };
  }

  function applyGlitch(le, st, flash) {
    if (!st) { le.d.style.visibility = 'hidden'; return; }
    le.d.style.visibility = st.on ? 'visible' : 'hidden';
    if (st.amt <= 0.001) {
      le.b.style.transform = ''; le.b.style.clipPath = ''; le.b.style.filter = '';
      le.cr.style.opacity = 0; le.cc.style.opacity = 0; return;
    }
    const r = st.r, a = st.amt;
    const dx = (r(2) - 0.5) * 60 * a, sk = (r(3) - 0.5) * 14 * a;
    le.b.style.transform = `translateX(${dx}px) skewX(${sk}deg)`;
    const y0 = r(4) * 80, h = 10 + r(5) * 40;
    le.b.style.clipPath = r(6) < 0.6 * a ? `polygon(0 0,100% 0,100% ${y0}%,${(r(7) - 0.5) * 20}% ${y0}%,${(r(7) - 0.5) * 20}% ${y0 + h}%,100% ${y0 + h}%,100% 100%,0 100%)` : '';
    le.b.style.filter = flash ? `brightness(${1 + 2.5 * a})` : '';
    le.cr.style.opacity = 0.9 * a; le.cc.style.opacity = 0.9 * a;
    le.cr.style.transform = `translateX(${(12 + r(8) * 26) * a}px) translateY(${(r(9) - 0.5) * 8 * a}px)`;
    le.cc.style.transform = `translateX(${-(12 + r(10) * 26) * a}px) translateY(${(r(11) - 0.5) * 8 * a}px)`;
  }

  // ---------------------------------------------------------------- rótulo abajo a la izquierda
  function caption({ t0, t1, label, lines, logo = false, tag = false }) {
    const el = document.createElement('div'); el.style.cssText = 'position:absolute;inset:0'; ov.appendChild(el);
    el.innerHTML = `<div class="shade"></div><div class="cap">
      ${logo ? `<div class="lg">${fairinoLogo({ width: 330, sub: 'COBOT ESPAÑA' })}</div>` : ''}
      ${label ? `<div class="lab">${label}</div>` : ''}
      <div class="bar"></div>
      ${lines.map((l) => `<div class="big ln"><span class="w">${kw(l)}</span></div>`).join('')}
    </div>`;
    const parts = [...el.querySelectorAll('.lg, .lab, .bar, .big')];
    const it = { kind: 'cap', el, parts, t0, t1 };
    items.push(it); return it;
  }

  // rótulo fijo de sección (arriba a la izquierda) con glitch de entrada
  function sectionTag({ t0, t1, label, text }) {
    const el = document.createElement('div'); el.className = 'sec'; ov.appendChild(el);
    el.innerHTML = `<div class="lab">${label}</div><div class="big">${text}</div>`;
    const it = { kind: 'sec', el, t0, t1, seed: hash(t0 * 3.3) * 1000 };
    items.push(it); return it;
  }

  function tagItem({ t0, t1, text = 'RECREACIÓN CON IA' }) {
    const el = document.createElement('div'); el.className = 'tag'; el.textContent = text; ov.appendChild(el);
    const it = { kind: 'tag', el, t0, t1 }; items.push(it); return it;
  }

  // ---------------------------------------------------------------- tarjetas del mapa
  function mapCard(c) {
    const el = document.createElement('div'); el.className = 'card'; ov.appendChild(el);
    el.innerHTML = `<div class="top"><div class="kind">${c.kind}</div><div class="nm">${c.name}</div></div>
      <div class="strip"><div class="num">${c.n}</div><div class="sep"></div><div><div class="ct">${c.city.split(' · ')[0]}</div>
      <div class="co">${(c.city.split(' · ')[1] ? c.city.split(' · ')[1] + ' · ' : '') + c.coord}</div></div></div>`;
    const line = document.createElement('div'); line.className = 'pinline'; ov.appendChild(line);
    return { el, line };
  }

  function miniLabel(c, off) {
    const el = document.createElement('div'); el.className = 'badge'; el.textContent = c.n; ov.appendChild(el);
    const ln = document.createElement('div'); ln.className = 'bline'; ov.appendChild(ln);
    return {
      set(p, k) {
        const vis = !!p && k > 0.001;
        el.style.display = ln.style.display = vis ? '' : 'none';
        if (!vis) return;
        const x = p.x + off[0], y = p.y + off[1];
        el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.opacity = k;
        el.style.transform = `translate(-50%,-50%) scale(${0.7 + 0.3 * k})`;
        const L = Math.hypot(off[0], off[1]) - 16;
        ln.style.left = p.x + 'px'; ln.style.top = p.y + 'px'; ln.style.width = Math.max(0, L) * k + 'px';
        ln.style.transform = `rotate(${Math.atan2(off[1], off[0])}rad)`; ln.style.opacity = k;
      },
    };
  }

  function legend(cs) {
    const el = document.createElement('div'); el.className = 'legend'; ov.appendChild(el);
    el.innerHTML = `<div class="hd"><span>10</span> CENTROS</div><div class="sub">INCORPORADOS EN 2026</div>` + cs.map((c) => `<div class="rw"><span class="rn">${c.n}</span><span class="rt">${c.name}</span><span class="rc">${c.city.split(' · ')[0]}</span></div>`).join('');
    const rows = [...el.querySelectorAll('.rw')], hd = el.querySelector('.hd');
    return {
      update(t, t0, t1) {
        const vis = t >= t0 && t < t1;
        el.style.display = vis ? '' : 'none'; if (!vis) return;
        const out = range(t, t1 - 0.15, t1);
        const k = easeOutExpo(range(t, t0, t0 + 0.3));
        el.style.opacity = k * (1 - out); el.style.transform = `translateX(${(1 - k) * 40}px)`;
        rows.forEach((r, i) => { const kr = easeOutCubic(range(t, t0 + 0.1 + i * 0.045, t0 + 0.3 + i * 0.045)); r.style.opacity = kr; r.style.transform = `translateX(${(1 - kr) * 24}px)`; });
      },
    };
  }

  // ---------------------------------------------------------------- ficha técnica de robot
  function specCard({ model, rows }) {
    const el = document.createElement('div'); el.className = 'spec'; ov.appendChild(el);
    el.innerHTML = `<div class="top"><div class="model">${model}</div><div class="brand">FAIRINO</div></div>` +
      rows.map((r) => `<div class="row"><span class="val">${r.v}</span><span class="unit">${r.u}</span><span class="k">${r.k}</span></div>`).join('');
    const lead = document.createElement('div'); lead.className = 'lead'; ov.appendChild(lead);
    const dot = document.createElement('div'); dot.className = 'leaddot'; ov.appendChild(dot);
    return { el, rows: [...el.querySelectorAll('.row')], top: el.querySelector('.top'), lead, dot };
  }

  // ---------------------------------------------------------------- cierre
  function endCard({ t0, t1 }) {
    const el = document.createElement('div'); el.className = 'end'; ov.appendChild(el);
    el.innerHTML = `<div class="e-logo">${fairinoLogo({ color: '#151515', width: 560, sub: 'COBOT ESPAÑA', subColor: '#3a3a3a' })}</div>
      <div class="l1 e-a">Traed a vuestros alumnos.</div>
      <div class="l2 e-b">OS ESPERAMOS.</div>
      <div class="rule e-c"></div>
      <div class="edu e-d">EDUCAFAIRINO 2026–2027</div>`;
    const it = { kind: 'end', el, t0, t1, parts: {
      logo: el.querySelector('.e-logo'), a: el.querySelector('.e-a'), b: el.querySelector('.e-b'), c: el.querySelector('.e-c'), d: [...el.querySelectorAll('.e-d')],
    } };
    items.push(it); return it;
  }

  function update(t, fps = 30) {
    for (const it of items) {
      const vis = t >= it.t0 - 1e-6 && t < it.t1;
      it.el.style.display = vis ? '' : 'none';
      if (!vis) continue;
      if (it.kind === 'hl') {
        const h = it.lineEls.length * it.size * 1.0;
        it.el.style.top = (it.y - h / 2) + 'px';
        const outT = it.t1 - 0.12;
        for (let i = 0; i < it.lineEls.length; i++) {
          const le = it.lineEls[i];
          const st = glitchState(t, it.t0 + le.at, it.seed + i * 31);
          if (it.outGlitch && t >= outT && st) {
            const f = Math.floor((t - outT) * fps);
            const r = (k) => hash(it.seed + 500 + f * 17.3 + k * 3.1 + i);
            applyGlitch(le, { on: r(0) > 0.35, amt: 0.8, r }, false);
          } else applyGlitch(le, st, true);
        }
      } else if (it.kind === 'cap') {
        it.parts.forEach((p, i) => {
          const k = easeOutCubic(range(t, it.t0 + i * 0.07, it.t0 + i * 0.07 + 0.35));
          const out = 1 - range(t, it.t1 - 0.15, it.t1);
          p.style.opacity = k * out; p.style.transform = `translateX(${(1 - k) * -40}px)`;
        });
      } else if (it.kind === 'sec') {
        const k = easeOutExpo(range(t, it.t0, it.t0 + 0.35));
        const out = range(t, it.t1 - 0.15, it.t1);
        const f = Math.floor(t * fps), g = t - it.t0 < 0.2 ? (hash(it.seed + f) - 0.5) * 30 * (1 - (t - it.t0) / 0.2) : 0;
        it.el.style.opacity = k * (1 - out);
        it.el.style.transform = `translateX(${(1 - k) * -40 + g}px)`;
      } else if (it.kind === 'tag') {
        it.el.style.opacity = range(t, it.t0, it.t0 + 0.15);
      } else if (it.kind === 'end') {
        const P = it.parts;
        const kl = easeOutExpo(range(t, it.t0 + 0.1, it.t0 + 0.9));
        P.logo.style.opacity = kl; P.logo.style.transform = `scale(${1.12 - 0.12 * kl})`; P.logo.style.filter = `blur(${(1 - kl) * 10}px)`;
        const ka = range(t, it.t0 + 0.93, it.t0 + 1.0);
        P.a.style.opacity = ka;
        const kb = range(t, it.t0 + 1.86, it.t0 + 1.9);
        P.b.style.opacity = kb; P.b.style.transform = `scale(${1 + 0.18 * Math.max(0, 1 - (t - it.t0 - 1.86) / 0.35)})`;
        const kc = easeOutCubic(range(t, it.t0 + 2.2, it.t0 + 2.7));
        P.c.style.width = 120 * kc + 'px';
        P.d.forEach((d) => { d.style.opacity = range(t, it.t0 + 2.4, it.t0 + 2.9); });
      }
    }
  }

  return { ov, headline, caption, tagItem, sectionTag, mapCard, miniLabel, legend, specCard, endCard, update, glitchState, applyGlitch };
}
