/**
 * Pure helpers for the LULUX ETA download page.
 *
 * No DOM access here, so every function is covered by `node --test`
 * (see test/release.test.mjs). Asset names are matched by pattern, never by
 * exact file name, so new versions work without touching this file.
 */

/** Files published for the auto-updater; never offered to people. */
const IGNORED = /\.(?:ya?ml|blockmap)$/i;

const ARCH_ALIASES = {
  x64: 'x64',
  x86_64: 'x64',
  amd64: 'x64',
  arm64: 'arm64',
  aarch64: 'arm64',
  universal: 'universal',
};

/** @param {string} raw */
export function normaliseArch(raw) {
  return ARCH_ALIASES[String(raw || '').toLowerCase()] ?? null;
}

/**
 * Classify one release asset by its file name.
 *
 * @param {string} name
 * @returns {{ kind: 'installer'|'archive'|'server'|'checksums'|'ignored'|'other',
 *             os: 'windows'|'mac'|'linux'|null,
 *             arch: 'x64'|'arm64'|'universal'|null,
 *             format: string|null,
 *             labelKey: string|null,
 *             group: 'windows'|'mac'|'linux'|'server'|'other'|null }}
 */
export function classifyAsset(name) {
  const n = String(name || '');
  const none = { kind: 'other', os: null, arch: null, format: null, labelKey: null, group: 'other' };

  if (!n || IGNORED.test(n)) return { ...none, kind: 'ignored', group: null };
  if (/^SHA256SUMS(?:\.txt)?$/i.test(n)) {
    return { ...none, kind: 'checksums', format: 'txt', labelKey: 'label_checksums', group: null };
  }
  if (/-server-v?[\w.-]+\.tar\.gz$/i.test(n)) {
    return { ...none, kind: 'server', format: 'tar.gz', labelKey: 'label_server', group: 'server' };
  }

  let m = n.match(/-win-(x64|arm64)(?:-setup)?\.exe$/i);
  if (m) {
    const arch = normaliseArch(m[1]);
    return { kind: 'installer', os: 'windows', arch, format: 'exe', labelKey: `label_win_${arch}`, group: 'windows' };
  }

  m = n.match(/-mac-(arm64|x64|universal)\.(dmg|zip)$/i);
  if (m) {
    const arch = normaliseArch(m[1]);
    const format = m[2].toLowerCase();
    return {
      kind: format === 'dmg' ? 'installer' : 'archive',
      os: 'mac',
      arch,
      format,
      labelKey: `label_mac_${arch}_${format}`,
      group: 'mac',
    };
  }

  m = n.match(/-linux-(x86_64|amd64|x64|arm64|aarch64)\.AppImage$/i);
  if (m) {
    const arch = normaliseArch(m[1]);
    return { kind: 'installer', os: 'linux', arch, format: 'appimage', labelKey: `label_linux_${arch}`, group: 'linux' };
  }

  return none;
}

/**
 * Work out the visitor's OS and CPU architecture.
 *
 * @param {object} env
 * @param {string} [env.userAgent]          navigator.userAgent
 * @param {string} [env.platform]           navigator.platform (legacy, still useful for iPadOS)
 * @param {number} [env.maxTouchPoints]     navigator.maxTouchPoints
 * @param {object} [env.uaData]             navigator.userAgentData low-entropy values ({ platform, mobile })
 * @param {object} [env.highEntropy]        result of uaData.getHighEntropyValues(['architecture','bitness'])
 * @returns {{ os: 'windows'|'mac'|'linux'|'chromeos'|'ios'|'android'|'unknown',
 *             arch: 'x64'|'arm64'|null }}
 */
export function detectPlatform(env = {}) {
  const ua = String(env.userAgent || '');
  const legacyPlatform = String(env.platform || '');
  const uaPlatform = String(env.uaData?.platform || '');
  const he = env.highEntropy || {};

  let os = 'unknown';
  if (uaPlatform) {
    const p = uaPlatform.toLowerCase();
    if (p === 'windows') os = 'windows';
    else if (p === 'macos') os = 'mac';
    else if (p === 'linux') os = 'linux';
    else if (p === 'chrome os' || p === 'chromeos') os = 'chromeos';
    else if (p === 'android') os = 'android';
    else if (p === 'ios') os = 'ios';
  }
  if (os === 'unknown') {
    if (/android/i.test(ua)) os = 'android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'ios';
    else if (/windows nt/i.test(ua)) os = 'windows';
    else if (/cros/i.test(ua)) os = 'chromeos';
    else if (/mac os x|macintosh/i.test(ua)) os = 'mac';
    else if (/linux|x11/i.test(ua)) os = 'linux';
  }
  // iPadOS reports a desktop Mac user agent; touch support gives it away.
  if (os === 'mac' && legacyPlatform === 'MacIntel' && Number(env.maxTouchPoints) > 1) os = 'ios';

  let arch = null;
  if (he.architecture) {
    const a = String(he.architecture).toLowerCase();
    if (a === 'arm') arch = he.bitness === '32' ? null : 'arm64';
    else if (a === 'x86') arch = he.bitness === '32' ? null : 'x64';
  }
  if (!arch && (os === 'linux' || os === 'windows')) {
    if (/aarch64|arm64|armv8/i.test(ua)) arch = 'arm64';
    else if (/x86_64|x86-64|amd64|win64|wow64|x64/i.test(ua)) arch = 'x64';
  }
  // Every Mac browser reports "Intel Mac OS X" in its user agent, so the UA
  // string alone can never tell Apple silicon from Intel. Leave it unknown.
  return { os, arch };
}

