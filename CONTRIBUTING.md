# Contributing to PayDance

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

Run these commands locally. CI will run them too, and PRs that fail won't be merged.

```powershell
npm test                # All unit/component tests
npm run lint            # ESLint
npm run format:check    # Prettier
npm run check:hygiene   # Brand + secret hygiene
npm run build:desktop   # Type-check + Vite build
npm run build:web       # Web Preview build
cargo fmt --all -- --check   # (in src-tauri/)
cargo clippy --all-targets -- -D warnings
```

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
- Multi-currency support
- Cloud sync, accounts, or online services
- Pomodoro timers or productivity features
- Complex animation systems or "fun" visual effects
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

By contributing, you agree that your contributions will be licensed under the same GPL-3.0 license that covers the project. See `LICENSE` and `TRADEMARK.md`.
