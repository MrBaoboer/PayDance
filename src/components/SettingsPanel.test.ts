import { describe, expect, it } from "vitest";
import settingsPanelSource from "./SettingsPanel.vue?raw";

describe("settings panel", () => {
  it("shows the about version as a plain number", () => {
    const versionLine = settingsPanelSource
      .split("\n")
      .find((line) => line.includes("{{ appVersion }}"));
    const prefixedVersionTemplate = ["v", "{{ appVersion }}"].join("");

    expect(versionLine).toBeDefined();
    expect(versionLine).toContain("{{ appVersion }}");
    expect(versionLine).not.toContain(prefixedVersionTemplate);
  });

  it("organizes settings into focused cards instead of dense major groups", () => {
    [
      "薪资模式",
      "薪资",
      "每周工作日",
      "工作时间",
      "休息扣除",
      "显示",
      "关于",
    ].forEach((title) => {
      expect(settingsPanelSource).toContain(`data-settings-card="${title}"`);
    });

    expect(settingsPanelSource).not.toContain('data-settings-group="作息"');
  });

  it("keeps display settings limited to theme and amount animation", () => {
    expect(settingsPanelSource).toContain("themeMode");
    expect(settingsPanelSource).toContain("update:themeMode");
    expect(settingsPanelSource).toContain("amountMode");
    expect(settingsPanelSource).not.toContain("miniMode");
    expect(settingsPanelSource).not.toContain("startInMiniMode");
  });

  it("returns the salary input section to the v0.5.10 card behavior", () => {
    expect(settingsPanelSource).toContain("const salaryAmountLabel = computed");
    expect(settingsPanelSource).toContain("<span>{{ salaryAmountLabel }}</span>");
    expect(settingsPanelSource).toContain(
      'v-if="config.salaryType === \'monthly\'"',
    );
    expect(settingsPanelSource).toContain(
      'v-if="config.salaryType === \'daily\'"',
    );
    expect(settingsPanelSource).toContain(
      'v-if="config.salaryType === \'hourly\'"',
    );
    expect(settingsPanelSource).not.toContain("field-grid--salary");
    expect(settingsPanelSource).not.toContain("field-grid--single");

    const salaryModeCardStart = settingsPanelSource.indexOf(
      'data-settings-card="薪资模式"',
    );
    const salaryCardStart = settingsPanelSource.indexOf(
      'data-settings-card="薪资"',
    );

    expect(salaryModeCardStart).toBeGreaterThan(-1);
    expect(salaryCardStart).toBeGreaterThan(salaryModeCardStart);
  });

  it("uses a stable rest deduction card without extra explanatory copy", () => {
    expect(settingsPanelSource).toContain('data-settings-card="休息扣除"');
    expect(settingsPanelSource).toContain("group-title--split");
    expect(settingsPanelSource).toContain(
      ':disabled="!config.enableLunchBreak"',
    );
    expect(settingsPanelSource).not.toContain("break-row");
    expect(settingsPanelSource).not.toContain("从工作时长中扣除固定休息段");
  });

  it("places copyright under the GitHub repository entry", () => {
    expect(settingsPanelSource).toContain("about-footer__repo-card");
    expect(settingsPanelSource).toContain("about-footer__copyright");
    expect(settingsPanelSource).toContain("about-footer__copyright--centered");
    expect(settingsPanelSource.indexOf("repository-button")).toBeLessThan(
      settingsPanelSource.indexOf("about-footer__copyright"),
    );
  });
});
