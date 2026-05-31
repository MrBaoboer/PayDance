# Security Policy

## Supported Versions

Only the latest release receives security fixes. Older versions are not supported.

| Version   | Supported            |
| --------- | -------------------- |
| latest    | :white_check_mark:  |
| < latest  | :x:                 |

## Reporting a Vulnerability

**Do NOT report security vulnerabilities through public GitHub Issues.**

Please report via either of the following private channels:

- **GitHub Security Advisory** (recommended): submit at [Security Advisories](https://github.com/MasterBao66/PayDance/security/advisories/new)
- **Email**: see the email listed on the [author's GitHub profile](https://github.com/MasterBao66) (include `[SECURITY]` in the subject line)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Any potential mitigations you've identified

### What to Expect

- **Acknowledgment**: Within 72 hours
- **Assessment**: Within 5 business days
- **Fix timeline**: Depends on severity; critical issues patched as quickly as possible
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

> [中文版安全策略 →](SECURITY.md)
