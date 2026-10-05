/*
 * Chispas de amoladora / soldadura en Canvas 2D.
 *
 * Cada chispa es un punto con velocidad, gravedad y rozamiento con el aire; se dibuja como una estela corta
 * (de su posición hacia atrás según su velocidad) y se enfría con la edad: blanco → amarillo → naranja → rojo.
 * Algunas revientan en dos a cuatro chispas pequeñas, como el acero de verdad. Se pintan en mezcla aditiva
 * ("lighter") y por tandas de color (6 tandas × 2 pasadas por fotograma), así aguanta miles a 60 fps.
 */
(function (global) {
  'use strict';

  // Rampa de temperatura: [umbral, núcleo, halo]
  var RAMP = [
    [0.86, '255,250,238', '255,212,150'],
    [0.7, '255,228,164', '255,168,78'],
    [0.54, '255,184,86', '255,118,38'],
    [0.4, '255,132,46', '252,82,32'],
    [0.26, '252,82,32', '196,46,14'],
    [0, '168,36,12', '110,22,8'],
  ];
  var CORE_ALPHA = [1, 0.95, 0.9, 0.82, 0.62, 0.38];
  var GLOW_ALPHA = [0.3, 0.26, 0.22, 0.18, 0.12, 0.07];

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function Sparks(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mobile = !!opts.mobile;
    this.max = opts.max || (this.mobile ? 600 : 1600);
    this.dprCap = this.mobile ? 1.5 : 2;
    var N = this.max;
    this.x = new Float32Array(N);
    this.y = new Float32Array(N);
    this.vx = new Float32Array(N);
    this.vy = new Float32Array(N);
    this.age = new Float32Array(N);
    this.life = new Float32Array(N);
    this.heat = new Float32Array(N);
    this.kind = new Uint8Array(N); // 0 = chispa principal, 1 = fragmento de un estallido
    this.bucket = new Uint8Array(N);
    this.n = 0;
    this.U = 1; // escala: 1 ≈ texto de 150 px

    this.attr = { x: 0, y: 0, pull: 0 };
    this.charge = 0; // luz acumulada en el punto de absorción
    this.activity = 0; // 0..1, cuánta chispa caliente hay (para el resplandor del texto)

    // Emisores
    this.head = { on: false, x: 0, y: 0, rate: this.mobile ? 120 : 260, angle: Math.PI * 0.68, spread: 0.4, acc: 0 };
    this.idle = { on: false, rate: this.mobile ? 4 : 7, fanEvery: this.mobile ? 1.3 : 0.95, fanT: 0.4 };
    this.points = null; // puntos del borde de las letras: {x, y, nx, ny, bottom[]}

    this.resize();
  }

  var P = Sparks.prototype;

  P.resize = function () {
    var dpr = Math.min(global.devicePixelRatio || 1, this.dprCap);
    this.W = global.innerWidth;
    this.H = global.innerHeight;
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  P.setScale = function (u) {
    this.U = Math.max(0.42, Math.min(1.3, u));
  };

  P.setPoints = function (pts) {
    this.points = pts;
  };

  // Lanza n chispas desde (x, y) en un abanico (ángulo central y apertura en radianes, velocidades en px/s a escala 1).
  P.emit = function (x, y, angle, spread, vmin, vmax, n, o) {
    o = o || {};
    var U = this.U;
    for (var k = 0; k < n; k++) {
      if (this.n >= this.max) return;
      var i = this.n++;
      var a = angle + (Math.random() * 2 - 1) * spread;
      var s = (vmin + (vmax - vmin) * Math.pow(Math.random(), 0.7)) * U;
      this.x[i] = x + rand(-1, 1);
      this.y[i] = y + rand(-1, 1);
      this.vx[i] = Math.cos(a) * s;
      this.vy[i] = Math.sin(a) * s;
      this.age[i] = 0;
      this.life[i] = rand(o.lifeMin || 0.45, o.lifeMax || 1.15);
      this.heat[i] = o.heat != null ? o.heat : rand(0.84, 1);
      this.kind[i] = o.kind || 0;
    }
  };

  // Estallido desde un punto del borde de las letras, hacia fuera.
  P.burstFromLetters = function (n, vmin, vmax, upBias) {
    var p = this.points;
    if (!p || !p.x.length) return;
    var j = (Math.random() * p.x.length) | 0;
    var a = Math.atan2(p.ny[j] - (upBias || 0), p.nx[j]);
    this.emit(p.x[j], p.y[j], a, 0.55, vmin, vmax, n, { lifeMin: 0.3, lifeMax: 0.85 });
  };

  // Chispas que gotean de la parte de abajo de las letras, en abanico hacia abajo.
  P.fanFromBottom = function (n) {
    var p = this.points;
    if (!p || !p.bottom.length) return;
    var j = p.bottom[(Math.random() * p.bottom.length) | 0];
    this.emit(p.x[j], p.y[j], Math.PI / 2 + rand(-0.35, 0.35), 0.75, 380, 1150, n, { lifeMin: 0.4, lifeMax: 1.1 });
  };

  // Clic: estallido desde todas las letras.
  P.explode = function (n, cx, cy) {
    var p = this.points;
    if (!p || !p.x.length) return;
    for (var k = 0; k < n; k++) {
      var j = (Math.random() * p.x.length) | 0;
      var a = Math.atan2(p.y[j] - cy, p.x[j] - cx) * 0.6 + Math.atan2(p.ny[j], p.nx[j]) * 0.4;
      this.emit(p.x[j], p.y[j], a, 0.6, 700, 2300, 1, { lifeMin: 0.9, lifeMax: 1.5, heat: rand(0.9, 1) });
    }
  };

  P.attractTo = function (x, y) {
    this.attr.x = x;
    this.attr.y = y;
  };

  P.kill = function (i) {
    var j = --this.n;
    if (i === j) return;
    this.x[i] = this.x[j];
    this.y[i] = this.y[j];
    this.vx[i] = this.vx[j];
    this.vy[i] = this.vy[j];
    this.age[i] = this.age[j];
    this.life[i] = this.life[j];
    this.heat[i] = this.heat[j];
    this.kind[i] = this.kind[j];
  };

  P.update = function (dt) {
    var U = this.U;
    var H = this.H;
    var g = 1600 * U;
    var dragK = Math.exp(-1.55 * dt);
    var pull = this.attr.pull;
    var ax = this.attr.x;
    var ay = this.attr.y;
    var killR = (8 + 30 * pull) * U;
    var hot = 0;

    // Emisores
    var h = this.head;
    if (h.on) {
      h.acc += h.rate * dt;
      while (h.acc >= 1) {
        h.acc -= 1;
        this.emit(h.x, h.y, h.angle, h.spread, 650, 1500, 1, { lifeMin: 0.4, lifeMax: 1.05 });
      }
    }
    var id = this.idle;
    if (id.on && this.points) {
      if (Math.random() < id.rate * dt) this.burstFromLetters((2 + Math.random() * 7) | 0, 200, 650, 0.6);
      id.fanT -= dt;
      if (id.fanT <= 0) {
        id.fanT = id.fanEvery * rand(0.6, 1.5);
        this.fanFromBottom(this.mobile ? (10 + Math.random() * 10) | 0 : (22 + Math.random() * 24) | 0);
      }
    }

    for (var i = 0; i < this.n; i++) {
      var age = this.age[i];
      var life = this.life[i];
      var vx = this.vx[i];
      var vy = this.vy[i];
      var x = this.x[i];
      var y = this.y[i];

      if (pull > 0) {
        // Absorción: la chispa olvida su trayectoria y cae hacia el punto, cada vez más deprisa.
        var dx = ax - x;
        var dy = ay - y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < killR) {
          this.charge += 1;
          this.kill(i--);
          continue;
        }
        var vt = (500 + 3400 * pull) * U;
        var k = 1 - Math.exp(-dt * (1.5 + 16 * pull));
        vx += ((dx / d) * vt - vx) * k;
        vy += ((dy / d) * vt - vy) * k;
        age += dt * (1 - 0.9 * pull);
      } else {
        age += dt;
      }

      if (age >= life) {
        this.kill(i--);
        continue;
      }

      vx *= dragK;
      vy = vy * dragK + g * dt * (1 - pull);
      x += vx * dt;
      y += vy * dt;

      // Rebote en el borde de abajo, como en el suelo del taller.
      if (y > H - 1 && vy > 0) {
        y = H - 1;
        vy *= -0.28;
        vx *= 0.55;
        life *= 0.85;
        this.life[i] = life;
      }

      var T = this.heat[i] * Math.pow(1 - age / life, 0.75);
      if (pull > 0) T = Math.max(T, 0.5 + 0.5 * pull);

      // Estallido del acero: la chispa revienta en fragmentos más pequeños.
      if (this.kind[i] === 0 && pull === 0 && age > 0.18 * life && age < 0.62 * life && Math.random() < 1.3 * dt && this.n < this.max - 4) {
        var sp = Math.sqrt(vx * vx + vy * vy) / U;
        var base = Math.atan2(vy, vx);
        this.emit(x, y, base, 1.25, sp * 0.22, sp * 0.55, 2 + ((Math.random() * 3) | 0), {
          lifeMin: 0.1,
          lifeMax: 0.3,
          heat: Math.min(1, T + 0.15),
          kind: 1,
        });
        this.kill(i--);
        continue;
      }

      this.x[i] = x;
      this.y[i] = y;
      this.vx[i] = vx;
      this.vy[i] = vy;
      this.age[i] = age;
      var b = 5;
      for (var r = 0; r < RAMP.length; r++) {
        if (T >= RAMP[r][0]) {
          b = r;
          break;
        }
      }
      this.bucket[i] = b;
      if (T > 0.4) hot += T;
    }

    var target = Math.min(1, hot / (this.mobile ? 55 : 110));
    this.activity += (target - this.activity) * (1 - Math.exp(-dt * 7));
    this.charge *= Math.exp(-dt * 2.6);
  };

  P.draw = function () {
    var ctx = this.ctx;
    var n = this.n;
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    var U = this.U;
    var trail = 0.028; // segundos de estela (desenfoque de movimiento)
    var maxLen = 58 * U;
    var flick = 0.86 + 0.14 * Math.random();

    // Luz del cabezal mientras recorre las letras
    if (this.head.on) this.glowAt(this.head.x, this.head.y, 70 * U, 0.42 * flick);
    // Las chispas absorbidas cargan de luz el punto de entrada (núcleo pequeño e intenso, no una mancha).
    if (this.charge > 0.5) this.glowAt(this.attr.x, this.attr.y, Math.min(40 + this.charge * 0.9, 120) * U, Math.min(0.75, this.charge / 70));

    for (var b = RAMP.length - 1; b >= 0; b--) {
      ctx.beginPath();
      var any = false;
      for (var i = 0; i < n; i++) {
        if (this.bucket[i] !== b) continue;
        any = true;
        var vx = this.vx[i];
        var vy = this.vy[i];
        var sp = Math.sqrt(vx * vx + vy * vy) || 1;
        var len = Math.min(maxLen, sp * trail) + 0.6;
        var x = this.x[i];
        var y = this.y[i];
        ctx.moveTo(x - (vx / sp) * len, y - (vy / sp) * len);
        ctx.lineTo(x, y);
      }
      if (!any) continue;
      // Halo
      ctx.strokeStyle = 'rgba(' + RAMP[b][2] + ',' + (GLOW_ALPHA[b] * flick).toFixed(3) + ')';
      ctx.lineWidth = (this.mobile ? 3.2 : 3.6) * Math.max(0.8, U);
      ctx.stroke();
      // Núcleo (algo más grueso en el móvil, que tiene menos píxeles de pantalla por chispa)
      ctx.strokeStyle = 'rgba(' + RAMP[b][1] + ',' + (CORE_ALPHA[b] * flick).toFixed(3) + ')';
      ctx.lineWidth = (b < 2 ? 1.25 : 1.05) * Math.max(0.85, U) * (this.mobile ? 1.35 : 1);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  P.glowAt = function (x, y, r, a) {
    var ctx = this.ctx;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,214,160,' + a.toFixed(3) + ')');
    g.addColorStop(0.25, 'rgba(252,110,40,' + (a * 0.45).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(252,82,32,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  global.Sparks = Sparks;
})(window);
