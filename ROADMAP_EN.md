# Roadmap

> [中文版 →](ROADMAP.md)

This document describes the development direction for PayDance. No release dates are promised.

## Now

- Complete auto-update system (real signing, portable self-update, `latest.json`)
- Window position memory with multi-monitor recovery
- System clock calibration (sleep resume, timezone change, day crossing)
- Explicit config migration version chain
- Onboarding wizard "example awareness" (live preview)

## Next

- Authenticode code signing (reduce SmartScreen warnings)
- Mini window right-click menu (opacity, reset position, restore)
- Post-release asset smoke test automation
- Supply chain hardening (cargo audit, gitleaks, pinned Actions SHAs)
- SBOM generation

## Later

- English website entry (`/en/` + `hreflang`)
- Playwright screenshot regression
- Accessibility auto-check (axe-core)
- Windows native integration smoke tests
- Community contribution task labels
- Multi-currency support

## Never

These features are explicitly excluded. Related PRs will not be accepted:

- Keyboard shortcuts / hotkeys
- Reminders / notifications / alerts
- Historical timeline / charts / trends
- Clock-in / attendance / timesheet tracking
- Cloud sync / accounts / online services

See `PRODUCT.md` and `CONTRIBUTING.md` for details.
