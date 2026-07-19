# Maintainers

> [中文版 →](MAINTAINERS.md)

PayDance is currently maintained by one person.

## Current Maintainer

- Mr.Baoboer / MrBaoboer
- GitHub profile: <https://github.com/MrBaoboer>

## Response Priorities

- Security reports: handled according to the [Security Policy](SECURITY_EN.md).
- Reproducible bugs: usually reviewed before feature requests.
- Pull requests: prioritized when they are scoped, verified, and aligned with [Product Boundaries](PRODUCT_EN.md).
- First contributions: start with `good first issue` or `help wanted` when available.

There is no fixed response-time promise. This is a solo-maintained project, so response quality and release quality come first.

## Merge Standard

- One pull request should solve one main problem.
- User-visible behavior needs tests; when automation is not practical, document the manual smoke path.
- UI changes need screenshots for Chinese/English and light/dark states.
- Release-chain, updater, security, legal, and brand changes require maintainer confirmation even when tests pass.

## Release Cadence

PayDance does not use a fixed release train. A release is cut when a coherent set of changes has been verified.

Before release, CI, Web Preview QA, desktop smoke checks, and release metadata checks should pass.
