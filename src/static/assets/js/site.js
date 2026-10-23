/*
 * Progressive enhancement for every page. Everything here is optional: the
 * site is fully readable and navigable without it.
 *   - language switch (persists to localStorage)
 *   - scroll reveals and the sticky walkthrough
 *   - copy-to-clipboard buttons
 *   - live GitHub star counts (cached per session, silent on failure)
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function short(lang) {
    return lang === 'en' ? 'en' : 'zh';
  }

  /* ---------- Language ---------- */

  var I18N_ATTRS = ['alt', 'aria-label', 'title'];

  function applyLanguage(lang) {
    var s = short(lang);
    root.lang = lang;
    var title = root.getAttribute('data-title-' + s);
    if (title) document.title = title;
    var desc = root.getAttribute('data-desc-' + s);
    var meta = document.querySelector('meta[name="description"]');
    if (desc && meta) meta.setAttribute('content', desc);
    I18N_ATTRS.forEach(function (attr) {
      var nodes = document.querySelectorAll('[data-i18n-' + attr + '-' + s + ']');
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].setAttribute(attr, nodes[i].getAttribute('data-i18n-' + attr + '-' + s));
      }
    });
    document.dispatchEvent(new CustomEvent('lulux:lang', { detail: { lang: lang } }));
  }

  function initLanguage() {
    applyLanguage(root.lang === 'en' ? 'en' : 'zh-CN');
    var btn = document.getElementById('lang-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = root.lang === 'en' ? 'zh-CN' : 'en';
      try {
        window.localStorage.setItem('lulux.lang', next);
      } catch (e) {
        /* Private mode or storage disabled: the switch still works for this page. */
      }
      applyLanguage(next);
    });
  }

  /* ---------- Navigation ---------- */

  function initNav() {
    var header = document.getElementById('gnav');
    var menu = document.querySelector('.gnav__menu');
    if (menu) {
      menu.addEventListener('toggle', function () {
        root.classList.toggle('menu-open', menu.hasAttribute('open'));
      });
      menu.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('a')) menu.removeAttribute('open');
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.hasAttribute('open')) {
          menu.removeAttribute('open');
          var summary = menu.querySelector('summary');
          if (summary) summary.focus();
        }
      });
    }
    if (!header) return;
    var ticking = false;
    // On pages that open with a dark painting the bar stays dark until the
    // painting has scrolled out from under it.
    var darkHero = document.body.classList.contains('has-dark-hero') ? document.querySelector('.hero') : null;
    function update() {
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      if (darkHero) header.classList.toggle('is-past', darkHero.getBoundingClientRect().bottom <= header.offsetHeight);
    }
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- Button water ---------- */

  /*
   * The water layer in every primary button is pure CSS; this only feeds the
   * pointer position (--mx/--my) so the glow follows the cursor. CSSOM writes
   * are allowed by the Content Security Policy (no inline style attributes).
   */
  function initWater() {
    if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
    var pending = null;
    var frame = 0;
    function apply() {
      frame = 0;
      if (!pending) return;
      var water = pending.el.querySelector('.btn__water');
      if (water) {
        var wr = water.getBoundingClientRect();
        water.style.setProperty('--mx', Math.round(pending.x - wr.left) + 'px');
        water.style.setProperty('--my', Math.round(pending.y - wr.top) + 'px');
      }
      pending = null;
    }
    document.addEventListener(
      'pointermove',
      function (e) {
        var el = e.target && e.target.closest ? e.target.closest('.btn') : null;
        if (!el) return;
        pending = { el: el, x: e.clientX, y: e.clientY };
        if (!frame) frame = window.requestAnimationFrame(apply);
      },
      { passive: true },
    );
  }

  /* ---------- Reveals ---------- */

  /*
   * Content fades in as it scrolls into view, but nothing may ever stay
   * hidden: anything already in or above the viewport is revealed on load,
   * after anchor jumps (hashchange), when a scroll settles (scrollend, with a
   * debounced fallback) and, as a last resort, after a safety timeout.
   */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.rv, .display'));
    function showAll() {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
    }
    if (!('IntersectionObserver' in window) || reduceMotion) {
      showAll();
      return;
    }
    root.classList.add('reveal-ready');
    var pending = items.slice();
    function reveal(el) {
      el.classList.add('is-in');
      io.unobserve(el);
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) reveal(entry.target);
        });
      },
      { rootMargin: '0px', threshold: 0 },
    );
    function sweep() {
      var vh = window.innerHeight || root.clientHeight;
      pending = pending.filter(function (el) {
        if (el.classList.contains('is-in')) return false;
        // getBoundingClientRect ignores the reveal's own translate offset only
        // approximately, so allow a little slack below the fold.
        if (el.getBoundingClientRect().top < vh + 48) {
          reveal(el);
          return false;
        }
        return true;
      });
    }
    for (var j = 0; j < items.length; j++) io.observe(items[j]);
    sweep();
    window.addEventListener('load', sweep);
    window.addEventListener('hashchange', function () {
      window.requestAnimationFrame(sweep);
    });
    window.addEventListener('pageshow', sweep);
    var settle = 0;
    if ('onscrollend' in window) window.addEventListener('scrollend', sweep, { passive: true });
    window.addEventListener(
      'scroll',
      function () {
        window.clearTimeout(settle);
        settle = window.setTimeout(sweep, 160);
      },
      { passive: true },
    );
    window.addEventListener('beforeprint', showAll);
    // Safety net: whatever happens, never leave the first screens blank.
    window.setTimeout(sweep, 1200);
    window.setTimeout(sweep, 3000);
  }

  /* ---------- Sticky walkthrough ---------- */

  function initSteps() {
    var groups = document.querySelectorAll('[data-steps]');
    if (!groups.length || !('IntersectionObserver' in window)) return;
    Array.prototype.forEach.call(groups, function (group) {
      var steps = group.querySelectorAll('.step');
      var slides = group.querySelectorAll('.stage__slide');
      function activate(index) {
        for (var i = 0; i < slides.length; i++) {
          var on = String(i) === String(index);
          slides[i].classList.toggle('is-active', on);
          if (on) slides[i].removeAttribute('aria-hidden');
          else slides[i].setAttribute('aria-hidden', 'true');
        }
        for (var k = 0; k < steps.length; k++) steps[k].classList.toggle('is-active', String(k) === String(index));
      }
      activate(0);
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) activate(entry.target.getAttribute('data-step'));
          });
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
      );
      for (var s = 0; s < steps.length; s++) io.observe(steps[s]);
      group.classList.add('is-enhanced');
    });
  }

  /* ---------- Copy buttons ---------- */

  function initCopy() {
    var buttons = document.querySelectorAll('[data-copy]');
    Array.prototype.forEach.call(buttons, function (btn) {
      var status = btn.closest('.cmd') && btn.closest('.cmd').querySelector('.cmd__status');
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var s = short(root.lang);
        function done(ok) {
          var msg = btn.getAttribute(ok ? 'data-copied-' + s : 'data-failed-' + s);
          btn.classList.toggle('is-copied', ok);
          if (status) status.textContent = msg;
          window.setTimeout(function () {
            btn.classList.remove('is-copied');
            if (status) status.textContent = '';
          }, 2200);
        }
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(
            function () { done(true); },
            function () { done(false); },
          );
        } else {
          done(false);
        }
      });
    });
  }

  /* ---------- Live star counts ---------- */

  var STAR_TTL_MS = 30 * 60 * 1000;
  var STAR_MIN = 50;

  function readCache(key) {
    try {
      var raw = window.sessionStorage.getItem(key);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return v && Date.now() - v.t < STAR_TTL_MS ? v.n : null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(key, n) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), n: n }));
    } catch (e) {
      /* ignore */
    }
  }

  function showStars(el, n) {
    // A tiny count reads as weak social proof; below 50 the "Star" button is enough.
    if (typeof n !== 'number' || !isFinite(n) || n < STAR_MIN) return;
    var out = el.querySelector('[data-stars-count]');
    if (!out) return;
    out.textContent = new Intl.NumberFormat(root.lang).format(n);
    el.hidden = false;
  }

  function initStars() {
    var els = document.querySelectorAll('[data-stars]');
    if (!els.length || !window.fetch) return;
    Array.prototype.forEach.call(els, function (el) {
      var slug = el.getAttribute('data-stars');
      if (!/^[\w.-]+\/[\w.-]+$/.test(slug)) return;
      var key = 'lulux.stars.' + slug;
      var cached = readCache(key);
      if (cached !== null) {
        showStars(el, cached);
        return;
      }
      fetch('https://api.github.com/repos/' + slug, { headers: { Accept: 'application/vnd.github+json' } })
        .then(function (res) {
          return res.ok ? res.json() : null;
        })
        .then(function (data) {
          if (data && typeof data.stargazers_count === 'number') {
            writeCache(key, data.stargazers_count);
            showStars(el, data.stargazers_count);
          }
        })
        .catch(function () {
          /* Offline or rate-limited: the static "Star" link remains. */
        });
    });
  }

  function init() {
    initLanguage();
    initNav();
    initWater();
    initReveal();
    initSteps();
    initCopy();
    initStars();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
