/**
 * Shared page components. All URLs are built from `ctx.base`, which is a
 * relative prefix ('./' at the root, '../' one level down) so the site works
 * from any host path, except the 404 page which uses '/' (GitHub Pages serves
 * it for arbitrary paths).
 */
import { t, tAttr, pair, escapeHtml, raw, inline } from './i18n.mjs';
import { agents, links } from '../data/agents.mjs';
import { ART, ART_WIDTHS } from './art.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const KOKO_EYES = JSON.parse(readFileSync(fileURLToPath(new URL('../data/koko-eyes.json', import.meta.url)), 'utf8'));

export const SITE_URL = (process.env.SITE_URL || 'https://luluxlabs.github.io').replace(/\/$/, '');

export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://api.github.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "manifest-src 'self'",
  "media-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

/** External link attributes. */
export const ext = 'rel="noopener noreferrer" target="_blank"';

/** Visually hidden "(opens in a new window)" suffix for external links. */
export const newWin = () => `<span class="vh">${t('common.opens_new')}</span>`;

/**
 * A painting as <picture> with AVIF/WebP/JPEG at every configured width.
 * Decorative: the paintings carry no information, so alt="" and aria-hidden.
 * @param {object} ctx
 * @param {string} id   key in src/data/art.json
 */
export function art(ctx, id, { eager = false, sizes = '100vw', cls = '' } = {}) {
  const item = ART[id];
  if (!item) throw new Error(`art: unknown painting "${id}"`);
  const [rw, rh] = item.ratio || [16, 9];
  const set = (e) => ART_WIDTHS.map((w) => `${ctx.base}assets/img/art/${id}-${w}.${e} ${w}w`).join(', ');
  const w = 1376;
  const h = Math.round((w * rh) / rw);
  return `<picture class="art art--${id} ${cls}" aria-hidden="true">
<source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
<img class="art__img" src="${ctx.base}assets/img/art/${id}-1376.jpg" srcset="${set('jpg')}" sizes="${sizes}" alt="" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
</picture>`;
}

/**
 * A product screenshot, optionally language-specific.
 * `shot` is 'eta/agent-chat' or { zh: 'flow/ui-canvas-zh', en: 'flow/ui-canvas' }.
 * Hidden-language images are display:none and lazy, so browsers never fetch them.
 */
export function screenshot(ctx, shot, altKey, { sizes = '(min-width: 1180px) 1080px, 92vw', eager = false } = {}) {
  const pic = (path, lang) => {
    const [dir] = path.split('/');
    const { w, h, large } = SHOT_META[dir];
    const big = `${ctx.base}assets/img/shots/${path}-${large}`;
    const small = `${ctx.base}assets/img/shots/${path}-960`;
    const altAttr = lang ? `alt="${escapeHtml(pair(altKey)[lang])}"` : tAttr('alt', altKey);
    return `<picture>
<source type="image/webp" srcset="${small}.webp 960w, ${big}.webp ${w}w" sizes="${sizes}">
<img src="${big}.jpg" srcset="${small}.jpg 960w, ${big}.jpg ${w}w" sizes="${sizes}" ${altAttr} width="${w}" height="${h}" ${eager ? '' : 'loading="lazy"'} decoding="async">
</picture>`;
  };
  if (typeof shot === 'string') return pic(shot, null);
  return `<span class="shot-l" data-l="zh">${pic(shot.zh, 'zh')}</span><span class="shot-l" data-l="en">${pic(shot.en, 'en')}</span>`;
}

/** Small caption shown only on the English page under screenshots that exist only in Chinese. */
export function zhShotNote(cls = '') {
  return `<p class="shotnote ${cls}" data-l="en" lang="en">${inline(raw('common.shot_zh_note', 'en'))}</p>`;
}

/** Native sizes of the largest screenshot rendition per product. */
export const SHOT_META = {
  eta: { w: 1440, h: 900, large: '1440' },
  flow: { w: 1600, h: 800, large: 'lg' },
};

