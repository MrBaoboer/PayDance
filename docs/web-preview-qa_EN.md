# Web Preview QA

> [中文版 →](web-preview-qa.md)

The Web Preview QA flow checks that the storefront works in a real browser: the page renders, theme and language switching work, key copy is present, and primary layout bounds stay inside the viewport. Its goal is release evidence, not just a good-looking screenshot.

## Do Not Use

Do not replace this flow with headless Chrome, CDP, or command-line screenshots. They have returned all-white captures while exiting successfully, so they are not a reliable release signal.

## Validation Flow

1. Start the local Web Preview dev server and record the local URL.
2. Open the page with the Playwright devDependency owned by this project; for special debugging environments, `PLAYWRIGHT_NODE_MODULES` can point to an external `node_modules`.
3. Capture fixed viewports: desktop `1440x900`, medium `960x760`, and mobile `390x844`.
4. Cover both light and dark themes. Even first-screen-only changes should not be checked in light mode alone.
5. Check the DOM: the page title, `Web Preview · appVersion`, software preview area, and mobile layout must remain present and stable.
6. Run the real language-switching path: open mobile in Chinese, click `Switch to English`, and confirm `data-locale="en"` with the English headline and CTA visible inside the viewport.
7. Use `@axe-core/playwright` for serious automated accessibility findings. This is not a full WCAG compliance claim.
8. Collect console errors and page errors, and confirm there are no severe errors.
9. Save screenshots and `summary.json` to a unique temporary QA directory for this run: `C:\Users\mrbao\AppData\Local\Temp\paydance-web-preview-qa-{version}-{commit}-{timestamp}`.
10. Compare four canonical visual states: desktop and mobile for Chinese light mode and English dark mode.
11. Stop the local service after validation so the port is not left occupied.

## Command

```powershell
npm run qa:web-preview
```

Update baselines only after confirming that the visual change is intentional:

```powershell
npm run qa:web-preview:update
```

Normal QA never accepts new screenshots automatically. On a mismatch, the temporary evidence directory keeps the expected, actual, and diff images. `summary.json` records the run id, commit, current Chinese/English copy, screenshot paths, and visual comparison results.

## Passing Criteria

- All three viewports have non-empty screenshots, with no overlapping text, overflowing buttons, or collapsed main content.
- Chinese and English copy is read from the current DOM, not inferred from an old screenshot.
- After entering in Chinese and clicking EN, the root `data-locale` must become `en`.
- There are no critical/serious axe automated accessibility violations.
- After light/dark theme switching, the preview window edge has no obvious flash, color mismatch, or residue.
- `summary.json` contains no severe console error or page error.
- Canonical states ignore minor antialiasing noise and may differ from reviewed baselines by no more than `0.5%` of pixels; expected, actual, and diff images are retained on failure.
- The local dev server exits after validation.
