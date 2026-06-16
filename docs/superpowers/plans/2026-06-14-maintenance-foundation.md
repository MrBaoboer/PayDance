# Maintenance Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a trustworthy maintenance foundation for dependency updates, visual regression detection, desktop-native behavior, modular source ownership, architecture onboarding, and first-contribution tasks without changing PayDance product behavior.

**Architecture:** Establish executable regression evidence before structural refactors. Keep desktop and Web Preview boundaries explicit, inject only the build-time version into shared metadata, and split large files by responsibility while preserving public interfaces.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Playwright, Rust, Tauri 2, PowerShell, GitHub Actions, Renovate.

---

### Task 1: Renovate Immediate Manual-Review Mode

**Files:**
- Modify: `.github/renovate.json`
- Modify: `scripts/repository-metadata.test.js`

- [ ] Add a failing metadata test asserting `dependencyDashboard: true`, `automerge: false`, `prConcurrentLimit: 0`, `prHourlyLimit: 0`, and no restricted schedule.
- [ ] Run `npx vitest run scripts/repository-metadata.test.js` and confirm the new assertion fails against the previous config.
- [ ] Remove the patch automerge rule and add the immediate unlimited manual-review settings.
- [ ] Run `npx vitest run scripts/repository-metadata.test.js` and confirm it passes.
- [ ] Validate the file with `npx renovate-config-validator .github/renovate.json`.

