import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  classifyAsset,
  detectPlatform,
  normaliseRelease,
  recommend,
  groupItems,
  formatBytes,
  normaliseArch,
} from '../src/static/assets/js/release.mjs';

const snapshot = JSON.parse(readFileSync(new URL('../src/data/release-snapshot.json', import.meta.url), 'utf8'));

/** Build a fake GitHub release for any version, mirroring today's naming. */
function fakeRelease(v, extra = []) {
  const names = [
    `LULUX-ETA-${v}-win-x64-setup.exe`,
    `LULUX-ETA-${v}-win-x64-setup.exe.blockmap`,
    `LULUX-ETA-${v}-mac-arm64.dmg`,
    `LULUX-ETA-${v}-mac-arm64.dmg.blockmap`,
    `LULUX-ETA-${v}-mac-x64.dmg`,
    `LULUX-ETA-${v}-mac-arm64.zip`,
    `LULUX-ETA-${v}-mac-x64.zip`,
    `LULUX-ETA-${v}-linux-x86_64.AppImage`,
    `LULUX-ETA-${v}-linux-arm64.AppImage`,
    `lulux-eta-server-v${v}.tar.gz`,
    'SHA256SUMS.txt',
    'latest.yml',
    'latest-mac.yml',
    'latest-linux.yml',
    'latest-linux-arm64.yml',
    ...extra,
  ];
  return {
    tag_name: `v${v}`,
    published_at: '2027-01-01T00:00:00Z',
    html_url: `https://github.com/koko2376/lulux-eta/releases/tag/v${v}`,
    assets: names.map((name, i) => ({
      name,
      size: 1000 + i,
      browser_download_url: `https://github.com/koko2376/lulux-eta/releases/download/v${v}/${name}`,
    })),
  };
}

const items = (rel) => normaliseRelease(rel).items;
const names = (list) => list.map((i) => i.name);

test('classifyAsset: every v0.1.1 asset is classified as expected', () => {
  const expected = {
    'LULUX-ETA-0.1.1-win-x64-setup.exe': ['installer', 'windows', 'x64', 'exe'],
    'LULUX-ETA-0.1.1-mac-arm64.dmg': ['installer', 'mac', 'arm64', 'dmg'],
    'LULUX-ETA-0.1.1-mac-x64.dmg': ['installer', 'mac', 'x64', 'dmg'],
    'LULUX-ETA-0.1.1-mac-arm64.zip': ['archive', 'mac', 'arm64', 'zip'],
    'LULUX-ETA-0.1.1-mac-x64.zip': ['archive', 'mac', 'x64', 'zip'],
    'LULUX-ETA-0.1.1-linux-x86_64.AppImage': ['installer', 'linux', 'x64', 'appimage'],
    'LULUX-ETA-0.1.1-linux-arm64.AppImage': ['installer', 'linux', 'arm64', 'appimage'],
    'lulux-eta-server-v0.1.1.tar.gz': ['server', null, null, 'tar.gz'],
    'SHA256SUMS.txt': ['checksums', null, null, 'txt'],
  };
  for (const [name, [kind, os, arch, format]] of Object.entries(expected)) {
    const c = classifyAsset(name);
    assert.deepEqual([c.kind, c.os, c.arch, c.format], [kind, os, arch, format], name);
  }
});

test('classifyAsset: updater metadata and blockmaps are ignored', () => {
  for (const n of ['latest.yml', 'latest-mac.yml', 'latest-linux-arm64.yml', 'LULUX-ETA-0.1.1-mac-x64.dmg.blockmap', 'x.YAML']) {
    assert.equal(classifyAsset(n).kind, 'ignored', n);
  }
});

test('classifyAsset: unknown files are kept as "other", empty input is ignored', () => {
  assert.equal(classifyAsset('RELEASE-NOTES.pdf').kind, 'other');
  assert.equal(classifyAsset('').kind, 'ignored');
  assert.equal(classifyAsset(undefined).kind, 'ignored');
});

test('classifyAsset: tolerates future naming variants', () => {
  assert.equal(classifyAsset('LULUX-ETA-1.0.0-win-arm64-setup.exe').arch, 'arm64');
  assert.equal(classifyAsset('LULUX-ETA-1.0.0-mac-universal.dmg').arch, 'universal');
  assert.equal(classifyAsset('LULUX-ETA-1.0.0-linux-aarch64.AppImage').arch, 'arm64');
  assert.equal(classifyAsset('LULUX-ETA-1.0.0-linux-amd64.AppImage').arch, 'x64');
  assert.equal(classifyAsset('LULUX-ETA-2.0.0-beta.1-mac-arm64.dmg').os, 'mac');
  assert.equal(classifyAsset('lulux-eta-server-2.0.0.tar.gz').kind, 'server');
});

