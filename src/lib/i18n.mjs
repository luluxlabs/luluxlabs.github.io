/**
 * Bilingual rendering.
 *
 * The site ships one HTML document per page containing both languages. Every
 * translatable string is rendered as a pair of sibling elements:
 *
 *   <span data-l="zh" lang="zh-CN">…</span><span data-l="en" lang="en">…</span>
 *
 * CSS hides the inactive language based on <html lang>. Chinese is the
 * default, so the site reads correctly with JavaScript disabled.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const LOCALES = /** @type {const} */ (['zh-CN', 'en']);
export const SHORT = { 'zh-CN': 'zh', en: 'en' };

const dir = new URL('../i18n/', import.meta.url);
const dicts = Object.fromEntries(
  LOCALES.map((l) => [l, JSON.parse(readFileSync(fileURLToPath(new URL(`${l}.json`, dir)), 'utf8'))]),
);

/** Keys looked up during a build, so unused keys can be reported. */
export const usedKeys = new Set();

/** @param {object} obj @param {string} key */
function dig(obj, key) {
  return key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
}

/** Raw string for one locale. Throws on a missing key so a build can never ship a gap. */
export function raw(key, locale) {
  usedKeys.add(key);
  const v = dig(dicts[locale], key);
  if (typeof v !== 'string' || v.trim() === '') {
    throw new Error(`i18n: missing or empty key "${key}" for locale ${locale}`);
  }
  return v;
}

/** Both locales as plain text (inline markup stripped), for attributes. */
export function pair(key) {
  return {
    zh: stripMarkup(raw(key, 'zh-CN')),
    en: stripMarkup(raw(key, 'en')),
  };
}

export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function stripMarkup(s) {
  return String(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\n/g, ' ');
}

/**
 * Minimal inline markup: **strong**, `code`, and \n line breaks.
 * Input is escaped first, so locale files cannot inject HTML.
 * @param {string} s
 * @param {{ lines?: boolean }} [opts] lines: wrap each line in <span class="ln"> (for display headlines)
 */
export function inline(s, opts = {}) {
  const fmt = (part) =>
    escapeHtml(part)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  const lines = String(s).split('\n');
  if (opts.lines) return lines.map((l) => `<span class="ln">${fmt(l)}</span>`).join('');
  return lines.map(fmt).join('<br>');
}

/**
 * Render a key in both languages.
 * @param {string} key
 * @param {{ lines?: boolean, tag?: string }} [opts]
 */
export function t(key, opts = {}) {
  const tag = opts.tag || 'span';
  return LOCALES.map(
    (l) => `<${tag} data-l="${SHORT[l]}" lang="${l}">${inline(raw(key, l), opts)}</${tag}>`,
  ).join('');
}

/**
 * Attribute pair: renders the Chinese value plus data-*-zh / data-*-en copies
 * that site.js swaps when the language changes.
 * @param {string} attr  e.g. 'alt', 'aria-label', 'title'
 * @param {string} key
 */
export function tAttr(attr, key) {
  const p = pair(key);
  return `${attr}="${escapeHtml(p.zh)}" data-i18n-${attr}-zh="${escapeHtml(p.zh)}" data-i18n-${attr}-en="${escapeHtml(p.en)}"`;
}

/** Flattened keys of one locale (used by scripts/check-i18n.mjs). */
export function flatKeys(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') out.push(...flatKeys(v, key));
    else out.push(key);
  }
  return out;
}

export { dicts };
