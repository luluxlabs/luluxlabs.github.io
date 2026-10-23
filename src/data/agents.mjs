/**
 * The LULUX agent registry.
 *
 * Every agent listed here gets, automatically:
 *   - a card on the projects hub (/projects/) and a logo in the home page's
 *     single entry block that leads there,
 *   - an entry in the footer, the source section and the about page,
 *   - a sitemap entry and, if `page` names a module in src/pages/, its own page.
 * The global navigation has one "Projects" item for all of them.
 *
 * Copy lives in src/i18n/<locale>.json under `agents.<id>.*` (both locales are
 * required; `npm run check:i18n` fails otherwise).
 *
 * To add an agent: add an entry below, add its `agents.<id>` keys to both
 * locale files and (optionally) a page module.
 */

/** @typedef {{ zh: string, en: string } | string} Localised */

/**
 * @typedef {object} Agent
 * @property {string} id            Stable id, also the i18n namespace (`agents.<id>`).
 * @property {'available'|'preview'} status
 * @property {string} path          Page path relative to the site root, with trailing slash.
 * @property {string|null} page     Page module in src/pages/ (without extension), or null.
 * @property {string} logo          Logo/avatar path under assets/img/ (original file, never edited).
 * @property {string} repo          GitHub repository URL.
 * @property {string} repoSlug      owner/name, used for the live star count.
 * @property {'source-available'|'open-source'} licenseKind
 * @property {string} licenseSpdx   SPDX identifier shown in the source section.
 * @property {string} licenseUrl    Link to the LICENSE file.
 * @property {{ shot: Localised, altKey: string }} card  Screenshot shown on the hub card (per-language allowed) and its alt-text key.
 * @property {{ href: string, labelKey: string }[]} [hubLinks]  Extra links on the hub card (site paths are relative to the root).
 * @property {string} [noteKey]     A notice printed on the hub card (e.g. "unofficial plugin").
 */

/** @type {Agent[]} */
export const agents = [
  {
    id: 'eta',
    status: 'available',
    path: 'eta/',
    page: 'eta',
    logo: 'brand/lulux.png',
    repo: 'https://github.com/koko2376/lulux-eta',
    repoSlug: 'koko2376/lulux-eta',
    licenseKind: 'source-available',
    licenseSpdx: 'BUSL-1.1',
    licenseUrl: 'https://github.com/koko2376/lulux-eta/blob/main/LICENSE',
    card: { shot: 'eta/agent-chat', altKey: 'eta.showcase_alt' },
    hubLinks: [{ href: 'download/', labelKey: 'projects.download_eta' }],
  },
  {
    id: 'flow',
    status: 'available',
    path: 'flow/',
    page: 'flow',
    logo: 'brand/lulux-flow.png',
    repo: 'https://github.com/koko2376/dsh-lulux-flow',
    repoSlug: 'koko2376/dsh-lulux-flow',
    licenseKind: 'open-source',
    licenseSpdx: 'Apache-2.0',
    licenseUrl: 'https://github.com/koko2376/dsh-lulux-flow/blob/main/LICENSE',
    card: { shot: { zh: 'flow/ui-canvas-zh', en: 'flow/ui-canvas' }, altKey: 'flow.canvas_alt' },
    noteKey: 'flow.unofficial',
  },
];

export const links = {
  github: 'https://github.com/koko2376',
  org: 'https://github.com/luluxlabs',
  x: 'https://x.com/koko2376',
  etaReleases: 'https://github.com/koko2376/lulux-eta/releases/latest',
  etaInstallGuide: 'https://github.com/koko2376/lulux-eta/blob/main/docs/INSTALL.md',
  etaServerGuide: 'https://github.com/koko2376/lulux-eta/blob/main/docs/deploy-server.md',
  etaApi: 'https://api.github.com/repos/koko2376/lulux-eta/releases/latest',
  flowReadmeInstall: 'https://github.com/koko2376/dsh-lulux-flow#install',
  flowReadmeLimits: 'https://github.com/koko2376/dsh-lulux-flow#known-limitations',
  flowReadme: 'https://github.com/koko2376/dsh-lulux-flow#readme',
  siteRepo: 'https://github.com/luluxlabs/luluxlabs.github.io',
};
