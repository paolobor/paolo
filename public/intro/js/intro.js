/*
 * Intro de FAIRINO Spain: llegar en persona a una gran fábrica, como el arranque de una película.
 * Un único plano secuencia en vídeo (assets/intro-1080.mp4, a la máxima calidad): lo reproduce el chip de vídeo del
 * aparato, así que va fluido también en móviles y ordenadores modestos (antes eran 768 fotogramas sueltos en un <canvas>,
 * que no cabían en la memoria de muchos aparatos). Se descarga entero mientras se ve la pantalla de inicio y se reproduce
 * desde la memoria: siempre en 1080p y a su velocidad, sin depender de la conexión. La cámara va siempre hacia delante,
 * recta y sin pararse: la rueda o el dedo la aceleran un rato (más velocidad de reproducción, que se va apagando sola).
 *   Inicio   la pantalla de siempre: el bloque «FAIRINO SPAIN» con su destello y «Haz clic para entrar». Al hacer
 *            clic (o Intro, espacio, rueda o dedo), la cámara cruza el hueco de la «O» y empieza el recorrido.
 *   Tramo 1  la fábrica desde el aire, quieta pero viva (parallax).
 *   Tramo 2  dentro de la nave, los FAIRINO trabajando.
 *   Tramo 3  la cámara elige el cobot del final (un marco naranja lo fija), todo se oscurece y entra por el anillo
 *            naranja: las bandas de cine se abren y aparece la web.
 * Sin tocar nada, la cámara sigue avanzando a cámara muy lenta; con un clic, avanza sola a velocidad normal.
 * Dentro de la web (html.fi-play) es una capa encima de la página; la página suelta (intro/index.html) salta a
 * data-target al terminar.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  if (root.classList.contains('is-skipping')) return;
  var intro = document.querySelector('[data-intro]');
  if (!intro || !window.gsap) return;

  var script = document.currentScript;
  var ASSETS = new URL('../assets/', script && script.src ? script.src : location.href).href;
  var OVERLAY = root.classList.contains('fi-play');
  var TARGET = root.dataset.target || '/';
  var KEY = 'fairino-intro-vista';

  // ---------------------------------------------------------------- el plano secuencia
  // VIDEO: assets/intro-<alto>.mp4 (tools/videos/intro-video.sh; v: súbelo al cambiar el vídeo, para que el navegador no
  // use el guardado). Tramos en segundos del vídeo: aéreo, entrada (bajada y puertas), nave (luces y cobots) y final (el
  // dron vuela entre los cobots y sale por el techo). Si cambias el vídeo, cambia estos números (README).
  var VIDEO = { fps: 48, v: 15 };
  var SEG = { entrada: 3.5, nave: 5.5, final: 12 };
  // LOCK: marco «objetivo fijado» sobre un cobot, de un instante a otro. Vacío: con el final nuevo (la cámara sube)
  // no hay cobot elegido.
  var LOCK = [];
  // Velocidades, en segundos de vídeo por segundo real: sola sin tocar nada, y tras un clic.
  var IDLE = 0.6;
  var AUTO = 1.7;
  // Rueda y dedo: velocidad extra por píxel de rueda o de arrastre; se apaga sola en unos 0,6 s. Tope de velocidad.
  var WHEEL = 0.006;
  var TOUCH = 0.02;
  var MAX_RATE = 3;
  // Segundos que se espera parado a que llegue vídeo antes de saltar a la web.
  var STALL = 6;
  var stallSince = 0;
  // Sonido tipo tráiler (opcional): si existen en assets/audio/, suenan tras el primer gesto, a volumen bajo, con el
  // botón «Sonido» para silenciarlo. Si no hay ninguno, no suena nada y el botón no aparece.
  var AUDIO = {
    viento: { src: 'audio/viento.mp3', loop: true, vol: 0.18 },
    puertas: { src: 'audio/golpe-puertas.mp3', vol: 0.5 },
    fabrica: { src: 'audio/fabrica.mp3', loop: true, vol: 0.2 },
    latido: { src: 'audio/latido.mp3', loop: true, vol: 0.35 },
    golpe: { src: 'audio/golpe-final.mp3', vol: 0.55 },
  };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  // Siempre el vídeo de 1080p, también en el móvil (allí se ve recortado y ampliado, y el de 720p quedaría blando); el de
  // 720p, solo si el visitante tiene activado el ahorro de datos.
  var net = navigator.connection || {};
  var HEIGHT = net.saveData ? 720 : 1080;
  if (coarse) intro.classList.add('fi-coarse');

  var $ = function (s) {
    return intro.querySelector(s);
  };
  var video = $('[data-video]');
  var stage = $('[data-stage]');
  var word = $('[data-word]');
  var mark = $('[data-wordmark]');
  var shineGrad = $('[data-shine]');
  var spain = $('[data-spain]');
  var lock = $('[data-lock]');
  var skip = $('[data-skip]');
  var enterBtn = $('[data-enter]');
  var bars = intro.querySelectorAll('[data-bar]');
  var note = $('[data-note]');
  var load = $('[data-load]');
  var loadBar = $('[data-load-bar]');
  var soundBtn = $('[data-sound]');
  var whiteout = $('[data-whiteout]');
  var hint = $('[data-hint]');
  var PATH = document.getElementById('fi-wm');
  if (coarse) {
    hint.querySelector('span').textContent = 'Toca para entrar';
  }

  var state = 'idle'; // idle → enter → run (rueda/dedo) | auto (clic) → out → done
  var boost = 0; // velocidad extra de la rueda o el dedo, que se va apagando
  var started = false;
  var revealTl = null;

  // ---------------------------------------------------------------- el vídeo
  // Se descarga entero mientras se ve la pantalla de inicio (una línea naranja fina bajo el logotipo dice cuánto
  // falta) y se reproduce desde la memoria del aparato: así siempre va en 1080p y a su velocidad, sin frenar ni bajar de
  // calidad aunque la conexión sea floja. El pulso de la «O» sale cuando ya está; si se entra antes, se espera a que
  // acabe y arranca solo. El póster (primer fotograma) se ve al instante.
  var src = function (name) {
    return ASSETS + name + '?v=' + VIDEO.v;
  };
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('webkit-playsinline', '');
  video.poster = src('intro-poster.webp');
  video.preload = 'auto';
  // Si el aparato no puede con el vídeo, se pasa a la web en vez de dejar la intro colgada.
  video.addEventListener('error', function () {
    if (state !== 'idle') skipNow();
  });
  var now = function () {
    return video.currentTime || 0;
  };
  var prep = document.createElement('div');
  prep.className = 'fi-prep';
  prep.setAttribute('aria-hidden', 'true');
  prep.innerHTML = '<i></i>';
  intro.appendChild(prep);
  var prepBar = prep.firstChild;
  var full = false; // vídeo descargado entero
  var wantIn = false; // han pedido entrar antes de tenerlo
  var blobUrl = '';
  function loaded() {
    if (full) return;
    full = true;
    prepBar.style.transform = 'scaleX(1)';
    prep.classList.add('is-done');
    load.classList.add('is-done');
    if (wantIn) enter();
    else startPulse();
  }
  // Sin descarga a la memoria (navegadores muy antiguos, o si falla): el vídeo se reproduce mientras llega.
  function stream(url) {
    video.src = url;
    video.load();
    loaded();
  }
  function download() {
    var url = src('intro-' + HEIGHT + '.mp4');
    if (!window.fetch || !window.ReadableStream || !window.URL || !URL.createObjectURL) return stream(url);
    fetch(url)
      .then(function (r) {
        if (!r.ok || !r.body) throw new Error('HTTP ' + r.status);
        var total = +r.headers.get('Content-Length') || 0;
        var reader = r.body.getReader();
        var parts = [];
        var got = 0;
        var pump = function () {
          return reader.read().then(function (d) {
            if (d.done) return new Blob(parts, { type: 'video/mp4' });
            parts.push(d.value);
            got += d.value.length;
            if (total) prepBar.style.transform = 'scaleX(' + Math.min(1, got / total).toFixed(3) + ')';
            return pump();
          });
        };
        return pump();
      })
      .then(function (blob) {
        blobUrl = URL.createObjectURL(blob);
        video.src = blobUrl;
        video.load();
        loaded();
      })
      .catch(function () {
        stream(url);
      });
  }
  // Arranca el vídeo (dentro del clic, para que los navegadores lo dejen). Si aun así lo frenan, vuelve a intentarlo
  // con el siguiente toque.
  function play() {
    video.playbackRate = IDLE;
    var p = video.play();
    if (p && p.catch) {
      p.catch(function () {
        var retry = function () {
          intro.removeEventListener('pointerdown', retry);
          if (state !== 'out' && state !== 'done') video.play().catch(function () {});
        };
        intro.addEventListener('pointerdown', retry);
      });
    }
  }
  // Pestaña oculta: el vídeo espera (si no, seguiría solo y la intro acabaría sin verla).
  document.addEventListener('visibilitychange', function () {
    if (!started || state === 'out' || state === 'done') return;
    if (document.hidden) video.pause();
    else video.play().catch(function () {});
  });

  // ---------------------------------------------------------------- tramo 1: quieto pero vivo
  var par = { x: 0, y: 0 };
  window.addEventListener('pointermove', function (e) {
    if (coarse || reduce) return;
    par.x = (e.clientX / window.innerWidth - 0.5) * 2;
    par.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  var px = 0;
  var py = 0;

  // ---------------------------------------------------------------- bloque FAIRINO SPAIN (sin cambios)
  function setShine(p) {
    shineGrad.setAttribute('x1', (p - 0.14).toFixed(4));
    shineGrad.setAttribute('x2', (p + 0.1).toFixed(4));
  }

  // ---------------------------------------------------------------- medidas del logotipo
  // Se pinta el logotipo en un lienzo oculto para sacar el hueco de la «O» (el portal).
  var geo = null;
  var mcan = document.createElement('canvas');
  var mctx = mcan.getContext('2d', { willReadFrequently: true });

  function measure() {
    var r = mark.getBoundingClientRect();
    var w = Math.max(2, Math.round(r.width));
    var h = Math.max(2, Math.round(r.height));
    var pad = Math.round(h * 0.5);
    var fallback = function () {
      geo = {
        rect: r,
        h: h,
        o: { x: r.right - h * 0.55, y: r.top + h / 2, hx: h * 0.42, hy: h * 0.25, rad: h * 0.2 },
      };
    };
    return new Promise(function (resolve) {
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 622 68.969" width="' + w + '" height="' + h + '">' +
        '<path fill="#fff" fill-rule="evenodd" transform="translate(-649 -451)" d="' + PATH.getAttribute('d') + '"/></svg>';
      var img = new Image();
      img.onload = function () {
        var W = w + pad * 2;
        var H = h + pad * 2;
        mcan.width = W;
        mcan.height = H;
        mctx.clearRect(0, 0, W, H);
        mctx.drawImage(img, pad, pad, w, h);
        var data = mctx.getImageData(0, 0, W, H).data;
        var A = function (x, y) {
          return x < 0 || y < 0 || x >= W || y >= H ? 0 : data[(y * W + x) * 4 + 3];
        };
        var ink = function (x, y) {
          return A(x, y) > 120;
        };

        // La «O» es la última letra: de su borde derecho hacia la izquierda hasta el hueco con la «N».
        var colInk = function (x) {
          for (var yy = pad; yy < pad + h; yy++) if (ink(x, yy)) return true;
          return false;
        };
        var xr = pad + w - 1;
        while (xr > pad && !colInk(xr)) xr--;
        var xl = xr;
        while (xl > pad && colInk(xl - 1)) xl--;
        var y0 = pad, y1 = pad + h - 1;
        var cx = Math.round((xl + xr) / 2);
        var cy = Math.round((y0 + y1) / 2);
        var ix = 0;
        while (cx + ix < xr && !ink(cx + ix, cy)) ix++;
        var sx = Math.round(cx + ix * 0.5); // fuera de la ranura central del estarcido
        var iy = 0;
        while (cy - iy > y0 && !ink(sx, cy - iy)) iy++;
        if (ix < 2 || iy < 2) {
          fallback();
        } else {
          geo = {
            rect: r,
            h: h,
            o: { x: r.left - pad + cx, y: r.top - pad + cy, hx: ix, hy: iy, rad: Math.min(ix, iy) * 0.75 },
          };
        }
        resolve();
      };
      img.onerror = function () {
        fallback();
        resolve();
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  // Destello: banda de luz que recorre el logotipo (p de -0,4 a 1,4 sobre su ancho).
  function setShine(p) {
    shineGrad.setAttribute('x1', (p - 0.14).toFixed(4));
    shineGrad.setAttribute('x2', (p + 0.1).toFixed(4));
  }

  // ---------------------------------------------------------------- pantalla de inicio (la de siempre)
  // Pulso de luz naranja en el hueco de la «O»: invita a tocar sin poner texto. Se quita al entrar.
  var pulse = document.createElement('div');
  pulse.className = 'fi-pulse';
  pulse.setAttribute('aria-hidden', 'true');
  intro.appendChild(pulse);
  function placePulse() {
    if (!geo) return;
    var o = geo.o;
    pulse.style.left = (o.x - o.hx).toFixed(1) + 'px';
    pulse.style.top = (o.y - o.hy).toFixed(1) + 'px';
    pulse.style.width = (o.hx * 2).toFixed(1) + 'px';
    pulse.style.height = (o.hy * 2).toFixed(1) + 'px';
    pulse.style.borderRadius = o.rad.toFixed(1) + 'px';
  }
  var revealed = false;
  function startPulse() {
    if (state !== 'idle' || !revealed || !full) return;
    placePulse();
    intro.classList.add('is-pulsing');
  }

  function reveal() {
    gsap.set(word, { autoAlpha: 1, opacity: 0 });
    if (reduce) {
      gsap.to(word, { opacity: 1, duration: 1, ease: 'power1.out' });
      gsap.to(spain, { opacity: 1, duration: 1, delay: 0.3 });
      gsap.to([hint, skip], { opacity: 1, duration: 1, delay: 0.6 });
      gsap.delayedCall(1.4, function () {
        revealed = true;
        startPulse();
      });
      return;
    }
    var sh = { p: -0.4 };
    var tl = (revealTl = gsap.timeline({ delay: 0.3 }));
    tl.fromTo(word, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: 'power2.out' }, 0)
      .fromTo(word, { filter: 'blur(16px)', scale: 1.035 }, { filter: 'blur(0px)', scale: 1, duration: 2.6, ease: 'expo.out', clearProps: 'filter' }, 0)
      .to(sh, { p: 1.4, duration: 2.1, ease: 'power2.inOut', onUpdate: function () { setShine(sh.p); } }, 0.4)
      .fromTo(spain, { opacity: 0, letterSpacing: '1.1em' }, { opacity: 1, letterSpacing: '0.62em', duration: 1.6, ease: 'expo.out' }, 1.5)
      .to(skip, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1.3)
      .to(hint, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 2.2)
      .call(function () {
        revealed = true;
        startPulse();
      }, null, 2.4);
  }

  // Clic en la pantalla de inicio: un destello recorre el logotipo, la cámara atraviesa la «O» y al otro lado está
  // la fábrica desde el aire; entran las bandas de cine.
  function enter() {
    if (state !== 'idle') return;
    // Aún descargando: se apunta y entra solo en cuanto esté (la línea de carga late para decir que va).
    if (!full) {
      wantIn = true;
      prep.classList.add('is-waiting');
      return;
    }
    state = 'enter';
    intro.classList.remove('is-pulsing');
    remember();
    play();
    started = true;
    startAudio();
    intro.classList.add('is-entering');
    if (revealTl) revealTl.kill();
    gsap.killTweensOf([hint, spain, word]);
    gsap.set(word, { scale: 1, filter: 'none', opacity: 1 });
    gsap.set(spain, { opacity: 1 });
    measure().then(function () {
      var o = geo.o;
      var W = window.innerWidth;
      var H = window.innerHeight;
      var S = Math.max(Math.max(o.x, W - o.x) / o.hx, Math.max(o.y, H - o.y) / o.hy) * 1.18;
      var wr = word.getBoundingClientRect();
      gsap.set(word, { transformOrigin: o.x - wr.left + 'px ' + (o.y - wr.top) + 'px' });
      var fly = { p: 0 };
      var hole = function (sc) {
        var hx = o.hx * sc;
        var hy = o.hy * sc;
        stage.style.clipPath =
          'inset(' + Math.max(0, o.y - hy).toFixed(1) + 'px ' + Math.max(0, W - o.x - hx).toFixed(1) + 'px ' +
          Math.max(0, H - o.y - hy).toFixed(1) + 'px ' + Math.max(0, o.x - hx).toFixed(1) + 'px round ' + (o.rad * sc).toFixed(1) + 'px)';
      };
      var sh = { p: -0.4 };
      gsap
        .timeline()
        .to(hint, { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0)
        .to(sh, { p: 1.4, duration: 0.62, ease: 'power2.inOut', onUpdate: function () { setShine(sh.p); } }, 0)
        .to(word, { scale: 0.986, duration: 0.16, ease: 'power2.out' }, 0)
        .to(word, { scale: 1, duration: 0.22, ease: 'power2.inOut' }, 0.16)
        .call(function () {
          hole(1);
          gsap.set(stage, { opacity: 1 });
        }, null, 0.3)
        .to(fly, {
          p: 1,
          duration: 0.6,
          ease: 'power2.in',
          onUpdate: function () {
            var sc = 1 / (1 - fly.p * (1 - 1 / S));
            gsap.set(word, { scale: sc });
            hole(sc * 0.985);
          },
        }, 0.4)
        .fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: 'power2.inOut' }, 0.5)
        .set(word, { autoAlpha: 0 }, 1.0)
        .call(function () {
          stage.style.clipPath = '';
          gsap.set(word, { scale: 1, transformOrigin: '50% 50%' });
          intro.classList.add('is-flying');
          if (state === 'enter') state = 'run';
          gsap.to(note, { opacity: 1, duration: 1.2, ease: 'sine.inOut', delay: 0.5 });
        }, null, 1.0);
    });
  }
  function logoOut() {
    gsap.to(word, { autoAlpha: 0, duration: 0.6, ease: 'sine.inOut' });
  }

  // Marco del sistema de visión sobre el cobot del final: aparece encogiéndose sobre él, parpadea al fijarlo y le
  // sigue mientras la cámara se acerca.
  var lockOn = false;
  // Rectángulo del fotograma 16:9 en pantalla (encaje «cover» del lienzo).
  function frameRect() {
    var r = video.getBoundingClientRect();
    var s = Math.max(r.width / 16, r.height / 9);
    return { x: r.left + (r.width - 16 * s) / 2, y: r.top + (r.height - 9 * s) / 2, w: 16 * s, h: 9 * s };
  }
  function trackLock(t) {
    var a = LOCK[0];
    var b = LOCK[1];
    var k = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)));
    var e = k * k * (3 - 2 * k);
    var f = frameRect();
    var w = (a.w + (b.w - a.w) * e) * f.w;
    var h = (a.h + (b.h - a.h) * e) * f.h;
    lock.style.left = (f.x + (a.x + (b.x - a.x) * e) * f.w - w / 2).toFixed(1) + 'px';
    lock.style.top = (f.y + (a.y + (b.y - a.y) * e) * f.h - h / 2).toFixed(1) + 'px';
    lock.style.width = w.toFixed(1) + 'px';
    lock.style.height = h.toFixed(1) + 'px';
  }
  function showLock(on) {
    if (on === lockOn) return;
    lockOn = on;
    gsap.killTweensOf(lock);
    if (!on) return gsap.to(lock, { opacity: 0, scale: 1, duration: 0.5 });
    gsap.fromTo(lock, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out' });
    gsap.to(lock, { opacity: 0.35, duration: 0.1, repeat: 3, yoyo: true, delay: 0.7 });
  }

  // ---------------------------------------------------------------- sonido (opcional)
  var sounds = {};
  var hasSound = false;
  var muted = false;
  function startAudio() {
    if (reduce || !window.fetch || !/^https?:/.test(location.protocol) || startAudio.done) return;
    startAudio.done = true;
    // Primero se mira si está el primero; si no, no hay sonido y no se pide nada más.
    var keys = Object.keys(AUDIO);
    fetch(ASSETS + AUDIO[keys[0]].src, { method: 'HEAD' })
      .then(function (r) {
        if (r.ok) keys.forEach(probe);
      })
      .catch(function () {});
    function probe(k) {
      fetch(ASSETS + AUDIO[k].src, { method: 'HEAD' })
        .then(function (r) {
          if (!r.ok) return;
          var a = new Audio(ASSETS + AUDIO[k].src);
          a.preload = 'auto';
          a.loop = !!AUDIO[k].loop;
          a.volume = 0;
          sounds[k] = a;
          if (!hasSound) {
            hasSound = true;
            soundBtn.hidden = false;
            gsap.fromTo(soundBtn, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'sine.inOut' });
          }
          mix();
        })
        .catch(function () {});
    }
  }
  // Qué suena en cada tramo: viento arriba, fábrica dentro, latido en el final.
  var bed = '';
  function mix() {
    var t = now();
    var want = state === 'out' || state === 'done' ? '' : t < SEG.entrada + 1.5 ? 'viento' : t < SEG.final + 0.5 ? 'fabrica' : 'latido';
    ['viento', 'fabrica', 'latido'].forEach(function (k) {
      var a = sounds[k];
      if (!a) return;
      var on = k === want && !muted;
      if (on && a.paused) {
        var p = a.play();
        if (p && p.catch) p.catch(function () {});
      }
      gsap.to(a, {
        volume: on ? AUDIO[k].vol : 0,
        duration: 1.2,
        overwrite: true,
        onComplete: function () {
          if (!on) a.pause();
        },
      });
    });
    bed = want;
  }
  function hit(k) {
    var a = sounds[k];
    if (!a || muted) return;
    a.currentTime = 0;
    a.volume = AUDIO[k].vol;
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
  }
  soundBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    muted = !muted;
    soundBtn.setAttribute('aria-pressed', String(!muted));
    bed = '';
    mix();
  });

  // ---------------------------------------------------------------- recorrido
  var last = 0;
  var flags = { doors: false };
  function begin(mode) {
    if (state === 'idle') return enter();
    if (state === 'enter' || state === 'out' || state === 'done') return;
    if (mode === 'auto') {
      state = 'auto';
      intro.classList.add('is-auto');
    } else if (state !== 'auto') {
      state = 'run';
    }
  }

  function tick() {
    var nowMs = performance.now();
    var dt = Math.min(0.05, last ? (nowMs - last) / 1000 : 0);
    last = nowMs;
    if (state === 'done') return;
    var moving = state === 'run' || state === 'auto';

    var t = now();
    var dur = video.duration || 0;
    // Segundos de vídeo ya descargados por delante de la cámara (99: descargado hasta el final).
    var ahead = 0;
    for (var b = 0; b < video.buffered.length; b++) {
      if (video.buffered.start(b) <= t + 0.1 && video.buffered.end(b) >= t) {
        ahead = video.buffered.end(b) >= dur - 0.1 ? 99 : video.buffered.end(b) - t;
      }
    }
    // Velocidad: la base (sola o tras un clic) más el empujón de la rueda o el dedo, que se apaga con suavidad. Si la
    // descarga va justa (menos de 2,5 s por delante), frena poco a poco en vez de pararse a esperar a tirones.
    if (moving) {
      boost *= Math.exp(-dt / 0.6);
      var lead = Math.max(0.3, Math.min(1, ahead / 2.5));
      var rate = Math.min(MAX_RATE, ((state === 'auto' ? AUTO : IDLE) + boost) * lead);
      if (Math.abs(video.playbackRate - rate) > 0.04) video.playbackRate = rate;
    }

    // Barra de carga: lo que lleva descargado el vídeo.
    if (dur && video.buffered.length) {
      var got = video.buffered.end(video.buffered.length - 1) / dur;
      loadBar.style.transform = 'scaleX(' + Math.min(1, got).toFixed(3) + ')';
      if (got >= 0.999) load.classList.add('is-done');
    }
    // Esperando vídeo que aún no ha llegado: la barra lo indica. Seguro: si deja de llegar (red lenta, el servidor
    // frena…), tras STALL s esperando se pasa a la web en vez de dejar la intro colgada.
    var waiting = moving && !video.ended && video.readyState < 3;
    load.classList.toggle('is-waiting', waiting);
    if (waiting && !document.hidden) {
      if (!stallSince) stallSince = nowMs;
      else if (nowMs - stallSince > STALL * 1000) skipNow();
    } else {
      stallSince = 0;
    }

    // Parallax leve en el tramo aéreo (se apaga al avanzar).
    if (state !== 'out') {
      var amt = Math.max(0, 1 - t / 1.5);
      px += (par.x * amt - px) * 0.06;
      py += (par.y * amt - py) * 0.06;
      stage.style.transform = 'translate3d(' + (-px * 1.4).toFixed(2) + '%,' + (-py * 1.1).toFixed(2) + '%,0)';
    }

    // Tramo 3: el sistema de visión fija el cobot del final.
    var locked = LOCK.length > 1 && t >= LOCK[0].t && t < LOCK[1].t + 0.25;
    if (locked) trackLock(t);
    showLock(locked);
    if (!flags.doors && t >= SEG.entrada + 2.2) {
      flags.doors = true;
      hit('puertas');
    }
    if (hasSound) {
      var want = t < SEG.entrada + 1.5 ? 'viento' : t < SEG.final + 0.5 ? 'fabrica' : 'latido';
      if (want !== bed) mix();
    }

    if (started && (video.ended || (dur && t >= dur - 0.06))) finale();
  }

  // ---------------------------------------------------------------- final: la cámara sigue subiendo y aparece la web
  // Al llegar arriba, la imagen sigue acercándose un poco (como si la grúa no parara), las bandas de cine se abren y la
  // nave se funde con la web.
  function finale() {
    if (state === 'out' || state === 'done') return;
    state = 'out';
    remember();
    showLock(false);
    logoOut();
    gsap.to(note, { opacity: 0, duration: 0.5 });
    gsap.set(stage, { transformOrigin: '50% 50%' });
    var tl = gsap.timeline();
    tl.call(function () {
        hit('golpe');
        bed = '';
        mix();
      }, null, 0.1)
      .to(stage, { scale: 1.08, duration: 1.4, ease: 'sine.inOut' }, 0)
      .to(bars, { scaleY: 0, duration: 0.9, ease: 'power2.inOut' }, 0.15)
      .to(whiteout, { opacity: 1, duration: 0.6, ease: 'power1.in' }, 0.6)
      .call(go, null, 1.2);
  }

  // ---------------------------------------------------------------- entrada en la web
  function remember() {
    try {
      sessionStorage.setItem(KEY, '1');
    } catch (e) {}
  }
  function stopAudio(d) {
    Object.keys(sounds).forEach(function (k) {
      gsap.to(sounds[k], { volume: 0, duration: d, overwrite: true, onComplete: function () { sounds[k].pause(); } });
    });
  }
  // Dentro de la web: la capa se funde y deja la página a la vista.
  function close(duration) {
    state = 'done';
    remember();
    stopAudio(duration);
    gsap.ticker.remove(tick);
    var host = intro.closest('.fi-overlay') || intro;
    window.scrollTo(0, 0);
    gsap.to(host, {
      opacity: 0,
      duration: duration,
      ease: 'power2.inOut',
      onComplete: function () {
        root.classList.remove('fi-play');
        host.remove();
        // Fuera el vídeo de la memoria.
        video.pause();
        video.removeAttribute('src');
        video.load();
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      },
    });
  }
  function go() {
    remember();
    if (OVERLAY) return close(0.6);
    stopAudio(0.3);
    state = 'done';
    if (window.top !== window.self) {
      whiteout.classList.add('is-fallback');
      try {
        window.top.location.href = TARGET;
      } catch (e) {}
      return;
    }
    window.location.replace(TARGET);
  }
  function skipNow() {
    if (state === 'out' || state === 'done') return;
    if (OVERLAY) return close(0.5);
    state = 'out';
    gsap.to(whiteout, { opacity: 1, duration: 0.35, ease: 'power1.inOut', onComplete: go });
  }

  // ---------------------------------------------------------------- movimiento reducido: tres imágenes fijas
  function reducedMotion() {
    // Sin vídeo: solo tres imágenes, así que no hay nada que esperar.
    full = true;
    prep.classList.add('is-done');
    video.removeAttribute('src');
    video.preload = 'none';
    var els = [1, 2, 3].map(function (i) {
      var im = document.createElement('img');
      im.className = 'fi-still';
      im.alt = '';
      im.src = src('intro-still-' + i + '.webp');
      stage.appendChild(im);
      return im;
    });
    video.style.display = 'none';
    load.classList.add('is-done');
    var tl = gsap.timeline({ paused: true });
    tl.to([hint, word], { opacity: 0, duration: 0.6 })
      .set(stage, { opacity: 1 })
      .to(bars, { scaleY: 1, duration: 0.6 }, 0.2)
      .to(els[0], { opacity: 1, duration: 1 }, 0.4)
      .to(els[1], { opacity: 1, duration: 1.2 }, 2.6)
      .call(function () {
        intro.classList.add('is-flying');
      }, null, 2.8)
      .to(word, { opacity: 1, duration: 1 }, 2.9)
      .to(els[2], { opacity: 1, duration: 1.2 }, 5)
      .to(word, { opacity: 0, duration: 0.8 }, 5)
      .to(bars, { scaleY: 0, duration: 0.8 }, 6.4)
      .to(whiteout, { opacity: 1, duration: 0.6 }, 6.6)
      .call(go, null, 7.3);
    var run = function () {
      if (state !== 'idle') return;
      state = 'auto';
      remember();
      tl.play();
    };
    enterBtn.addEventListener('click', run);
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') run();
    });
  }

  // ---------------------------------------------------------------- eventos
  skip.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    skipNow();
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && OVERLAY && state !== 'done') return close(0.5);
  });
  if (!OVERLAY) {
    whiteout.querySelector('[data-whiteout-link]').href = TARGET;
    skip.href = TARGET;
  }
  gsap.set(word, { autoAlpha: 0 });

  if (reduce) {
    gsap.set(bars, { scaleY: 0 });
    gsap.set(stage, { opacity: 0 });
    reveal();
    reducedMotion();
    return;
  }

  enterBtn.addEventListener('click', function () {
    if (state === 'idle') return enter();
    if (state === 'run') begin('auto');
  });
  window.addEventListener('keydown', function (e) {
    if (state === 'out' || state === 'done') return;
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement !== skip && document.activeElement !== soundBtn) {
      e.preventDefault();
      if (state === 'idle') enter();
      else begin('auto');
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      begin('run');
      boost = Math.min(MAX_RATE, boost + 1.2);
    }
  });
  // Rueda: la cámara avanza o retrocede; la página de debajo no se mueve.
  intro.addEventListener(
    'wheel',
    function (e) {
      e.preventDefault();
      if (state === 'out' || state === 'done') return;
      var d = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1);
      begin('run');
      // Siempre hacia delante: la rueda (en cualquier sentido) acelera la cámara, nunca la hace volver.
      boost = Math.min(MAX_RATE, boost + Math.min(240, Math.abs(d)) * WHEEL);
    },
    { passive: false },
  );
  // Dedo: arrastrar hacia arriba avanza, hacia abajo retrocede.
  var ty = null;
  intro.addEventListener(
    'touchstart',
    function (e) {
      ty = e.touches[0].clientY;
    },
    { passive: true },
  );
  intro.addEventListener(
    'touchmove',
    function (e) {
      if (ty === null || state === 'out' || state === 'done') return;
      e.preventDefault();
      var y = e.touches[0].clientY;
      begin('run');
      boost = Math.min(MAX_RATE, boost + Math.abs(ty - y) * TOUCH);
      ty = y;
    },
    { passive: false },
  );
  intro.addEventListener('touchend', function () {
    ty = null;
  });

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      if (state === 'idle' && intro.classList.contains('is-pulsing')) measure().then(placePulse);
    }, 120);
  });

  // ---------------------------------------------------------------- arranque
  gsap.set(stage, { opacity: 0 });
  gsap.set(bars, { scaleY: 0 });
  // El vídeo se descarga entero mientras se ve la pantalla de inicio.
  download();
  gsap.ticker.add(tick);
  // La pantalla de inicio sale cuando el logotipo tiene su tamaño y la fuente de «SPAIN» está lista (máx. 0,8 s).
  var fontsReady = document.fonts && document.fonts.load ? document.fonts.load('500 16px Inter') : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (res) { setTimeout(res, 800); })])
    .then(measure)
    .then(function () {
      intro.classList.add('is-ready');
      reveal();
    });
})();
