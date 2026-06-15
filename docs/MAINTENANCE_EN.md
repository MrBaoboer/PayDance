# Maintenance Conventions

> [中文版 →](MAINTENANCE.md)

This document keeps recurring PayDance maintenance rules easy to find: what to check when changing persisted settings, writing diagnostics, or preparing a release.

## Settings Migration

- `settingsSchemaVersion` in `src/lib/settings-migration.ts` tracks the salary settings schema.
- When adding persisted fields, add migration tests before changing migration logic.
- Old settings must not block launch; unknown or unsafe values should fall back to defaults.
- Window size, mini mode, and opacity preferences keep their compatibility boundary in `src/lib/window-mode.ts`.
- When changing the schema, also check the read/write keys and save verification in `src/composables/useSalarySettings.ts`.
- Time, boolean, salary-number, and workday values must be normalized before use; unknown fields must not pass through to runtime config.
- Automatic recovery should reset only the damaged value or smallest linked group, preserve other valid settings, and immediately write back the repair; completed background repair must not remain as a persistent warning.

## Diagnostics and Logs

- User-facing errors should explain the next action: retry, check settings, or reopen the app.
- Maintainer diagnostics may stay in console or local logs, but must not include salary values, private paths, keys, emails, or similar sensitive data.
- New logs should record the failed stage and a safe error category, not the full private payload.

## Desktop Release Smoke

Before each Windows release, use `docs/desktop-smoke-checklist.md` or the English checklist. Record at least:

- PayDance version and commit.
- Windows version.
- Monitor count and DPI scaling.
- Screenshot or note for any failed item.
- Whether tray, mini floating mode, always-on-top, auto-start, and update entry points were checked.

The Release workflow also runs `scripts/smoke-windows-exe.ps1` to confirm that the portable EXE creates a main window, remains stable, and rejects a second instance. The manual checklist still covers tray, autostart, and sleep scenarios that are not yet reliable to automate.

## Release Chain

- `latest.json` must point at the versioned Windows EXE.
- `.sha256` must match the actual EXE.
- `.sig` is the Tauri updater signature, not a Windows Authenticode publisher signature.
- Before adding Authenticode, confirm cost, certificate source, renewal, and rollback behavior.
- `release-assets/pay-dance-sbom.spdx.json` must be archived with each Release.
- Every GitHub Actions `uses:` reference must be pinned to a 40-character commit SHA with a version comment.
- The CodeQL workflow must explicitly analyze `javascript-typescript` and `rust`.

## Main Branch Pushes

- Maintainers may push copy, images, README changes, and low-risk documentation directly to `main` after running `npm run verify:metadata`.
- Product features, bug fixes, dependency upgrades, release workflows, and security-related changes should normally use a PR and wait for CI and CodeQL.
- Documentation-only changes still report `CI gate` and `CodeQL gate`, while CodeQL skips the expensive JavaScript and Rust analysis jobs.

## Renovate

- Configuration lives in `.github/renovate.json`; validate it with `npx --yes --package renovate renovate-config-validator .github/renovate.json`.
- Renovate runs immediately with unlimited concurrent PRs and mandatory human merge assessment. Automerge is disabled.
- Public evidence of a working hosted app is a Renovate PR or a `Dependency Dashboard` Issue. A config file alone does not prove installation.
- After the configuration reaches `main`, confirm the Dashboard and first PR batch immediately. If nothing appears, reconfirm repository access in the GitHub App settings.
