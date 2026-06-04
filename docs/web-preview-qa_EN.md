# Web Preview QA

> [中文版 →](web-preview-qa.md)

The Web Preview verification standard is: local server + project-declared Playwright + multi-viewport screenshots + DOM/console/a11y checks. The goal is not merely to capture an image; it is to confirm that the online storefront renders, switches themes, switches languages, preserves key copy, and keeps layout boundaries stable in a real browser.

## Do not use

Do not use headless Chrome/CDP/CLI screenshot as the Web Preview validation path. Previous verification showed that this route can return all-white screenshots while still exiting successfully, so it is not a release signal.

## Standard flow

1. Start the local Web Preview dev server and record the local URL.
2. Open the page with the Playwright devDependency owned by this project; for special debugging environments, `PLAYWRIGHT_NODE_MODULES` can point to an external `node_modules`.
3. Capture fixed viewports: desktop `1440x900`, medium `960x760`, and mobile `390x844`.
4. Cover both light and dark themes; even first-screen-only changes must not be checked in light mode alone.
5. Run DOM checks at the same time: page title, `Web Preview · appVersion`, software preview area, and mobile preview area must remain visible and stable.
6. Run the real language-switching path: open mobile in Chinese, click `Switch to English`, and confirm `data-locale="en"` with the English headline and CTA visible inside the viewport.
7. Use `@axe-core/playwright` for serious automated accessibility findings; this is not a full WCAG compliance claim.
8. Collect browser console and page errors, and confirm there are no severe errors.
9. Save screenshots to a unique temporary QA directory for this run: `C:\Users\mrbao\AppData\Local\Temp\paydance-web-preview-qa-{version}-{commit}-{timestamp}`. Do not reuse a fixed version-only directory, because the chat window or image viewer can cache old screenshots.
10. Stop the local service after validation so the port is not left occupied.

## Command

```powershell
npm run qa:web-preview
```

The script starts `npm run dev:web`, runs project-owned Playwright screenshots, DOM/console/a11y checks, and the Chinese-to-English click regression, then shuts down the local service. Screenshots and `summary.json` are written to a unique temporary QA directory; `summary.json` records the run id, commit, and actual Chinese/English DOM copy read from the page, which helps avoid mistaking old screenshots for new evidence.

## Passing standard

- All three viewports have non-empty screenshots, with no overlapping text, overflowing buttons, or collapsed main content.
- Chinese and English copy is read from the current DOM, not inferred from an old screenshot.
- After entering in Chinese and clicking EN, the root `data-locale` must become `en`.
- There are no critical/serious axe automated accessibility violations.
- After light/dark theme switching, the preview window edge has no obvious flash, color mismatch, or residue.
- `summary.json` contains no severe console error or page error.
- The local dev server exits after validation.
