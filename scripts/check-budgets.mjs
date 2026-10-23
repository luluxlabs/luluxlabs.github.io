#!/usr/bin/env node
/**
 * Page-weight budgets (runs in CI after the build).
 *
 * For each page and each language we add up what a desktop browser at the
 * widest breakpoint would download: HTML, CSS and JS (gzip-compressed, as
 * GitHub Pages serves them), the self-hosted font, and images (the largest
 * candidate of the first <source>, i.e. AVIF for paintings and WebP for
 * screenshots). Images in the inactive language are not counted, because
 * they are display:none and lazy, so browsers never fetch them. Repeated URLs
 * are counted once. Budgets and the reasoning behind each are in BUDGETS.
 */
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const KB = 1024;
export const BUDGETS = {
  html: { max: 24 * KB, why: 'One document carries both languages, so copy is doubled; still a small fraction of the page.' },
  css: { max: 16 * KB, why: 'A single stylesheet, no framework.' },
  js: { max: 16 * KB, why: 'Progressive enhancement only: language switch, reveals, copy buttons, live downloads.' },
  font: { max: 40 * KB, why: 'One Latin-subset variable sans (Inter); Chinese uses system fonts to avoid multi-megabyte CJK webfonts.' },
  initial: { max: 250 * KB, why: 'First view on a fast-3G/4G phone in a few seconds: document, styles, scripts and the eager hero painting.' },
  total: { max: 1024 * KB, why: 'Fully scrolled desktop page. Screenshots are the product, so they are kept sharp; everything below the fold is lazy-loaded.' },
};

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const pages = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) pages.push(p);
  }
})(dist);

const size = (file) => statSync(file).size;
const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length;
const resolve = (page, url) => (url.startsWith('/') ? join(dist, url) : join(dirname(page), url));
const fmt = (n) => `${(n / KB).toFixed(1)} KB`;

const failures = [];
const rows = [];

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const name = relative(dist, page);
  for (const lang of ['zh', 'en']) {
    const other = lang === 'zh' ? 'en' : 'zh';
    const visible = html.replace(new RegExp(`<span class="shot-l" data-l="${other}">[\\s\\S]*?</span>`, 'g'), '');
    const seen = new Set();
    const t = { html: gz(page), css: 0, js: 0, font: 0, images: 0, eager: 0 };
    for (const m of visible.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) t.css += gz(resolve(page, m[1]));
    for (const m of visible.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) {
      const f = resolve(page, m[1]);
      t.js += gz(f);
      if (f.endsWith('download.js')) t.js += gz(join(dirname(f), 'release.mjs'));
    }
    t.font = size(join(dist, 'assets/fonts/inter-latin.woff2'));
    for (const m of visible.matchAll(/<picture[^>]*>([\s\S]*?)<\/picture>/g)) {
      const block = m[1];
      const srcset = (block.match(/<source[^>]*srcset="([^"]+)"/) || block.match(/<img[^>]*srcset="([^"]+)"/))[1];
      const largest = srcset.split(',').map((c) => c.trim().split(/\s+/)).sort((a, b) => parseInt(b[1], 10) - parseInt(a[1], 10))[0][0];
      if (seen.has(largest)) continue;
      seen.add(largest);
      const bytes = size(resolve(page, largest));
      t.images += bytes;
      if (!/loading="lazy"/.test(block)) t.eager += bytes;
    }
    for (const m of visible.matchAll(/<img(?![^>]*srcset)[^>]*\ssrc="([^"]+)"[^>]*>/g)) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
      const bytes = size(resolve(page, m[1]));
      t.images += bytes;
      if (!/loading="lazy"/.test(m[0])) t.eager += bytes;
    }
    const initial = t.html + t.css + t.js + t.font + t.eager;
    const total = t.html + t.css + t.js + t.font + t.images;
    const check = { html: t.html, css: t.css, js: t.js, font: t.font, initial, total };
    for (const [k, v] of Object.entries(check)) if (v > BUDGETS[k].max) failures.push(`${name} [${lang}] ${k} ${fmt(v)} > ${fmt(BUDGETS[k].max)}`);
    rows.push([`${name} [${lang}]`, fmt(t.html), fmt(t.css), fmt(t.js), fmt(t.font), fmt(initial), fmt(total)]);
  }
}

const head = ['page', 'html(gz)', 'css(gz)', 'js(gz)', 'font', 'initial', 'total'];
const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
const line = (r) => r.map((c, i) => c.padEnd(widths[i])).join('  ');
console.log(line(head));
for (const r of rows) console.log(line(r));
if (failures.length) {
  console.error(`\nbudget check failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nall pages within budget');
