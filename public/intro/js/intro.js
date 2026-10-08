/*
 * Intro de FAIRINO Spain.
 *   Escena 1: el logotipo de FAIRINO se enfoca con un destello. Clic (o Intro / espacio).
 *   Escena 2: un destello recorre el logotipo, la cámara atraviesa la «O» y detrás arranca el vídeo, algo más
 *             lento que el original; el cobot sale de la sombra, la cámara se queda un momento en el plano del
 *             anillo rojo de una articulación, se acerca despacio y entra por él. Todo en la escena oscura del vídeo:
 *             el plano blanco que viene después no se ve.
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

  // Anillo rojo en el fotograma congelado del vídeo (proporciones del encuadre 16:9; cap = radio de la tapa
  // respecto al ancho) y momento del zoom: a 1,2 s, todavía en la escena oscura (a los 2,1 s el vídeo corta a un
  // plano blanco, que así no llega a verse).
  var RING = { x: 0.588, y: 0.285, cap: 0.067, at: 1.2 };
  // Velocidad del vídeo (más lento que el original, para que la escena del cobot dure más) y acercamiento lento al
  // anillo antes de entrar por él.
  var RATE = 0.85;
  var PUSH = { scale: 1.08, duration: 1 };

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
  var PATH = document.getElementById('fi-wm');
  var state = 'idle';
  var revealTl = null;
  if (coarse) hint.querySelector('span').textContent = 'Toca para entrar';

  // ---------------------------------------------------------------- vídeo (se descarga entero en la escena 1)
  var isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var small = mobile || Math.max(window.innerWidth, window.innerHeight) * dpr <= 1400;
  var webm = !isSafari && video.canPlayType('video/webm; codecs="vp9"') === 'probably';
  var src = ASSETS + 'fairino-intro' + (small ? '-720' : '') + (webm ? '.webm' : '.mp4');
  var setSrc = function (u) {
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
      .to(skip, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1.3)
      .to(hint, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 2.2);
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

    if (reduce) {
      gsap
        .timeline()
        .to([word, hint, skip], { opacity: 0, duration: 0.5, ease: 'power1.inOut' }, 0)
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
      tl.to([hint, skip], { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0)
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
    var started = performance.now();
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
    var tooLong = function () {
      return performance.now() - started > (video.currentTime > 0 ? 5000 : 2600);
    };
    var check = function () {
      if (done) return;
      if (video.currentTime >= RING.at - 0.01) return stop(zoom);
      if (tooLong()) return stop(finish);
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(check);
      else requestAnimationFrame(check);
    };
    check();
    // Si el vídeo no avanza (red lenta o error), se sigue igual.
    (function watch() {
      if (done) return;
      if (tooLong()) stop(finish);
      else setTimeout(watch, 400);
    })();
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
    // Primero se acerca despacio al anillo y después entra por él.
    var t = PUSH.duration;
    var tl = gsap.timeline();
    tl.to(film, { scale: PUSH.scale, duration: t, ease: 'sine.inOut' }, 0)
      .to(film, { scale: S, duration: 1.25, ease: 'power3.in' }, t)
      // Al acercarse, la imagen se oscurece (la tapa del anillo es clara: así no se llena la pantalla de gris).
      .fromTo(video, { filter: 'brightness(1) saturate(1)' }, { filter: 'brightness(0.08) saturate(1.4)', duration: 0.85, ease: 'power1.in' }, t + 0.15)
      .to(whiteout, { opacity: 1, duration: 0.45, ease: 'power2.in' }, t + 0.85)
      .call(go, null, t + 1.35);
  }

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
    if (state !== 'idle') return;
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement !== skip) {
      e.preventDefault();
      enter();
    } else if (e.key === 'Escape' && OVERLAY) {
      close(0.5);
    }
  });
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
