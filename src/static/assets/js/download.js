/*
 * Live LULUX ETA downloads.
 *
 * Fetches the latest release from the GitHub API, detects the visitor's OS and
 * CPU architecture, and highlights the matching installer. The page already
 * contains static links from build time, so if anything here fails (offline,
 * rate limit, old browser) the visitor still has working downloads.
 *
 * Everything that comes from the API is put into the page with
 * createElement/textContent only, never parsed as HTML.
 */
import { detectPlatform, normaliseRelease, recommend, groupItems, formatBytes } from './release.mjs';

const CACHE_KEY = 'lulux.release.eta';
const CACHE_TTL_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 8000;

const live = document.getElementById('dl-live');
const compact = document.getElementById('dl-compact');

function readJson(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
}

const strings = readJson('dl-strings') || { zh: {}, en: {} };
const snapshot = readJson('dl-snapshot');

/**
 * Create an element. `props` sets className/href/etc.; children may be
 * strings (inserted as text), nodes, or null (skipped).
 */
function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'className') el.className = v;
      else el.setAttribute(k, v);
    }
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === '') continue;
    el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

/** Both languages for one key as a fragment; CSS shows the active one. */
function L(key) {
  const zh = strings.zh[key];
  const en = strings.en[key];
  const frag = document.createDocumentFragment();
  if (!zh || !en) return frag;
  frag.append(h('span', { 'data-l': 'zh', lang: 'zh-CN' }, zh), h('span', { 'data-l': 'en', lang: 'en' }, en));
  return frag;
}

function label(item) {
  return item.labelKey ? L(`download.${item.labelKey}`) : document.createTextNode(String(item.name));
}

function safeUrl(url) {
  return typeof url === 'string' && url.startsWith('https://github.com/') ? url : null;
}

async function fetchRelease(api) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.t < CACHE_TTL_MS) return cached.data;
  } catch {
    /* storage unavailable */
  }
  const res = await fetch(api, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout ? AbortSignal.timeout(TIMEOUT_MS) : undefined,
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = await res.json();
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* ignore */
  }
  return data;
}

async function platform() {
  const uaData = navigator.userAgentData;
  let highEntropy = null;
  if (uaData && typeof uaData.getHighEntropyValues === 'function') {
    try {
      highEntropy = await uaData.getHighEntropyValues(['architecture', 'bitness']);
    } catch {
      highEntropy = null;
    }
  }
  return detectPlatform({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    uaData: uaData ? { platform: uaData.platform, mobile: uaData.mobile } : null,
    highEntropy,
  });
}

/** An x64 Windows build offered to a Windows-on-ARM visitor. */
function isEmulated(item, p) {
  return item.os === 'windows' && p?.os === 'windows' && p.arch === 'arm64' && item.arch === 'x64';
}

function fileRow(item, p) {
  const url = safeUrl(item.url);
  if (!url) return null;
  const emu = isEmulated(item, p) ? [' · ', L('download.label_emulated')] : [];
  return h(
    'li',
    { className: `file${item.recommended ? ' is-recommended' : ''}` },
    h('a', { className: 'file__link', href: url }, h('span', { className: 'file__label' }, label(item), emu), h('span', { className: 'file__name mono' }, String(item.name))),
    h('span', { className: 'file__size mono' }, formatBytes(item.size)),
  );
}

function renderFiles(model, p) {
  return groupItems(model.items).map((g) =>
    h(
      'div',
      { className: 'files__group' },
      h('h3', { className: 'files__h' }, L(`download.group_${g.group}`)),
      h('ul', { className: 'files__list' }, g.items.map((it) => fileRow(it, p))),
    ),
  );
}

