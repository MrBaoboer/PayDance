# Maintainers

PayDance is currently maintained by a solo maintainer.

## Current Maintainer

- Mr.Baoboer / MasterBao66
- Public profile: <https://github.com/MasterBao66>

## Response Cadence

- Security reports: handled according to [.github/SECURITY.md](.github/SECURITY.md).
- Bug reports with clear reproduction steps: reviewed when maintainer capacity is
  available, usually before feature requests.
- Pull requests: reviewed only when they stay within [docs/PRODUCT.md](docs/PRODUCT.md)
  and include the verification requested in [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md).
- Low-risk first contributions: prefer issues labeled `good first issue` or
  `help wanted`.

## Merge Standard

- One pull request should solve one problem.
- User-facing behavior needs tests or a documented manual smoke path.
- UI changes need screenshots for Chinese/English and light/dark states.
- Release-chain, updater, security, and legal changes require maintainer review
  even when tests pass.

## Release Cadence

PayDance does not promise a fixed release train. Releases are cut when a coherent
set of fixes or improvements has passed CI, Web Preview QA, desktop smoke
checks, and release metadata checks.
