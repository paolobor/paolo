/*
 * Intro de FAIRINO Spain: llegar en persona a una gran fábrica, como el arranque de una película.
 * Un único plano secuencia (assets/recorrido.mp4, convertido en fotogramas WebP en assets/frames/) que se pinta en un
 * <canvas>; la cámara va siempre hacia delante, recta y sin pararse: la rueda o el dedo la aceleran, con inercia.
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
  // FRAMES: fotogramas de assets/frames/<ancho>/f0000.webp… (tools/videos/intro-fotogramas.sh). Tramos en segundos,
  // medidos sobre los fotogramas del vídeo: aéreo, entrada (bajada y puertas), nave (luces y 8 cobots) y final
  // (cobot elegido, oscuridad, anillo). LOCK: dónde está el cobot del final al empezar el tramo 3 (proporciones del
  // fotograma 16:9). Si cambias el vídeo, cambia estos números (README).
  var FRAMES = { count: 719, fps: 48, v: 6 };
  var SEG = { entrada: 3.5, nave: 5.5, final: 13.6 };
  // LOCK: marco sobre el cobot elegido, de un instante a otro (la cámara se le acerca). RING: el anillo en el último
  // fotograma (centro y radio exterior, respecto al ancho).
  var LOCK = [
    { t: 13.75, x: 0.58, y: 0.5, w: 0.24, h: 0.55 },
    { t: 14.3, x: 0.64, y: 0.58, w: 0.36, h: 0.8 },
  ];
  var RING = { x: 0.516, y: 0.49, r: 0.2 };
  // Velocidades, en segundos de vídeo por segundo real: sola sin tocar nada, y tras un clic.
  var IDLE = 0.6;
  var AUTO = 1.7;
  // Rueda: segundos de vídeo por píxel de rueda; dedo: por píxel arrastrado.
  var WHEEL = 0.0032;
  var TOUCH = 0.014;
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
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var WIDTH = coarse || Math.max(window.innerWidth, window.innerHeight) * dpr <= 1400 ? 960 : 1920;
  if (coarse) intro.classList.add('fi-coarse');

  var $ = function (s) {
    return intro.querySelector(s);
  };
  var canvas = $('[data-canvas]');
  var ctx = canvas.getContext('2d', { alpha: false });
  var stage = $('[data-stage]');
  var word = $('[data-word]');
  var mark = $('[data-wordmark]');
  var shineGrad = $('[data-shine]');
  var spain = $('[data-spain]');
  var lock = $('[data-lock]');
  var flare = $('[data-flare]');
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

  var N = FRAMES.count;
  var LAST = N - 1;
  var state = 'idle'; // idle → run (rueda/dedo) | auto (clic) → out → done
  var pos = 0; // fotograma que se ve (con decimales: se funden los dos vecinos)
  var target = 0; // a dónde va la cámara
  var started = false;
  var revealTl = null;

  // ---------------------------------------------------------------- carga de fotogramas
  // Primero el tramo aéreo (para empezar en 2-3 s) y después el resto, en orden, en segundo plano. La cámara no puede
  // pasar del último fotograma seguido ya cargado.
  var imgs = new Array(N);
  var ok = new Array(N);
  var ready = -1; // último fotograma cargado sin huecos desde el principio
  var loaded = 0;
  var frameUrl = function (i) {
    return ASSETS + 'frames/' + WIDTH + '/f' + ('000' + i).slice(-4) + '.webp?v=' + FRAMES.v;
  };
  function loadFrames(onFirst) {
    var next = 0;
    var active = 0;
    var MAX = 10;
    var pump = function () {
      while (active < MAX && next < N) {
        (function (i) {
          active++;
          var img = new Image();
          img.decoding = 'async';
          var done = function (good) {
            active--;
            ok[i] = good;
            loaded++;
            if (good) imgs[i] = img;
            while (ready + 1 < N && ok[ready + 1] !== undefined) ready++;
            loadBar.style.transform = 'scaleX(' + (loaded / N).toFixed(3) + ')';
            if (loaded === N) load.classList.add('is-done');
            if (i === 0 && onFirst) onFirst(good);
            pump();
          };
          img.onload = function () {
            (img.decode ? img.decode() : Promise.resolve()).then(
              function () {
                done(true);
              },
              function () {
                done(true);
              },
            );
          };
          img.onerror = function () {
            done(false);
          };
          img.src = frameUrl(i);
        })(next++);
      }
    };
    pump();
  }

  // ---------------------------------------------------------------- lienzo
  var cw = 0;
  var ch = 0;
  function resize() {
    var r = canvas.getBoundingClientRect();
    cw = Math.max(1, Math.round(r.width * dpr));
    ch = Math.max(1, Math.round(r.height * dpr));
    canvas.width = cw;
    canvas.height = ch;
    drawn = -1;
  }
  // Encaje «cover» del fotograma 16:9 en el lienzo.
  function cover(img) {
    var iw = img.naturalWidth;
    var ih = img.naturalHeight;
    var s = Math.max(cw / iw, ch / ih);
    return [(cw - iw * s) / 2, (ch - ih * s) / 2, iw * s, ih * s];
  }
  var nearest = function (i) {
    // El fotograma cargado más cercano (por si alguno ha fallado).
    for (var d = 0; d < 6; d++) {
      if (imgs[i - d]) return imgs[i - d];
      if (imgs[i + d]) return imgs[i + d];
    }
    return null;
  };
  var drawn = -1;
  function draw(p) {
    var key = Math.round(p);
    if (key === drawn) return;
    drawn = key;
    // A 48 fps basta con el fotograma más cercano: mezclar dos vecinos emborrona la imagen.
    var a = nearest(Math.min(Math.round(p), LAST));
    if (!a) return;
    var r = cover(a);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(a, r[0], r[1], r[2], r[3]);
  }

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
  function reveal() {
    gsap.set(word, { autoAlpha: 1, opacity: 0 });
    if (reduce) {
      gsap.to(word, { opacity: 1, duration: 1, ease: 'power1.out' });
      gsap.to(spain, { opacity: 1, duration: 1, delay: 0.3 });
      gsap.to([hint, skip], { opacity: 1, duration: 1, delay: 0.6 });
      return;
    }
    var sh = { p: -0.4 };
    var tl = (revealTl = gsap.timeline({ delay: 0.3 }));
    tl.fromTo(word, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: 'power2.out' }, 0)
      .fromTo(word, { filter: 'blur(16px)', scale: 1.035 }, { filter: 'blur(0px)', scale: 1, duration: 2.6, ease: 'expo.out', clearProps: 'filter' }, 0)
      .to(sh, { p: 1.4, duration: 2.1, ease: 'power2.inOut', onUpdate: function () { setShine(sh.p); } }, 0.4)
      .fromTo(spain, { opacity: 0, letterSpacing: '1.1em' }, { opacity: 1, letterSpacing: '0.62em', duration: 1.6, ease: 'expo.out' }, 1.5)
      .to(skip, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1.3)
      .to(hint, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 2.2);
  }

  // Clic en la pantalla de inicio: un destello recorre el logotipo, la cámara atraviesa la «O» y al otro lado está
  // la fábrica desde el aire; entran las bandas de cine.
  function enter() {
    if (state !== 'idle') return;
    state = 'enter';
    remember();
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
          state = 'run';
          started = true;
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
    var r = canvas.getBoundingClientRect();
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
    var t = pos / FRAMES.fps;
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
    var now = performance.now();
    var dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
    last = now;
    if (state === 'done') return;

    if (state === 'run' || state === 'auto') {
      target += (state === 'auto' ? AUTO : IDLE) * FRAMES.fps * dt;
    }
    target = Math.max(pos, Math.min(target, LAST, ready < 0 ? 0 : ready));
    // Inercia: la cámara alcanza el objetivo con suavidad, nunca a saltos.
    pos += (target - pos) * (1 - Math.exp(-dt * (state === 'auto' ? 12 : 9)));
    if (Math.abs(target - pos) < 0.002) pos = target;
    // Esperando fotogramas que aún no han llegado: la barra de carga lo indica.
    load.classList.toggle('is-waiting', target >= ready - 1 && ready < LAST);

    // Parallax leve en el tramo aéreo (se apaga al avanzar).
    if (state !== 'out') {
      var amt = Math.max(0, 1 - pos / (FRAMES.fps * 1.5));
      px += (par.x * amt - px) * 0.06;
      py += (par.y * amt - py) * 0.06;
      stage.style.transform = 'translate3d(' + (-px * 1.4).toFixed(2) + '%,' + (-py * 1.1).toFixed(2) + '%,0)';
    }

    draw(pos);
    var t = pos / FRAMES.fps;

    // Tramo 3: el sistema de visión fija el cobot del final.
    var locked = t >= LOCK[0].t && t < LOCK[1].t + 0.25;
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

    if (pos >= LAST - 0.05 && ready >= LAST) finale();
  }

  // ---------------------------------------------------------------- la cámara entra por el anillo
  function finale() {
    if (state === 'out' || state === 'done') return;
    state = 'out';
    remember();
    showLock(false);
    logoOut();
    gsap.to(note, { opacity: 0, duration: 0.5 });
    // La cámara entra por el anillo del último fotograma.
    var f = frameRect();
    var rx = f.x + RING.x * f.w;
    var ry = f.y + RING.y * f.h;
    var rr = RING.r * f.w;
    gsap.set(stage, { transformOrigin: rx + 'px ' + ry + 'px' });
    flare.style.setProperty('--fi-ry', ((ry / window.innerHeight) * 100).toFixed(1) + '%');
    whiteout.style.setProperty('--fi-rx', ((rx / window.innerWidth) * 100).toFixed(1) + '%');
    whiteout.style.setProperty('--fi-ry', ((ry / window.innerHeight) * 100).toFixed(1) + '%');
    var far = Math.max(Math.hypot(rx, ry), Math.hypot(window.innerWidth - rx, window.innerHeight - ry), Math.hypot(rx, window.innerHeight - ry), Math.hypot(window.innerWidth - rx, ry));
    var S = (far / (rr * 0.55)) * 1.1;
    var tl = gsap.timeline();
    tl.call(function () {
        hit('golpe');
        bed = '';
        mix();
      }, null, 0.25)
      .to(stage, { scale: S, duration: 0.85, ease: 'power3.in' }, 0.2)
      .fromTo(canvas, { filter: 'brightness(1)' }, { filter: 'brightness(1.6) saturate(1.3)', duration: 0.4, ease: 'power1.in' }, 0.25)
      .fromTo(flare, { opacity: 0, scaleX: 0.15 }, { opacity: 1, scaleX: 1, duration: 0.25, ease: 'power2.out' }, 0.35)
      .to(flare, { opacity: 0, duration: 0.6, ease: 'sine.in' }, 0.6)
      .to(bars, { scaleY: 0, duration: 0.8, ease: 'power2.inOut' }, 0.35)
      .to(whiteout, { opacity: 1, duration: 0.35, ease: 'power2.in' }, 0.75)
      .call(go, null, 1.1);
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
        imgs = [];
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
    var picks = [Math.round(1.5 * FRAMES.fps), Math.round((SEG.nave + 3) * FRAMES.fps), LAST];
    var els = picks.map(function (i) {
      var im = document.createElement('img');
      im.className = 'fi-still';
      im.alt = '';
      im.src = frameUrl(i);
      stage.appendChild(im);
      return im;
    });
    canvas.style.display = 'none';
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
      target += FRAMES.fps * 0.8;
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
      target += Math.min(240, Math.abs(d)) * WHEEL * FRAMES.fps;
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
      target += Math.abs(ty - y) * TOUCH * FRAMES.fps;
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
    resizeT = setTimeout(resize, 120);
  });

  // ---------------------------------------------------------------- arranque
  resize();
  gsap.set(stage, { opacity: 0 });
  gsap.set(bars, { scaleY: 0 });
  // Los fotogramas se descargan mientras se ve la pantalla de inicio (primero el tramo aéreo).
  loadFrames(function () {
    draw(0);
  });
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
