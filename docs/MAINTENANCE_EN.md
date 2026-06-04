# Maintenance Conventions

> [中文版 →](MAINTENANCE.md)

This document keeps recurring PayDance maintenance rules easy to find: what to check when changing persisted settings, writing diagnostics, or preparing a release.

## Settings Migration

- `settingsSchemaVersion` in `src/lib/settings-migration.ts` tracks the salary settings schema.
- When adding persisted fields, add migration tests before changing migration logic.
- Old settings must not block launch; unknown or unsafe values should fall back to defaults.
- Window size, mini mode, and opacity preferences keep their compatibility boundary in `src/lib/window-mode.ts`.
- When changing the schema, also check the read/write keys and save verification in `src/composables/useSalarySettings.ts`.

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

## Release Chain

- `latest.json` must point at the versioned Windows EXE.
- `.sha256` must match the actual EXE.
- `.sig` is the Tauri updater signature, not a Windows Authenticode publisher signature.
- Before adding Authenticode, confirm cost, certificate source, renewal, and rollback behavior.
