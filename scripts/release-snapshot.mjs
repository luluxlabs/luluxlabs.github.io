#!/usr/bin/env node
/**
 * Refresh src/data/release-snapshot.json from the GitHub API. The snapshot
 * feeds the static (no-JavaScript) download links; commit the result.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { links } from '../src/data/agents.mjs';
import { normaliseRelease } from '../src/static/assets/js/release.mjs';

const res = await fetch(links.etaApi, {
  headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'luluxlabs-site-snapshot' },
  signal: AbortSignal.timeout(15000),
});
if (!res.ok) {
  console.error(`GitHub API answered ${res.status}`);
  process.exit(1);
}
const d = await res.json();
const out = {
  _comment: 'Snapshot of the GitHub releases/latest API for koko2376/lulux-eta, used for the static (no-JS) download links. Refresh with: npm run release:snapshot',
  tag_name: d.tag_name,
  published_at: d.published_at,
  html_url: d.html_url,
  assets: d.assets.map((a) => ({ name: a.name, size: a.size, browser_download_url: a.browser_download_url })),
};
if (!normaliseRelease(out).items.length) {
  console.error('refusing to write a snapshot without downloadable assets');
  process.exit(1);
}
writeFileSync(fileURLToPath(new URL('../src/data/release-snapshot.json', import.meta.url)), `${JSON.stringify(out, null, 2)}\n`);
console.log(`snapshot updated to ${out.tag_name}`);
