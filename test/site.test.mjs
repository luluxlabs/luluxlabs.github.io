import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agents } from '../src/data/agents.mjs';
import { layout, koko, productHero, CSP } from '../src/lib/components.mjs';
import * as home from '../src/pages/home.mjs';
import * as projects from '../src/pages/projects.mjs';
import * as eta from '../src/pages/eta.mjs';
import * as flow from '../src/pages/flow.mjs';
import * as download from '../src/pages/download.mjs';
import * as about from '../src/pages/about.mjs';
import { loadRelease } from '../src/lib/release-static.mjs';

// Pages that show the latest release need the committed snapshot (no network).
await loadRelease({ fetchLive: false });

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

function page(mod) {
  const depth = mod.meta.path.split('/').filter(Boolean).length;
  const ctx = { ...mod.meta, base: depth ? '../'.repeat(depth) : './' };
  return layout({ ...ctx, ...mod.render(ctx) });
}

const hrefs = (html) => [...html.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1]);

test('no "far side / dark side of the moon" wording anywhere in the copy or assets scripts', () => {
  const files = ['src/i18n/zh-CN.json', 'src/i18n/en.json', 'README.md', 'LICENSE-ASSETS.md', 'scripts/assets/og.py'];
  for (const f of files) {
    const text = read(f);
    for (const bad of [/月之背面/, /月之暗面/, /背面/, /照不到/, /far side/i, /dark side/i]) {
      assert.doesNotMatch(text, bad, `${f} contains ${bad}`);
    }
  }
});

test('home: the hero has one action, to the projects hub, and no direct product links', () => {
  const html = page(home);
  const hero = html.match(/<section class="hero[\s\S]*?<\/section>/)[0];
  assert.deepEqual(hrefs(hero), ['./projects/']);
  const main = html.match(/<main[\s\S]*?<\/main>/)[0];
  for (const p of ['download/', ...agents.map((a) => a.path)]) assert.ok(!hrefs(main).includes(`./${p}`), `home links ${p}`);
  assert.match(main, /不被已知束缚，探追未知。/);
  assert.match(main, /Unbound by the known\. Chasing the unknown\./);
});

test('global navigation: Projects, Source, About only', () => {
  const nav = page(eta).match(/<ul class="gnav__links">([\s\S]*?)<\/ul>/)[1];
  assert.deepEqual(hrefs(nav), ['../projects/', '../#source', '../about/']);
});

test('projects hub: one card per registry entry, plus what comes next', () => {
  const html = page(projects);
  for (const a of agents) {
    assert.match(html, new RegExp(`id="project-${a.id}"`));
    assert.ok(hrefs(html).includes(`../${a.path}`), `hub links ${a.path}`);
  }
  assert.match(html, /id="project-next"/);
  assert.ok(hrefs(html).includes('../download/'), 'hub links the download page');
  assert.match(html, /非官方社区插件/);
  assert.match(html, /Not affiliated with, or endorsed by, DeepSeek/);
});

test('licenses: LULUX ETA is source-available, never "open source"; Flow is Apache-2.0', () => {
  const e = agents.find((a) => a.id === 'eta');
  const f = agents.find((a) => a.id === 'flow');
  assert.equal(e.licenseSpdx, 'BUSL-1.1');
  assert.equal(e.licenseKind, 'source-available');
  assert.equal(f.licenseSpdx, 'Apache-2.0');
  const en = JSON.parse(read('src/i18n/en.json'));
  assert.match(en.agents.eta.license_kind, /source-available/i);
  assert.doesNotMatch(en.agents.eta.license_kind, /open source/i);
});

test('flow: the install command is shown in full and is never an npm install', () => {
  const html = page(flow);
  assert.match(html, /dsh plugin --profile web add github:koko2376\/dsh-lulux-flow/);
  assert.doesNotMatch(html, /npm (i|install) [^<]*dsh-lulux-flow/);
});

test('product heroes: white, koko with separate K and O eyes, flowing light, no paintings', () => {
  for (const mod of [eta, flow]) {
    const html = page(mod);
    const hero = html.match(/<section class="phero[\s\S]*?<\/section>/)[0];
    assert.match(hero, /phero--koko/);
    assert.match(hero, /class="flowlight"/);
    assert.equal((hero.match(/<g class="koko__ko"[^>]*>(.*?)<\/g>/)[1].match(/<path /g) || []).length, 2);
    assert.doesNotMatch(html, /assets\/img\/art\/(eta|flow)-/);
    assert.match(html, /assets\/js\/hero\.js/);
  }
  const dl = page(download).match(/<section class="phero[\s\S]*?<\/section>/)[0];
  assert.match(dl, /class="flowlight"/);
  assert.doesNotMatch(dl, /data-koko/);
});

test('koko and the hero render no inline styles or scripts (strict CSP)', () => {
  const html = [koko({ base: './' }), productHero({ base: './' }, { titleKey: 'eta.hero_title' }), page(about)].join('');
  assert.doesNotMatch(html, /\sstyle="/);
  assert.doesNotMatch(html.replace(/<script type="application\/json"[\s\S]*?<\/script>/g, ''), /<script(?![^>]*\ssrc=)[^>]*>/);
  assert.match(CSP, /script-src 'self'/);
  assert.match(CSP, /style-src 'self'/);
});
