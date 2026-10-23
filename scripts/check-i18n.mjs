#!/usr/bin/env node
/**
 * i18n completeness gate (runs in CI).
 *  1. Every key in zh-CN.json exists in en.json and vice versa.
 *  2. No value is empty, and both sides have the same type at every path.
 *  3. Inline markup is balanced and matches across locales: the same number of
 *     `code` spans, **strong** spans and line breaks (headline line structure).
 *  4. Every key the templates use exists (the build itself also enforces this
 *     by throwing), and no key is left unused.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = new URL('../src/i18n/', import.meta.url);
const load = (l) => JSON.parse(readFileSync(fileURLToPath(new URL(`${l}.json`, dir)), 'utf8'));
const zh = load('zh-CN');
const en = load('en');

function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out.set(key, v);
  }
  return out;
}

const a = flatten(zh);
const b = flatten(en);
const errors = [];

for (const k of a.keys()) if (!b.has(k)) errors.push(`missing in en: ${k}`);
for (const k of b.keys()) if (!a.has(k)) errors.push(`missing in zh-CN: ${k}`);

const count = (s, re) => (String(s).match(re) || []).length;
for (const [k, va] of a) {
  if (!b.has(k)) continue;
  const vb = b.get(k);
  for (const [loc, v] of [['zh-CN', va], ['en', vb]]) {
    if (typeof v !== 'string') errors.push(`${loc} ${k}: expected a string, got ${typeof v}`);
    else if (!v.trim()) errors.push(`${loc} ${k}: empty`);
    else if (/<[a-z/!]/i.test(v)) errors.push(`${loc} ${k}: raw HTML is not allowed; use **bold** or \`code\``);
    else if (count(v, /`/g) % 2) errors.push(`${loc} ${k}: unbalanced backticks`);
    else if (count(v, /\*\*/g) % 2) errors.push(`${loc} ${k}: unbalanced **`);
  }
  if (typeof va === 'string' && typeof vb === 'string') {
    if (count(va, /`[^`]+`/g) !== count(vb, /`[^`]+`/g)) errors.push(`${k}: different number of \`code\` spans`);
    if (count(va, /\*\*.+?\*\*/g) !== count(vb, /\*\*.+?\*\*/g)) errors.push(`${k}: different number of **strong** spans`);
    if (count(va, /\n/g) !== count(vb, /\n/g)) errors.push(`${k}: different number of line breaks`);
  }
}

// Unused keys: a strict build reports any key no template looked up.
try {
  execFileSync(process.execPath, [fileURLToPath(new URL('./build.mjs', import.meta.url)), '--strict'], { stdio: 'pipe' });
} catch (err) {
  errors.push(`build --strict failed:\n${String(err.stderr || err.stdout || err.message).trim()}`);
}

if (errors.length) {
  console.error(`i18n check failed (${errors.length}):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`i18n ok: ${a.size} keys in zh-CN and en, all used, markup consistent`);
