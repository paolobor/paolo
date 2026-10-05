/*
 * Intro de FAIRINO España.
 *   Escena 1: «fairino.es» se enfoca con un destello y chispas alrededor. Clic (o Intro / espacio) para entrar.
 *   Escena 2: estallido, las chispas caen dentro de la «o», la cámara la atraviesa y detrás arranca el vídeo;
 *             después, zoom al anillo naranja de una articulación como si fuera un portal.
 *   Escena 3: fundido a blanco y salto a la web (data-target en <html>).
 */
(function () {
  'use strict';

  var root = document.documentElement;
  if (root.classList.contains('is-skipping')) return;

  var TARGET = root.dataset.target || 'https://fairino.es/';
  var KEY = 'fairino-intro-vista';

  // Anillo naranja en el fotograma congelado del vídeo (proporciones del encuadre 16:9) y momento del zoom.
  var RING = { x: 0.518, y: 0.279, cap: 0.056, at: 2.44 };

  var $ = function (s) {
    return document.querySelector(s);
  };
  var intro = $('[data-intro]');
  var word = $('[data-word]');
  var base = $('[data-word-base]');
  var shine = $('.word-shine');
  var heatLayer = $('.word-heat');
  var hint = $('[data-hint]');
  var skip = $('[data-skip]');
  var enterBtn = $('[data-enter]');
  var film = $('[data-film]');
  var video = $('[data-video]');
  var whiteout = $('[data-whiteout]');
  var canvas = $('[data-sparks]');
  var underglow = $('[data-underglow]');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var mobile = coarse || Math.min(window.innerWidth, window.innerHeight) < 700;
  var state = 'idle';

  // Las capas de brillo y calor llevan las mismas letras que el texto base, para que encajen al píxel.
  var letters = base.innerHTML.replace(/ data-o=""| data-o/g, '').replace(/<i class="baseline"[^>]*><\/i>/, '');
  shine.innerHTML = letters;
  heatLayer.innerHTML = letters;

  // ---------------------------------------------------------------- vídeo (se descarga entero en la escena 1)
  var isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var small = mobile || Math.max(window.innerWidth, window.innerHeight) * dpr <= 1400;
  var webm = !isSafari && video.canPlayType('video/webm; codecs="vp9"') === 'probably';
  var src = 'assets/fairino-intro' + (small ? '-720' : '') + (webm ? '.webm' : '.mp4');
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

  // ---------------------------------------------------------------- medidas del texto
  var geo = null;
  var mcan = document.createElement('canvas');
  var mctx = mcan.getContext('2d', { willReadFrequently: true });

  function measure() {
    var cs = getComputedStyle(word);
    var fs = parseFloat(cs.fontSize);
    var ls = parseFloat(cs.letterSpacing) || 0;
    var font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
    var rect = base.getBoundingClientRect();
    var baseY = $('[data-baseline]').getBoundingClientRect().top;
    var pad = Math.ceil(fs * 0.3);
    var w = Math.ceil(rect.width + pad * 2);
    var h = Math.ceil(rect.height + pad * 2);
    mcan.width = w;
    mcan.height = h;
    mctx.clearRect(0, 0, w, h);
    mctx.font = font;
    mctx.textBaseline = 'alphabetic';
    mctx.fillStyle = '#fff';
    var bl = baseY - rect.top + pad;
    var oBox = null;
    base.querySelectorAll('.ch').forEach(function (ch) {
      var r = ch.getBoundingClientRect();
      var x = r.left - rect.left + pad;
      mctx.fillText(ch.textContent, x, bl);
      if (ch.hasAttribute('data-o')) oBox = { x0: x, x1: x + r.width - ls };
    });
    var data = mctx.getImageData(0, 0, w, h).data;
    var A = function (x, y) {
      return x < 0 || y < 0 || x >= w || y >= h ? 0 : data[(y * w + x) * 4 + 3];
    };

    // Puntos del borde de las letras (de donde salen las chispas) con su normal hacia fuera.
    var step = Math.max(1, Math.round(fs / 90));
    var px = [], py = [], nx = [], ny = [], bottom = [];
    for (var y = 1; y < h - 1; y += step) {
      for (var x = 1; x < w - 1; x += step) {
        if (A(x, y) < 120) continue;
        if (A(x + 1, y) >= 120 && A(x - 1, y) >= 120 && A(x, y + 1) >= 120 && A(x, y - 1) >= 120) continue;
        var gx = A(x - 1, y) - A(x + 1, y);
        var gy = A(x, y - 1) - A(x, y + 1);
        var gl = Math.sqrt(gx * gx + gy * gy) || 1;
        px.push(rect.left - pad + x);
        py.push(rect.top - pad + y);
        nx.push(gx / gl);
        ny.push(gy / gl);
        if (gy / gl > 0.55) bottom.push(px.length - 1);
      }
    }

    // La «o»: centro real del glifo y radio del hueco interior.
    var o = { x: rect.left + rect.width / 2, y: baseY - fs * 0.27, r: fs * 0.18 };
    if (oBox) {
      var minx = 1e9, maxx = -1, miny = 1e9, maxy = -1;
      for (var yy = 0; yy < h; yy++) {
        for (var xx = Math.floor(oBox.x0); xx < Math.ceil(oBox.x1); xx++) {
          if (A(xx, yy) > 120) {
            if (xx < minx) minx = xx;
            if (xx > maxx) maxx = xx;
            if (yy < miny) miny = yy;
            if (yy > maxy) maxy = yy;
          }
        }
      }
      if (maxx > 0) {
        var cx = Math.round((minx + maxx) / 2);
        var cy = Math.round((miny + maxy) / 2);
        var rx = 0, ry = 0;
        while (cx + rx < w && A(cx + rx, cy) < 120) rx++;
        while (cy - ry > 0 && A(cx, cy - ry) < 120) ry++;
        o = { x: rect.left - pad + cx, y: rect.top - pad + cy, r: Math.max(2, Math.min(rx, ry)) };
      }
    }

    geo = {
      fs: fs,
      rect: rect,
      o: o,
      points: { x: Float32Array.from(px), y: Float32Array.from(py), nx: Float32Array.from(nx), ny: Float32Array.from(ny), bottom: bottom },
    };
    if (sparks) {
      sparks.setScale(fs / 150);
      sparks.setPoints(geo.points);
    }
  }

  // ---------------------------------------------------------------- chispas
  var sparks = reduce ? null : new window.Sparks(canvas, { mobile: mobile });
  if (reduce) intro.classList.add('is-reduced');
  var lastHeat = -1;
  function tick(t, deltaMs) {
    if (!sparks) return;
    var dt = Math.min(deltaMs / 1000, 1 / 20);
    sparks.update(dt);
    sparks.draw();
    var heat = Math.min(1, sparks.activity + sparks.charge / 60);
    if (Math.abs(heat - lastHeat) > 0.004) {
      lastHeat = heat;
      intro.style.setProperty('--heat', heat.toFixed(3));
    }
  }

  // ---------------------------------------------------------------- escena 1
  function reveal() {
    measure();
    if (reduce) {
      gsap.to(word, { opacity: 1, duration: 1, ease: 'power1.out' });
      gsap.to([hint, skip], { opacity: 1, duration: 1, delay: 0.6 });
      intro.style.setProperty('--heat', '0.35');
      return;
    }
    gsap.ticker.add(tick);
    var shineState = { p: -0.25 };
    var r = geo.rect;
    var tl = gsap.timeline({ delay: 0.3 });
    tl.fromTo(word, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: 'power2.out' }, 0)
      .fromTo(word, { filter: 'blur(18px)', scale: 1.035 }, { filter: 'blur(0px)', scale: 1, duration: 2.6, ease: 'expo.out', clearProps: 'filter' }, 0)
      .to(
        shineState,
        {
          p: 1.25,
          duration: 2.1,
          ease: 'power2.inOut',
          onUpdate: function () {
            shine.style.setProperty('--shine', (shineState.p * 100).toFixed(2) + '%');
            // El «cabezal» que suelta chispas va con el destello, por la base de las letras.
            var p = shineState.p;
            sparks.head.on = p > 0.02 && p < 0.98;
            sparks.head.x = r.left + p * r.width;
            sparks.head.y = geo.o.y + geo.fs * 0.27;
          },
          onComplete: function () {
            sparks.head.on = false;
          },
        },
        0.4,
      )
      .call(function () {
        sparks.idle.on = true;
      }, null, 1.5)
      .to(skip, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1.3)
      .to(hint, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 2.2);
  }

  // Chispas desde el ratón cuando pasa cerca del texto.
  var last = null;
  window.addEventListener(
    'pointermove',
    function (e) {
      if (!sparks || state !== 'idle' || !geo) return;
      var now = performance.now();
      if (last) {
        var dt = Math.max(8, now - last.t) / 1000;
        var vx = (e.clientX - last.x) / dt;
        var vy = (e.clientY - last.y) / dt;
        var sp = Math.sqrt(vx * vx + vy * vy);
        var r = geo.rect;
        var dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        var dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        var prox = 1 - Math.sqrt(dx * dx + dy * dy) / (geo.fs * 1.6);
        if (prox > 0) {
          var n = Math.min(mobile ? 6 : 14, Math.round((sp / 260) * prox + Math.random() * prox * 1.4));
          if (n > 0) sparks.emit(e.clientX, e.clientY, Math.atan2(vy, vx), 0.75, 160, 520 + Math.min(sp, 2400) * 0.3, n, { lifeMin: 0.3, lifeMax: 0.85 });
        }
      }
      last = { x: e.clientX, y: e.clientY, t: now };
    },
    { passive: true },
  );

  // ---------------------------------------------------------------- escena 2
  function enter() {
    if (state !== 'idle') return;
    state = 'enter';
    try {
      sessionStorage.setItem(KEY, '1');
    } catch (e) {}
    intro.classList.add('is-entering');

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
    measure();
    var o = geo.o;
    var r = geo.rect;
    sparks.idle.on = false;
    sparks.head.on = false;

    // Escala a la que el hueco de la «o» cubre toda la pantalla.
    var W = window.innerWidth;
    var H = window.innerHeight;
    var far = Math.max(Math.hypot(o.x, o.y), Math.hypot(W - o.x, o.y), Math.hypot(o.x, H - o.y), Math.hypot(W - o.x, H - o.y));
    var S = (far / o.r) * 1.08;
    var wr = word.getBoundingClientRect();
    gsap.set(word, { transformOrigin: o.x - wr.left + 'px ' + (o.y - wr.top) + 'px' });
    var fly = { p: 0 };

    var tl = gsap.timeline();
    tl.to([hint, skip], { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0)
      // Estallido
      .call(function () {
        sparks.explode(mobile ? 170 : 360, r.left + r.width / 2, r.top + r.height / 2);
      }, null, 0)
      .fromTo(shine, { '--shine': '-25%' }, { '--shine': '125%', duration: 0.62, ease: 'power2.inOut' }, 0.18)
      .to(word, { scale: 0.986, duration: 0.24, ease: 'power2.out' }, 0)
      .to(word, { scale: 1, duration: 0.34, ease: 'power2.inOut' }, 0.24)
      // Absorción: todas las chispas caen dentro de la «o»
      .call(function () {
        sparks.attractTo(o.x, o.y);
      }, null, 0.2)
      .to(sparks.attr, { pull: 1, duration: 0.5, ease: 'power2.in' }, 0.2)
      // La cámara atraviesa la «o»: el vídeo solo se ve por su hueco, que crece con la letra hasta llenar la pantalla.
      .set(film, { opacity: 1, clipPath: 'circle(0px at ' + o.x + 'px ' + o.y + 'px)' }, 0.5)
      .to(
        fly,
        {
          p: 1,
          duration: 0.8,
          ease: 'power2.in',
          onUpdate: function () {
            var sc = 1 / (1 - fly.p * (1 - 1 / S));
            gsap.set(word, { scale: sc });
            film.style.clipPath = 'circle(' + (o.r * sc * 0.98).toFixed(1) + 'px at ' + o.x + 'px ' + o.y + 'px)';
          },
        },
        0.6,
      )
      .to([canvas, underglow], { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0.95)
      .call(playVideo, null, 1.12)
      .set(word, { visibility: 'hidden' }, 1.4)
      .set(film, { clearProps: 'clipPath' }, 1.4)
      .call(function () {
        gsap.ticker.remove(tick);
      }, null, 1.4);
  }

  function playVideo() {
    state = 'video';
    intro.classList.add('is-video');
    var started = performance.now();
    var done = false;
    var p = video.play();
    if (p && p.catch) {
      p.catch(function () {
        if (!done) {
          done = true;
          finish();
        }
      });
    }
    var check = function () {
      if (done) return;
      if (video.currentTime >= RING.at - 0.01) {
        done = true;
        zoom();
        return;
      }
      // Si el vídeo no llega (red lenta o error), se sigue igual a la web.
      if (performance.now() - started > (video.currentTime > 0 ? 4500 : 2600)) {
        done = true;
        finish();
        return;
      }
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(check);
      else requestAnimationFrame(check);
    };
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(check);
    else requestAnimationFrame(check);
    // requestVideoFrameCallback no llama si el vídeo no avanza: vigilancia aparte.
    setTimeout(function stall() {
      if (done) return;
      if (performance.now() - started > (video.currentTime > 0 ? 4500 : 2600)) {
        done = true;
        finish();
      } else setTimeout(stall, 400);
    }, 400);
  }

  function zoom() {
    state = 'zoom';
    video.pause();
    var W = window.innerWidth;
    var H = window.innerHeight;
    var VW = video.videoWidth || 1920;
    var VH = video.videoHeight || 1080;
    // Dónde queda el anillo en pantalla con object-fit: cover.
    var s = Math.max(W / VW, H / VH);
    var dw = VW * s;
    var dh = VH * s;
    var rx = (W - dw) / 2 + RING.x * dw;
    var ry = (H - dh) / 2 + RING.y * dh;
    var cap = RING.cap * dw;
    var far = Math.max(Math.hypot(rx, ry), Math.hypot(W - rx, ry), Math.hypot(rx, H - ry), Math.hypot(W - rx, H - ry));
    var S = (far / cap) * 1.12;
    gsap.set(film, { transformOrigin: rx + 'px ' + ry + 'px' });
    var tl = gsap.timeline();
    tl.to(film, { scale: S, duration: 0.9, ease: 'power3.in' }, 0);
    if (!mobile) tl.fromTo(video, { filter: 'brightness(1)' }, { filter: 'brightness(1.3)', duration: 0.45, ease: 'power1.in' }, 0.45);
    tl.to(whiteout, { opacity: 1, duration: 0.36, ease: 'power2.in' }, 0.62).call(go, null, 1.0);
  }

  // ---------------------------------------------------------------- escena 3
  function finish() {
    state = 'out';
    gsap.to(whiteout, { opacity: 1, duration: 0.45, ease: 'power2.inOut', onComplete: go });
  }

  function go() {
    try {
      sessionStorage.setItem(KEY, '1');
    } catch (e) {}
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
    if ((e.key === 'Enter' || e.key === ' ') && state === 'idle' && document.activeElement !== skip) {
      e.preventDefault();
      enter();
    }
  });
  skip.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    state = 'out';
    gsap.to(whiteout, { opacity: 1, duration: 0.35, ease: 'power1.inOut', onComplete: go });
  });
  whiteout.querySelector('[data-whiteout-link]').href = TARGET;
  skip.href = TARGET;

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      if (sparks) sparks.resize();
      if (state === 'idle') measure();
    }, 150);
  });

  // Arranca cuando la fuente está lista (sin esperar más de 1,5 s).
  var started = false;
  var start = function () {
    if (started) return;
    started = true;
    intro.classList.add('is-ready');
    reveal();
  };
  if (document.fonts && document.fonts.load) {
    Promise.race([
      document.fonts.load('200 100px Inter').then(function () {
        return document.fonts.ready;
      }),
      new Promise(function (res) {
        setTimeout(res, 1500);
      }),
    ]).then(start, start);
  } else {
    start();
  }
})();