/**
 * Turn a GitHub release API payload into a normalised model.
 * @param {any} release
 */
export function normaliseRelease(release) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const items = [];
  let checksums = null;
  for (const a of assets) {
    if (!a || typeof a.name !== 'string' || typeof a.browser_download_url !== 'string') continue;
    if (!/^https:\/\/github\.com\//.test(a.browser_download_url)) continue;
    const info = classifyAsset(a.name);
    if (info.kind === 'ignored') continue;
    const item = { name: a.name, url: a.browser_download_url, size: Number(a.size) || 0, ...info };
    if (info.kind === 'checksums') checksums = item;
    else items.push(item);
  }
  return {
    tag: String(release?.tag_name || ''),
    version: String(release?.tag_name || '').replace(/^v/i, ''),
    publishedAt: release?.published_at || null,
    htmlUrl: typeof release?.html_url === 'string' && release.html_url.startsWith('https://github.com/') ? release.html_url : null,
    items,
    checksums,
  };
}

const GROUP_ORDER = ['windows', 'mac', 'linux', 'server', 'other'];
const ARCH_ORDER = { arm64: 0, x64: 1, universal: 2 };
const FORMAT_ORDER = { exe: 0, dmg: 0, appimage: 0, zip: 1, 'tar.gz': 2 };

/** Group items for the "all files" list, in a stable order. */
export function groupItems(items) {
  const groups = new Map(GROUP_ORDER.map((g) => [g, []]));
  for (const it of items) groups.get(it.group ?? 'other')?.push(it);
  for (const list of groups.values()) {
    list.sort((a, b) =>
      (FORMAT_ORDER[a.format] ?? 9) - (FORMAT_ORDER[b.format] ?? 9) ||
      (a.os === 'linux' ? (ARCH_ORDER[b.arch] ?? 9) - (ARCH_ORDER[a.arch] ?? 9) : (ARCH_ORDER[a.arch] ?? 9) - (ARCH_ORDER[b.arch] ?? 9)) ||
      a.name.localeCompare(b.name));
  }
  return GROUP_ORDER.map((g) => ({ group: g, items: groups.get(g) })).filter((g) => g.items.length);
}

/**
 * Pick the installer(s) to highlight.
 * @returns {{ items: object[], reason: 'exact'|'nearest'|'mac-unknown'|'arch-unknown'|'mobile'|'unknown'|'none' }}
 */
export function recommend(items, platform) {
  const installers = items.filter((i) => i.kind === 'installer');
  const forOs = (os) => installers.filter((i) => i.os === os);
  const byArch = (list, arch) => list.filter((i) => i.arch === arch);

  switch (platform?.os) {
    case 'ios':
    case 'android':
      return { items: [], reason: 'mobile' };
    case 'windows': {
      const list = forOs('windows');
      if (!list.length) return { items: [], reason: 'none' };
      const exact = platform.arch ? byArch(list, platform.arch) : [];
      if (exact.length) return { items: exact.slice(0, 1), reason: 'exact' };
      // No build for this exact architecture (or it is unknown): offer x64,
      // the only Windows build published today, without claiming it fits.
      const x64 = byArch(list, 'x64');
      return { items: [x64[0] ?? list[0]], reason: platform.arch ? 'nearest' : 'arch-unknown' };
    }
    case 'mac': {
      const list = forOs('mac');
      if (!list.length) return { items: [], reason: 'none' };
      const universal = byArch(list, 'universal');
      if (platform.arch) {
        const exact = byArch(list, platform.arch);
        if (exact.length) return { items: exact.slice(0, 1), reason: 'exact' };
        if (universal.length) return { items: universal.slice(0, 1), reason: 'exact' };
      }
      if (universal.length) return { items: universal.slice(0, 1), reason: 'exact' };
      const both = [...byArch(list, 'arm64').slice(0, 1), ...byArch(list, 'x64').slice(0, 1)];
      return { items: both, reason: 'mac-unknown' };
    }
    case 'linux':
    case 'chromeos': {
      const list = forOs('linux');
      if (!list.length) return { items: [], reason: 'none' };
      if (platform.arch) {
        const exact = byArch(list, platform.arch);
        if (exact.length) return { items: exact.slice(0, 1), reason: 'exact' };
      }
      return { items: [...byArch(list, 'x64').slice(0, 1), ...byArch(list, 'arm64').slice(0, 1)], reason: 'arch-unknown' };
    }
    default:
      return { items: [], reason: 'unknown' };
  }
}

/**
 * Human-readable size. GitHub reports bytes; installers are shown in MB with
 * one decimal, using binary units (what Finder/Explorer call MB varies, so the
 * unit is stated explicitly).
 */
export function formatBytes(bytes, locale = 'en') {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  const digits = u >= 2 ? 1 : 0;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v)} ${units[u]}`;
}
