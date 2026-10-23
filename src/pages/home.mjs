import { t } from '../lib/i18n.mjs';
import { hero, btn, ext, newWin, icons, PROJECTS_PATH } from '../lib/components.mjs';
import { agents } from '../data/agents.mjs';

export const meta = { path: '', metaKey: 'home', og: 'home', section: 'home' };

/**
 * The single way into the projects from the home page: the logos of every
 * agent in the registry (not links) and one button to the hub.
 */
function entry(ctx) {
  const logos = agents
    .map((a) => `<li class="entry__item"><img src="${ctx.base}assets/img/${a.logo}" alt="" width="64" height="64" loading="lazy"><span>${t(`agents.${a.id}.name`)}</span></li>`)
    .join('');
  return `<div class="entry rv">
<p class="kicker">${t('home.agents_kicker')}</p>
<h2 class="display display--xl" id="agents-title">${t('home.agents_title', { lines: true })}</h2>
<p class="lede">${t('home.agents_body')}</p>
<ul class="entry__list">${logos}<li class="entry__item entry__item--next"><span class="entry__x" aria-hidden="true">X</span><span>${t('home.agents_next')}</span></li></ul>
<div class="actions actions--center">${btn(`${ctx.base}${PROJECTS_PATH}`, t('home.agents_cta'))}</div>
</div>`;
}

function sourceRow(a) {
  const k = `agents.${a.id}`;
  return `<article class="repo rv">
<div class="repo__head">
<p class="repo__kind">${t(`${k}.license_kind`)}</p>
<h3 class="repo__name"><a href="${a.repo}" ${ext}>${a.repoSlug}${newWin()}</a></h3>
<p class="repo__desc">${t(`${k}.repo_desc`)}</p>
</div>
<dl class="repo__meta">
<div><dt>${t('common.license')}</dt><dd><a href="${a.licenseUrl}" ${ext}>${t(`${k}.license_name`)}${newWin()}</a> <span class="spdx">${a.licenseSpdx}</span></dd></div>
<div class="repo__stars" data-stars="${a.repoSlug}" hidden><dt>${t('home.source_live_stars')}</dt><dd><span data-stars-count></span></dd></div>
</dl>
<p class="repo__summary">${t(`${k}.license_summary`)}</p>
<div class="repo__cta">${btn(a.repo, `${icons.github}<span>${t('common.view_github')}</span><span class="vh"> ${a.repoSlug}</span>`, { external: true })}</div>
</article>`;
}

export function render(ctx) {
  const body = `
${hero(ctx, {
    artId: 'hero',
    titleKey: 'home.hero_title',
    ledeKey: 'home.hero_lede',
    actions: btn(`${ctx.base}${PROJECTS_PATH}`, t('home.hero_cta'), { cls: 'btn--inverse' }),
    cls: 'hero--home',
  })}

<section class="name band band--white" id="name" aria-labelledby="name-title">
<div class="wrap">
<h2 class="kicker" id="name-title">${t('home.name_kicker')}</h2>
<div class="name__word" aria-hidden="true"><span class="name__lulu">LULU</span><span class="name__x">X</span></div>
<dl class="name__def">
<div class="name__item rv"><dt>LULU</dt><dd>${t('home.name_lulu')}</dd></div>
<div class="name__item rv"><dt>X</dt><dd>${t('home.name_x')}</dd></div>
</dl>
<p class="name__line rv">${t('home.name_line')}</p>
</div>
</section>

<section class="manifesto band" id="manifesto" aria-labelledby="manifesto-title">
<div class="wrap wrap--narrow">
<p class="kicker">${t('home.manifesto_kicker')}</p>
<h2 class="display display--xl" id="manifesto-title">${t('home.manifesto_title', { lines: true })}</h2>
<ul class="manifesto__lines">
<li class="rv">${t('home.manifesto_1')}</li>
<li class="rv">${t('home.manifesto_2')}</li>
<li class="rv">${t('home.manifesto_3')}</li>
</ul>
</div>
</section>

<section class="agents band band--white" id="agents" aria-labelledby="agents-title">
<div class="wrap">
${entry(ctx)}
</div>
</section>

<section class="source band" id="source" aria-labelledby="source-title">
<div class="wrap">
<header class="section-head">
<p class="kicker">${t('home.source_kicker')}</p>
<h2 class="display display--xl" id="source-title">${t('home.source_title', { lines: true })}</h2>
<p class="lede">${t('home.source_lede')}</p>
</header>
<div class="source__list">${agents.map(sourceRow).join('\n')}</div>
</div>
</section>`;
  return { ...meta, body, bodyClass: 'has-dark-hero' };
}