function renderRecommendation(rec, p) {
  if (rec.reason === 'mobile') return [h('p', { className: 'dl__note' }, L('download.recommended_mobile'))];
  if (!rec.items.length) return [h('p', { className: 'dl__note' }, L('download.recommended_unknown'))];
  const buttons = rec.items
    .map((item) => {
      const url = safeUrl(item.url);
      if (!url) return null;
      const emu = isEmulated(item, p);
      // Same black button (with its water layer) as every other primary action.
      return h(
        'a',
        { className: 'btn rec', href: url },
        h('span', { className: 'btn__water', 'aria-hidden': 'true' }),
        h(
          'span',
          { className: 'btn__label rec__body' },
          h('span', { className: 'rec__cta' }, L('dljs.download')),
          h('span', { className: 'rec__label' }, label(item)),
          h('span', { className: 'rec__meta mono' }, `${item.name} · ${formatBytes(item.size)}`, emu ? [' · ', L('download.label_emulated')] : []),
        ),
      );
    })
    .filter(Boolean);
  const out = [h('p', { className: 'dl__k dl__k--accent' }, L('download.recommended')), h('div', { className: 'rec__row' }, buttons)];
  if (rec.reason === 'mac-unknown') out.push(h('p', { className: 'dl__note' }, L('download.recommended_mac_unknown')));
  if (rec.items.some((it) => isEmulated(it, p))) out.push(h('p', { className: 'dl__note' }, L('download.emulation_note')));
  return out;
}

function formatDate(iso, lang) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

function setDate(el, iso) {
  if (!el || !iso) return;
  el.setAttribute('datetime', iso);
  el.replaceChildren(h('span', { 'data-l': 'zh', lang: 'zh-CN' }, formatDate(iso, 'zh-CN')), h('span', { 'data-l': 'en', lang: 'en' }, formatDate(iso, 'en')));
}

function showFallback(statusEl, releasesUrl) {
  if (!statusEl) return;
  const url = safeUrl(releasesUrl);
  statusEl.replaceChildren(
    h('p', { className: 'dl__k dl__k--accent' }, L('download.fallback_title')),
    h('p', null, L('download.fallback_body')),
    url
      ? h('p', null, h('a', { className: 'chev', href: url, rel: 'noopener noreferrer', target: '_blank' }, h('span', { className: 'chev__t' }, L('download.releases_page')), h('span', { className: 'vh' }, L('common.opens_new'))))
      : null,
  );
  statusEl.hidden = false;
}

async function runLive() {
  const api = live.getAttribute('data-api');
  const releasesUrl = live.getAttribute('data-releases');
  const recEl = live.querySelector('[data-dl-rec]');
  const filesEl = live.querySelector('[data-dl-files]');
  const statusEl = live.querySelector('[data-dl-status]');
  const p = await platform();

  let model = null;
  try {
    model = normaliseRelease(await fetchRelease(api));
    if (!model.items.length) throw new Error('no assets');
  } catch {
    showFallback(statusEl, releasesUrl);
    model = snapshot ? normaliseRelease(snapshot) : null;
    if (!model) return;
  }

  const rec = recommend(model.items, p);
  for (const item of model.items) item.recommended = rec.items.includes(item);
  recEl.replaceChildren(...renderRecommendation(rec, p));
  filesEl.replaceChildren(...renderFiles(model, p));

  const tag = live.querySelector('[data-dl-tag]');
  if (tag && model.tag) tag.textContent = model.tag;
  setDate(live.querySelector('[data-dl-date]'), model.publishedAt);
  const sums = live.querySelector('[data-dl-sums]');
  if (sums && model.checksums && safeUrl(model.checksums.url)) sums.href = model.checksums.url;
}

async function runCompact() {
  const api = compact.getAttribute('data-api');
  const primary = compact.querySelector('[data-dl-primary]');
  const metaEl = compact.querySelector('[data-dl-meta]');
  const p = await platform();
  let model = null;
  try {
    model = normaliseRelease(await fetchRelease(api));
    if (!model.items.length) throw new Error('no assets');
  } catch {
    model = snapshot ? normaliseRelease(snapshot) : null;
  }
  if (!model) return;
  const rec = recommend(model.items, p);
  // Link straight to the file only when there is exactly one clear choice;
  // otherwise the button keeps pointing at the full download page.
  if (rec.items.length === 1 && rec.reason === 'exact' && primary) {
    const item = rec.items[0];
    const url = safeUrl(item.url);
    if (!url) return;
    primary.href = url;
    if (metaEl) metaEl.replaceChildren(label(item), ' ', h('span', { className: 'mono' }, `· ${model.tag} · ${formatBytes(item.size)}`));
  } else if (metaEl && model.tag) {
    metaEl.replaceChildren(L('download.latest'), ' ', h('span', { className: 'mono' }, model.tag));
  }
}

// Any failure leaves the static, build-time links in place.
if (live) runLive().catch(() => {});
if (compact) runCompact().catch(() => {});
