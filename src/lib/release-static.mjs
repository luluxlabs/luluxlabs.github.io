/**
 * Release data baked into the static HTML, so the download links work with
 * JavaScript disabled. By default the committed snapshot is used, keeping
 * builds deterministic and offline-capable. With LULUX_FETCH_RELEASE=1 (set
 * by the Pages deploy workflow) the build asks the GitHub API first and falls
 * back to the snapshot if that fails.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normaliseRelease } from '../static/assets/js/release.mjs';
import { links } from '../data/agents.mjs';

const SNAPSHOT = fileURLToPath(new URL('../data/release-snapshot.json', import.meta.url));

let current = null;
let source = 'snapshot';

export async function loadRelease({ fetchLive = false, timeoutMs = 10000 } = {}) {
  let payload = null;
  if (fetchLive) {
    try {
      const res = await fetch(links.etaApi, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'luluxlabs-site-build',
          // In CI the workflow token raises the API rate limit; it is never written to output.
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        payload = await res.json();
        source = 'github-api';
      } else {
        console.warn(`release: GitHub API answered ${res.status}; using snapshot`);
      }
    } catch (err) {
      console.warn(`release: GitHub API unreachable (${err.message}); using snapshot`);
    }
  }
  if (!payload) payload = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  current = normaliseRelease(payload);
  if (!current.items.length) throw new Error('release: no downloadable assets found');
  return { release: current, source, payload };
}

export function staticRelease() {
  if (!current) throw new Error('release: loadRelease() must run before rendering');
  return current;
}

/** The baked release in GitHub API shape, embedded for the live script's fallback. */
export function staticPayload() {
  const r = staticRelease();
  const assets = [...r.items, ...(r.checksums ? [r.checksums] : [])].map((i) => ({
    name: i.name,
    size: i.size,
    browser_download_url: i.url,
  }));
  return { tag_name: r.tag, published_at: r.publishedAt, html_url: r.htmlUrl, assets };
}
