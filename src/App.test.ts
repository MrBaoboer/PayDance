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

  it("passes autostart preferences into the first-run guide", () => {
    expect(appSource).toContain(':autostart-enabled="autostartEnabled"');
    expect(appSource).toContain('@update:autostart-enabled="updateAutostartEnabled"');
  });
});
