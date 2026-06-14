# Contributing to PayDance

> [中文版 →](../.github/CONTRIBUTING.md)

Thanks for your interest in PayDance. This project is intentionally small: it puts today's live earnings on the desktop in a calm, clear way. Please read the boundaries and workflow below before opening an Issue or PR.

> **License in one sentence: Ordinary contributions only need a DCO sign-off; no CLA is required upfront.** A CLA is requested separately before merge only if the maintainer plans to use that contribution in commercial, OEM, or white-label licensing.

## Environment

- **OS**: the current official release and validation baseline is Windows 11; Web Preview can preview the core experience in a browser; platform-adaptation contributions need a clear validation boundary
- **Runtime**: Node.js 22 and the latest stable Rust
- **Package manager**: npm

## Getting Started

```powershell
npm install
npm run tauri dev # Desktop app
npm run dev:web   # Browser Web Preview
```

## Before Submitting

Choose the checks that match your change. CI automatically selects lightweight or full verification by path, but running locally first saves review round trips.

```powershell
npm run verify:metadata # Docs, legal, brand, and community-template changes
npm run verify:fast     # Lint, format, tests, desktop build, Web Preview build
npm run qa:web-preview  # Web Preview visual and DOM/console validation
```

For Rust, release, or security-governance changes, also run in `src-tauri/`:

```powershell
cargo fmt --all -- --check
cargo check
cargo clippy --all-targets -- -D warnings
cargo audit --deny warnings
cargo deny check --hide-inclusion-graph
```

## Maintainer Push Workflow

Before pushing to `main`:

```powershell
npm run push:main
```

This command classifies files by path:

- **Lightweight paths** (`docs/**`, `legal/**`, `README*`, `CHANGELOG*`, etc.): runs version consistency, brand/secret hygiene, formatting, metadata tests, and `git diff --check`.
- **Code paths** (`src/**`, `src-tauri/**`, `package*.json`, `scripts/**`, `.github/workflows/**`, etc.): upgrades to full verification — adds lint, tests, desktop build, Web Preview build, `npm audit`, `cargo fmt/check/clippy/audit/deny`.

To run checks without pushing: `npm run verify:push`

> Note: do not run `npm run build:desktop` and `npm run build:web` in parallel — both write to the same `dist/` directory.

Security audit steps require local tools:

```powershell
cargo install cargo-audit --locked
cargo install cargo-deny --version 0.19.8 --locked
gh auth login
```

## What We Welcome

All contributions should align with the product boundaries in [PRODUCT_EN.md](PRODUCT_EN.md).

- Bug fixes with reproduction steps
- Desktop reliability improvements: window management, tray, autostart, single instance
- Windows 11 UI polish: theming, accessibility, DPI, multi-monitor behavior
- Platform-adaptation proposals with target OS, build flow, and validation scope
- Performance and edge-case improvements for the wage ticker
- Tests for clock changes, config migration, night shifts, and similar boundaries
- Chinese/English copy, documentation, release workflow, and community-template improvements

For first contributions, prefer issues labeled `good first issue` or `help wanted`. They should be small, low-risk, and clear about verification.

## First Contribution Walkthrough

For a low-risk first PR, pick one documentation or QA issue and keep the change narrow:

1. Read the linked issue and confirm it is still open.
2. Edit one focused file, such as a docs page, checklist, or community template.
3. Run `npm run verify:metadata` for docs, legal, brand, or community-template changes.
4. Open the PR with a short summary, the verification command you ran, and a `Signed-off-by:` line.

Avoid mixing code, screenshots, release notes, and documentation cleanup in the same first PR unless the issue explicitly asks for that scope.

## What We Do Not Accept

PayDance is not a time tracker, personal finance manager, payroll system, attendance system, or task manager. The following directions are outside the current product boundary; related PRs should start with an Issue:

- Keyboard shortcuts or hotkey systems
- Reminders, notifications, or alerts
- Segmented historical timelines, charts, or trend analysis
- Cloud sync, accounts, or online services
- Any feature that sends data off-device by default

These boundaries keep the product light, stable, and trustworthy. If you are unsure whether an idea fits, open an Issue first.

## PR Guidelines

1. **One change per PR.** Do not mix a bug fix, refactor, and documentation sweep.
2. **Write tests.** New behavior needs test coverage; bug fixes should include a regression test.
3. **Follow existing code style.** Prefer established patterns in the codebase.
4. **Update [CHANGELOG.md](../CHANGELOG.md) and [CHANGELOG_EN.md](../CHANGELOG_EN.md)** under the `## Unreleased` section; for internal verification or tiny doc polish, explain why it is not applicable.
5. **Screenshots are required for UI changes**, covering at least light/dark mode and Chinese/English.
6. **Platform adaptations must describe their validation boundary**, including target OS, build command, manual smoke items, update endpoint, and brand-distinction approach.
7. **Use conventional commits:** `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.

## i18n

All user-facing strings must be in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`, with a type definition in `src/i18n/types.ts`. Do not hardcode Chinese or English strings in Vue components or TypeScript.

## Versioning

PayDance follows [Semantic Versioning](https://semver.org/). Release versions are managed by the project author. Do not bump the version number in your PR.

## License Details

The project code is released under [AGPL-3.0-only](../LICENSE) with [additional terms under AGPL Section 7](../legal/ADDITIONAL_TERMS_EN.md).

By submitting a code contribution, you confirm that:

- You are legally entitled to make the contribution and it is your original work, or you have the necessary permissions;
- You agree that your contribution is incorporated into the project under AGPL-3.0-only and the project's additional terms;
- You include a `Signed-off-by:` line (DCO) with your submission, confirming its lawful origin.

> Ordinary contributions enter the project under the open-source terms above. If the maintainer needs to include a contribution in commercial, OEM, or white-label licensing, the contributor will be asked to explicitly sign the [Contributor License Agreement (CLA)](../legal/CLA_EN.md) before merge. Opening an Issue, suggestion, or security report does not require the CLA.

See [LICENSE](../LICENSE), [ADDITIONAL_TERMS_EN.md](../legal/ADDITIONAL_TERMS_EN.md), [TRADEMARK_EN.md](../legal/TRADEMARK_EN.md), and [BRAND-ASSETS_EN.md](../legal/BRAND-ASSETS_EN.md) for details.

## Maintenance and Governance

- Code of Conduct: [CODE_OF_CONDUCT_EN.md](CODE_OF_CONDUCT_EN.md)
- Maintainers: [MAINTAINERS_EN.md](MAINTAINERS_EN.md)
- Governance: [GOVERNANCE_EN.md](GOVERNANCE_EN.md)
- Maintenance conventions: [MAINTENANCE_EN.md](MAINTENANCE_EN.md)
