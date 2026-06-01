# Contributing to PayDance

> [中文版 →](CONTRIBUTING.md)

Thanks for your interest! PayDance is a focused desktop tool — please read the guidelines below before submitting anything.

## Environment

- **OS**: Windows 11 (primary target; Web Preview works cross-platform)
- **Runtime**: Node.js 22, Rust (latest stable)
- **Package manager**: npm

## Getting Started

```powershell
npm install
npm run tauri dev       # Desktop app
npm run dev:web         # Web Preview in browser
```

## Before Submitting

Run these commands locally. CI automatically chooses lightweight or full verification based on changed paths, and PRs that fail won't be merged.

```powershell
npm run verify:metadata # Lightweight verification for docs/legal/brand changes
npm test                # All unit/component tests
npm run lint            # ESLint
npm run format:check    # Prettier
npm run check:hygiene   # Brand + secret hygiene
npm run build:desktop   # Type-check + Vite build
npm run build:web       # Web Preview build
cargo fmt --all -- --check        # (in src-tauri/)
cargo clippy --all-targets -- -D warnings
```

## Maintainer Push Workflow

Maintainers should use one command to run local verification, push, and confirm remote results before updating `main`:

```powershell
npm run push:main
```

This command first classifies the files that are about to be pushed. If every change is limited to documentation, legal, brand asset, or community-template paths, it runs only version consistency, brand and secret hygiene, formatting, repository metadata tests, and `git diff --check`. If the change touches `src/**`, `src-tauri/**`, `package*.json`, `scripts/**`, `.github/workflows/**`, build configuration, or an unknown path, it automatically upgrades to full verification and also runs linting, tests, desktop build, Web Preview build, `npm audit --omit=dev`, `cargo fmt`, `cargo check`, `cargo clippy`, `cargo audit`, and `cargo deny check`.

Lightweight paths include:

- `docs/**`, `legal/**`, `marketing-posters/**`
- `README*`, `LICENSE*`, `SECURITY*`, `CONTRIBUTING*`, `CHANGELOG*`, `PRODUCT*`, `DESIGN*`
- `.github/ISSUE_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/**`, `.github/PULL_REQUEST_TEMPLATE.md`

Before pushing, it refuses dirty working trees or non-`main` branches, checks that the default branch has no open Dependabot alerts, pushes `origin/main`, and waits for GitHub Actions CI to finish. It waits for Web Preview only when the change affects Web Preview; remote deployment also runs only after a successful `main` CI run whose change scope requires deployment.

To run push-readiness checks before committing without running `git push`:

```powershell
npm run verify:push
```

The security audit steps require these local tools:

```powershell
cargo install cargo-audit --locked
cargo install cargo-deny --version 0.19.8 --locked
gh auth login
```

Do not run `npm run build:desktop` and `npm run build:web` in parallel because both write to the same `dist/` directory. The push workflow runs them serially in the same order as CI.

## What We Accept

PayDance is a **desktop real-time salary dashboard**. Contributions should align with the product boundaries documented in `PRODUCT.md`.

**Welcome:**

- Bug fixes with reproduction steps
- Desktop reliability improvements (window management, tray, auto-start)
- Windows 11 UI polish (theming, accessibility, DPI)
- Performance improvements for the salary ticker
- Test coverage for edge cases (clock changes, config migration, night shifts)
- i18n corrections for Chinese and English

## What We Don't Accept

PayDance is intentionally NOT:

- A time tracker or timesheet tool
- A personal finance manager
- A payroll or HR system
- A task/project management app

**We will not accept contributions that add:**

- Keyboard shortcuts or hotkey systems
- Reminders, notifications, or alerts
- Segmented time axes or historical charts
- Cloud sync, accounts, or online services
- Any feature that sends data off-device

These boundaries keep PayDance simple and maintainable. If you're unsure whether something fits, open an Issue to discuss first.

## PR Guidelines

1. **One change per PR.** Don't mix a bug fix with a refactor.
2. **Write tests.** New behavior needs test coverage. Bug fixes should include a regression test.
3. **Follow existing code style.** The codebase has established patterns — match them.
4. **Update CHANGELOG.md** under the `## Unreleased` section.
5. **Screenshots required** for UI changes (light + dark mode, Chinese + English).
6. **Use conventional commits:** `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.

## i18n

All user-facing strings must be in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`, with a type definition in `src/i18n/types.ts`. Never hardcode Chinese or English strings in Vue components or TypeScript.

## Versioning

PayDance follows [Semantic Versioning](https://semver.org/). Release versions are managed by the project author. Do not bump the version number in your PR.

## License

The project code is released under [AGPL-3.0-only](LICENSE) with [additional terms under AGPL Section 7](legal/ADDITIONAL_TERMS.md).

By submitting a code contribution, you confirm that:

- You are legally entitled to make the contribution and it is your original work (or you have the necessary permissions);
- You agree that your contribution is incorporated into the project under AGPL-3.0-only and the project's additional terms;
- You include a `Signed-off-by:` line (DCO) with your submission, confirming its lawful origin.

> The project is currently a solo effort. Ordinary contributions enter the project under the open-source terms above. If the maintainer needs to include a contribution in commercial, OEM, or white-label licensing, the contributor will be asked to explicitly sign the [Contributor License Agreement (CLA)](legal/CLA.md) before merge. Opening an Issue, suggestion, or security report does not require signing the CLA.

See `LICENSE`, `legal/ADDITIONAL_TERMS.md`, `legal/TRADEMARK.md`, and `legal/BRAND-ASSETS.md` for details.
