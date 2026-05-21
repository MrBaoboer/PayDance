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

  it("returns settings cards to the v0.5.10 structure", () => {
    [
      "薪资模式",
      "薪资",
      "每周工作日",
      "工作时间",
      "午休",
      "金额变换",
    ].forEach((title) => {
      expect(settingsPanelSource).toContain(`<strong>${title}</strong>`);
    });

    expect(settingsPanelSource).not.toContain("data-settings-card");
    expect(settingsPanelSource).not.toContain("<strong>显示</strong>");
    expect(settingsPanelSource).not.toContain("<strong>休息扣除</strong>");
    expect(settingsPanelSource).not.toContain("themeMode");
    expect(settingsPanelSource).not.toContain("update:themeMode");
  });

  it("keeps salary inputs exactly on the v0.5.10 card behavior", () => {
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
  });

  it("keeps the v0.5.10 lunch card interaction", () => {
    expect(settingsPanelSource).toContain("<strong>午休</strong>");
    expect(settingsPanelSource).toContain("<span>剔除</span>");
    expect(settingsPanelSource).toContain(
      ':disabled="!config.enableLunchBreak"',
    );
    expect(settingsPanelSource).not.toContain("休息扣除");
    expect(settingsPanelSource).not.toContain("从工作时长中扣除固定休息段");
  });

  it("keeps modified attribution footer but removes the about heading copy", () => {
    expect(settingsPanelSource).toContain("about-footer__repo-card");
    expect(settingsPanelSource).toContain("about-footer__copyright");
    expect(settingsPanelSource).toContain("about-footer__copyright--centered");
    expect(settingsPanelSource).not.toContain("<strong>关于</strong>");
    expect(settingsPanelSource).not.toContain('data-settings-card="关于"');
    expect(settingsPanelSource.indexOf("repository-button")).toBeLessThan(
      settingsPanelSource.indexOf("about-footer__copyright"),
    );
  });

  it("adds a lightweight autostart card without unrelated desktop controls", () => {
    const startupSection = settingsPanelSource.slice(
      settingsPanelSource.indexOf("<strong>启动</strong>"),
      settingsPanelSource.indexOf("settings-inline-error"),
    );

    expect(settingsPanelSource).toContain("<strong>启动</strong>");
    expect(settingsPanelSource).toContain("开机自动启动");
    expect(settingsPanelSource).toContain("autostartEnabled");
    expect(startupSection).toContain("switch-row--autostart");
    expect(startupSection).toContain("switch-row--title-action");
    expect(startupSection).toContain("开机自动启动");
    expect(settingsPanelSource).toContain(".switch-row--title-action");
    expect(settingsPanelSource).toContain("justify-content: flex-end");
    expect(settingsPanelSource).not.toContain("margin-right: clamp(3px, 0.9cqw, 5px)");
    expect(settingsPanelSource).not.toContain("快捷键");
    expect(settingsPanelSource).not.toContain("提醒");
    expect(settingsPanelSource).not.toContain("分段时间轴");
  });

  it("keeps the attribution footer balanced in narrow settings sheets", () => {
    expect(settingsPanelSource).toContain("flex: 1 1 clamp(180px, 50%, 260px)");
    expect(settingsPanelSource).toContain("min-width: clamp(92px, 20cqw, 112px)");
    expect(settingsPanelSource).toContain("width: clamp(92px, 20cqw, 108px)");
    expect(settingsPanelSource).toContain("box-shadow: 0 7px 18px rgb(15 23 42 / 0.08)");
    expect(settingsPanelSource).toContain("width: 20px");
    expect(settingsPanelSource).toContain(".about-footer__identity {\n    text-align: center;");
  });

  it("uses the dashboard numeric font for settings numbers, symbols, and repository text", () => {
    const fieldInputBlock = settingsPanelSource.slice(
      settingsPanelSource.indexOf(".field input {"),
      settingsPanelSource.indexOf(".field input[type=\"number\"]"),
    );

    expect(fieldInputBlock).toContain("font-family: var(--font-dashboard)");
    expect(fieldInputBlock).toContain("font-variant-numeric: tabular-nums");
    expect(fieldInputBlock).not.toContain("font-family: var(--font-mono)");
    expect(settingsPanelSource).toContain(".field-unit");
    expect(settingsPanelSource).toContain("font-family: var(--font-dashboard)");
    expect(settingsPanelSource).toContain(".repository-button");
    expect(settingsPanelSource).toContain(".about-footer__identity span");
    expect(settingsPanelSource).toContain("font-variant-numeric: tabular-nums");
  });
});