### Task 2: Build-Time Version Injection

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/lib/app-meta.ts`
- Modify: `src/lib/app-meta.test.ts`
- Modify: `scripts/assert-build-boundary.mjs`
- Modify: `scripts/assert-build-boundary.test.js`

- [ ] Add a failing metadata test proving `appVersion` equals `package.json.version`.
- [ ] Add a failing build-boundary fixture proving Web Preview assets containing package script or dependency sentinels are rejected.
- [ ] Run the two focused test files and confirm the new build-boundary assertion fails.
- [ ] Read `package.json` only inside Vite configuration and define `__PAYDANCE_VERSION__` with `JSON.stringify`.
- [ ] Declare the global constant and replace the runtime JSON import in `app-meta.ts`.
- [ ] Extend the Web Preview build assertion to reject package metadata sentinels while allowing the version string.
- [ ] Run focused tests, `npm run build:desktop`, and `npm run build:web`.
- [ ] Search `dist/assets/*.js` and confirm package scripts and dependency lists are absent.

### Task 3: Deterministic Visual Regression

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `scripts/visual-diff.mjs`
- Create: `scripts/visual-diff.test.js`
- Modify: `scripts/qa-web-preview.mjs`
- Modify: `.github/workflows/ci.yml`
- Create: `tests/visual-baselines/*.png`
- Modify: `docs/web-preview-qa.md`
- Modify: `docs/web-preview-qa_EN.md`

- [ ] Add failing unit tests for identical images, changed pixels, dimension mismatch, and missing baseline behavior.
- [ ] Run `npx vitest run scripts/visual-diff.test.js` and confirm the module is missing.
- [ ] Add `pixelmatch` and `pngjs` as development dependencies and implement PNG comparison with expected, actual, and diff outputs.
- [ ] Freeze browser time, disable transitions and animations, wait for bundled fonts, and capture canonical desktop/mobile Chinese/English light/dark states.
- [ ] Add `qa:web-preview:update` for explicit baseline regeneration; normal QA must never update baselines.
- [ ] Generate and commit the canonical baseline PNG files.
- [ ] Make CI upload visual evidence on failure.
- [ ] Run unit tests and both normal/update QA modes.

### Task 4: Desktop-Native Behavior and Rust Module Split

**Files:**
- Create: `src-tauri/src/tray.rs`
- Create: `src-tauri/src/portable_update.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/window-chrome.test.js`
- Modify: `src-tauri/single-instance.test.js`
- Modify: `scripts/smoke-windows-exe.ps1`
- Modify: `scripts/ci-workflow.test.js`
- Modify: `docs/desktop-smoke-checklist.md`
- Modify: `docs/desktop-smoke-checklist_EN.md`

- [ ] Add failing Rust tests for tray labels, tooltip language, and menu-id-to-action routing.
- [ ] Add failing script tests that expect tray and portable updater ownership outside `lib.rs`.
- [ ] Run `cargo test` and focused Vitest files to confirm the new expectations fail.
- [ ] Move tray construction, events, locale refresh, and testable action routing to `tray.rs`.
- [ ] Move portable updater staging, helper invocation, command, and tests to `portable_update.rs`.
- [ ] Keep `lib.rs` limited to plugin registration, command registration, setup, and run orchestration.
- [ ] Extend EXE smoke output with machine-readable window responsiveness and single-instance evidence.
- [ ] Run Rust formatting, Clippy, Rust tests, and focused JavaScript tests.

### Task 5: CSS and Settings Responsibility Split

**Files:**
- Create: `src/web-preview/styles/foundation.css`
- Create: `src/web-preview/styles/hero.css`
- Create: `src/web-preview/styles/showcase.css`
- Create: `src/web-preview/styles/responsive.css`
- Modify: `src/web-preview/web-preview.css`
- Create: `src/components/settings/SettingsAboutFooter.vue`
- Create: `src/components/settings/SettingsAboutFooter.test.ts`
- Modify: `src/components/SettingsPanel.vue`
- Modify: `src/components/SettingsPanel.test.ts`
- Modify: `src/architecture-size.test.ts`

- [ ] Add failing architecture limits for the CSS entry file, `SettingsPanel.vue`, and Rust `lib.rs`.
- [ ] Add a failing component test for repository opening, disabled state, and error rendering in the extracted footer.
- [ ] Run the focused tests and confirm they fail before extraction.
- [ ] Convert `web-preview.css` into an ordered import entry and move unchanged rules into responsibility-based files.
- [ ] Extract the about/repository footer without changing props, emitted events, copy, or styles.
- [ ] Run focused component tests, full unit tests, and visual regression QA.

### Task 6: Architecture Navigation and Contribution Ladder

**Files:**
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/ARCHITECTURE_EN.md`
- Modify: `README.md`
- Modify: `docs/README_EN.md`
- Modify: `.github/CONTRIBUTING.md`
- Modify: `docs/CONTRIBUTING_EN.md`
- Modify: `.github/ISSUE_TEMPLATE.md`
- Modify: `scripts/repository-metadata.test.js`

- [ ] Add failing metadata tests for bilingual architecture links and first-contribution acceptance fields.
- [ ] Run `npx vitest run scripts/repository-metadata.test.js` and confirm failure.
- [ ] Add a concise Mermaid runtime/data-flow map and a “change type → files → tests” table.
- [ ] Define first-contribution levels around visible outcome, bounded files, reproduction evidence, acceptance criteria, and one verification command.
- [ ] Require proposed newcomer issues to include user impact and before/after evidence; do not publish unapproved product changes.
- [ ] Run metadata verification and link checks.

### Task 7: Integration, Publish, and Release Decision

**Files:**
- Modify only files required by verification findings.

- [ ] Run `npm run verify:fast`.
- [ ] Run `npm run verify:metadata`.
- [ ] Run `npm run qa:web-preview`.
- [ ] Run `cargo fmt --all -- --check`, `cargo check`, `cargo clippy --all-targets -- -D warnings`, and `cargo test` in `src-tauri`.
- [ ] Inspect `git diff --check`, repository status, and the complete branch diff.
- [ ] Push `codex/maintenance-foundation` and open a pull request to `main`.
- [ ] Trigger Renovate after the configuration reaches `main`, then confirm the Dependency Dashboard and dependency PRs exist with no automerge enabled.
- [ ] Do not create a release unless product behavior, distributed binaries, or user-facing functionality changed.
