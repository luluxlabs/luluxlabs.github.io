# Contributing / 参与贡献

Issues and pull requests are welcome. 欢迎提交 Issue 和 Pull Request。

1. `npm ci`, then `npm run dev` to preview at <http://127.0.0.1:8080/>.
2. Every user-facing string goes into **both** `src/i18n/zh-CN.json` and
   `src/i18n/en.json`. Write each language natively rather than translating
   word for word. 所有文案必须同时写中英文。
3. No inline scripts or styles, no third-party scripts, fonts or CDNs: the
   Content Security Policy forbids them.
4. Run `npm run check` before opening a pull request; CI runs the same checks.
5. Do not edit, recolour or redraw the logo, avatars or artwork (see
   `LICENSE-ASSETS.md`).

Commits must carry a Developer Certificate of Origin sign-off
(`git commit -s`), certifying that you wrote the change or have the right to
submit it under the project's license (<https://developercertificate.org/>).