test('normaliseArch maps aliases', () => {
  assert.equal(normaliseArch('x86_64'), 'x64');
  assert.equal(normaliseArch('AMD64'), 'x64');
  assert.equal(normaliseArch('aarch64'), 'arm64');
  assert.equal(normaliseArch('mips'), null);
});

test('normaliseRelease: committed snapshot yields 8 downloads plus checksums', () => {
  const r = normaliseRelease(snapshot);
  assert.match(r.tag, /^v\d+\.\d+\.\d+/);
  assert.equal(r.items.length, 8);
  assert.ok(r.checksums, 'SHA256SUMS present');
  assert.ok(r.items.every((i) => i.size > 0));
  assert.ok(!r.items.some((i) => /\.(yml|blockmap)$/.test(i.name)));
});

test('normaliseRelease: rejects non-GitHub download URLs and malformed entries', () => {
  const r = normaliseRelease({
    tag_name: 'v9',
    html_url: 'javascript:alert(1)',
    assets: [
      { name: 'LULUX-ETA-9-win-x64-setup.exe', size: 1, browser_download_url: 'https://evil.example/x.exe' },
      { name: 'LULUX-ETA-9-mac-arm64.dmg', size: 1, browser_download_url: 'javascript:alert(1)' },
      { name: 42, browser_download_url: 'https://github.com/a' },
      null,
    ],
  });
  assert.equal(r.items.length, 0);
  assert.equal(r.htmlUrl, null);
  assert.deepEqual(normaliseRelease(null).items, []);
  assert.deepEqual(normaliseRelease({ assets: 'nope' }).items, []);
});

test('normaliseRelease: works for a future version without code changes', () => {
  const r = normaliseRelease(fakeRelease('3.4.5'));
  assert.equal(r.version, '3.4.5');
  assert.equal(r.items.length, 8);
});

test('groupItems: stable order, Apple silicon first on macOS, x86-64 first on Linux', () => {
  const groups = groupItems(items(snapshot));
  assert.deepEqual(groups.map((g) => g.group), ['windows', 'mac', 'linux', 'server']);
  const mac = groups.find((g) => g.group === 'mac').items;
  assert.deepEqual(mac.map((i) => `${i.arch}.${i.format}`), ['arm64.dmg', 'x64.dmg', 'arm64.zip', 'x64.zip']);
  const linux = groups.find((g) => g.group === 'linux').items;
  assert.deepEqual(linux.map((i) => i.arch), ['x64', 'arm64']);
});

/* ---------------- detectPlatform ---------------- */

const UA = {
  winChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  winFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0',
  winArm: 'Mozilla/5.0 (Windows NT 10.0; ARM64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  linuxX64: 'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0',
  linuxArm: 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  cros: 'Mozilla/5.0 (X11; CrOS x86_64 16181.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
};

test('detectPlatform: user-agent strings', () => {
  assert.deepEqual(detectPlatform({ userAgent: UA.winChrome }), { os: 'windows', arch: 'x64' });
  assert.deepEqual(detectPlatform({ userAgent: UA.winFirefox }), { os: 'windows', arch: 'x64' });
  assert.deepEqual(detectPlatform({ userAgent: UA.winArm }), { os: 'windows', arch: 'arm64' });
  assert.deepEqual(detectPlatform({ userAgent: UA.linuxX64 }), { os: 'linux', arch: 'x64' });
  assert.deepEqual(detectPlatform({ userAgent: UA.linuxArm }), { os: 'linux', arch: 'arm64' });
  assert.deepEqual(detectPlatform({ userAgent: UA.iphone }), { os: 'ios', arch: null });
  assert.deepEqual(detectPlatform({ userAgent: UA.android }), { os: 'android', arch: null });
  assert.equal(detectPlatform({ userAgent: UA.cros }).os, 'chromeos');
  assert.deepEqual(detectPlatform({}), { os: 'unknown', arch: null });
});

test('detectPlatform: a Mac UA never claims an architecture', () => {
  assert.deepEqual(detectPlatform({ userAgent: UA.macSafari, platform: 'MacIntel', maxTouchPoints: 0 }), { os: 'mac', arch: null });
});

test('detectPlatform: iPadOS desktop-mode UA is recognised by touch support', () => {
  assert.equal(detectPlatform({ userAgent: UA.macSafari, platform: 'MacIntel', maxTouchPoints: 5 }).os, 'ios');
});

