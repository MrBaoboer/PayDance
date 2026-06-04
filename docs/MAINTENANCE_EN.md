# Maintenance Conventions

> [中文版 →](MAINTENANCE.md)

This document keeps PayDance maintenance rules in the repository instead of
leaving them in one-off chats or audits.

## Settings Migration Convention

- `settingsSchemaVersion` in `src/lib/settings-migration.ts` is the salary config
  migration version.
- When adding persisted fields, write the migration test before changing the
  migration logic.
- Migrations must keep existing users unblocked: unknown or invalid fields should
  fall back to safe defaults instead of preventing launch.
- Window size, mini mode, and opacity preferences keep their compatibility
  boundary in `src/lib/window-mode.ts`.
- When changing the schema, also review the read/write keys and save verification
  in `src/composables/useSalarySettings.ts`.

## Diagnostics Convention

- User-facing errors should explain a recovery action, such as retrying,
  checking settings, or reopening the app.
- Maintainer diagnostics should stay in console or local-log contexts and avoid
  exposing salary values, private paths, keys, emails, or other sensitive data.
- New error logs should record the failed stage and safe error category rather
  than full private data.

## Desktop Smoke Records

Before each Windows release, use `docs/desktop-smoke-checklist.md` or the English
checklist. Record at least:

- PayDance version and commit.
- Windows version.
- Monitor count and DPI scaling.
- Screenshot or note for any failed item.
- Whether tray, mini floating mode, always-on-top, auto-start, and update entry
  points were checked.

## Release Chain

- `latest.json` must point at the versioned Windows EXE.
- `.sha256` must match the actual EXE.
- `.sig` is the Tauri updater signature, not a Windows Authenticode publisher
  signature.
- Until a usable free publicly trusted code-signing path is available, do not
  force Authenticode into the release workflow.
