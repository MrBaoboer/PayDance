# Security Policy

> [中文版 →](../.github/SECURITY.md)

## Supported Versions

Only the latest release receives security fixes. Older versions do not receive separate security patches.

| Version   | Supported            |
| --------- | -------------------- |
| latest    | :white_check_mark:  |
| < latest  | :x:                 |

## Supported Platforms

The currently released and security-supported surfaces are the **Windows 11 desktop app** and the **Web Preview**. The Tauri dependency graph may include upstream cross-platform dependencies for macOS/Linux in `Cargo.lock`; these dependencies are not ignored, but until a platform is officially shipped, related findings are assessed as unreleased-platform paths, documented, and tracked upstream.

## Reporting a Vulnerability

**Do NOT report security vulnerabilities through public GitHub Issues.**

Please report via either of the following private channels:

- **GitHub Security Advisory** (recommended): submit at [Security Advisories](https://github.com/MrBaoboer/PayDance/security/advisories/new)
- **Email**: see the email listed on the [author's GitHub profile](https://github.com/MrBaoboer), and include `[SECURITY]` in the subject line

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Any potential mitigations you've identified

### What to Expect

- **Acknowledgment**: Within 72 hours
- **Assessment**: Within 5 business days
- **Fix timeline**: Depends on severity; critical issues are prioritized
- **Disclosure**: After a fix is released and users have had reasonable time to update

## Sensitive Information

- **Never** paste salary data, configuration files, or log files into public Issues
- **Never** include private keys, signing keys, or secrets in any public channel
- PayDance stores salary configuration locally in `salary-settings.json` — this file contains personal information and should not be shared

## Signing Key Compromise

If the Tauri updater signing key is compromised:

1. Immediately revoke the compromised key
2. Generate a new key pair
3. Update `tauri.conf.json` with the new public key
4. Issue a new release signed with the new key
5. Previous releases will no longer be updatable — users must download manually

## Local Data

PayDance is a local-first application. Salary data, work schedules, and preferences are stored only on your device. No data is sent to remote servers. If you discover a vulnerability that could expose local configuration to unauthorized access, please report it immediately.
