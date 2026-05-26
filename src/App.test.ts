import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import appSource from "./App.vue?raw";
import desktopAppSource from "./DesktopApp.vue?raw";
import runtimeSource from "./platform/runtime.ts?raw";
import themeSyncSource from "./composables/useThemeSync.ts?raw";
import dashboardModelSource from "./composables/useDashboardModel.ts?raw";
import mainDashboardSource from "./components/MainDashboard.vue?raw";
import appWindowSource from "./components/AppWindow.vue?raw";
import moneyFormatSource from "./lib/money-format.ts?raw";

const appThemeSource = readFileSync(
  new URL("./styles/app-theme.css", import.meta.url),
  "utf8",
);
const appShellSource = readFileSync(
  new URL("./styles/app-shell.css", import.meta.url),
  "utf8",
);

describe("main dashboard shell", () => {
  it("keeps App.vue as a runtime selector under the 300-line architecture budget", () => {
    expect(appSource.split(/\r?\n/).length).toBeLessThanOrEqual(300);
    expect(appSource).toContain("WebPreviewApp");
    expect(appSource).toContain("DesktopApp");
    expect(runtimeSource).toContain('import.meta.env.MODE === "web"');
    expect(runtimeSource).toContain('import.meta.env.VITE_PAYDANCE_TARGET === "web"');
    expect(runtimeSource).toContain(': "desktop"');
    expect(appSource).toContain(
      'isWebPreview ? import("./WebPreviewApp.vue") : import("./DesktopApp.vue")',
    );
  });

  it("keeps DesktopApp.vue as a page shell under the 300-line architecture budget", () => {
    expect(desktopAppSource.split(/\r?\n/).length).toBeLessThanOrEqual(300);
    expect(desktopAppSource).not.toContain(':show-desktop-features="false"');
    expect(desktopAppSource).toContain("@toggle-always-on-top");
    expect(desktopAppSource).toContain("@toggle-mini-mode");
    expect(desktopAppSource).toContain("@update:autostart-enabled");
  });

  it("removes the v0.6.0 pulse line from the main surface", () => {
    expect(desktopAppSource).not.toContain("getDashboardCopy");
    expect(desktopAppSource).not.toContain("income-pulse");
    expect(desktopAppSource).not.toContain("dashboardCopy");
  });

  it("keeps salary details as the quieter salary explanation entry", () => {
    expect(mainDashboardSource).toContain("hero-controls");
    expect(mainDashboardSource).toContain("hero-dashboard");
    expect(mainDashboardSource).toContain("salary-info-button--quiet");
    expect(appWindowSource).toContain("SalaryInfoSheet");
    expect(mainDashboardSource).not.toContain("薪资明细");
    expect(mainDashboardSource).not.toContain("dashboard-controls");
  });

  it("uses v0.6.0-style h/m durations on the main dashboard", () => {
    expect(dashboardModelSource).toContain("formatDashboardDuration");
    expect(dashboardModelSource).toContain('value: "0m"');
    expect(dashboardModelSource).not.toContain("MIN");
  });

  it("formats money without thousands separators on the main surface", () => {
    expect(moneyFormatSource).toContain("useGrouping: false");
  });

  it("balances the dashboard as part of the main amount stack instead of pinning it to the bottom", () => {
    expect(appShellSource).toContain("--hero-dashboard-gap");
    expect(mainDashboardSource).toContain("margin-top: var(--hero-dashboard-gap)");
    expect(mainDashboardSource).not.toContain("margin-top: auto");
  });

  it("gives the salary explanation entry more breathing room below the dashboard", () => {
    expect(appShellSource).toContain("--salary-info-offset");
    expect(appShellSource).toContain("--salary-info-offset: clamp(15px, 3.7cqh, 22px)");
    expect(mainDashboardSource).toContain("margin-top: var(--salary-info-offset)");
  });

  it("keeps the salary explanation entry text-like instead of adding a third surface layer", () => {
    expect(mainDashboardSource).toContain(
      ":global(.theme-light) .salary-info-button:hover",
    );
    expect(mainDashboardSource).toContain("border-radius: 999px");
    expect(mainDashboardSource).toContain("background: rgb(245 158 11 / 0.08)");
    expect(mainDashboardSource).not.toContain(
      "box-shadow: 0 8px 22px rgb(245 158 11 / 0.16)",
    );
    expect(mainDashboardSource).not.toContain(
      "background: color-mix(in srgb, var(--income-accent) 10%, white 90%)",
    );
  });

  it("guards theme switching so native and web themes do not race", () => {
    expect(themeSyncSource).toContain("const isThemeSwitching = ref(false)");
    expect(themeSyncSource).toContain("let themeApplyToken = 0");
    expect(themeSyncSource).toContain("const applyThemeMode = async");
    expect(themeSyncSource).toContain("const token = ++themeApplyToken");
    expect(themeSyncSource).toContain("if (token !== themeApplyToken) return");
    expect(themeSyncSource).toContain("if (isThemeSwitching.value) return");
    expect(themeSyncSource.indexOf("themeMode.value = mode")).toBeLessThan(
      themeSyncSource.indexOf("await appWindow.setTheme(mode)"),
    );
    expect(desktopAppSource).toContain("useThemeSync(");
    expect(desktopAppSource).toContain("saveStateNow,");
    expect(desktopAppSource).not.toContain("let themeApplyToken = 0");
  });

  it("keeps theme switching as a logic guard without freezing the whole UI", () => {
    expect(desktopAppSource).not.toContain("transition: none !important");
  });

  it("uses flat dark-theme hover and dashboard tokens", () => {
    expect(mainDashboardSource).toContain(
      ":global(.theme-dark) .salary-info-button:hover",
    );
    expect(appThemeSource).toContain("--progress-track-bg");
    expect(appThemeSource).toContain("--progress-fill-bg");
    expect(appThemeSource).toContain("--progress-dot-border");
    expect(appShellSource).toContain("box-shadow: none");
  });

  it("removes the full-window outer gutter while giving theme switches a synced shell surface", () => {
    expect(desktopAppSource).toContain("app-shell h-full w-full select-none p-0");
    expect(desktopAppSource).not.toContain("bg-transparent p-2");
    expect(appShellSource).toContain("border: 0;");
    expect(appShellSource).toContain(".app-window");
    expect(appShellSource).toContain("border-radius: inherit");
    expect(appShellSource).toContain("background: transparent");
    expect(desktopAppSource).toContain("'is-theme-syncing': isThemeSwitching");
    expect(appShellSource).toContain(".app-shell.is-theme-syncing::before");
    expect(appShellSource).not.toContain("opacity: 0.9");
  });

  it("keeps shell radius ownership in one layer to avoid dark-mode corner halos", () => {
    const windowBlock = appShellSource.slice(
      appShellSource.indexOf(".app-window {"),
      appShellSource.indexOf(".settings-overlay {"),
    );

    expect(appShellSource).toContain(".app-shell {");
    expect(appShellSource).toContain("border-radius: 22px");
    expect(windowBlock).toContain("border-radius: inherit");
    expect(windowBlock).toContain("background: transparent");
    expect(windowBlock).toContain("box-shadow: none");
    expect(windowBlock).not.toContain("background: var(--panel)");
    expect(windowBlock).not.toContain("box-shadow: var(--shadow)");
  });

  it("keeps a premium dashboard surface without the dirty white haze in dark mode", () => {
    expect(appThemeSource).toContain("--dashboard-panel: rgb(255 255 255 / 0.5)");
    expect(appThemeSource).toContain("--dashboard-panel: rgb(12 12 15 / 0.92)");
    expect(appThemeSource).toContain("--dashboard-border: rgb(255 255 255 / 0.72)");
    expect(appThemeSource).toContain("--dashboard-border: rgb(255 255 255 / 0.1)");
    expect(appThemeSource).toContain(
      "--dashboard-shadow: 0 16px 42px rgb(15 23 42 / 0.1)",
    );
    expect(appThemeSource).not.toContain("rgb(255 255 255 / 0.11)");
    expect(mainDashboardSource).not.toContain("radial-gradient");
  });

  it("keeps the progress track flat while restoring the v0.6.6 dark fill glow", () => {
    expect(appThemeSource).toContain("--progress-track-shadow: none");
    expect(appThemeSource).toContain("--progress-fill-bg: linear-gradient(");
    expect(appThemeSource).toContain("rgb(245 158 11) 62%");
    expect(appThemeSource).toContain("rgb(252 211 77)");
  });

  it("keeps theme tokens out of App.vue", () => {
    expect(desktopAppSource).not.toContain(".theme-light {");
    expect(desktopAppSource).not.toContain(".theme-dark {");
  });

  it("passes autostart preferences into the first-run guide", () => {
    expect(appWindowSource).toContain(':autostart-enabled="autostartEnabled"');
    expect(desktopAppSource).toContain(
      '@update:autostart-enabled="updateAutostartEnabled"',
    );
  });
});
