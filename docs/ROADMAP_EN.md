# Roadmap

> [中文版 →](ROADMAP.md)

This document records PayDance's development direction. It is not a release-date promise; it helps maintainers, contributors, and users quickly understand current priorities.

## Recently Completed

- Web Preview automated QA is now enforced in CI: local server, multi-viewport screenshots, DOM, console, and axe-core accessibility checks, with evidence uploaded on failure.
- Desktop reliability baseline hardening: the hybrid clock rebases after long sleep or major forward system-clock jumps; window recovery brings fully off-screen saved positions back into a visible area.
- More trustworthy local settings: config migrations now use an explicit version chain, future-version configs are safely isolated, and settings write failures surface a lightweight UI message.
- Stronger updater and release chain: updater errors now distinguish missing development config, production signature failures, invalid manifests, and network failures; Release dry-runs include smoke checks for the current build artifacts, while post-release smoke no longer mistakes dry-runs for published Release verification.
- Web Preview and accessibility fixes: locale switching now syncs the HTML `lang` attribute, and updater badges use semantic buttons.
- Supply-chain, brand, and licensing baseline governance: `cargo audit`, `cargo deny`, gitleaks, locked dependencies, metadata tests, official asset boundaries, and bilingual documentation mirrors.

## Now

- Complete the v0.9.5 release-chain review: confirm Latest Release status, public assets, `latest.json` compatibility, portable auto-update paths, and a key-rotation drill.
- Close remaining system-clock calibration gaps: major backward corrections, timezone changes, day crossing, and night-shift boundaries.
- Improve multi-monitor recovery: preserve still-valid secondary-monitor positions first, and add a reset-window-position entry point.
- Improve settings recovery UX: future-schema downgrade warnings, save retry, and visible load-failure states.
- Surface background updater failures appropriately: keep routine network failures low-noise, while clearly exposing manifest errors and signature-verification failures.
- Add onboarding preview examples so setup immediately shows estimated daily income, per-minute income, and lunch-break pause semantics.

## Next

- Authenticode code signing to reduce Windows SmartScreen warnings.
- Mini floating-window context menu: opacity, reset position, and restore main window.
- Windows desktop smoke tests for native capabilities: tray, always-on-top, autostart, single instance, sleep resume, and multi-monitor changes.
- Real updater signature verification, gitleaks download checksum verification, and GitHub Actions commit-SHA pinning.
- SBOM generation and release archiving.
- Community contribution labels and a public soft-launch feedback loop so new contributors can find suitable entry points.

## Later

- English website entry: `/en/`, `hreflang`, and language switching.
- Playwright screenshot regression for the Web Preview first screen and key states.
- Multi-currency support, while keeping the main interface lightweight and avoiding exchange-rate, tax, or financial-analysis complexity.

## Long-Term Exclusions

These directions remain outside the long-term product focus. Related proposals should start with an Issue explaining why they still serve the core desktop real-time wage-board experience:

- Keyboard shortcuts / hotkeys
- Reminders / notifications / alerts
- Historical timelines / charts / trends
- Clock-in / attendance / timesheet tracking
- Cloud sync / accounts / online services

Roadmap decisions are grounded in [PRODUCT_EN.md](PRODUCT_EN.md) and the [Contributing Guide](CONTRIBUTING_EN.md).
