import { t } from '../lib/i18n.mjs';
import { screenshot, device, chevronLink, productHero, btn, ext, newWin, icons, zhShotNote } from '../lib/components.mjs';
import { agents, links } from '../data/agents.mjs';

/**
 * The projects hub: one card per entry in src/data/agents.mjs, then a card
 * for what comes next. Every link into a project's pages starts here, so a
 * new agent needs only its registry entry and its strings.
 */
export const meta = { path: 'projects/', metaKey: 'projects', og: 'projects', section: 'projects' };

function card(ctx, a) {
  const k = `agents.${a.id}`;
  const b = ctx.base;
  const extra = (a.hubLinks || [])
    .map((l) => chevronLink(/^https:/.test(l.href) ? l.href : `${b}${l.href}`, l.labelKey, { external: /^https:/.test(l.href) }))
    .join('');
  const shotNote = typeof a.card.shot === 'string' ? zhShotNote('shotnote--card') : '';
  return `<article class="proj rv" id="project-${a.id}" aria-labelledby="project-${a.id}-name">
<div class="proj__copy">
<div class="proj__head"><img class="proj__logo" src="${b}assets/img/${a.logo}" alt="" width="56" height="56" loading="lazy"><p class="proj__kind">${t(`${k}.kind`)}</p></div>
<h2 class="proj__name" id="project-${a.id}-name">${t(`${k}.name`)}</h2>
<p class="proj__title">${t(`${k}.card_title`, { lines: true })}</p>
<p class="proj__text">${t(`${k}.card_body`)}</p>
<p class="proj__license"><span class="spdx">${a.licenseSpdx}</span> <span>${t(`${k}.license_kind`)}</span></p>
${a.noteKey ? `<p class="proj__note">${t(a.noteKey)}</p>` : ''}
<div class="actions">
${btn(`${b}${a.path}`, `${t('common.learn_more')}<span class="vh"> — ${t(`${k}.name`)}</span>`)}
${extra}
${chevronLink(a.repo, 'common.view_github', { external: true })}
</div>
</div>
<div class="proj__media"><div class="proj__shot">${device(screenshot(ctx, a.card.shot, a.card.altKey, { sizes: '(min-width: 1024px) 44vw, 86vw' }))}</div></div>
${shotNote}
</article>`;
}

export function render(ctx) {
  const body = `
${productHero(ctx, {
    eyebrow: t('projects.hero_eyebrow'),
    titleKey: 'projects.hero_title',
    ledeKey: 'projects.hero_lede',
    avatar: false,
    cls: 'phero--hub',
  })}

<section class="hub band band--white" id="list" aria-labelledby="hub-title">
<div class="wrap">
<h2 class="vh" id="hub-title">${t('projects.list_title')}</h2>
<div class="hub__list">
${agents.map((a) => card(ctx, a)).join('\n')}
<article class="soon rv" id="project-next" aria-labelledby="soon-title">
<p class="proj__kind">${t('projects.coming_label')}</p>
<h2 class="soon__title" id="soon-title">${t('projects.coming_title', { lines: true })}</h2>
<p class="proj__text">${t('projects.coming_body')}</p>
<div class="actions actions--center">
${btn(links.github, `${icons.github}<span>GitHub</span>`, { external: true })}
<a class="chev" href="${links.x}" ${ext}><span class="chev__t">X · @koko2376</span>${icons.arrow}${newWin()}</a>
</div>
</article>
</div>
<p class="fineprint hub__fine">${t('projects.license_note')} ${chevronLink(`${ctx.base}#source`, 'projects.source_link')}</p>
</div>
</section>`;
  return { ...meta, body, scripts: ['hero.js'], bodyClass: 'has-white-hero' };
}
