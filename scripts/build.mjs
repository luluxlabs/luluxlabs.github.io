#!/usr/bin/env node
/**
 * Static site build. Zero runtime dependencies: Node.js >= 22 only.
 *
 *   node scripts/build.mjs            build into dist/ from the committed release snapshot
 *   LULUX_FETCH_RELEASE=1 node ...     ask the GitHub API for the latest release first
 *   SITE_URL=https://example.org ...   override the canonical origin (forks, previews)
 */
import { appendFileSync, cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { layout, SITE_URL } from '../src/lib/components.mjs';
import { artCss } from '../src/lib/art.mjs';
import { usedKeys, dicts, flatKeys } from '../src/lib/i18n.mjs';
import { loadRelease } from '../src/lib/release-static.mjs';
import { agents } from '../src/data/agents.mjs';
import * as home from '../src/pages/home.mjs';
import * as projects from '../src/pages/projects.mjs';
import * as download from '../src/pages/download.mjs';
import * as about from '../src/pages/about.mjs';
import * as notfound from '../src/pages/notfound.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

/** Relative prefix from a page path back to the site root. */
function baseFor(path) {
  if (path === '404.html') return '/';
  const depth = path.split('/').filter(Boolean).length;
  return depth === 0 ? './' : '../'.repeat(depth);
}

function write(rel, content) {
  const file = join(dist, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

async function main() {
  const { release, source } = await loadRelease({ fetchLive: process.env.LULUX_FETCH_RELEASE === '1' });

  rmSync(dist, { recursive: true, force: true });
  cpSync(join(root, 'src/static'), dist, { recursive: true });
  // Focal points of the paintings (src/data/art.json) are appended to the stylesheet.
  appendFileSync(join(dist, 'assets/css/site.css'), artCss());

  const pageModules = [home, projects];
  for (const a of agents) {
    if (!a.page) continue;
    pageModules.push(await import(pathToFileURL(join(root, 'src/pages', `${a.page}.mjs`)).href));
  }
  pageModules.push(download, about, notfound);

  const sitemap = [];
  for (const mod of pageModules) {
    const base = baseFor(mod.meta.path);
    const ctx = { ...mod.meta, base };
    const page = mod.render(ctx);
    const html = layout({ ...ctx, ...page });
    const out = mod.meta.path.endsWith('.html') ? mod.meta.path : `${mod.meta.path}index.html`;
    write(out, html);
    if (!mod.meta.noindex) sitemap.push(`${SITE_URL}/${mod.meta.path}`);
  }

  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`,
  );
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  write('.nojekyll', '');

  const all = flatKeys(dicts['zh-CN']);
  const unused = all.filter((k) => !usedKeys.has(k));
  console.log(`built ${pageModules.length} pages into dist/ (release ${release.tag} from ${source})`);
  if (unused.length) {
    console.warn(`i18n: ${unused.length} unused key(s): ${unused.join(', ')}`);
    if (process.argv.includes('--strict')) process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
