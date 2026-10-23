/*
 * Product heroes: the flowing light along the bottom of the hero and koko's
 * eyes following the pointer. Optional enhancement: without JavaScript the
 * light is a still CSS gradient and the eyes look straight ahead.
 *
 *   - Both loops run only while their element is on screen
 *     (IntersectionObserver) and the tab is visible.
 *   - prefers-reduced-motion: the light is drawn once and the eyes stay still.
 *   - Only CSSOM writes (element.style), which the Content Security Policy
 *     allows; no inline styles, no external resources.
 */
(function () {
  'use strict';

  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduceMotion = !!(motionQuery && motionQuery.matches);
  var hasIO = 'IntersectionObserver' in window;

  /** Calls fn(visible) when el enters or leaves the viewport. */
  function watch(el, fn) {
    if (!hasIO) {
      fn(true);
      return;
    }
    new IntersectionObserver(
      function (entries) {
        fn(entries[entries.length - 1].isIntersecting);
      },
      { rootMargin: '80px 0px' },
    ).observe(el);
  }

  /* ---------- Flowing light ---------- */

  /*
   * Translucent ribbons of mist blue, pale blue and white drift sideways at
   * different speeds; thin bright and dark caustic lines ride on top. The
   * canvas is drawn at reduced resolution and scaled up by CSS, which softens
   * every edge into a liquid blur and keeps each frame cheap.
   */
  var RIBBONS = [
    // y (0-1 of height), thickness, amplitude, wavelength (px), speed (px/s), colour, alpha
    { y: 0.42, th: 0.2, amp: 0.07, len: 900, speed: 26, rgb: '223,231,238', a: 0.9 },
    { y: 0.56, th: 0.18, amp: 0.06, len: 640, speed: -18, rgb: '143,168,188', a: 0.34 },
    { y: 0.66, th: 0.24, amp: 0.08, len: 1100, speed: 34, rgb: '186,204,218', a: 0.5 },
    { y: 0.8, th: 0.22, amp: 0.05, len: 760, speed: -24, rgb: '143,168,188', a: 0.42 },
    { y: 0.9, th: 0.2, amp: 0.04, len: 520, speed: 40, rgb: '223,231,238', a: 0.8 },
  ];
  var LINES = [
    // y, amplitude, wavelength, speed, width, colour, alpha
    { y: 0.5, amp: 0.05, len: 380, speed: 46, w: 1.6, rgb: '255,255,255', a: 0.95 },
    { y: 0.62, amp: 0.06, len: 300, speed: -38, w: 1.2, rgb: '255,255,255', a: 0.85 },
    { y: 0.72, amp: 0.045, len: 460, speed: 58, w: 1.4, rgb: '106,138,163', a: 0.35 },
    { y: 0.84, amp: 0.05, len: 340, speed: -52, w: 1.8, rgb: '255,255,255', a: 0.9 },
    { y: 0.94, amp: 0.03, len: 280, speed: 64, w: 1.1, rgb: '106,138,163', a: 0.3 },
  ];
  var SCALE = 0.6; // canvas pixels per CSS pixel
  var STEP = 12; // horizontal sampling step in canvas pixels

  function wave(x, t, len, speed, phase) {
    var k = (2 * Math.PI) / len;
    return Math.sin(k * (x - speed * t) + phase) * 0.62 + Math.sin(k * 1.9 * (x + speed * 0.6 * t) + phase * 1.7) * 0.38;
  }

  function initFlowLight(box) {
    var canvas = box.querySelector('canvas');
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;
    var W = 0;
    var H = 0;
    var visible = false;
    var raf = 0;
    var t0 = performance.now();
    var tFrozen = 7.3;

    function size() {
      var r = box.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width * SCALE));
      var h = Math.max(1, Math.round(r.height * SCALE));
      if (w !== W || h !== H) {
        W = canvas.width = w;
        H = canvas.height = h;
        return true;
      }
      return false;
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var unit = 1 / SCALE; // CSS px per canvas px, so speeds and lengths stay in CSS px
      var i;
      var x;
      for (i = 0; i < RIBBONS.length; i++) {
        var r = RIBBONS[i];
        var ph = i * 1.3;
        var grad = ctx.createLinearGradient(0, 0, W, 0);
        var shift = (((r.speed * t) / (W * unit)) % 1 + 1) % 1;
        for (var s = 0; s <= 4; s++) {
          var o = (s / 4 + shift) % 1;
          grad.addColorStop(o, 'rgba(' + r.rgb + ',' + (s % 2 ? r.a : r.a * 0.45) + ')');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        for (x = -STEP; x <= W + STEP; x += STEP) {
          var y = (r.y + r.amp * wave(x * unit, t, r.len, r.speed, ph)) * H;
          if (x === -STEP) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (x = W + STEP; x >= -STEP; x -= STEP) {
          var th = r.th * (0.65 + 0.35 * wave(x * unit, t, r.len * 1.7, -r.speed * 0.5, ph + 2));
          ctx.lineTo(x, (r.y + th + r.amp * wave(x * unit, t, r.len, r.speed, ph + 0.4)) * H);
        }
        ctx.closePath();
        ctx.fill();
      }
      // Caustic glints: thin bright filaments that swell and taper as they drift.
      for (i = 0; i < LINES.length; i++) {
        var l = LINES[i];
        var lp = i * 2.1;
        ctx.fillStyle = 'rgba(' + l.rgb + ',' + l.a + ')';
        ctx.beginPath();
        for (x = -STEP; x <= W + STEP; x += STEP / 2) {
          var yt = (l.y + l.amp * wave(x * unit, t, l.len, l.speed, lp)) * H;
          if (x === -STEP) ctx.moveTo(x, yt);
          else ctx.lineTo(x, yt);
        }
        for (x = W + STEP; x >= -STEP; x -= STEP / 2) {
          var swell = Math.max(0, wave(x * unit, t, l.len * 2.3, -l.speed * 0.35, lp + 1));
          ctx.lineTo(x, (l.y + l.amp * wave(x * unit, t, l.len, l.speed, lp)) * H + 0.25 + l.w * 1.8 * swell * SCALE * 2);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      size();
      draw((now - t0) / 1000);
      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (!raf && visible && !document.hidden) raf = window.requestAnimationFrame(frame);
    }

    function stop() {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    }

    size();
    draw(tFrozen);
    box.classList.add('is-live');
    if (reduceMotion) {
      // One still frame, redrawn only when the box changes size.
      if ('ResizeObserver' in window) {
        new ResizeObserver(function () {
          if (size()) draw(tFrozen);
        }).observe(box);
      }
      return;
    }
    watch(box, function (v) {
      visible = v;
      if (v) start();
      else stop();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });
  }

  /* ---------- koko's eyes ---------- */

  var MAX = 42; // largest eye offset, in avatar units (the avatar is 1024 wide)
  var TILT = 5; // largest tilt, degrees

  function initKoko(el) {
    var eyes = el.querySelector('.koko__ko');
    if (!eyes || reduceMotion) return;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var cur = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var visible = false;
    var raf = 0;
    var last = 0;
    var idleStart = performance.now();

    function apply() {
      eyes.style.transform =
        'translate(' + (cur.x * MAX).toFixed(2) + 'px,' + (cur.y * MAX).toFixed(2) + 'px) rotate(' + (cur.x * TILT).toFixed(2) + 'deg)';
    }

    function idleTarget(now) {
      // A slow, gentle look around: drift, rest, drift.
      var t = (now - idleStart) / 1000;
      target.x = Math.sin(t * 0.55) * 0.7 * Math.min(1, Math.abs(Math.sin(t * 0.21)) * 1.6);
      target.y = Math.sin(t * 0.37 + 1.2) * 0.45;
    }

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      var dt = last ? Math.min(64, now - last) : 16;
      last = now;
      if (!fine) idleTarget(now);
      var k = 1 - Math.exp(-dt / 110);
      cur.x += (target.x - cur.x) * k;
      cur.y += (target.y - cur.y) * k;
      apply();
      // With a mouse, rest once the eyes have arrived; idle mode keeps going.
      if (!fine) raf = window.requestAnimationFrame(frame);
      else if (Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.002) raf = window.requestAnimationFrame(frame);
      else last = 0;
    }

    function kick() {
      if (!raf && visible && !document.hidden) raf = window.requestAnimationFrame(frame);
    }

    if (fine) {
      document.addEventListener(
        'pointermove',
        function (e) {
          if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
          var r = el.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2);
          var dy = e.clientY - (r.top + r.height / 2);
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          // Full deflection once the pointer is a little beyond the avatar's edge.
          var m = Math.min(1, d / (r.width * 0.9));
          target.x = (dx / d) * m;
          target.y = (dy / d) * m;
          kick();
        },
        { passive: true },
      );
      document.documentElement.addEventListener('pointerleave', function () {
        target.x = 0;
        target.y = 0;
        kick();
      });
    }

    watch(el, function (v) {
      visible = v;
      if (v) {
        last = 0;
        kick();
      }
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        last = 0;
        kick();
      }
    });
    el.classList.add('is-live');
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.flowlight'), initFlowLight);
    Array.prototype.forEach.call(document.querySelectorAll('[data-koko]'), initKoko);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