/** Screenshot inside a quiet window frame. */
export function device(inner, cls = '') {
  return `<div class="device ${cls}"><div class="device__bar" aria-hidden="true"><i></i><i></i><i></i></div><div class="device__screen">${inner}</div></div>`;
}

const ICON_GITHUB = `<svg class="icon" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`;
const ICON_X = `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
const ICON_MENU = `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 8h18v1.5H3zM3 14.5h18V16H3z"/></svg>`;
const ICON_ARROW = `<svg class="icon icon--arrow" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false"><path fill="currentColor" d="M5.3 2.3 4.2 3.4 8.8 8l-4.6 4.6 1.1 1.1L11 8z"/></svg>`;
export const icons = { github: ICON_GITHUB, x: ICON_X, arrow: ICON_ARROW };

/**
 * Primary button: black, white label, with the water layer that site.css
 * animates on hover and keyboard focus.
 * @param {string} href
 * @param {string} label  already-rendered HTML
 */
export function btn(href, label, { cls = '', external = false, attrs = '' } = {}) {
  return `<a class="btn ${cls}" href="${href}"${external ? ` ${ext}` : ''}${attrs ? ` ${attrs}` : ''}>${WATER}<span class="btn__label">${label}</span>${external ? newWin() : ''}</a>`;
}

/** The water layer inside every primary button (decorative). */
export const WATER = '<span class="btn__water" aria-hidden="true"></span>';

/** Text link with chevron, the house style for secondary actions. */
export function chevronLink(href, labelKey, { external = false, cls = '' } = {}) {
  return `<a class="chev ${cls}" href="${href}"${external ? ` ${ext}` : ''}><span class="chev__t">${t(labelKey)}</span>${ICON_ARROW}${external ? newWin() : ''}</a>`;
}

/**
 * SVG filter used by the button water layer: fractal noise displaces the
 * flowing sheen so its bands bend like water. Declared once per page.
 */
const WATER_DEFS = `<svg class="defs" width="0" height="0" aria-hidden="true" focusable="false"><filter id="lx-water" x="-10%" y="-40%" width="120%" height="180%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.07" numOctaves="2" seed="7" result="noise"><animate attributeName="baseFrequency" dur="7s" values="0.011 0.07;0.014 0.09;0.011 0.07" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`;

/** Path of the projects hub, relative to the site root. */
export const PROJECTS_PATH = 'projects/';

function nav(ctx) {
  const b = ctx.base;
  const cur = (p) => (ctx.section === p ? ' aria-current="page"' : '');
  // One entry for every project: the hub lists them all, so a new agent never
  // crowds the bar. The item is marked as the current section on the hub and
  // on each project's own pages (aria-current only where it is the page).
  const inProjects = ctx.section === 'projects' || agents.some((a) => a.id === ctx.section) || ctx.section === 'download';
  const projAttr = ctx.section === 'projects' ? ' aria-current="page"' : inProjects ? ' class="is-section"' : '';
  const items = [
    `<li><a href="${b}${PROJECTS_PATH}"${projAttr}>${t('nav.projects')}</a></li>`,
    `<li><a href="${b}#source">${t('nav.source')}</a></li>`,
    `<li><a href="${b}about/"${cur('about')}>${t('nav.about')}</a></li>`,
  ].join('');
  return `<a class="skip" href="#main">${t('nav.skip')}</a>
<header class="gnav" id="gnav">
<nav class="gnav__inner" ${tAttr('aria-label', 'nav.primary')}>
<a class="gnav__brand" href="${b}" ${tAttr('aria-label', 'nav.home')}><img src="${b}assets/img/brand/lulux.png" alt="" width="24" height="24"><span class="gnav__word" aria-hidden="true">LULUX</span></a>
<ul class="gnav__links">${items}</ul>
<div class="gnav__tools">
<button class="gnav__lang" id="lang-toggle" type="button" ${tAttr('aria-label', 'nav.lang_label')}>${t('nav.lang_button')}</button>
<a class="gnav__icon" href="${links.github}" ${ext} ${tAttr('aria-label', 'nav.github')}>${ICON_GITHUB}</a>
<details class="gnav__menu">
<summary ${tAttr('aria-label', 'nav.menu')}>${ICON_MENU}</summary>
<ul class="gnav__sheet">${items}</ul>
</details>
</div>
</nav>
</header>`;
}

