import { describe, expect, it } from "vitest";
import settingsPanelSource from "./SettingsPanel.vue?raw";
import settingsGroupSource from "./ui/SettingsGroup.vue?raw";
import switchRowSource from "./ui/SwitchRow.vue?raw";
import lunchBreakFieldsSource from "./settings/LunchBreakFields.vue?raw";
import salaryAmountFieldsSource from "./settings/SalaryAmountFields.vue?raw";
import workTimeFieldsSource from "./settings/WorkTimeFields.vue?raw";

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
    ["薪资模式", "薪资", "每周工作日", "工作时间", "金额变换"].forEach((title) => {
      expect(settingsPanelSource).toContain(`<SettingsGroup title="${title}">`);
    });

    expect(settingsPanelSource).toContain("<LunchBreakFields");
    expect(lunchBreakFieldsSource).toContain("<strong>午休</strong>");
    expect(settingsPanelSource).not.toContain("data-settings-card");
    expect(settingsPanelSource).not.toContain("<strong>显示</strong>");
    expect(settingsPanelSource).not.toContain("<strong>休息扣除</strong>");
    expect(settingsPanelSource).not.toContain("themeMode");
    expect(settingsPanelSource).not.toContain("update:themeMode");
  });

  it("keeps salary inputs on the shared v0.5.10 card behavior", () => {
    expect(settingsPanelSource).toContain("<SalaryAmountFields");
    expect(salaryAmountFieldsSource).toContain("const salaryAmountLabel = computed");
    expect(salaryAmountFieldsSource).toContain("<span>{{ salaryAmountLabel }}</span>");
    expect(salaryAmountFieldsSource).toContain(
      "v-if=\"config.salaryType === 'monthly'\"",
    );
    expect(salaryAmountFieldsSource).toContain("v-if=\"config.salaryType === 'daily'\"");
    expect(salaryAmountFieldsSource).toContain("v-if=\"config.salaryType === 'hourly'\"");
    expect(salaryAmountFieldsSource).not.toContain("field-grid--salary");
    expect(salaryAmountFieldsSource).not.toContain("field-grid--single");
  });

  it("keeps the v0.5.10 lunch card interaction", () => {
    expect(settingsPanelSource).toContain("<LunchBreakFields");
    expect(lunchBreakFieldsSource).toContain("<strong>午休</strong>");
    expect(lunchBreakFieldsSource).toContain('label="剔除"');
    expect(lunchBreakFieldsSource).toContain(':disabled="!config.enableLunchBreak"');
    expect(lunchBreakFieldsSource).not.toContain("休息扣除");
    expect(lunchBreakFieldsSource).not.toContain("从工作时长中扣除固定休息段");
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
      settingsPanelSource.indexOf('<SettingsGroup title="启动">'),
      settingsPanelSource.indexOf("settings-inline-error"),
    );

    expect(settingsPanelSource).toContain('<SettingsGroup title="启动">');
    expect(settingsPanelSource).toContain("开机自动启动");
    expect(settingsPanelSource).toContain("autostartEnabled");
    expect(startupSection).toContain("<SwitchRow");
    expect(startupSection).toContain("title-action");
    expect(startupSection).toContain("开机自动启动");
    expect(switchRowSource).toContain(".switch-row--title-action");
    expect(switchRowSource).toContain("justify-content: flex-end");
    expect(settingsPanelSource).not.toContain("margin-right: clamp(3px, 0.9cqw, 5px)");
    expect(settingsPanelSource).not.toContain("快捷键");
    expect(settingsPanelSource).not.toContain("提醒");
    expect(settingsPanelSource).not.toContain("分段时间轴");
  });

  it("uses a slightly more breathable settings rhythm", () => {
    expect(settingsPanelSource).toContain("gap: clamp(11px, 2.6cqh, 14px)");
    expect(settingsPanelSource).toContain("padding: clamp(15px, 3.6cqw, 19px)");
    expect(settingsGroupSource).toContain("padding: clamp(12px, 3cqw, 15px)");
  });

  it("keeps the attribution footer balanced in narrow settings sheets", () => {
    expect(settingsPanelSource).toContain("grid-template-columns: minmax(0, 1fr) auto");
    expect(settingsPanelSource).toContain("min-width: clamp(96px, 20cqw, 112px)");
    expect(settingsPanelSource).toContain("min-width: clamp(92px, 20cqw, 112px)");
    expect(settingsPanelSource).toContain("width: clamp(92px, 20cqw, 108px)");
    expect(settingsPanelSource).toContain("box-shadow: 0 7px 18px rgb(15 23 42 / 0.08)");
    expect(settingsPanelSource).toContain("width: 20px");
    expect(settingsPanelSource).not.toContain("flex-wrap: wrap");
    expect(settingsPanelSource).not.toContain(
      ".about-footer__identity {\n    text-align: center;",
    );
  });

  it("keeps settings field groups in two columns at the minimum desktop width", () => {
    [salaryAmountFieldsSource, workTimeFieldsSource, lunchBreakFieldsSource].forEach(
      (source) => {
        expect(source).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
        expect(source).not.toContain("@media (max-width: 460px)");
      },
    );
  });

  it("uses the dashboard numeric font for settings numbers, symbols, and repository text", () => {
    const fieldInputBlock = salaryAmountFieldsSource.slice(
      salaryAmountFieldsSource.indexOf(".field input {"),
      salaryAmountFieldsSource.indexOf('.field input[type="number"]'),
    );

    expect(fieldInputBlock).toContain("font-family: var(--font-dashboard)");
    expect(fieldInputBlock).toContain("font-variant-numeric: tabular-nums");
    expect(fieldInputBlock).not.toContain("font-family: var(--font-mono)");
    expect(salaryAmountFieldsSource).toContain(".field-unit");
    expect(salaryAmountFieldsSource).toContain("font-family: var(--font-dashboard)");
    expect(settingsPanelSource).toContain(".repository-button");
    expect(settingsPanelSource).toContain(".about-footer__identity span");
    expect(settingsPanelSource).toContain("font-variant-numeric: tabular-nums");
  });
});