test('detectPlatform: User-Agent Client Hints win over the UA string', () => {
  const mac = detectPlatform({ userAgent: UA.macSafari, uaData: { platform: 'macOS' }, highEntropy: { architecture: 'arm', bitness: '64' } });
  assert.deepEqual(mac, { os: 'mac', arch: 'arm64' });
  const intel = detectPlatform({ userAgent: UA.macSafari, uaData: { platform: 'macOS' }, highEntropy: { architecture: 'x86', bitness: '64' } });
  assert.deepEqual(intel, { os: 'mac', arch: 'x64' });
  const winArm = detectPlatform({ userAgent: UA.winChrome, uaData: { platform: 'Windows' }, highEntropy: { architecture: 'arm', bitness: '64' } });
  assert.deepEqual(winArm, { os: 'windows', arch: 'arm64' });
  const linux32 = detectPlatform({ userAgent: 'Mozilla/5.0 (X11; Linux i686)', uaData: { platform: 'Linux' }, highEntropy: { architecture: 'x86', bitness: '32' } });
  assert.deepEqual(linux32, { os: 'linux', arch: null });
});

/* ---------------- recommend ---------------- */

test('recommend: exact matches for each desktop platform', () => {
  const list = items(snapshot);
  const pick = (p) => recommend(list, p);
  assert.match(names(pick({ os: 'windows', arch: 'x64' }).items)[0], /win-x64-setup\.exe$/);
  assert.match(names(pick({ os: 'mac', arch: 'arm64' }).items)[0], /mac-arm64\.dmg$/);
  assert.match(names(pick({ os: 'mac', arch: 'x64' }).items)[0], /mac-x64\.dmg$/);
  assert.match(names(pick({ os: 'linux', arch: 'x64' }).items)[0], /linux-x86_64\.AppImage$/);
  assert.match(names(pick({ os: 'linux', arch: 'arm64' }).items)[0], /linux-arm64\.AppImage$/);
  for (const p of [{ os: 'windows', arch: 'x64' }, { os: 'mac', arch: 'arm64' }, { os: 'linux', arch: 'arm64' }]) {
    const r = pick(p);
    assert.equal(r.reason, 'exact');
    assert.equal(r.items.length, 1);
  }
});

test('recommend: unknown Mac chip offers both DMGs, Apple silicon first, never a ZIP', () => {
  const r = recommend(items(snapshot), { os: 'mac', arch: null });
  assert.equal(r.reason, 'mac-unknown');
  assert.deepEqual(r.items.map((i) => `${i.arch}.${i.format}`), ['arm64.dmg', 'x64.dmg']);
});

test('recommend: Windows on Arm gets the x64 build marked as nearest, not exact', () => {
  const r = recommend(items(snapshot), { os: 'windows', arch: 'arm64' });
  assert.equal(r.reason, 'nearest');
  assert.match(r.items[0].name, /win-x64/);
});

test('recommend: unknown Linux arch offers both AppImages; ChromeOS is treated as Linux', () => {
  const r = recommend(items(snapshot), { os: 'linux', arch: null });
  assert.equal(r.reason, 'arch-unknown');
  assert.deepEqual(r.items.map((i) => i.arch), ['x64', 'arm64']);
  assert.equal(recommend(items(snapshot), { os: 'chromeos', arch: 'x64' }).reason, 'exact');
});

test('recommend: phones and unknown systems get no installer', () => {
  assert.deepEqual(recommend(items(snapshot), { os: 'ios', arch: null }), { items: [], reason: 'mobile' });
  assert.deepEqual(recommend(items(snapshot), { os: 'android', arch: null }), { items: [], reason: 'mobile' });
  assert.deepEqual(recommend(items(snapshot), { os: 'unknown', arch: null }), { items: [], reason: 'unknown' });
  assert.deepEqual(recommend([], { os: 'windows', arch: 'x64' }), { items: [], reason: 'none' });
});

test('recommend: a universal macOS build is preferred when no exact build exists', () => {
  const rel = fakeRelease('5.0.0', ['LULUX-ETA-5.0.0-mac-universal.dmg']);
  rel.assets = rel.assets.filter((a) => !/mac-(arm64|x64)\.dmg$/.test(a.name));
  const r = recommend(items(rel), { os: 'mac', arch: null });
  assert.equal(r.reason, 'exact');
  assert.match(r.items[0].name, /universal\.dmg$/);
});

test('formatBytes', () => {
  assert.equal(formatBytes(124423850), '118.7 MB');
  assert.equal(formatBytes(1639), '2 KB');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(0), '');
  assert.equal(formatBytes('x'), '');
});
