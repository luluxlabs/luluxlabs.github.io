import { t } from '../lib/i18n.mjs';
import { screenshot, device, chevronLink, productHero, localnav, steps, btn, ext, newWin, icons, zhShotNote, FLOWLIGHT } from '../lib/components.mjs';
import { agents, links } from '../data/agents.mjs';
import { staticRelease } from '../lib/release-static.mjs';
import { dlData } from './download.mjs';

export const meta = { path: 'eta/', metaKey: 'eta', og: 'eta', section: 'eta' };

const agent = agents.find((a) => a.id === 'eta');

/** Agents shown in the group-chat row (original avatar files from the LULUX ETA repo). */
const GROUP = [
  ['brand/lulux.png', 'LULUX'],
  ['avatars/eta/claude.png', 'Claude Code'],
  ['avatars/eta/codex.png', 'Codex'],
  ['avatars/eta/grok.png', 'Grok'],
  ['avatars/eta/pi.png', 'Pi'],
];

export function render(ctx) {
  const b = ctx.base;
  const rel = staticRelease();
  const nav = localnav(ctx, {
    nameKey: 'agents.eta.name',
    items: [
      ['#overview', 'eta.localnav_overview'],
      ['#features', 'eta.localnav_features'],
      ['#modes', 'eta.localnav_modes'],
    ],
    cta: ['#download', 'eta.localnav_download'],
  });

  const features = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
    .map((p) => `<li class="feature rv"><h3 class="feature__title">${t(`eta.${p}_title`)}</h3><p class="feature__body">${t(`eta.${p}_body`)}</p></li>`)
    .join('');

  const mode = (m) => `<article class="mode mode--${m} rv">
<p class="mode__kicker">${t(`eta.mode_${m}_kicker`)}</p>
<h3 class="mode__title">${t(`eta.mode_${m}_title`)}</h3>
<p class="mode__lede">${t(`eta.mode_${m}_lede`)}</p>
<ul class="mode__list">${[1, 2, 3, 4].map((i) => `<li>${t(`eta.mode_${m}_${i}`)}</li>`).join('')}</ul>
</article>`;

  const dataItems = ['data1', 'data2', 'data3', 'data4']
    .map((d) => `<li class="fact rv"><h3 class="fact__title">${t(`eta.${d}_title`)}</h3><p class="fact__body">${t(`eta.${d}_body`)}</p></li>`)
    .join('');

  const body = `
${productHero(ctx, {
    eyebrow: t('eta.hero_eyebrow'),
    titleKey: 'eta.hero_title',
    ledeKey: 'eta.hero_lede',
    actions: `${btn('#download', t('common.download_free'))}${chevronLink(agent.repo, 'common.view_github', { external: true })}`,
  })}

<section class="showcase band band--white" id="overview" aria-labelledby="showcase-title">
<div class="wrap section-head section-head--center">
<p class="kicker">${t('eta.showcase_kicker')}</p>
<h2 class="display display--xl" id="showcase-title">${t('eta.showcase_title', { lines: true })}</h2>
<p class="lede">${t('eta.showcase_body')}</p>
</div>
<div class="wrap wrap--wide showcase__stage rv">${device(screenshot(ctx, 'eta/agent-chat', 'eta.showcase_alt'), 'device--hero')}${zhShotNote()}</div>
</section>

<section class="statement band" aria-labelledby="statement-kicker">
<div class="wrap wrap--narrow">
<p class="kicker" id="statement-kicker">${t('eta.statement_kicker')}</p>
<p class="statement__text rv">${t('eta.statement')}</p>
</div>
</section>

<section class="walk band band--white" id="features" aria-labelledby="steps-title">
<div class="wrap">
<header class="section-head">
<p class="kicker">${t('eta.steps_kicker')}</p>
<h2 class="display display--xl" id="steps-title">${t('eta.steps_title', { lines: true })}</h2>
</header>
${steps(ctx, {
    id: 'eta-steps',
    items: [
      { titleKey: 'eta.step1_title', bodyKey: 'eta.step1_body', shot: 'eta/workbench', altKey: 'eta.step1_alt' },
      { titleKey: 'eta.step2_title', bodyKey: 'eta.step2_body', shot: 'eta/customers', altKey: 'eta.step2_alt' },
      { titleKey: 'eta.step3_title', bodyKey: 'eta.step3_body', shot: 'eta/quote', altKey: 'eta.step3_alt' },
      { titleKey: 'eta.step4_title', bodyKey: 'eta.step4_body', shot: 'eta/group-chat', altKey: 'eta.step4_alt' },
      { titleKey: 'eta.step5_title', bodyKey: 'eta.step5_body', shot: 'eta/workflow', altKey: 'eta.step5_alt' },
    ],
  })}
<p class="fineprint">${t('common.screenshot_note')}</p>
${zhShotNote()}
</div>
</section>

<section class="features band" aria-labelledby="features-title">
<div class="wrap">
<header class="section-head section-head--split">
<div><p class="kicker">${t('eta.pillars_kicker')}</p>
<h2 class="display display--xl" id="features-title">${t('eta.pillars_title', { lines: true })}</h2></div>
<figure class="avatars rv">
<ul class="avatars__row">${GROUP.map(([src, name]) => `<li><img src="${b}assets/img/${src}" alt="${name}" width="56" height="56" loading="lazy"></li>`).join('')}</ul>
<figcaption>${t('eta.avatars_caption')}</figcaption>
</figure>
</header>
<ul class="features__grid">${features}</ul>
</div>
</section>

<section class="modes band band--white" id="modes" aria-labelledby="modes-title">
<div class="wrap">
<header class="section-head section-head--center">
<p class="kicker">${t('eta.modes_kicker')}</p>
<h2 class="display display--xl" id="modes-title">${t('eta.modes_title', { lines: true })}</h2>
<p class="lede">${t('eta.modes_lede')}</p>
</header>
<div class="modes__grid">${mode('desktop')}${mode('cloud')}</div>
<p class="modes__more">${chevronLink(links.etaServerGuide, 'eta.modes_server_guide', { external: true })}</p>
</div>
</section>

<section class="facts band" id="data" aria-labelledby="data-title">
<div class="wrap facts__grid">
<header class="section-head">
<p class="kicker">${t('eta.data_kicker')}</p>
<h2 class="display display--lg" id="data-title">${t('eta.data_title', { lines: true })}</h2>
</header>
<ul class="facts__list">${dataItems}</ul>
</div>
</section>

<section class="cta" id="download" aria-labelledby="dl-title">
<div class="wrap cta__inner">
<p class="kicker">${t('eta.download_kicker')}</p>
<h2 class="display display--xl" id="dl-title">${t('eta.download_title')}</h2>
<p class="lede">${t('eta.download_body')}</p>
<div class="dl-compact" id="dl-compact" data-api="${links.etaApi}">
<div class="actions actions--center">
${btn(`${b}download/`, t('common.download_free'), { cls: 'btn--lg', attrs: 'data-dl-primary' })}
${chevronLink(`${b}download/`, 'eta.download_all')}
</div>
<p class="dl-compact__meta" data-dl-meta>${rel.tag ? `<span>${t('download.latest')}</span> <span class="mono">${rel.tag}</span>` : ''}</p>
</div>
<p class="fineprint">${t('download.requirements')}</p>
</div>
${FLOWLIGHT}
</section>

<section class="notes band band--white" aria-labelledby="license-title">
<div class="wrap notes__grid">
<div class="note rv">
<h2 class="note__title" id="license-title">${t('eta.license_title')}</h2>
<p>${t('eta.license_body')}</p>
<p><a class="chev" href="${agent.licenseUrl}" ${ext}><span class="chev__t">LICENSE · ${agent.licenseSpdx}</span>${icons.arrow}${newWin()}</a></p>
</div>
<div class="note rv">
<h2 class="note__title">${t('eta.next_title')}</h2>
<p>${t('eta.next_body')}</p>
</div>
</div>
<div class="wrap"><p class="fineprint">${t('eta.disclaimer')}</p></div>
</section>
${dlData()}`;
  return { ...meta, body, localnav: nav, scripts: ['download.js', 'hero.js'], bodyClass: 'has-lnav has-white-hero' };
}
