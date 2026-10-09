/*
 * Intro de FAIRINO Spain, como el arranque de una película: cinemascope (bandas negras 2,39:1), títulos con fundidos
 * lentos, grano y viñeta.
 *   Escena 1: el logotipo de FAIRINO se enfoca con un destello. Clic, deslizar (rueda o dedo), Intro o espacio.
 *   Escena 2: un destello recorre el logotipo, la cámara atraviesa la «O» y detrás arranca el vídeo (assets/):
 *             exterior de la fábrica de noche → nave con 8 cobots FAIRINO → primer plano de la tapa de una articulación
 *             con su aro naranja. El vídeo se para en el aro, la cámara entra por él, las bandas se abren y un
 *             destello anamórfico cruza la pantalla.
 *   Escena 3: fundido a negro con un resplandor naranja y
 *             - página suelta (intro/index.html): salto a la web (data-target en <html>);
 *             - dentro de la web (inicio y tienda, html.fi-play): la capa se funde y deja ver la página.
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

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var mobile = coarse || Math.min(window.innerWidth, window.innerHeight) < 700;
  // Móvil en vertical: el vídeo se ve entero (encajado y fundido en negro arriba y abajo), sin recortarlo.
  var portrait = window.innerHeight > window.innerWidth * 1.15;
  var FIT = portrait ? 'contain' : 'cover';
  if (portrait) intro.classList.add('is-portrait');

  // Aro naranja en el último fotograma del vídeo (proporciones del encuadre 16:9; cap = radio de la tapa blanca
  // respecto al ancho) y segundo en que el vídeo se para para entrar por él. SHOTS: inicio de cada plano (títulos
  // del pie). Si cambias el vídeo, cambia también estos números (README).
  var RING = { x: 0.497, y: 0.5, cap: 0.284, at: 10.3 };
  var SHOTS = [
    { at: 0, slug: 'Ext. Fábrica — Noche' },
    { at: 4.04, slug: 'Int. Nave de producción' },
    { at: 7.33, slug: 'FAIRINO · Articulación' },
  ];
  var RATE = 1;
  var PUSH = { scale: 1.03, duration: 0.35 };
  var FPS = 24;
  // Sonido tipo tráiler (opcional): si estos archivos existen en assets/audio/, suenan tras el primer gesto, a volumen
  // bajo, y aparece el botón «Sonido» para silenciarlos. Si no existen, no pasa nada y el botón no se ve.
  var AUDIO = { amb: 'audio/ambiente-fabrica.mp3', hall: 'audio/golpe-nave.mp3', ring: 'audio/golpe-anillo.mp3' };
  var VOL = { amb: 0.22, hit: 0.5 };

  var $ = function (s) {
    return intro.querySelector(s);
  };
  var word = $('[data-word]');
  var mark = $('[data-wordmark]');
  var shineGrad = $('[data-shine]');
  var spain = $('[data-spain]');
  var hint = $('[data-hint]');
  var skip = $('[data-skip]');
  var enterBtn = $('[data-enter]');
  var film = $('[data-film]');
  var video = $('[data-video]');
  var whiteout = $('[data-whiteout]');
  var bars = intro.querySelectorAll('[data-bar]');
  var slug = $('[data-slug]');
  var note = $('[data-note]');
  var tc = $('[data-tc]');
  var flare = $('[data-flare]');
  var soundBtn = $('[data-sound]');
  var PATH = document.getElementById('fi-wm');
  var state = 'idle';
  var revealTl = null;
  if (coarse) hint.querySelector('span').textContent = 'Desliza o toca';

  // ---------------------------------------------------------------- vídeo (se descarga entero en la escena 1)
  var isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var small = mobile || Math.max(window.innerWidth, window.innerHeight) * dpr <= 1400;
  var webm = !isSafari && video.canPlayType('video/webm; codecs="vp9"') === 'probably';
  // ?v=: súbelo al cambiar los vídeos, para que el navegador no use el guardado.
  var src = ASSETS + 'fairino-intro' + (small ? '-720' : '') + (webm ? '.webm' : '.mp4') + '?v=3';
  var setSrc = function (u) {
    if (video.getAttribute('src')) return;
    video.src = u;
    video.load();
  };
  if (!reduce) {
    if (/^https?:/.test(location.protocol) && window.fetch && window.URL) {
      fetch(src)
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.blob();
        })
        .then(function (b) {
          setSrc(URL.createObjectURL(b));
        })
        .catch(function () {
          setSrc(src);
        });
    } else {
      setSrc(src);
    }
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

  // ---------------------------------------------------------------- escena 1
  function reveal() {
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
      .to(
        sh,
        {
          p: 1.4,
          duration: 2.1,
          ease: 'power2.inOut',
          onUpdate: function () {
            setShine(sh.p);
          },
        },
        0.4,
      )
      .fromTo(spain, { opacity: 0, letterSpacing: '1.1em' }, { opacity: 1, letterSpacing: '0.62em', duration: 1.6, ease: 'expo.out' }, 1.5)
      .to(skip, { opacity: 1, duration: 2.2, ease: 'sine.inOut' }, 1.3)
      .to(hint, { opacity: 1, duration: 2.4, ease: 'sine.inOut' }, 2.2);
  }

  // ---------------------------------------------------------------- escena 2
  function enter() {
    if (state !== 'idle') return;
    state = 'enter';
    remember();
    intro.classList.add('is-entering');
    // Si se entra antes de que acabe la escena 1, su animación no debe volver a encender «Haz clic para entrar».
    if (revealTl) revealTl.kill();
    gsap.killTweensOf([hint, skip, spain]);
    gsap.to(skip, { opacity: 1, duration: 1.2, ease: 'sine.inOut' });
    startAudio();

    if (reduce) {
      gsap
        .timeline()
        .to([word, hint], { opacity: 0, duration: 0.5, ease: 'power1.inOut' }, 0)
        .to(bars, { scaleY: 0, duration: 0.8, ease: 'power2.inOut' }, 0.3)
        .to(whiteout, { opacity: 1, duration: 0.6, ease: 'power1.inOut' }, 0.4)
        .call(go, null, 1.1);
      return;
    }

    gsap.killTweensOf(word);
    gsap.set(word, { scale: 1, filter: 'none' });
    measure().then(function () {
      var o = geo.o;

      // Escala a la que el hueco de la «O» cubre toda la pantalla.
      var W = window.innerWidth;
      var H = window.innerHeight;
      var S = Math.max(Math.max(o.x, W - o.x) / o.hx, Math.max(o.y, H - o.y) / o.hy) * 1.18;
      var wr = word.getBoundingClientRect();
      gsap.set(word, { transformOrigin: o.x - wr.left + 'px ' + (o.y - wr.top) + 'px' });
      var fly = { p: 0 };
      var portal = function (sc) {
        var hx = o.hx * sc;
        var hy = o.hy * sc;
        film.style.clipPath =
          'inset(' + Math.max(0, o.y - hy).toFixed(1) + 'px ' + Math.max(0, W - o.x - hx).toFixed(1) + 'px ' +
          Math.max(0, H - o.y - hy).toFixed(1) + 'px ' + Math.max(0, o.x - hx).toFixed(1) + 'px round ' + (o.rad * sc).toFixed(1) + 'px)';
      };

      var sh = { p: -0.4 };
      var tl = gsap.timeline();
      tl.to(hint, { opacity: 0, duration: 0.6, ease: 'sine.out' }, 0)
        // Un destello recorre el logotipo, que se encoge un poco antes de lanzarse.
        .to(sh, { p: 1.4, duration: 0.62, ease: 'power2.inOut', onUpdate: function () { setShine(sh.p); } }, 0)
        .to(word, { scale: 0.986, duration: 0.16, ease: 'power2.out' }, 0)
        .to(word, { scale: 1, duration: 0.22, ease: 'power2.inOut' }, 0.16)
        // La cámara atraviesa la «O»: el vídeo solo se ve por su hueco, que crece con la letra hasta llenar la pantalla.
        .call(function () {
          portal(1);
          film.style.opacity = '1';
        }, null, 0.3)
        .to(
          fly,
          {
            p: 1,
            duration: 0.8,
            ease: 'power2.in',
            onUpdate: function () {
              var sc = 1 / (1 - fly.p * (1 - 1 / S));
              gsap.set(word, { scale: sc });
              portal(sc * 0.985);
            },
          },
          0.4,
        )
        .call(playVideo, null, 0.92)
        .set(word, { visibility: 'hidden' }, 1.2)
        .call(function () {
          film.style.clipPath = '';
        }, null, 1.2);
    });
  }

  function playVideo() {
    state = 'video';
    intro.classList.add('is-video');
    if (!video.getAttribute('src')) setSrc(src); // la descarga previa no ha terminado: se reproduce en streaming
    var done = false;
    var stop = function (fn) {
      if (done) return;
      done = true;
      fn();
    };
    video.playbackRate = RATE;
    var p = video.play();
    if (p && p.catch) {
      p.catch(function () {
        stop(finish);
      });
    }
    gsap.to([slug, tc], { opacity: 1, duration: 1.6, ease: 'sine.inOut', delay: 0.4 });
    gsap.to(note, { opacity: 1, duration: 1.6, ease: 'sine.inOut', delay: 0.8 });
    var shot = -1;
    var check = function () {
      if (done) return;
      var t = video.currentTime;
      timecode(t);
      var n = 0;
      for (var i = 0; i < SHOTS.length; i++) if (t >= SHOTS[i].at) n = i;
      if (n !== shot) {
        if (shot >= 0) hit('hall', n === 1);
        shot = n;
        title(SHOTS[n].slug);
      }
      if (t >= RING.at - 0.01) return stop(zoom);
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(check);
      else requestAnimationFrame(check);
    };
    check();
    // Si el vídeo no avanza (red lenta o error) durante 3 s, se sigue igual.
    var last = -1;
    var lastMove = performance.now();
    (function watch() {
      if (done) return;
      if (video.currentTime !== last) {
        last = video.currentTime;
        lastMove = performance.now();
      }
      if (performance.now() - lastMove > 3000) stop(finish);
      else setTimeout(watch, 400);
    })();
  }

  // Código de tiempo HH:MM:SS:FF del vídeo, en el pie.
  function timecode(t) {
    var f = Math.floor(t * FPS);
    var pad = function (n) {
      return (n < 10 ? '0' : '') + n;
    };
    tc.textContent = '00:00:' + pad(Math.floor(f / FPS)) + ':' + pad(f % FPS);
  }

  // Título de escena en el pie: fundido lento de salida y de entrada.
  function title(text) {
    gsap.killTweensOf(slug, 'opacity');
    if (!slug.textContent) {
      slug.textContent = text;
      return;
    }
    gsap.to(slug, {
      opacity: 0,
      duration: 0.45,
      ease: 'sine.in',
      onComplete: function () {
        slug.textContent = text;
        gsap.to(slug, { opacity: 1, duration: 1.1, ease: 'sine.out' });
      },
    });
  }

  function zoom() {
    state = 'zoom';
    video.pause();
    var W = window.innerWidth;
    var H = window.innerHeight;
    var VW = video.videoWidth || 1920;
    var VH = video.videoHeight || 1080;
    // Dónde queda el anillo en pantalla (object-fit: cover en horizontal, contain en el móvil en vertical).
    var s = FIT === 'contain' ? Math.min(W / VW, H / VH) : Math.max(W / VW, H / VH);
    var dw = VW * s;
    var dh = VH * s;
    var rx = (W - dw) / 2 + RING.x * dw;
    var ry = (H - dh) / 2 + RING.y * dh;
    var cap = RING.cap * dw;
    var far = Math.max(Math.hypot(rx, ry), Math.hypot(W - rx, ry), Math.hypot(rx, H - ry), Math.hypot(W - rx, H - ry));
    var S = (far / cap) * 1.12;
    gsap.set(film, { transformOrigin: rx + 'px ' + ry + 'px' });
    // El resplandor del fundido sale del anillo.
    whiteout.style.setProperty('--fi-rx', ((rx / W) * 100).toFixed(1) + '%');
    whiteout.style.setProperty('--fi-ry', ((ry / H) * 100).toFixed(1) + '%');
    flare.style.setProperty('--fi-ry', ((ry / H) * 100).toFixed(1) + '%');
    // Un instante quieto en el aro y la cámara entra por él: las bandas de cine se abren, un destello anamórfico
    // cruza la pantalla y suena el golpe.
    var t = PUSH.duration;
    var tl = gsap.timeline();
    tl.to(film, { scale: PUSH.scale, duration: t, ease: 'sine.inOut' }, 0)
      .to(film, { scale: S, duration: 1.25, ease: 'power3.in' }, t)
      .to([slug, note, tc], { opacity: 0, duration: 0.6, ease: 'sine.in' }, t)
      .to(bars, { scaleY: 0, duration: 1.3, ease: 'power2.inOut' }, t + 0.1)
      .call(function () {
        hit('ring', true);
      }, null, t + 0.55)
      .fromTo(flare, { opacity: 0, scaleX: 0.15 }, { opacity: 1, scaleX: 1, duration: 0.35, ease: 'power2.out' }, t + 0.55)
      .to(flare, { opacity: 0, duration: 0.9, ease: 'sine.in' }, t + 0.9)
      // Al acercarse, la imagen se oscurece (la tapa del anillo es clara: así no se llena la pantalla de gris).
      .fromTo(video, { filter: 'brightness(1) saturate(1)' }, { filter: 'brightness(0.08) saturate(1.4)', duration: 0.85, ease: 'power1.in' }, t + 0.15)
      .to(whiteout, { opacity: 1, duration: 0.45, ease: 'power2.in' }, t + 0.85)
      .call(go, null, t + 1.35);
  }

  // ---------------------------------------------------------------- sonido (opcional)
  var sounds = null;
  var muted = false;
  function startAudio() {
    if (sounds || reduce || !window.fetch || !/^https?:/.test(location.protocol)) return;
    sounds = {};
    var url = function (k) {
      return ASSETS + AUDIO[k];
    };
    fetch(url('amb'), { method: 'HEAD' })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        Object.keys(AUDIO).forEach(function (k) {
          var a = new Audio(url(k));
          a.preload = 'auto';
          a.loop = k === 'amb';
          a.volume = 0;
          sounds[k] = a;
        });
        soundBtn.hidden = false;
        gsap.fromTo(soundBtn, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'sine.inOut' });
        var amb = sounds.amb;
        var p = amb.play();
        if (p && p.catch) p.catch(function () {});
        gsap.to(amb, { volume: muted ? 0 : VOL.amb, duration: 2.5, ease: 'sine.inOut' });
      })
      .catch(function () {});
  }
  function hit(k, on) {
    var a = on && sounds && sounds[k];
    if (!a || muted) return;
    a.currentTime = 0;
    a.volume = VOL.hit;
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
  }
  function stopAudio(d) {
    if (!sounds || !sounds.amb) return;
    gsap.to(sounds.amb, {
      volume: 0,
      duration: d,
      onComplete: function () {
        Object.keys(sounds).forEach(function (k) {
          sounds[k].pause();
        });
      },
    });
  }
  soundBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    muted = !muted;
    soundBtn.setAttribute('aria-pressed', String(!muted));
    if (sounds && sounds.amb) gsap.to(sounds.amb, { volume: muted ? 0 : VOL.amb, duration: 0.4 });
  });

  // ---------------------------------------------------------------- escena 3
  function remember() {
    try {
      sessionStorage.setItem(KEY, '1');
    } catch (e) {}
  }

  function finish() {
    state = 'out';
    gsap.to(whiteout, { opacity: 1, duration: 0.45, ease: 'power2.inOut', onComplete: go });
  }

  // Dentro de la web: la capa (ya en blanco o en negro) se funde y deja la página a la vista.
  function close(duration) {
    state = 'done';
    remember();
    stopAudio(duration);
    var host = intro.closest('.fi-overlay') || intro;
    window.scrollTo(0, 0);
    gsap.to(host, {
      opacity: 0,
      duration: duration,
      ease: 'power2.inOut',
      onComplete: function () {
        root.classList.remove('fi-play');
        video.pause();
        video.removeAttribute('src');
        video.load();
        host.remove();
      },
    });
  }

  function go() {
    remember();
    if (!OVERLAY) stopAudio(0.3);
    if (OVERLAY) return close(0.9);
    if (window.top !== window.self) {
      // Dentro de un iframe (vista previa): enlace por si el marco no deja salir solo.
      whiteout.classList.add('is-fallback');
      try {
        window.top.location.href = TARGET;
      } catch (e) {}
      return;
    }
    window.location.replace(TARGET);
  }

  // ---------------------------------------------------------------- eventos
  enterBtn.addEventListener('click', enter);
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && OVERLAY && state !== 'done') return close(0.5);
    if (state !== 'idle') return;
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement !== skip && document.activeElement !== soundBtn) {
      e.preventDefault();
      enter();
    }
  });
  // Deslizar: rueda del ratón o el dedo hacia arriba (o hacia abajo).
  intro.addEventListener('wheel', function (e) {
    if (state === 'idle' && Math.abs(e.deltaY) > 8) enter();
  }, { passive: true });
  var touchY = null;
  intro.addEventListener('touchstart', function (e) {
    touchY = e.touches[0].clientY;
  }, { passive: true });
  intro.addEventListener('touchmove', function (e) {
    if (touchY !== null && state === 'idle' && Math.abs(e.touches[0].clientY - touchY) > 30) {
      touchY = null;
      enter();
    }
  }, { passive: true });
  skip.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (state === 'out' || state === 'done') return;
    if (OVERLAY) return close(0.5);
    state = 'out';
    gsap.to(whiteout, { opacity: 1, duration: 0.35, ease: 'power1.inOut', onComplete: go });
  });
  if (!OVERLAY) {
    whiteout.querySelector('[data-whiteout-link]').href = TARGET;
    skip.href = TARGET;
  }

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      if (state === 'idle') measure();
    }, 150);
  });

  // Arranca cuando el logotipo tiene su tamaño y la fuente de «SPAIN» está lista (sin esperar más de 0,8 s).
  var fontsReady = document.fonts && document.fonts.load ? document.fonts.load('500 16px Inter') : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (res) { setTimeout(res, 800); })])
    .then(measure)
    .then(function () {
      intro.classList.add('is-ready');
      reveal();
    });
})();
