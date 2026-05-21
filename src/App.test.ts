import { describe, expect, it } from "vitest";
import appSource from "./App.vue?raw";

describe("main dashboard shell", () => {
  it("removes the v0.6.0 pulse line from the main surface", () => {
    expect(appSource).not.toContain("getDashboardCopy");
    expect(appSource).not.toContain("income-pulse");
    expect(appSource).not.toContain("dashboardCopy");
  });

  it("keeps salary details as the quieter salary explanation entry", () => {
    expect(appSource).toContain("hero-controls");
    expect(appSource).toContain("hero-dashboard");
    expect(appSource).toContain("salary-info-button--quiet");
    expect(appSource).toContain("薪资说明");
    expect(appSource).not.toContain("薪资明细");
    expect(appSource).not.toContain("dashboard-controls");
  });

  it("uses v0.6.0-style h/m durations on the main dashboard", () => {
    expect(appSource).toContain("formatDashboardDuration");
    expect(appSource).toContain('value: "0m"');
    expect(appSource).not.toContain("MIN");
  });

  it("formats money without thousands separators on the main surface", () => {
    expect(appSource).toContain("useGrouping: false");
  });

  it("balances the dashboard as part of the main amount stack instead of pinning it to the bottom", () => {
    expect(appSource).toContain("--hero-dashboard-gap");
    expect(appSource).toContain("margin-top: var(--hero-dashboard-gap)");
    expect(appSource).not.toContain("margin-top: auto");
  });

  it("gives the salary explanation entry more breathing room below the dashboard", () => {
    expect(appSource).toContain("--salary-info-offset");
    expect(appSource).toContain("--salary-info-offset: clamp(15px, 3.7cqh, 22px)");
    expect(appSource).toContain("margin-top: var(--salary-info-offset)");
  });

  it("keeps the salary explanation entry text-like instead of adding a third surface layer", () => {
    expect(appSource).toContain(".theme-light .salary-info-button:hover");
    expect(appSource).toContain("border-radius: 999px");
    expect(appSource).toContain("background: rgb(245 158 11 / 0.08)");
    expect(appSource).not.toContain("box-shadow: 0 8px 22px rgb(245 158 11 / 0.16)");
    expect(appSource).not.toContain("background: color-mix(in srgb, var(--income-accent) 10%, white 90%)");
  });

  it("guards theme switching so native and web themes do not race", () => {
    expect(appSource).toContain("const isThemeSwitching = ref(false)");
    expect(appSource).toContain("let themeApplyToken = 0");
    expect(appSource).toContain("const applyThemeMode = async");
    expect(appSource).toContain("const token = ++themeApplyToken");
    expect(appSource).toContain("if (token !== themeApplyToken) return");
    expect(appSource).toContain("if (isThemeSwitching.value) return");
    expect(appSource.indexOf("themeMode.value = mode")).toBeLessThan(
      appSource.indexOf("await appWindow.setTheme(mode)"),
    );
  });

  it("keeps theme switching as a logic guard without freezing the whole UI", () => {
    expect(appSource).not.toContain("'is-theme-switching': isThemeSwitching");
    expect(appSource).not.toContain(".is-theme-switching");
    expect(appSource).not.toContain("transition: none !important");
  });

  it("uses flat dark-theme hover and dashboard tokens", () => {
    expect(appSource).toContain(".theme-dark .salary-info-button:hover");
    expect(appSource).toContain("--progress-track-bg");
    expect(appSource).toContain("--progress-fill-bg");
    expect(appSource).toContain("--progress-dot-border");
    expect(appSource).toContain("box-shadow: none");
  });

  it("removes the full-window outer gutter while giving theme switches a synced shell surface", () => {
    expect(appSource).toContain("app-shell h-full w-full select-none p-0");
    expect(appSource).not.toContain("bg-transparent p-2");
    expect(appSource).toContain("border: 0;");
    expect(appSource).toContain("'is-theme-syncing': isThemeSwitching");
    expect(appSource).toContain(".app-shell.is-theme-syncing::before");
    expect(appSource).toContain("background: var(--panel)");
  });

  it("keeps a premium dashboard surface without the dirty white haze in dark mode", () => {
    expect(appSource).toContain("--dashboard-panel: rgb(255 255 255 / 0.5)");
    expect(appSource).toContain("--dashboard-panel: rgb(17 17 21 / 0.88)");
    expect(appSource).toContain("--dashboard-border: rgb(255 255 255 / 0.72)");
    expect(appSource).toContain("--dashboard-border: rgb(255 255 255 / 0.1)");
    expect(appSource).toContain("--dashboard-shadow: 0 16px 42px rgb(15 23 42 / 0.1)");
    expect(appSource).not.toContain("rgb(255 255 255 / 0.11)");
    expect(appSource).not.toContain("radial-gradient");
  });

  it("keeps the progress track flat while restoring the v0.6.6 dark fill glow", () => {
    expect(appSource).toContain("--progress-track-shadow: none");
    expect(appSource).toContain("--progress-fill-bg: linear-gradient(90deg, rgb(217 119 6), rgb(245 158 11) 62%, rgb(252 211 77))");
  });

  it("passes autostart preferences into the first-run guide", () => {
    expect(appSource).toContain(':autostart-enabled="autostartEnabled"');
    expect(appSource).toContain('@update:autostart-enabled="updateAutostartEnabled"');
  });
});