function footer(ctx) {
  const b = ctx.base;
  return `<footer class="footer">
<div class="wrap footer__top">
<a class="footer__logo" href="${b}" ${tAttr('aria-label', 'nav.home')}><img src="${b}assets/img/brand/lulux.png" alt="" width="36" height="36" loading="lazy"><span aria-hidden="true">LULUX</span></a>
<p class="footer__tag">${t('footer.tagline')}</p>
</div>
<div class="wrap footer__grid">
<div>
<h2 class="footer__h">${t('footer.col_products')}</h2>
<ul class="footer__list"><li><a href="${b}${PROJECTS_PATH}">${t('footer.all_projects')}</a></li>${agents.map((a) => `<li><a href="${b}${a.path}">${t(`agents.${a.id}.name`)}</a></li>`).join('')}<li><a href="${b}download/">${t('footer.download_eta')}</a></li></ul>
</div>
<div>
<h2 class="footer__h">${t('footer.col_resources')}</h2>
<ul class="footer__list">
<li><a href="${links.etaReleases}" ${ext}>${t('footer.releases')}${newWin()}</a></li>
<li><a href="${links.etaInstallGuide}" ${ext}>${t('footer.install_guide')}${newWin()}</a></li>
<li><a href="${links.flowReadme}" ${ext}>${t('footer.flow_readme')}${newWin()}</a></li>
<li><a href="${links.siteRepo}" ${ext}>${t('footer.site_source')}${newWin()}</a></li>
</ul>
</div>
<div>
<h2 class="footer__h">${t('footer.col_follow')}</h2>
<ul class="footer__list">
<li><a href="${b}about/">${t('footer.about')}</a></li>
<li><a href="${links.github}" ${ext}>${ICON_GITHUB}<span>GitHub · koko2376</span>${newWin()}</a></li>
<li><a href="${links.x}" ${ext}>${ICON_X}<span>X · @koko2376</span>${newWin()}</a></li>
<li><a href="${links.org}" ${ext}>${ICON_GITHUB}<span>GitHub · luluxlabs</span>${newWin()}</a></li>
</ul>
</div>
</div>
<div class="wrap footer__legal">
<p>${t('footer.art_credit')}</p>
<p>${t('footer.font_credit')}</p>
<p>${t('footer.license_note')}</p>
<p>${t('footer.trademark')}</p>
<p class="footer__copy">${t('footer.copyright')}</p>
</div>
</footer>`;
}

/**
 * The full HTML document.
 * @param {object} ctx { base, path, section, metaKey, og, body, scripts?, bodyClass?, noindex?, localnav? }
 */
export function layout(ctx) {
  const b = ctx.base;
  const title = pair(`meta.${ctx.metaKey}_title`);
  const desc = pair(`meta.${ctx.metaKey}_description`);
  const url = `${SITE_URL}/${ctx.path}`;
  const ogImage = `${SITE_URL}/assets/og/${ctx.og}.jpg`;
  const scripts = (ctx.scripts || []).map((s) => `<script type="module" src="${b}assets/js/${s}"></script>`).join('\n');
  return `<!doctype html>
<html lang="zh-CN" data-title-zh="${escapeHtml(title.zh)}" data-title-en="${escapeHtml(title.en)}" data-desc-zh="${escapeHtml(desc.zh)}" data-desc-en="${escapeHtml(desc.en)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${escapeHtml(title.zh)}</title>
<meta name="description" content="${escapeHtml(desc.zh)}">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#faf8f3">
${ctx.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<link rel="icon" href="${b}favicon.ico" sizes="any">
<link rel="icon" href="${b}assets/img/brand/lulux.png" type="image/png" sizes="256x256">
<link rel="apple-touch-icon" href="${b}assets/img/brand/lulux-1024.png">
<link rel="preload" href="${b}assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${b}assets/css/site.css">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LULUX">
<meta property="og:title" content="${escapeHtml(title.zh)}">
<meta property="og:description" content="${escapeHtml(desc.zh)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(title.zh)}">
<meta property="og:locale" content="zh_CN">
<meta property="og:locale:alternate" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@koko2376">
<meta name="twitter:title" content="${escapeHtml(title.en)}">
<meta name="twitter:description" content="${escapeHtml(desc.en)}">
<meta name="twitter:image" content="${ogImage}">
<script src="${b}assets/js/boot.js"></script>
<script src="${b}assets/js/site.js" defer></script>
${scripts}
</head>
<body class="${ctx.bodyClass || ''}">
${WATER_DEFS}
${nav(ctx)}
${ctx.localnav || ''}
<main id="main" tabindex="-1">
${ctx.body}
</main>
${footer(ctx)}
</body>
</html>
`;
}

