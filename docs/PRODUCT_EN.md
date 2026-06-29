# PRODUCT

> [中文版 →](PRODUCT.md)

This document defines PayDance's product positioning, capability boundaries, and trade-off principles so future releases do not drift away from the core experience of a desktop real-time wage board.

## One-Sentence Positioning

PayDance is a desktop real-time wage board that turns today's earnings into a quiet, always-available, live-updating dashboard you can scan at a glance.

## Who It Is For

- Windows 11 desktop users who want a more tangible sense of the value of their working time.
- People who prefer lightweight utilities with no account, local storage, and no uploaded data.
- Users who want always-on-top windows, a system tray, a mini floating earnings window, and a low-distraction persistent experience.
- People who want to try the feel in a browser before deciding whether to download the official desktop app.

## Core Value

- **Visible earnings**: today's earnings keep growing with working time, so every second of income becomes visible.
- **Readable at a glance**: the main window shows today's earnings, time worked, time until the end of the shift, estimated daily earnings, and progress.
- **Useful in a corner**: the mini floating window keeps only the amount, making it suitable for long-term placement in a screen corner.
- **Closer to real work schedules**: supports monthly, daily, and hourly salary modes, weekly workdays, lunch-break exclusion, and night shifts crossing midnight.
- **Local-first**: salary and schedule settings stay on the device. PayDance does not add login, cloud sync, telemetry, or ads.

## Product Boundaries

The following directions are currently outside the product scope:

- Keyboard shortcuts / hotkeys
- Reminders / notifications / alerts
- Historical timelines, charts, or trend analysis
- Clock-in, attendance, or timesheet tracking
- Cloud sync, account systems, or online services
- Turning mini floating mode into a complex panel
- Presenting the Web Preview as the full desktop app

This is not a rejection of every suggestion. It protects the core experience. Any new feature should first answer one question: does it help users see "the money they are earning today" more easily?

## Experience Principles

- The main window provides complete information; the mini floating window provides a low-presence persistent amount.
- Web Preview is an online storefront that lowers the first-try barrier; the Windows desktop app remains the complete product.
- Salary explanations and settings are low-frequency entry points and should not compete with the main dashboard for attention.
- All error messages should be concise, direct, and actionable.
- New features should first serve the experience of "seeing how much each second earns" rather than complexity unrelated to the core value.

## Platform Strategy

The current official release and validation priority is Windows 11. The project uses Vue 3, TypeScript, and Tauri 2. Web Preview is published primarily on Vercel as the online experience entry point, providing browser-based simulations of core calculation, first-run setup, settings, and mini floating mode; GitHub Pages may remain available as a repository mirror and release-validation entry.

This does not exclude macOS, Linux, or other platforms. Community contributors can first submit platform-adaptation proposals and validation results. Before an official release, the project still needs clear build, validation, updater, and maintenance boundaries. The Windows desktop app currently carries the complete capabilities, including tray support, always-on-top mode, transparent windows, mini floating mode, system materials, and autostart.
