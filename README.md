<div align="center">

<img src="src/static/assets/img/brand/lulux.png" width="88" alt="LULUX logo">

# luluxlabs.github.io

**LULUX 官方网站 · Official website of LULUX**

[简体中文](#简体中文) · [English](#english)

[![CI](https://github.com/luluxlabs/luluxlabs.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/luluxlabs/luluxlabs.github.io/actions/workflows/ci.yml)
[![Deploy](https://github.com/luluxlabs/luluxlabs.github.io/actions/workflows/pages.yml/badge.svg)](https://github.com/luluxlabs/luluxlabs.github.io/actions/workflows/pages.yml)
[![Code: Apache-2.0](https://img.shields.io/badge/code-Apache--2.0-blue.svg)](LICENSE)

</div>

---

## 简体中文

本仓库是 <https://luluxlabs.github.io> 的源码：一个零运行时依赖的静态网站，介绍 LULUX 和它的 AI Agent，
目前包括 [LULUX ETA](https://github.com/koko2376/lulux-eta) 和
[DSH工作流（DSH-LULUX Flow）](https://github.com/koko2376/dsh-lulux-flow)。

### 页面

| 路径 | 内容 |
| --- | --- |
| `/` | 首页：LULUX 这个名字与理念、通往项目页的入口、源码与许可证 |
| `/projects/` | 项目页：全部 Agent 的卡片（由注册表生成）与“即将到来” |
| `/eta/` | LULUX ETA：功能、截图、桌面版与 LULUX Cloud、下载入口 |
| `/flow/` | DSH工作流：作用域网关、工作流画布、安装命令 |
| `/download/` | LULUX ETA 下载：实时读取 GitHub 最新版本，自动推荐安装包 |
| `/about/` | 关于作者 koko |
| `/404.html` | 404 页面 |

全站中英双语（默认简体中文），两种语言在同一个页面里，所以英文版和中文版是同一个地址（例如项目页就是 `/projects/`）。首次访问按浏览器语言选择，切换后保存在 `localStorage`。

导航只有“项目 / 源码 / 关于”三项：每个项目都从项目页进入，下载页从 ETA 页、项目页的 ETA 卡片和页脚进入。

### 本地开发

需要 Node.js ≥ 22.12。

```bash
npm ci              # 只安装开发依赖（html-validate）
npm run dev         # 构建到 dist/ 并在 http://127.0.0.1:8080/ 预览
npm run check       # CI 同款检查：i18n、单元测试、构建、HTML 校验、链接、页面体积
```

### 目录结构

```
src/
  data/agents.mjs          Agent 注册表（驱动项目页卡片、首页入口、页脚、源码区、站点地图）
  data/art.json            首页油画配置：母版文件与焦点（换图只改这里）
  data/koko-eyes.json      koko 头像的 K、O 眼睛矢量路径（由 koko.py 生成）
  data/release-snapshot.json  构建时使用的 ETA 版本快照（无 JS 时的下载链接）
  i18n/zh-CN.json, en.json 全部文案，两种语言键必须一一对应
  lib/                     模板组件、双语渲染
  pages/                   各页面模块
  static/                  原样复制到 dist/ 的静态资源（CSS、JS、图片、字体）
scripts/                   构建、本地预览与各项检查；scripts/assets/ 生成图片
art-src/                   油画与 koko 头像母版（不直接发布，由 art.py / koko.py 生成各尺寸）
test/                      node --test 单元测试
```

### 新增一个 Agent

1. 在 `src/data/agents.mjs` 里加一项（id、路径、Logo、仓库、许可证、项目卡片截图，可选的额外链接与提示）。
2. 在 `src/i18n/zh-CN.json` 与 `en.json` 中加上 `agents.<id>.*` 文案（缺一种语言 CI 会失败）。
3. 需要独立页面时，在 `src/pages/` 新建页面模块并在注册表里写上 `page`；产品页开头用 `productHero()`（白底、koko、底部流光）。

项目页卡片、首页入口里的 Logo、页脚、源码区和站点地图会自动出现；导航始终只有一个“项目”。

### 产品页开头：koko 与流光

ETA 与 DSH工作流 的开头是纯白底：右侧（窄屏在标题上方）是大号 koko 头像，K 和 O 两只“眼睛”跟随鼠标；
触屏设备上会缓慢地四处看看；开启“减少动态效果”时保持不动；没有 JavaScript 时居中。头像分两层：
`scripts/assets/koko.py` 从 `art-src/koko-avatar.png` 抹掉 KO 得到无眼的身体（WebP 320/640/1024 + PNG 480），
并把 K、O 描成矢量路径写入 `src/data/koko-eyes.json`。底部的流光由 `assets/js/hero.js` 在 canvas 上绘制
（雾蓝、浅蓝与白色光带横向漂移），离开屏幕或标签页隐藏时暂停，减少动态效果时只画一帧；
没有 JavaScript 时显示同色的静态渐变。下载页、项目页开头与 ETA 下载区使用同样的流光（不含头像）。

### 更换油画

首页的油画在 `src/data/art.json` 里只有一个母版路径和焦点配置（`position` 宽屏、`positionMobile` 窄屏、`side` 主体在哪一侧、`tone` 明暗）。
换图：`npm run art -- hero=/path/to/new.png`（会复制到 `art-src/` 并生成 768/1376/1920/2560 的 AVIF、WebP、JPEG），
再按需调整焦点，`npm run build` 后提交。焦点会在构建时写入 CSS（CSP 禁止内联样式）。

### 部署

推送到 `main` 后，`.github/workflows/pages.yml` 先运行完整 CI，再构建并通过
`actions/upload-pages-artifact` + `actions/deploy-pages` 发布。首次使用需在仓库
**Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。

部署构建会向 GitHub API 读取 LULUX ETA 最新版本写入静态下载链接；读取失败时回退到
`src/data/release-snapshot.json`。可以用 `npm run release:snapshot` 手动刷新快照。
如果部署到其他域名，构建时设置 `SITE_URL`（影响 canonical、Open Graph、sitemap）。

### 许可证

代码采用 [Apache-2.0](LICENSE)。LULUX 名称与 Logo、头像、油画、社交分享图和产品截图
**不在**此许可范围内，见 [LICENSE-ASSETS.md](LICENSE-ASSETS.md)。安全问题见 [SECURITY.md](SECURITY.md)。

---

## English

This repository is the source of <https://luluxlabs.github.io>: a static site
with zero runtime dependencies that presents LULUX and its AI agents,
currently [LULUX ETA](https://github.com/koko2376/lulux-eta) and
[DSH-LULUX Flow](https://github.com/koko2376/dsh-lulux-flow).

### Pages

| Path | What it is |
| --- | --- |
| `/` | Home: the name and the idea behind LULUX, one entry to the projects, source and licenses |
| `/projects/` | Projects hub: a card for every agent (generated from the registry) and "coming next" |
| `/eta/` | LULUX ETA: features, screenshots, desktop and LULUX Cloud, download |
| `/flow/` | DSH-LULUX Flow: scoped gateway, workflow canvas, install command |
| `/download/` | LULUX ETA downloads: reads the latest GitHub release live and recommends the right installer |
| `/about/` | About the author, koko |
| `/404.html` | Not-found page |

Every page is bilingual (Simplified Chinese by default). Both languages live in
the same document, so the English page has the same URL (the hub is
`/projects/` in both). The first visit follows the browser language; a manual
choice is remembered in `localStorage`.

The global navigation has three items: Projects, Source and About. Every
project is entered through the hub; the download page is linked from the ETA
page, the ETA card on the hub and the footer.

### Develop

Requires Node.js ≥ 22.12.

```bash
npm ci              # dev dependency only (html-validate)
npm run dev         # build into dist/ and preview at http://127.0.0.1:8080/
npm run check       # what CI runs: i18n, unit tests, build, HTML validation, links, page weight
```

### How it is built

- `scripts/build.mjs` renders each page module in `src/pages/` with the
  shared components in `src/lib/`, copies `src/static/` and writes
  `sitemap.xml`, `robots.txt` and `.nojekyll` into `dist/`.
- Both languages are rendered into the same document
  (`<span data-l="zh" lang="zh-CN">…</span><span data-l="en" lang="en">…</span>`);
  CSS shows the active one. `assets/js/boot.js` picks the language before
  first paint. Locale strings may use only `**bold**`, `` `code` `` and line
  breaks; they are HTML-escaped at build time.
- `src/data/agents.mjs` is the single registry of agents. Adding one is an
  entry there, its `agents.<id>` strings in both locale files, and optionally
  a page module; the hub card, the logo in the home page's entry block, the
  footer, the source section and the sitemap follow automatically.
- Product heroes (`productHero()` in `src/lib/components.mjs`) are pure white
  with koko, the LULUX avatar, on the right (above the headline on narrow
  screens) and flowing light along the bottom. koko's K and O are its eyes and
  follow the pointer, eased with `requestAnimationFrame` within a clamped
  radius; touch devices get a slow look-around, reduced motion keeps them
  still and without JavaScript they sit centred. `scripts/assets/koko.py`
  splits `art-src/koko-avatar.png` into an eyeless body (the K and O painted
  out with the face colour) and the two glyphs traced as SVG paths
  (`src/data/koko-eyes.json`). The flowing light (mist-blue, pale-blue and
  white bands with caustic glints) is drawn on a canvas by
  `assets/js/hero.js`; it pauses off-screen and in hidden tabs, is a single
  still frame under reduced motion, and a still CSS gradient without
  JavaScript. The download page, the hub and the ETA download band use the
  same light without the avatar.
- The home painting is a single master in `art-src/` plus focal points in
  `src/data/art.json` (`position` for wide screens, `positionMobile` for
  narrow ones, `side` where the subject sits, `tone` light or dark). To swap
  one, run `npm run art -- hero=/path/to/new.png`: it copies the master and
  renders AVIF, WebP and JPEG at 768/1376/1920/2560 px. The build turns the
  focal points into CSS, since the CSP forbids inline styles.
- Primary buttons are black with a water layer: thin mist-blue bands flow
  through an SVG turbulence/displacement filter on hover and keyboard focus,
  with a glow that follows the pointer; reduced motion gets a still highlight.

### Progressive enhancement and the no-JavaScript fallback

Everything is readable and navigable without JavaScript: Chinese copy,
navigation (the mobile menu is a native `<details>`), every page, and working
download links baked in at build time. JavaScript adds the language switch,
scroll reveals, the sticky walkthrough, copy buttons, live star counts, live
download detection, the flowing light and koko's eyes. All motion, including
the button water, is reduced to still states under `prefers-reduced-motion`.

### Live downloads

`assets/js/download.js` fetches
`https://api.github.com/repos/koko2376/lulux-eta/releases/latest`, classifies
assets by file-name pattern (so new versions need no code change), detects
the OS and CPU (User-Agent Client Hints where available, otherwise the UA
string) and highlights the matching installer. Updater files (`*.yml`,
`*.blockmap`) are ignored. If the API fails or is rate-limited, the page
keeps the build-time links and points to the releases page. The matching and
detection logic lives in `assets/js/release.mjs` and is unit-tested in
`test/release.test.mjs`.

> When the API call fails, the browser itself logs the failed request in the
> developer console; the site adds no messages of its own.

### Checks (CI)

`.github/workflows/ci.yml` runs on every pull request and push:

| Check | Command |
| --- | --- |
| i18n completeness: identical key sets, no empty values, matching inline markup, no unused keys | `npm run check:i18n` |
| Unit tests: asset matching, OS/arch detection, language choice, site structure and copy rules | `npm test` |
| HTML validation (`html-validate`, recommended + a11y presets, no inline styles) | `npm run check:html` |
| Internal links, assets, `srcset` candidates and `#anchors` resolve; external links are https; every project is linked from the hub, the nav has one Projects item, the home page enters projects only through the hub | `npm run check:links` |
| Page-weight budgets | `npm run check:budgets` |
| Secret scan of the full history (`gitleaks`, checksum-verified binary) | CI only |

### Page-weight budgets

Measured per page and per language for a desktop browser at the widest
breakpoint (text gzip-compressed, images at their largest candidate, inactive
language excluded, repeated URLs counted once):

| Budget | Limit | Why |
| --- | --- | --- |
| HTML | 24 KB gz | One document carries both languages, so copy is doubled |
| CSS | 16 KB gz | A single stylesheet, no framework |
| JS | 16 KB gz | Progressive enhancement only |
| Font | 40 KB | One Latin-subset variable sans (Inter); Chinese uses system fonts instead of multi-megabyte CJK webfonts |
| Initial view | 250 KB | Document, styles, scripts and the eager hero painting |
| Whole page | 1 MB | Screenshots are the product and stay sharp; everything below the fold is lazy-loaded |

The home painting ships as AVIF and WebP with a JPEG fallback at 768, 1376, 1920 and 2560 px;
screenshots as WebP with a JPEG fallback at 960 px and full size.

### Deploy

Pushing to `main` runs `.github/workflows/pages.yml`: the full CI first, then
a build that bakes the newest LULUX ETA release into the static links
(falling back to `src/data/release-snapshot.json`), then
`actions/upload-pages-artifact` and `actions/deploy-pages`. On a new
repository, set **Settings → Pages → Build and deployment → Source** to
**GitHub Actions** once. All actions are pinned to commit SHAs and kept current
by Dependabot. To deploy elsewhere, set `SITE_URL` at build time (canonical
URLs, Open Graph tags and the sitemap use it).

### Assets

- Painting: the home page's crescent, an original oil-painting-style image
  created for LULUX with generative AI. No museum works are used. Its master
  lives in `art-src/`.
- Logo and agent avatars: the original files from the LULUX ETA and
  DSH-LULUX Flow repositories, used unmodified. The about-page avatar is
  rendered at 128/256/512 px from its original (`art-src/koko-avatar.png`),
  which is also the source of the two-layer hero avatar.
- Screenshots: from the products' own documentation.
- Font: Inter (SIL OFL 1.1), Latin subset, variable weight 400–700, self-hosted.
- `scripts/assets/og.py` regenerates the 1200×630 social images from the
  home painting, the logo and the about-page avatar (product pages, hub and
  download page on white with the flowing light).

### License

Code: [Apache-2.0](LICENSE). The LULUX names and logos, avatars, paintings,
social images and product screenshots are **not** covered; see
[LICENSE-ASSETS.md](LICENSE-ASSETS.md). Security: [SECURITY.md](SECURITY.md).
Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).

DSH工作流 (DSH-LULUX Flow) is an unofficial community plugin and is not
affiliated with or endorsed by DeepSeek. Product names are trademarks of their
respective owners.