/** Product sub-navigation pinned under the global nav. */
export function localnav(ctx, { nameKey, items, cta }) {
  return `<nav class="lnav" ${tAttr('aria-label', nameKey)}>
<div class="lnav__inner">
<a class="lnav__name" href="#top">${t(nameKey)}</a>
<ul class="lnav__links">${items.map(([href, key]) => `<li><a href="${href}">${t(key)}</a></li>`).join('')}</ul>
${btn(cta[0], t(cta[1]), { cls: 'btn--sm' })}
</div>
</nav>`;
}

/**
 * Painting hero. The painting fills the section; the headline sits on the
 * empty side (the subject's side comes from art.json). On narrow screens the
 * headline comes first and the painting sits beneath it, fading in from the
 * page colour so no hard edge ever meets the text.
 */
export function hero(ctx, { artId, eyebrow = '', titleKey, ledeKey, actions = '', note = '', id = 'top', cls = '', h1 = true }) {
  const item = ART[artId] || {};
  const side = item.side || 'right';
  const tone = item.tone === 'dark' ? 'dark' : 'light';
  const tag = h1 ? 'h1' : 'h2';
  // The painting is cropped by object-fit: cover, so on narrow screens (where the
  // box is taller than the painting's ratio) it is displayed much wider than the viewport.
  const [rw, rh] = item.ratio || [16, 9];
  const mobileVw = Math.ceil((rw / rh) * 100);
  return `<section class="hero hero--${tone} hero--subject-${side} ${cls}" id="${id}">
<div class="hero__art">${art(ctx, artId, { eager: true, sizes: `(max-width: 760px) ${mobileVw}vw, 140vw` })}</div>
<div class="hero__content wrap">
${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
<${tag} class="display display--hero">${t(titleKey, { lines: true })}</${tag}>
${ledeKey ? `<p class="hero__lede">${t(ledeKey)}</p>` : ''}
${actions ? `<div class="actions">${actions}</div>` : ''}
${note}
</div>
</section>`;
}

/**
 * koko, the LULUX avatar, in two layers: the eyeless body (a picture) and the
 * K and O as vector "eyes" on top, which assets/js/hero.js moves toward the
 * pointer. Without JavaScript, or with reduced motion, the eyes stay centred,
 * so the avatar looks exactly like the original. Decorative.
 */
export function koko(ctx, { sizes = '(min-width: 1025px) 36vw, (min-width: 761px) 40vw, 62vw', eager = true } = {}) {
  const b = `${ctx.base}assets/img/koko/body-`;
  return `<div class="koko" data-koko aria-hidden="true">
<picture class="koko__body">
<source type="image/webp" srcset="${b}320.webp 320w, ${b}640.webp 640w, ${b}1024.webp 1024w" sizes="${sizes}">
<img src="${b}480.png" alt="" width="480" height="480" decoding="async"${eager ? ' fetchpriority="high"' : ' loading="lazy"'}>
</picture>
<svg class="koko__eyes" viewBox="${KOKO_EYES.viewBox.join(' ')}" focusable="false"><g class="koko__ko" fill="${KOKO_EYES.fill}"><path d="${KOKO_EYES.paths.k}"/><path d="${KOKO_EYES.paths.o}"/></g></svg>
</div>`;
}

