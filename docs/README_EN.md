
<p align="center">
  <img src="../src-tauri/icons/icon.png" alt="PayDance" width="88">
</p>

<h1 align="center">PayDance 薪跳</h1>

<p align="center">
  A desktop real-time salary dashboard that turns today's earnings into a quietly ticking number on your screen.
</p>

<p align="center">
  <a href="https://masterbao66.github.io/PayDance/"><strong>Live Preview</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://github.com/MasterBao66/PayDance/releases/latest"><strong>Download</strong></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="../README.md">中文</a>
</p>

## What It Is

PayDance (薪跳) is a desktop real-time salary dashboard. Configure your salary and work hours, and today's earnings appear on your desktop, ticking upward as you work.

The main window shows today's earnings, work progress, time remaining, and daily estimate. The mini floating window keeps only the amount — perfect for a corner of your screen.

<p align="center">
  <img src="posters/poster-02-three-step-setup-v3.png" alt="PayDance three-step setup" width="100%">
</p>

<p align="center">
  Salary mode, work hours, preferences — set once, remembered forever.
</p>

## Why Use It

- **Earnings made visible** — Today's income precise to 2 decimal places, ticking continuously, giving your work time a tangible sense of value.
- **Realistic work schedules** — Monthly/daily/hourly pay with auto-conversion; supports weekly workdays, lunch break exclusion, and overnight shifts.
- **Mini floating mode** — Amount only, draggable, always-on-top, 10%–100% opacity. Double-click to restore the main window.
- **Local-first privacy** — No accounts, no uploads, no telemetry. Your salary config stays on your machine.
- **Bilingual UI** — Full Simplified Chinese and English coverage across the interface, tray menu, and validation messages.
- **Windows 11 experience** — Frameless rounded windows, light/dark themes, system tray, auto-start, silent background updates.

## Get It

| &nbsp; | Link | Notes |
|:---:|:---:|:---:|
| 🌐 | **[Live Preview](https://masterbao66.github.io/PayDance/)** | Browser-based, all core features available |
| ⬇️ | **[Windows Desktop](https://github.com/MasterBao66/PayDance/releases/latest)** | Portable EXE with tray, pinning, mini float, auto-start |

Each release includes a SHA256 checksum file for integrity verification.

## Tech Stack

| Layer | Technologies |
|:---:|:---:|
| Desktop shell | Tauri 2 + Rust |
| Frontend | Vue 3 + TypeScript + Vite |
| UI | Windows 11 styling, CSS Container Queries, Lucide Icons |
| Storage | Local app data directory (Tauri Store) |
| Testing | Vitest + vue-tsc + cargo clippy |

The Web Preview and desktop app share core salary logic and frontend UI, deployed to GitHub Pages as an online demo.

## Development

```powershell
npm install
npm run tauri dev      # Desktop app
npm run dev:web        # Web Preview
npm run build:exe      # Build Windows portable EXE
npm run build:web      # Build web preview
```

For commit conventions, verification commands, and contribution guidelines, see the [Contributing Guide](../.github/CONTRIBUTING.md).

## Privacy

PayDance requires no login, uploads no data, and includes no telemetry. All configuration is saved locally via Tauri Store in `salary-settings.json`, containing only salary parameters, work hours, and UI preferences.

## Documentation

- [Product Positioning & Boundaries](PRODUCT.md)
- [Roadmap](ROADMAP_EN.md)
- [Changelog](../CHANGELOG.md)
- [License & Legal](../legal/LEGAL_EN.md)

## License

Designed and developed by Mr.Baoboer. Code licensed under [AGPL-3.0-only](../LICENSE).

For full license information and trademark policy, see the [Legal Guide](../legal/LEGAL_EN.md).

---

> [中文版 README →](../README.md)
