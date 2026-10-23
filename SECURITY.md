# Security policy / 安全策略

## Reporting a vulnerability / 报告漏洞

Please **do not open a public issue**. Use GitHub's private reporting instead:
**Security → Report a vulnerability** on this repository
(`https://github.com/luluxlabs/luluxlabs.github.io/security/advisories/new`).
You will get an acknowledgement as soon as possible, and fixes are published
through the normal deploy.

请不要公开提交 Issue，使用本仓库 **Security → Report a vulnerability** 私密报告。

Vulnerabilities in the LULUX products themselves belong to their own
repositories:

- LULUX ETA: <https://github.com/koko2376/lulux-eta/security>
- DSH工作流 / DSH-LULUX Flow: <https://github.com/koko2376/dsh-lulux-flow/security>

## What this site does / 本站做了什么

This is a static site on GitHub Pages. It has no backend, no forms, no
accounts, no cookies, no analytics and no third-party scripts, fonts or CDNs.

- **Network requests.** Besides its own files, the browser contacts only
  `https://api.github.com` (unauthenticated, read-only): the latest LULUX ETA
  release on the download and ETA pages, and repository star counts on the
  home page. Responses are cached in `sessionStorage` (10 and 30 minutes).
  Download links point to `https://github.com/` release assets; the client
  refuses any asset URL that is not on `https://github.com/`.
- **Storage.** `localStorage["lulux.lang"]` stores the chosen language.
  `sessionStorage` holds the API caches above. Nothing else is stored.
- **Content Security Policy** (meta tag on every page):
  `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.github.com; object-src 'none'; base-uri 'self'; form-action 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'self'; media-src 'none'; upgrade-insecure-requests`.
  There are no inline scripts, inline styles or `eval`. JSON data blocks
  (`<script type="application/json">`) are inert and not executed.
- **Rendering of API data.** Release data is escaped before insertion and
  asset names are matched against fixed patterns.
- **Supply chain.** No runtime dependencies. The only dev dependency
  (`html-validate`) is pinned and locked. GitHub Actions are pinned to full
  commit SHAs; Dependabot proposes updates. Every push and pull request runs a
  `gitleaks` secret scan.

### Known limitations of a static host

GitHub Pages does not allow custom response headers, so the CSP is delivered
by `<meta>`. As a result `frame-ancestors`, `report-uri`/`report-to` and
`sandbox` cannot be set, and headers such as `X-Frame-Options`,
`Permissions-Policy` and `Cross-Origin-Opener-Policy` are not sent. The site
holds no user data or authenticated actions, so clickjacking has no target.
If the site ever moves behind a CDN that supports headers, set the same policy
as a header and add `frame-ancestors 'none'`.

## Supported versions

Only the live site (the `main` branch) is supported.
