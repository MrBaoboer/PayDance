# Maintenance Conventions

> [中文版 →](MAINTENANCE.md)

For maintainers: compatibility rules for local settings, pushes to `main`, dependencies, toolchain, and releases. The contributor workflow lives in the [Contributing Guide](CONTRIBUTING_EN.md); use the [Architecture and Change Map](ARCHITECTURE_EN.md) to locate code.

## Settings Migration

- `settingsSchemaVersion` in `src/lib/settings-migration.ts` tracks the salary settings schema; the compatibility boundary for window size, mini mode, and opacity preferences lives in `src/lib/window-mode.ts`.
- `windowSettingsSchemaVersion` in `window-mode.ts` and the persisted `settingsVersion` are two separate counters; raising the former resets every user's window size.
- When adding persisted fields, add migration tests before changing migration logic. When changing the schema, also check the read/write keys and save validation in `src/composables/useSalarySettings.ts`.
- Old settings must not block launch. Normalize time, boolean, salary-number, and workday values before use, fall back to defaults for unknown or unsafe values, and never pass unknown fields through to the runtime config.
- Automatic repair resets only the damaged value or the smallest linked group, preserves other valid settings, and writes back immediately; a completed repair must not stay on screen as a warning.

## Diagnostics and Logs

- User-facing errors state the next step: retry, check settings, or reopen the app.
- Maintainer diagnostics stay in the console or local logs and record only the failed stage and a safe error category, never salary values, private paths, keys, or email addresses.

## Pushing to main

Copy, images, and low-risk documentation may go straight to `main`. Features, bug fixes, dependency upgrades, release workflow, and security-related changes go through a pull request and wait for CI and CodeQL.

- `npm run push:main` needs an authenticated GitHub CLI (`gh auth login`). It runs `npm run verify:metadata`, adds lint and unit tests when the change goes beyond documentation, and stops while Dependabot security alerts are open; it then pushes and waits for CI and CodeQL (and Web Preview when the change deploys the site). Builds, browser QA, Rust checks, and security audits are left to CI.
- `npm run verify:push` runs the same local checks without pushing.
- `npm run verify:release:record` writes a pass record to `.tmp/paydance-verification.json`; within two hours, `push:main` on the same HEAD skips the local checks.

CI trims jobs by changed files (`scripts/ci-change-scope.mjs`), and both gates check only the jobs judged necessary. A green gate does not mean everything ran:

- Documentation-only changes run the metadata job alone; frontend, Rust, Web Preview QA, security audit, and CodeQL are all skipped.
- Security audits are scoped per ecosystem: npm audit runs only when `package.json` / `package-lock.json` change, cargo audit and cargo deny only when `src-tauri/Cargo.*`, `deny.toml`, or `.cargo/audit.toml` change, and gitleaks always runs. An npm-only Dependabot pull request is no longer blocked by a Rust advisory, and vice versa.
- Every day at 06:00 Asia/Shanghai, CI reruns every audit against main; a failure opens or updates the issue "Scheduled dependency audit failed", which closes itself once the audit passes again.
- The metadata job runs the whole Vitest suite on every run, so Rust, script, or workflow changes can no longer skip the tests that cover them; the frontend job runs it again when frontend files change.

## Dependency Updates

- Dependabot is configured in `.github/dependabot.yml`: npm, cargo, and github-actions, checked every Monday at 09:00 Asia/Shanghai, one group per ecosystem, no automerge. Its own pull requests are exempt from the DCO gate as long as the commits stay within dependency manifests and workflow files; the rule lives in `scripts/check-dco.mjs`.
- RustSec advisories missing from the GitHub Advisory Database (usually transitive crates behind tauri / reqwest, such as rustls in 2026-09) produce no Dependabot alert or pull request; only the scheduled audit catches them. Follow the issue: run `cargo update -p <crate>` in `src-tauri`, then `npm run push:main`.
- Upgrades deliberately held back live in two places that must stay in sync: the `ignore` block in `dependabot.yml`, and the test "keeps the upgrades that are blocked upstream pinned with a reason" in `scripts/repository-metadata.test.js`. Two entries today:
  - `typescript` stays on 6.x: TypeScript 7 is the native port, vue-tsc cannot resolve `tsc.js` from it, and typescript-eslint refuses to load.
  - `@types/node` stays on 24.x to track the runtime major. Once Node 26 reaches LTS, move every CI `node-version` to 26, lift this block, and drop the matching test assertion.
