import { t, tAttr } from '../lib/i18n.mjs';
import { btn, chevronLink, icons, PROJECTS_PATH } from '../lib/components.mjs';
import { agents, links } from '../data/agents.mjs';

export const meta = { path: 'about/', metaKey: 'about', og: 'about', section: 'about' };

/** Avatar at 128/256/512 px (WebP with PNG fallback, transparent background). */
function avatar(ctx) {
  const set = (e) => [128, 256, 512].map((w) => `${ctx.base}assets/img/about/koko-${w}.${e} ${w}w`).join(', ');
  const sizes = '(min-width: 760px) 176px, 128px';
  return `<picture class="about__avatar">
<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
<img src="${ctx.base}assets/img/about/koko-256.png" srcset="${set('png')}" sizes="${sizes}" ${tAttr('alt', 'about.avatar_alt')} width="256" height="256" fetchpriority="high" decoding="async">
</picture>`;
}

function project(ctx, a) {
  const k = `agents.${a.id}`;
  return `<li class="mini rv">
<a class="mini__link" href="${ctx.base}${a.path}">
<span class="mini__kind">${t(`${k}.kind`)}</span>
<span class="mini__name">${t(`${k}.name`)}</span>
<span class="mini__text">${t(`${k}.card_body`)}</span>
<span class="mini__more">${t('common.learn_more')}${icons.arrow}</span>
</a>
</li>`;
}

export function render(ctx) {
  const body = `
<section class="about band" id="top" aria-labelledby="about-title">
<div class="wrap wrap--narrow about__intro">
${avatar(ctx)}
<h1 class="display display--xl about__name" id="about-title">koko</h1>
<p class="about__bio">${t('about.bio')}</p>
<div class="actions actions--center">
${btn(links.github, `${icons.github}<span>GitHub · koko2376</span>`, { external: true })}
${btn(links.x, `${icons.x}<span>X · @koko2376</span>`, { external: true })}
${btn(links.org, `${icons.github}<span>GitHub · luluxlabs</span>`, { external: true })}
</div>
</div>
</section>

<section class="belief band band--white" aria-labelledby="belief-title">
<div class="wrap wrap--narrow">
<h2 class="kicker" id="belief-title">${t('about.belief_kicker')}</h2>
<div class="name__word name__word--sm" aria-hidden="true"><span class="name__lulu">LULU</span><span class="name__x">X</span></div>
<dl class="name__def">
<div class="name__item rv"><dt>LULU</dt><dd>${t('home.name_lulu')}</dd></div>
<div class="name__item rv"><dt>X</dt><dd>${t('home.name_x')}</dd></div>
</dl>
<p class="belief__text rv">${t('about.belief_body')}</p>
<blockquote class="belief__quote rv"><p>${t('about.core_line')}</p></blockquote>
</div>
</section>

<section class="projects band" aria-labelledby="projects-title">
<div class="wrap">
<header class="section-head">
<p class="kicker">${t('about.projects_kicker')}</p>
<h2 class="display display--lg" id="projects-title">${t('about.projects_title')}</h2>
</header>
<ul class="mini__grid">${agents.map((a) => project(ctx, a)).join('')}</ul>
<p class="projects__more">${chevronLink(`${ctx.base}${PROJECTS_PATH}`, 'about.all_projects')}${chevronLink(`${ctx.base}#source`, 'about.source_link')}</p>
</div>
</section>`;
  return { ...meta, body };
}
