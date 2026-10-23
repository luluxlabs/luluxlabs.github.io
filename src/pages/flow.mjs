import { t } from '../lib/i18n.mjs';
import { screenshot, device, chevronLink, productHero, localnav, steps, command, btn, newWin, icons } from '../lib/components.mjs';
import { agents, links } from '../data/agents.mjs';

export const meta = { path: 'flow/', metaKey: 'flow', og: 'flow', section: 'flow' };

const agent = agents.find((a) => a.id === 'flow');

export const INSTALL_COMMAND = 'dsh plugin --profile web add github:koko2376/dsh-lulux-flow';

/** The five CLIs the gateway serves (original avatar files from the plugin repo). */
const CLIS = [
  ['claude-code', 'Claude Code'],
  ['codex', 'Codex'],
  ['gemini-cli', 'Gemini CLI'],
  ['qwen-code', 'Qwen Code'],
  ['grok', 'Grok CLI'],
];

/** Node types as named in the plugin (identifiers, not translated). */
const NODES = ['input', 'output', 'agent', 'kernel', 'script', 'http', 'condition', 'loop', 'approval', 'notify'];

export function render(ctx) {
  const b = ctx.base;
  const nav = localnav(ctx, {
    nameKey: 'agents.flow.name',
    items: [
      ['#gateway', 'flow.localnav_gateway'],
      ['#workflows', 'flow.localnav_workflows'],
      ['#security', 'flow.localnav_security'],
    ],
    cta: ['#install', 'flow.localnav_install'],
  });

  const gfeat = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6']
    .map((g) => `<li class="feature rv"><h3 class="feature__title">${t(`flow.${g}_title`)}</h3><p class="feature__body">${t(`flow.${g}_body`)}</p></li>`)
    .join('');

  const eng = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'].map((e) => `<li class="check rv">${t(`flow.${e}`)}</li>`).join('');

  const body = `
${productHero(ctx, {
    eyebrow: t('agents.flow.name'),
    titleKey: 'flow.hero_title',
    ledeKey: 'flow.hero_lede',
    actions: `${btn('#install', t('flow.localnav_install'))}${chevronLink(agent.repo, 'common.view_github', { external: true })}`,
    note: `<p class="hero__note">${t('flow.unofficial')}</p>`,
  })}

<section class="gateway band band--white" id="gateway" aria-labelledby="gateway-title">
<div class="wrap">
<header class="section-head section-head--center">
<p class="kicker">${t('flow.gateway_kicker')}</p>
<h2 class="display display--xl" id="gateway-title">${t('flow.gateway_title', { lines: true })}</h2>
<p class="lede">${t('flow.gateway_body')}</p>
</header>
<figure class="diagram rv">
<ol class="diagram__row" aria-describedby="diagram-desc">
<li class="diagram__node"><ul class="diagram__clis">${CLIS.map(([id, name]) => `<li><img src="${b}assets/img/avatars/flow/${id}.png" alt="${name}" width="40" height="40" loading="lazy"></li>`).join('')}</ul><strong>${t('flow.diagram_cli')}</strong><span>${t('flow.diagram_cli_sub')}</span></li>
<li class="diagram__node diagram__node--core"><span class="diagram__seal mono" aria-hidden="true">127.0.0.1</span><strong>${t('flow.diagram_gateway')}</strong><span>${t('flow.diagram_gateway_sub')}</span></li>
<li class="diagram__node"><img class="diagram__logo" src="${b}assets/img/avatars/flow/dsh-agent.png" alt="" width="40" height="40" loading="lazy"><strong>${t('flow.diagram_model')}</strong><span>${t('flow.diagram_model_sub')}</span></li>
</ol>
<figcaption class="vh" id="diagram-desc">${t('flow.diagram_label')}</figcaption>
</figure>
</div>
<div class="wrap wrap--wide showcase__stage rv">${device(screenshot(ctx, 'flow/ui-session-kernel', 'flow.session_alt'), 'device--hero')}</div>
</section>

<section class="features band" aria-labelledby="gfeat-title">
<div class="wrap">
<header class="section-head">
<p class="kicker">${t('flow.gfeat_kicker')}</p>
<h2 class="display display--lg" id="gfeat-title">${t('flow.gfeat_title', { lines: true })}</h2>
</header>
<ul class="features__grid">${gfeat}</ul>
<p class="caveat rv">${t('flow.gateway_caveat')}</p>
</div>
</section>

<section class="walk band band--white" id="workflows" aria-labelledby="workflows-title">
<div class="wrap">
<header class="section-head section-head--center">
<p class="kicker">${t('flow.workflows_kicker')}</p>
<h2 class="display display--xl" id="workflows-title">${t('flow.workflows_title', { lines: true })}</h2>
<p class="lede">${t('flow.workflows_body')}</p>
</header>
</div>
<div class="wrap wrap--wide showcase__stage rv">${device(screenshot(ctx, { zh: 'flow/ui-canvas-zh', en: 'flow/ui-canvas' }, 'flow.canvas_alt'), 'device--hero')}</div>
<div class="wrap">
<div class="nodes rv"><h3 class="nodes__title">${t('flow.nodes_title')}</h3><ul class="nodes__list">${NODES.map((n) => `<li><code>${n}</code></li>`).join('')}</ul></div>
${steps(ctx, {
    id: 'flow-steps',
    items: [
      { titleKey: 'flow.w1_title', bodyKey: 'flow.w1_body', shot: 'flow/ui-generate', altKey: 'flow.w1_alt' },
      { titleKey: 'flow.w2_title', bodyKey: 'flow.w2_body', shot: { zh: 'flow/ui-run-inspector-zh', en: 'flow/ui-run-inspector' }, altKey: 'flow.w2_alt' },
      { titleKey: 'flow.w3_title', bodyKey: 'flow.w3_body', shot: { zh: 'flow/ui-kernels-zh', en: 'flow/ui-kernels' }, altKey: 'flow.w3_alt' },
    ],
  })}
<ul class="duo">
<li class="duo__item rv"><h3>${t('flow.r_title')}</h3><p>${t('flow.r_body')}</p></li>
<li class="duo__item rv"><h3>${t('flow.w4_title')}</h3><p>${t('flow.w4_body')}</p></li>
</ul>
</div>
</section>

<section class="install band" id="install" aria-labelledby="install-title">
<div class="wrap wrap--narrow install__inner">
<header class="section-head section-head--center">
<p class="kicker">${t('flow.install_kicker')}</p>
<h2 class="display display--xl" id="install-title">${t('flow.install_title', { lines: true })}</h2>
</header>
${command(INSTALL_COMMAND, 'flow.install_cmd_label', 'flow-cmd')}
<p class="install__p">${t('flow.install_body')}</p>
<p class="install__p install__p--muted">${t('flow.install_desktop')}</p>
<p class="install__p install__p--muted">${t('flow.install_build')}</p>
<div class="actions actions--center">
${btn(links.flowReadmeInstall, t('flow.install_readme'), { external: true })}
${btn(agent.repo, `${icons.github}<span>koko2376/dsh-lulux-flow</span>`, { external: true })}
</div>
</div>
</section>

<section class="eng band band--white" id="security" aria-labelledby="eng-title">
<div class="wrap">
<header class="section-head">
<p class="kicker">${t('flow.eng_kicker')}</p>
<h2 class="display display--lg" id="eng-title">${t('flow.eng_title')}</h2>
</header>
<ul class="checks">${eng}</ul>
<p class="fineprint">${t('flow.limits')} ${chevronLink(links.flowReadmeLimits, 'flow.limits_link', { external: true })}</p>
<p class="fineprint">${t('flow.unofficial')}</p>
</div>
</section>`;
  return { ...meta, body, localnav: nav, scripts: ['hero.js'], bodyClass: 'has-lnav has-white-hero' };
}