- When adding or removing a direct dependency, update `legal/THIRD_PARTY_NOTICES.md` and its English mirror; `npm run check:notices` compares both directions and runs inside `verify:metadata` and `verify:fast`.
- Declared ranges are documentation; the committed `package-lock.json` decides installs. When raising a `^` floor, follow the locked and verified version. `@tauri-apps/*` moves in lockstep with the Rust crates, and a stale floor suggests an old IPC surface is still supported.

## Toolchain

- CI uses Rust `stable`; a lagging local toolchain makes `cargo clippy -D warnings` disagree with CI. `rustup check` shows the gap, `rustup update stable` closes it.
- `npm run verify:release` invokes the local cargo-audit and cargo-deny. Their versions must match the ones pinned in CI, or the local audit result does not count:

  ```powershell
  cargo install cargo-audit --version 0.22.2 --locked
  cargo install cargo-deny --version 0.20.2 --locked
  ```

- `npm run build:exe` first checks whether `src-tauri/target/release/pay-dance.exe` is still running. A running instance blocks the build from overwriting it; quit from the tray and retry.

## Release

1. Bump the version in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` together; `npm run version:check` verifies that they match.
2. In `CHANGELOG.md` and `CHANGELOG_EN.md`, move `## Unreleased` into `### vX.Y.Z`. `scripts/extract-release-notes.mjs` builds the GitHub Release body from that section of the Chinese changelog.
3. Run `npm run verify:release` (includes npm audit and Rust fmt, clippy, test, audit, and deny), then complete [Web Preview QA](web-preview-qa_EN.md) and the pre-release sections of the [desktop smoke checklist](desktop-smoke-checklist_EN.md).
4. `npm run push:main`, then wait for CI and CodeQL.
5. `npm run release:publish`: it checks the branch, worktree, sync with origin, version and changelog section, that the tag does not exist yet, and the CI results; then creates and pushes the annotated tag `v<version>`, waits for the Release and Post-Release Smoke workflows, and verifies that every Release asset is present. `--dry-run` runs the local checks only. When the Release workflow fails, the script deletes the local and remote tag so the fix can ship under the same version; if a draft release was already created, run `gh release delete v<version> --yes` first.
6. After publishing, run the "Portable Update" section of the smoke checklist: update from the previous release's EXE to the new version.

The Release workflow builds the portable EXE on `windows-2025`, creates the Release as a draft, and publishes it only after every asset is uploaded, so `/releases/latest` never points at a half-uploaded release. It attaches `.sha256`, the updater signature `.sig`, the stable `pay-dance-windows-x64.exe` with its `.sha256`, `latest.json`, an SPDX SBOM, the automated smoke report from `scripts/smoke-windows-exe.ps1`, and `release-manifest.json`. Post-Release Smoke downloads the published assets and re-checks hashes, manifests, the stable copy, and download links.

### Release Chain Invariants

- `latest.json` points at the versioned Windows EXE; the updater endpoint is fixed at `releases/latest/download/latest.json`.
- Every Release also uploads the stable `pay-dance-windows-x64.exe`; the website and the docs link to it, and the link never changes with the version.
- `.sha256` matches the actual EXE. `.sig` is the Tauri updater signature, not a Windows Authenticode publisher signature; before adding Authenticode, confirm cost, certificate source, renewal, and rollback.
- `pay-dance-sbom.spdx.json` is archived with every Release.
- Every GitHub Actions `uses:` is pinned to a 40-character commit SHA with a version comment.
- The CodeQL workflow explicitly analyzes `javascript-typescript` and `rust`.

### Withdrawing a Bad Release

The updater only moves forward, so the way back is a fixed release with a new patch version, not deleting the published one: deleting only sends users who have not updated yet back to the previous version, while everyone who already updated cannot roll back automatically. Only when the assets are shown to be harmful, turn that Release into a draft and describe the manual rollback in the Release body and an issue.

### Usage Snapshot

The `Usage Snapshot` workflow appends the cumulative download count of every Release asset to `downloads.csv` on the `usage-data` branch once a day (date, tag, asset name, count). Reading it: the daily increase of `latest.json` approximates desktop launches (the updater fetches it once per launch), the increase of the EXE approximates new installs, and their ratio is the closest public signal to retention. Neither the app nor the website carries telemetry, so this is the only usage data source.

### Updater Signing Key Compromise

1. Retire the compromised key and generate a new key pair.
2. Put the new public key in `plugins.updater.pubkey` of `src-tauri/tauri.conf.json`, and replace the `TAURI_UPDATER_PRIVKEY` and `TAURI_UPDATER_PRIVKEY_PASSWORD` GitHub Secrets.
3. Ship a release signed with the new key. Earlier releases can no longer auto-update; users must download manually.
