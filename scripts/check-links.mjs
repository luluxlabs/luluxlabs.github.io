#!/usr/bin/env node
/**
 * Internal link and asset checker for dist/ (runs in CI after the build).
 * Verifies that every href, src, srcset candidate, and in-page #fragment
 * that points inside the site resolves to a file (and to an element id), and
 * that external links use https. External URLs are not fetched: CI must not
 * depend on third-party uptime. It also checks the site structure: every
 * project page is linked from the projects hub, the global navigation has one
 * Projects item (no direct product or download items), every footer links the
 * download page, and the home page enters the projects only through the hub.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
if (!existsSync(dist)) {
  console.error('dist/ not found: run `npm run build` first');
  process.exit(1);
}

function walk(d, out = []) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const idsCache = new Map();
const ids = (file) => {
  if (!idsCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
};

const errors = [];
let internal = 0;
let external = 0;

function resolveTarget(fromFile, url) {
  const [pathPart, frag] = url.split('#');
  let target;
  if (pathPart === '') target = fromFile;
  else if (pathPart.startsWith('/')) target = join(dist, pathPart);
  else target = join(dirname(fromFile), pathPart);
  if (pathPart.endsWith('/') || (pathPart !== '' && existsSync(target) && statSync(target).isDirectory())) target = join(target, 'index.html');
  return { target, frag };
}

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(dist, file);
  const refs = [];
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const cand of m[1].split(',')) refs.push(cand.trim().split(/\s+/)[0]);
  }
  for (const ref of refs) {
    if (!ref) {
      errors.push(`${rel}: empty URL`);
      continue;
    }
    if (/^(mailto:|tel:)/.test(ref)) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(ref)) {
      external += 1;
      if (!ref.startsWith('https://')) errors.push(`${rel}: non-https external URL ${ref}`);
      continue;
    }
    if (ref.startsWith('//')) {
      errors.push(`${rel}: protocol-relative URL ${ref}`);
      continue;
    }
    internal += 1;
    const { target, frag } = resolveTarget(file, ref);
    if (!existsSync(target)) {
      errors.push(`${rel}: broken link ${ref} -> ${posix.normalize(relative(dist, target))}`);
      continue;
    }
    if (frag && target.endsWith('.html') && !ids(target).has(frag)) errors.push(`${rel}: missing anchor #${frag} in ${relative(dist, target)}`);
  }
}

// CSS url() references (fonts, images)
for (const css of files.filter((f) => f.endsWith('.css'))) {
  const text = readFileSync(css, 'utf8');
  for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (/^(data:|https?:)/.test(m[1])) continue;
    // url(#id) points at an SVG filter declared in every page (the button water filter).
    if (m[1].startsWith('#')) {
      const missing = htmlFiles.filter((f) => !ids(f).has(m[1].slice(1)));
      if (missing.length) errors.push(`${relative(dist, css)}: ${m[1]} is not declared in ${missing.map((f) => relative(dist, f)).join(', ')}`);
      continue;
    }
    internal += 1;
    if (!existsSync(join(dirname(css), m[1]))) errors.push(`${relative(dist, css)}: broken url(${m[1]})`);
  }
}

// Site structure: every project is reached through the hub.
{
  const { agents } = await import('../src/data/agents.mjs');
  const read = (rel) => (existsSync(join(dist, rel)) ? readFileSync(join(dist, rel), 'utf8') : '');
  const hrefs = (html) => [...html.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1]);
  const block = (html, re) => (html.match(re) || [''])[0];
  const hub = read('projects/index.html');
  if (!hub) errors.push('projects/index.html (the projects hub) is missing');
  for (const a of agents) {
    if (!hrefs(hub).some((h) => h.endsWith(`../${a.path}`))) errors.push(`projects hub: no link to ${a.path}`);
  }
  if (!hrefs(hub).some((h) => h.endsWith('../download/'))) errors.push('projects hub: no link to download/');
  if (!hrefs(read('eta/index.html')).some((h) => h.endsWith('../download/'))) errors.push('eta page: no link to download/');
  for (const file of htmlFiles) {
    const rel = relative(dist, file);
    const html = readFileSync(file, 'utf8');
    const nav = block(html, /<header class="gnav"[\s\S]*?<\/header>/);
    const navLinks = hrefs(nav);
    if (!navLinks.some((h) => /(^|\/|\.\/)projects\/$/.test(h))) errors.push(`${rel}: global nav has no Projects link`);
    for (const p of ['download/', ...agents.map((a) => a.path)]) {
      if (navLinks.some((h) => h.endsWith(`/${p}`) || h === p)) errors.push(`${rel}: global nav links ${p} directly (use the Projects hub)`);
    }
    if (!/<footer[\s\S]*?href="[^"]*download\/"/.test(html)) errors.push(`${rel}: footer has no link to download/`);
  }
  const home = read('index.html');
  const homeMain = block(home, /<main[\s\S]*?<\/main>/);
  const heroLinks = hrefs(block(homeMain, /<section class="hero[\s\S]*?<\/section>/));
  if (heroLinks.length !== 1 || heroLinks[0] !== './projects/') errors.push(`home hero: expected one action to ./projects/, found ${JSON.stringify(heroLinks)}`);
  for (const p of ['download/', ...agents.map((a) => a.path)]) {
    if (hrefs(homeMain).includes(`./${p}`)) errors.push(`home: links ${p} directly (projects are entered through the hub)`);
  }
}

if (errors.length) {
  console.error(`link check failed (${errors.length}):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`links ok: ${internal} internal references across ${htmlFiles.length} pages resolve; ${external} external links are https`);
