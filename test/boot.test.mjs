import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/static/assets/js/boot.js', import.meta.url), 'utf8');

/** Run boot.js against a stubbed browser and return the language it chose. */
function boot({ saved = null, languages, language, storageThrows = false } = {}) {
  const classes = new Set();
  const root = { lang: 'zh-CN', classList: { add: (c) => classes.add(c) } };
  const storage = {
    getItem: () => {
      if (storageThrows) throw new Error('SecurityError');
      return saved;
    },
  };
  const context = {
    document: { documentElement: root },
    navigator: { languages, language },
    window: { localStorage: storage },
  };
  vm.runInNewContext(source, context);
  return { lang: root.lang, js: classes.has('js') };
}

test('a saved choice wins', () => {
  assert.equal(boot({ saved: 'en', languages: ['zh-CN'] }).lang, 'en');
  assert.equal(boot({ saved: 'zh-CN', languages: ['en-US'] }).lang, 'zh-CN');
});

test('first visit follows the browser language', () => {
  assert.equal(boot({ languages: ['zh-TW', 'en'] }).lang, 'zh-CN');
  assert.equal(boot({ languages: ['en-GB'] }).lang, 'en');
  assert.equal(boot({ languages: ['ja-JP', 'zh-CN'] }).lang, 'en');
  assert.equal(boot({ language: 'zh-HK' }).lang, 'zh-CN');
});

test('falls back to Chinese when nothing is known, ignores junk in storage', () => {
  assert.equal(boot({}).lang, 'zh-CN');
  assert.equal(boot({ saved: 'fr' , languages: [] , language: '' }).lang, 'zh-CN');
});

test('survives blocked storage and always marks the page as script-enabled', () => {
  const r = boot({ storageThrows: true, languages: ['en-US'] });
  assert.equal(r.lang, 'en');
  assert.equal(r.js, true);
});
