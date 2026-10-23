/**
 * Paintings. Every painting is configured in src/data/art.json (master file,
 * focal points, which side the subject sits on); scripts/assets/art.py renders
 * the responsive files from it. The focal points become CSS here, because the
 * Content Security Policy forbids inline styles.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const config = JSON.parse(readFileSync(fileURLToPath(new URL('../data/art.json', import.meta.url)), 'utf8'));

export const ART_WIDTHS = config.widths;
export const ART = config.items;

/** Generated rules appended to site.css at build time. */
export function artCss() {
  const rules = ['/* Generated from src/data/art.json by scripts/build.mjs. */'];
  const mobile = [];
  for (const [id, item] of Object.entries(ART)) {
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`art: invalid id "${id}"`);
    const pos = (v) => {
      if (!/^\d{1,3}% \d{1,3}%$/.test(v)) throw new Error(`art: invalid position "${v}" for ${id}`);
      return v;
    };
    rules.push(`.art--${id} .art__img{object-position:${pos(item.position)}}`);
    mobile.push(`.art--${id} .art__img{object-position:${pos(item.positionMobile || item.position)}}`);
  }
  rules.push(`@media (max-width:760px){${mobile.join('')}}`);
  return `${rules.join('\n')}\n`;
}
