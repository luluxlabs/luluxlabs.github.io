/*
 * Runs synchronously in <head> before first paint: picks the language
 * (saved choice → browser language → Chinese) so the page never flashes the
 * wrong one, and marks the document as script-enabled for progressive
 * enhancement styles. Kept tiny on purpose.
 */
(function () {
  var root = document.documentElement;
  var lang = null;
  try {
    lang = window.localStorage.getItem('lulux.lang');
  } catch (e) {
    lang = null;
  }
  if (lang !== 'en' && lang !== 'zh-CN') {
    // First visit: Chinese for Chinese-language browsers, English for every
    // other language. Chinese stays the default when nothing is reported.
    var first = String((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
    lang = first === '' || first.indexOf('zh') === 0 ? 'zh-CN' : 'en';
  }
  root.lang = lang;
  root.classList.add('js');
})();
