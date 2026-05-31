<p align="center">
  <img src="src-tauri/icons/icon.png" alt="PayDance" width="88"><br>
  <strong><font size="7">薪跳 PayDance</font></strong>
</p>

<p align="center">
  <strong><font size="6">Desktop Real-Time Salary Dashboard</font></strong>
</p>

<p align="center">
  <font size="5"><strong><a href="https://masterbao66.github.io/PayDance/">Live Preview</a></strong></font>
  &nbsp;&nbsp;&nbsp;
  <font size="5"><strong><a href="https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance-v0.9.3-windows-x64.exe">Windows Desktop</a></strong></font>
  &nbsp;&nbsp;&nbsp;
  <a href="README.md"><strong>中文</strong></a>
</p>

## About

PayDance (薪跳) is a real-time salary dashboard for Windows 11. Configure your salary and work hours, and it displays today's earnings on your desktop, increasing continuously as you work.

The main window shows today's earnings, work progress, remaining time, and daily estimate. The mini floating window keeps only the amount — perfect for tucking into a corner of your screen.

## Interface

<p align="center">
  <img src="marketing-posters/poster-02-three-step-setup-v3.png" alt="PayDance three-step setup" width="100%">
</p>

<p align="center">
  <strong>Three-step setup</strong><br>
  Salary mode, work hours, preferences — set once, remembered forever.
</p>

## Core Features

- **Real-time earnings ticker**: Continuously calculates today's earnings based on the current time, precise to 2 decimal places. Watch your income grow in real time.
- **Bilingual UI**: Full Chinese (简体中文) and English support — switch languages in settings. Tray menu, validation messages, and all UI copy are fully translated.
- **Multiple salary modes**: Supports monthly, daily, and hourly salary, with automatic conversion to per-day, per-hour, per-minute, and per-second rates.
- **Realistic time modeling**: Working days per month, workdays per week, start/end times, lunch break deduction, and overnight shifts across midnight.
- **Mini floating mode**: Shows only the core amount. Supports drag, double-click to restore the main window, always-on-top, and 10%–100% transparency.
- **Windows 11 desktop experience**: Frameless window, rounded corners, light/dark themes, system tray, always-on-top, auto-start, and silent background auto-update.
- **Local-first privacy**: No account required. Salary data stays on your machine. No telemetry, remote sync, or online accounts.
- **Web preview**: Try the core dashboard, setup wizard, and mini floating mode in your browser before downloading.
- **Release reliability**: Every release includes a portable EXE with SHA256 checksums and digital signatures. CI covers code hygiene, behavioral tests, desktop and web builds.

## Quick Download

| Platform | Download | Notes |
| --- | --- | --- |
| Web Preview | [PayDance Web](https://masterbao66.github.io/PayDance/) | Browser-based, all core features |
| Windows 11 Desktop | [pay-dance-v0.9.3-windows-x64.exe](https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance-v0.9.3-windows-x64.exe) | Full desktop experience: auto-start, always-on-top, mini floating mode, system tray |

Each release includes `pay-dance-v0.9.3-windows-x64.exe` and its `pay-dance-v0.9.3-windows-x64.exe.sha256`. On Windows, unsigned binaries may trigger a publisher verification prompt. Verify integrity using the SHA256 checksum:

```powershell
Get-FileHash .\pay-dance-v0.9.3-windows-x64.exe -Algorithm SHA256
Get-Content .\pay-dance-v0.9.3-windows-x64.exe.sha256
```

If the values match, your local file is identical to the release asset. If not, do not run it.

## Tech Stack

| Layer       | Technologies                                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop shell | Tauri 2, Rust, Windows tray, frameless window                                                                                           |
| Frontend    | Vue 3, TypeScript, Vite                                                                                                                    |
| Web Preview | Vite Web build, GitHub Pages, browser localStorage                                                                                         |
| UI          | Windows 11 styling, CSS Container Queries, @lucide/vue                                                                                     |
| Local storage | `@tauri-apps/plugin-store`, config saved to local app data directory                                                                     |
| Testing     | Vitest, @vue/test-utils, happy-dom, vue-tsc, cargo fmt, cargo clippy, cargo check                                                          |

Built with Vue 3 + TypeScript + Tauri 2. Core salary logic, state model, and UI are shared between the Web Preview and Windows desktop app. The primary validated platform is Windows 11. The web version serves as an online preview of core functionality.

## Developer Guide

Install dependencies and start local development:

```powershell
npm install
npm run tauri dev
```

Start Web Preview:

```powershell
npm run dev:web
```

Build portable Windows EXE:

```powershell
npm run build:exe
```

Build web preview:

```powershell
npm run build:web
```

Reset local config to re-trigger the onboarding wizard:

```powershell
Remove-Item "$env:APPDATA\com.masterbao.paydance\salary-settings.json" -ErrorAction SilentlyContinue
```

Full testing, code hygiene, version consistency, and release builds are handled automatically by CI/CD workflows. Day-to-day development only requires the core start and build commands above.

## Privacy

PayDance is local-first: no login, no salary data uploads, no telemetry, no remote sync, no online accounts. Configuration is saved via Tauri Store to `salary-settings.json` in the local app data directory, including salary settings, work hours, theme, always-on-top state, mini window opacity, amount animation mode, and onboarding state.

## Author & License

Designed and developed by Mr.Baoboer.

- Code is licensed under **AGPL-3.0-only**, with additional terms permitted by AGPL Section 7 for attribution, modification notices, anti-misrepresentation, and trademark reservation.
- "薪跳", `PayDance`, the logo, icons, website visuals, official screenshots, and release channels are not licensed with the code. Modified versions must use clearly distinguishable names, icons, application identifiers, and update channels.
- Compliant commercial use is allowed. Closed-source integration, OEM, white-label, or official brand licensing requires a separate commercial license.

For full license information, trademark policy, and commercial licensing terms, see the **[Legal Guide](legal/LEGAL_EN.md)**.

---

Full version history in [CHANGELOG.md](CHANGELOG.md). Build artifacts and checksums on [Releases](https://github.com/MasterBao66/PayDance/releases).

> [中文版 README →](README.md)
