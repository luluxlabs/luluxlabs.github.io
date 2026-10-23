import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ART, ART_WIDTHS, artCss } from '../src/lib/art.mjs';

const root = new URL('../', import.meta.url);

test('every painting has a master and every rendition', () => {
  for (const [id, item] of Object.entries(ART)) {
    assert.ok(existsSync(fileURLToPath(new URL(item.source, root))), `${id}: master ${item.source}`);
    for (const w of ART_WIDTHS) {
      for (const ext of ['avif', 'webp', 'jpg']) {
        const f = new URL(`src/static/assets/img/art/${id}-${w}.${ext}`, root);
        assert.ok(existsSync(fileURLToPath(f)), `${id}-${w}.${ext}`);
      }
    }
  }
});

test('focal points become CSS for wide and narrow screens', () => {
  const css = artCss();
  for (const [id, item] of Object.entries(ART)) {
    assert.ok(css.includes(`.art--${id} .art__img{object-position:${item.position}}`));
    assert.ok(css.includes(`.art--${id} .art__img{object-position:${item.positionMobile || item.position}}`));
  }
  assert.match(css, /@media \(max-width:760px\)/);
});
