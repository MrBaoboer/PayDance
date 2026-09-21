# FAQ

> [中文版 →](FAQ.md)

For product scope, see [PRODUCT_EN.md](PRODUCT_EN.md); for support and feedback paths, see [SUPPORT_EN.md](SUPPORT_EN.md).

## Download and Usage

### Web Preview or the Windows desktop app?

Use the [Web Preview](https://paydance.vercel.app/en/) to try the interface and calculation logic. The mini window and opacity control are simulated in the browser; the system tray, always-on-top mode, and auto-start are available only in the Windows desktop app.

### Which file should I download?

From the [latest Release](https://github.com/MrBaoboer/PayDance/releases/latest), download `pay-dance-v<version>-windows-x64.exe`; it is the only EXE on the Release. The website download button always redirects to this file for the newest version. Verify it against the `.sha256` file on the same page:

```powershell
Get-FileHash .\pay-dance-v<version>-windows-x64.exe -Algorithm SHA256
```

The printed hash must match the one inside the `.sha256` file; case does not matter.

### Windows says "Windows protected your PC" on first launch. Now what?

That is the default SmartScreen prompt for programs without a code-signing certificate, not a verdict on the file. Click **More info**, then **Run anyway**; the prompt appears once per downloaded file. If you are worried about tampering, verify the `.sha256` first. The EXE carries an updater signature but no Authenticode certificate yet; see the [roadmap](ROADMAP_EN.md).

### How do I remove PayDance completely?

1. If auto-start was ever enabled, turn it off in Settings.
2. Quit PayDance from the tray.
3. Delete the EXE file.
4. To also erase your salary settings, delete `%APPDATA%\com.masterbao.paydance\salary-settings.json`.

### How do I open the first-run wizard again?

Close the app, delete the local settings file, then start PayDance again:

```powershell
Remove-Item "$env:APPDATA\com.masterbao.paydance\salary-settings.json"
```

### Do Web Preview settings affect the desktop app?

No. The Web Preview keeps settings in browser `localStorage`; the desktop app uses Tauri Store in your local app data directory. Neither one reads the other.

## Salary and Time Calculation

### How is today's amount calculated?

Choose monthly, daily, or hourly pay. PayDance first works out the day's effective working time from your workdays, start and end times, and lunch-break setting, then works out the day's pay: monthly salary divided by the "Work days per month" setting, daily salary as entered, or hourly rate times the effective working time. Today's amount grows in proportion to the effective working time already elapsed.

### Is the lunch break included in the calculation?

It depends on your settings. With lunch-break exclusion on, the break is not counted as effective work time. If your own pay rule does not deduct it, turn the option off.

### Are night shifts and work past midnight supported?

Yes. When the end time is earlier than the start time, the shift is treated as crossing midnight, and earnings keep accumulating for that same shift past 00:00.

### The amount is 0 or never moves

Check the status at the left of the title bar first. "Day Off" means today is not one of your workdays; "Not Yet" and "Off Work" mean the current time is outside your working hours; "Lunch Break" means lunch exclusion is on; "Needs Setup" means a setting is invalid, and Settings shows which one. If none of these applies, check the system clock and time zone.

### Does the amount match my actual paycheck?

No. It is a live estimate based on the salary and schedule you entered. It does not account for taxes, benefits, bonuses, leave, overtime, or employer-specific payroll rules.

## Privacy and Local Data

### Is my salary data uploaded?

No. PayDance has no account, cloud sync, telemetry, or advertising. Salary, working hours, and UI preferences stay on your device.

### Where are settings stored?

The Windows desktop app writes settings through Tauri Store to `%APPDATA%\com.masterbao.paydance\salary-settings.json`. That file holds your salary figures, so it counts as personal data. Delete it and the next launch starts from the first-run wizard.

## Desktop Capabilities

### How does the mini floating window work?

Double-click the amount in the main window to switch to mini floating mode. The mini window shows only the amount. Right-click it to adjust opacity, and double-click to restore the main window.

### Why does PayDance keep running after I close the main window?

The main window's close button hides PayDance to the system tray. Use the tray menu to reopen the window or quit the app. Always-on-top and auto-start can be changed independently in Settings.

### Launch at startup does not work

The startup entry records the EXE path at the moment you enable it. After moving or renaming the EXE, turn the switch off and on again. Some security software blocks the entry and needs an exception.

### The update fails

Updating needs access to GitHub and a writable folder around the EXE. On failure the bottom of Settings shows "Update failed, click to retry"; if that keeps failing, download the new EXE from the [latest Release](https://github.com/MrBaoboer/PayDance/releases/latest) and replace the old file. Your settings are kept.

### The settings file cannot be read

The app retries once; if the file still cannot be read it is renamed to `salary-settings.json.bak-<timestamp>` and rebuilt with defaults. When no backup is possible the file is left untouched and Settings explains why. If it keeps happening, quit the app, delete `%APPDATA%\com.masterbao.paydance\salary-settings.json`, and start again.

### Multi-monitor or high-DPI display looks wrong — what now?

If the window is stuck somewhere invisible, click the tray icon: the app pulls it back into the visible area. If that does not help, quit the app and delete the `mainPosition` and `miniPosition` fields from `salary-settings.json` (or the whole file), then restart. If the problem persists, report it through [SUPPORT_EN.md](SUPPORT_EN.md) with the app version, Windows version, monitor count, DPI scaling, and reproduction steps; screenshots or a recording help.

## Open Source, License, and Branding

### What license is it under, and can I use it commercially?

The code is released under [AGPL-3.0-only](../LICENSE) with additional terms permitted by AGPL Section 7. Commercial use must comply with both. Closed-source integration, OEM, white-label distribution, and official brand use require separate permission. See [LEGAL_EN.md](../legal/LEGAL_EN.md).

### Can I fork it or publish a modified version?

Yes, but a modified version must preserve the required legal notices, state that it is not an official release, and use distinguishable names, icons, application identifiers, and release channels so it is not mistaken for the official build. For trademark and brand asset boundaries, see [TRADEMARK_EN.md](../legal/TRADEMARK_EN.md) and [BRAND-ASSETS_EN.md](../legal/BRAND-ASSETS_EN.md).

### Is there a macOS or Linux build?

Only the Windows desktop app and the Web Preview exist today. A macOS build is open for community contribution; the proposal thread and progress live in [#65](https://github.com/MrBaoboer/PayDance/issues/65).

## Contributions and Feedback

### How do I report a bug?

Use the repository's Bug Report form; [SUPPORT_EN.md](SUPPORT_EN.md) lists what to include. Issues are public, so do not attach salary data or settings files.

### What should I read before suggesting a feature?

Start with the product scope in [PRODUCT_EN.md](PRODUCT_EN.md). Describing the specific situation your idea solves helps more than describing the feature itself.

### Where can developers start?

Read the [Contributing Guide](CONTRIBUTING_EN.md). The open collaboration entry points today are the macOS call for contributors ([#65](https://github.com/MrBaoboer/PayDance/issues/65)) and issues labeled `help wanted`; ideas and questions are welcome in [Discussions](https://github.com/MrBaoboer/PayDance/discussions). Documentation and tests usually do not require a full Windows desktop environment.