/**
 * Flowing light: mist-blue, pale-blue and white bands drifting sideways along
 * the bottom of a section. assets/js/hero.js draws them on the canvas; the
 * CSS gradient underneath is the still version shown without JavaScript.
 */
export const FLOWLIGHT = '<div class="flowlight" aria-hidden="true"><canvas class="flowlight__c"></canvas></div>';

/**
 * Product hero: pure white, headline and actions on the left, koko on the
 * right (above the headline on narrow screens), flowing light along the
 * bottom. Without `avatar` it is a shorter page head (download page, hub).
 */
export function productHero(ctx, { eyebrow = '', titleKey, ledeKey, actions = '', note = '', id = 'top', cls = '', avatar = true }) {
  return `<section class="phero${avatar ? ' phero--koko' : ' phero--plain'} ${cls}" id="${id}">
<div class="phero__inner wrap">
${avatar ? `<div class="phero__koko">${koko(ctx)}</div>` : ''}
<div class="phero__copy">
${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
<h1 class="display display--hero phero__title">${t(titleKey, { lines: true })}</h1>
${ledeKey ? `<p class="hero__lede">${t(ledeKey)}</p>` : ''}
${actions ? `<div class="actions">${actions}</div>` : ''}
${note}
</div>
</div>
${FLOWLIGHT}
</section>`;
}

/**
 * Sticky product walkthrough. On wide screens with JavaScript, the frame on
 * the right stays pinned while the steps scroll past and site.js crossfades
 * to the matching screenshot. Without JavaScript, or on narrow screens, each
 * step simply shows its own screenshot inline.
 */
export function steps(ctx, { id, items }) {
  const num = (i) => String(i + 1).padStart(2, '0');
  const stepHtml = items
    .map(
      (s, i) => `<li class="step" data-step="${i}">
<span class="step__num" aria-hidden="true">${num(i)}</span>
<h3 class="step__title">${t(s.titleKey)}</h3>
<p class="step__body">${t(s.bodyKey)}</p>
<div class="step__media">${device(screenshot(ctx, s.shot, s.altKey, { sizes: '92vw' }), 'device--inline')}</div>
</li>`,
    )
    .join('\n');
  const stage = items
    .map(
      (s, i) =>
        `<div class="stage__slide${i === 0 ? ' is-active' : ''}" data-slide="${i}">${screenshot(ctx, s.shot, s.altKey, { sizes: '(min-width: 1024px) 60vw, 1px' })}</div>`,
    )
    .join('');
  return `<div class="steps" id="${id}" data-steps>
<ol class="steps__list">${stepHtml}</ol>
<div class="steps__stage"><div class="device device--stage"><div class="device__bar" aria-hidden="true"><i></i><i></i><i></i></div><div class="device__screen stage">${stage}</div></div></div>
</div>`;
}

/** Code block with a copy button (button hidden when JavaScript is off). */
export function command(cmd, labelKey, id) {
  return `<div class="cmd">
<p class="cmd__label" id="${id}-label">${t(labelKey)}</p>
<div class="cmd__row">
<pre class="cmd__pre" tabindex="0" role="group" ${tAttr('aria-label', labelKey)}><code id="${id}"><span class="cmd__prompt" aria-hidden="true">$ </span>${escapeHtml(cmd)}</code></pre>
<button class="btn btn--sm cmd__copy" type="button" aria-describedby="${id}-label" data-copy="${escapeHtml(cmd)}" data-copied-zh="${escapeHtml(pair('common.copied').zh)}" data-copied-en="${escapeHtml(pair('common.copied').en)}" data-failed-zh="${escapeHtml(pair('common.copy_failed').zh)}" data-failed-en="${escapeHtml(pair('common.copy_failed').en)}">${WATER}<span class="btn__label">${t('common.copy')}</span></button>
</div>
<p class="cmd__status vh" aria-live="polite"></p>
</div>`;
}
