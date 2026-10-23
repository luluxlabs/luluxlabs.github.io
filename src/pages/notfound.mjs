import { t } from '../lib/i18n.mjs';
import { hero, btn } from '../lib/components.mjs';

/** Served by GitHub Pages for any unknown path, so it uses root-absolute URLs (ctx.base = '/'). */
export const meta = { path: '404.html', metaKey: 'notfound', og: 'home', section: 'none', noindex: true };

export function render(ctx) {
  const body = hero(ctx, {
    artId: 'hero',
    eyebrow: t('notfound.code'),
    titleKey: 'notfound.title',
    ledeKey: 'notfound.body',
    actions: btn(ctx.base, t('notfound.home'), { cls: 'btn--inverse' }),
    cls: 'hero--home hero--404',
  });
  return { ...meta, body, bodyClass: 'has-dark-hero' };
}
