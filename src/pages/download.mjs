import { t, tAttr, pair, escapeHtml } from '../lib/i18n.mjs';
import { productHero, chevronLink } from '../lib/components.mjs';
import { links } from '../data/agents.mjs';
import { staticRelease, staticPayload } from '../lib/release-static.mjs';
import { groupItems, formatBytes } from '../static/assets/js/release.mjs';

export const meta = { path: 'download/', metaKey: 'download', og: 'download', section: 'download' };

/** Strings the live download script needs, in both languages. */
const JS_KEYS = [
  'download.recommended',
  'download.recommended_mac_unknown',
  'download.recommended_mobile',
  'download.recommended_unknown',
  'download.latest',
  'download.fallback_title',
  'download.fallback_body',
  'download.releases_page',
  'download.group_windows',
  'download.group_mac',
  'download.group_linux',
  'download.group_server',
  'download.group_other',
  'download.label_win_x64',
  'download.label_win_arm64',
  'download.label_mac_arm64_dmg',
  'download.label_mac_x64_dmg',
  'download.label_mac_arm64_zip',
  'download.label_mac_x64_zip',
  'download.label_mac_universal_dmg',
  'download.label_mac_universal_zip',
  'download.label_linux_x64',
  'download.label_linux_arm64',
  'download.label_server',
  'download.label_checksums',
  'download.label_emulated',
  'download.emulation_note',
  'common.opens_new',
  'dljs.download',
];

export function jsStrings() {
  const out = { zh: {}, en: {} };
  for (const k of JS_KEYS) {
    const p = pair(k);
    out.zh[k] = p.zh;
    out.en[k] = p.en;
  }
  return out;
}

const json = (v) => JSON.stringify(v).replaceAll('<', '\\u003c');

/** Data blocks read by assets/js/download.js (inert JSON, allowed by the CSP). */
export function dlData() {
  return `<script type="application/json" id="dl-strings">${json(jsStrings())}</script>
<script type="application/json" id="dl-snapshot">${json(staticPayload())}</script>`;
}

/** One row in the "all files" table (shared with the static fallback). */
function row(item) {
  const label = item.labelKey ? t(`download.${item.labelKey}`) : escapeHtml(item.name);
  return `<li class="file">
<a class="file__link" href="${escapeHtml(item.url)}"><span class="file__label">${label}</span><span class="file__name mono">${escapeHtml(item.name)}</span></a>
<span class="file__size mono">${formatBytes(item.size)}</span>
</li>`;
}

export function fileList(release) {
  return groupItems(release.items)
    .map(
      (g) => `<div class="files__group"><h3 class="files__h">${t(`download.group_${g.group}`)}</h3><ul class="files__list">${g.items.map(row).join('')}</ul></div>`,
    )
    .join('');
}

export function render(ctx) {
  const rel = staticRelease();
  const date = rel.publishedAt ? String(rel.publishedAt).slice(0, 10) : '';
  const sums = rel.checksums;
  const body = `
${productHero(ctx, {
    eyebrow: t('download.hero_eyebrow'),
    titleKey: 'download.hero_title',
    ledeKey: 'download.hero_lede',
    avatar: false,
    note: `<p class="phero__back">${chevronLink(`${ctx.base}eta/`, 'download.about_eta')}</p>`,
  })}

<section class="dl band band--white" aria-labelledby="dl-version" id="dl-live" data-api="${links.etaApi}" data-releases="${links.etaReleases}">
<div class="wrap">
<p class="dl__version" id="dl-version"><span class="dl__k">${t('download.latest')}</span> <span class="mono" data-dl-tag>${escapeHtml(rel.tag)}</span>${date ? ` <span class="dl__k">· ${t('download.released')}</span> <time class="mono" data-dl-date datetime="${escapeHtml(String(rel.publishedAt))}">${date}</time>` : ''}</p>
<div class="dl__rec" data-dl-rec aria-live="polite">
<p class="dl__static">${t('download.static_note')}</p>
</div>
<div class="dl__status" data-dl-status role="status" hidden></div>
<h2 class="dl__h">${t('download.all_title')}</h2>
<div class="files" data-dl-files>${fileList(rel)}</div>
<p class="dl__links">
${sums ? `<a class="chev" href="${escapeHtml(sums.url)}" data-dl-sums><span class="chev__t">${t('download.checksums_link')}</span></a>` : ''}
${chevronLink(links.etaReleases, 'download.releases_page', { external: true })}
</p>
</div>
</section>

<section class="dl-help band" aria-labelledby="unsigned-title">
<div class="wrap">
<header class="section-head">
<h2 class="display display--md" id="unsigned-title">${t('download.unsigned_title')}</h2>
<p class="lede">${t('download.unsigned_body')}</p>
</header>
<div class="help__grid">
<article class="help">
<h3 class="help__h">${t('download.mac_title')}</h3>
<ol class="help__list"><li>${t('download.mac_1')}</li><li>${t('download.mac_2')}</li><li>${t('download.mac_3')}
<pre class="code" tabindex="0" role="group" ${tAttr('aria-label', 'download.code_quarantine')}><code>xattr -dr com.apple.quarantine "/Applications/LULUX ETA.app"</code></pre></li></ol>
</article>
<article class="help">
<h3 class="help__h">${t('download.win_title')}</h3>
<ol class="help__list"><li>${t('download.win_1')}</li><li>${t('download.win_2')}</li></ol>
</article>
<article class="help">
<h3 class="help__h">${t('download.linux_title')}</h3>
<ol class="help__list"><li>${t('download.linux_1')}
<pre class="code" tabindex="0" role="group" ${tAttr('aria-label', 'download.code_appimage')}><code>chmod +x LULUX-ETA-*-linux-*.AppImage
./LULUX-ETA-*-linux-*.AppImage</code></pre></li><li>${t('download.linux_2')}</li></ol>
</article>
</div>
<p>${chevronLink(links.etaInstallGuide, 'download.install_guide', { external: true })}</p>
</div>
</section>

<section class="dl-help band band--white" aria-labelledby="verify-title">
<div class="wrap help__grid help__grid--2">
<article class="help">
<h2 class="help__h help__h--lg" id="verify-title">${t('download.checksums_title')}</h2>
<p>${t('download.checksums_body')}</p>
<pre class="code" tabindex="0" role="group" ${tAttr('aria-label', 'download.code_verify')}><code># Linux
sha256sum -c SHA256SUMS.txt --ignore-missing
# macOS (run in the folder with the .dmg and SHA256SUMS.txt)
f=$(ls LULUX-ETA-*-mac-*.dmg)
awk -v f="$f" '$2 == f || $2 == "*" f' SHA256SUMS.txt | shasum -a 256 -c -
# Windows PowerShell (prints True when the hash matches)
$f = Get-Item .\\LULUX-ETA-*-win-*-setup.exe
(Get-FileHash $f -Algorithm SHA256).Hash -eq ((Select-String -SimpleMatch $f.Name SHA256SUMS.txt).Line -split '\\s+')[0]</code></pre>
</article>
<article class="help">
<h2 class="help__h help__h--lg">${t('download.server_title')}</h2>
<p>${t('download.server_body')}</p>
<pre class="code" tabindex="0" role="group" ${tAttr('aria-label', 'download.code_docker')}><code>docker pull ghcr.io/koko2376/lulux-eta:latest</code></pre>
<p>${chevronLink(links.etaServerGuide, 'download.server_guide', { external: true })}</p>
</article>
</div>
</section>
${dlData()}`;
  return { ...meta, body, scripts: ['download.js', 'hero.js'], bodyClass: 'has-white-hero' };
}

