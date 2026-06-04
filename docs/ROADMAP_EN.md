# Roadmap

> [中文版 →](ROADMAP.md)

This document records PayDance's development direction. It is not a release-date promise; it is a quick way for maintainers, contributors, and users to understand current priorities.

## Recently Completed

- Web Preview automated QA: local server, multi-viewport screenshots, DOM checks, and console checks.
- Supply-chain baseline governance: `cargo audit`, `cargo deny`, gitleaks, locked dependencies, and metadata tests.
- Brand and licensing documentation: official asset boundaries, Chinese-first docs, and English mirrors.
- Release asset constraints: versioned Windows file names, `latest.json`, updater signing, and post-release smoke checks.

## Now

- Auto-update release-chain review: key rotation drills, `latest.json` compatibility, and portable update paths.
- Window position memory with multi-monitor recovery.
- System clock calibration: sleep resume, timezone changes, day crossing, and night-shift boundaries.
- Explicit config migration version chain so future settings changes stay traceable and reversible.
- Onboarding preview examples that feel closer to the real live wage tick during setup.

## Next

- Authenticode code signing to reduce Windows SmartScreen warnings.
- Mini floating window context menu: opacity, reset position, and restore main window.
- Windows desktop smoke tests for native capabilities: tray, always-on-top, autostart, and single instance.
- SBOM generation and release archiving.
- Community contribution labels so new contributors can find suitable entry points.

## Later

- English website entry: `/en/`, `hreflang`, and language switching.
- Playwright screenshot regression for the Web Preview first screen and key states.
- Accessibility automation such as axe-core.
- Multi-currency support, while keeping the main interface lightweight.

## Long-Term Exclusions

These directions are outside the long-term product focus. Related proposals should start with an Issue explaining why they still serve the core desktop real-time wage board experience:

- Keyboard shortcuts / hotkeys
- Reminders / notifications / alerts
- Historical timelines / charts / trends
- Clock-in / attendance / timesheet tracking
- Cloud sync / accounts / online services

Roadmap decisions are grounded in [PRODUCT.md](PRODUCT.md) and the [Contributing Guide](../.github/CONTRIBUTING.md).
