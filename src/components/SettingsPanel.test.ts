// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import settingsPanelSource from "./SettingsPanel.vue?raw";
import settingsGroupSource from "./ui/SettingsGroup.vue?raw";
import switchRowSource from "./ui/SwitchRow.vue?raw";
import lunchBreakFieldsSource from "./settings/LunchBreakFields.vue?raw";
import salaryAmountFieldsSource from "./settings/SalaryAmountFields.vue?raw";
import settingsAboutFooterSource from "./settings/SettingsAboutFooter.vue?raw";
import settingsOnboardingActionSource from "./settings/SettingsOnboardingAction.vue?raw";
import updateActionBadgeSource from "./settings/UpdateActionBadge.vue?raw";
import workTimeFieldsSource from "./settings/WorkTimeFields.vue?raw";

describe("settings panel", () => {
  it("shows the about version as a plain number", () => {
    const versionLine = settingsAboutFooterSource
      .split("\n")
      .find((line) => line.includes("{{ appVersion }}"));
    const prefixedVersionTemplate = ["v", "{{ appVersion }}"].join("");

    expect(versionLine).toBeDefined();
    expect(versionLine).toContain("{{ appVersion }}");
    expect(versionLine).not.toContain(prefixedVersionTemplate);
  });

  it("returns settings cards to the v0.5.10 structure", () => {
    [
      "t('settings.salaryMode')",
      "t('settings.salary')",
      "t('settings.workdays')",
      "t('settings.workTime')",
      "t('settings.amountAnimation')",
    ].forEach((key) => {
      expect(settingsPanelSource).toContain(`:title="${key}"`);
    });

    expect(settingsPanelSource).toContain("<LunchBreakFields");
    expect(lunchBreakFieldsSource).toContain('t("lunchBreak.heading")');
    expect(settingsPanelSource).not.toContain("data-settings-card");
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
    expect(lunchBreakFieldsSource).toContain('t("lunchBreak.heading")');
    expect(lunchBreakFieldsSource).toContain("t('lunchBreak.toggle')");
    expect(lunchBreakFieldsSource).toContain(':disabled="!config.enableLunchBreak"');
  });

  it("keeps modified attribution footer but removes the about heading copy", () => {
    expect(settingsPanelSource).toContain("<SettingsAboutFooter");
  });

  it("offers the first-time setup only when the host enables it", () => {
    expect(settingsPanelSource).toContain("showOnboardingAction?: boolean");
    expect(settingsPanelSource).toContain("showOnboardingAction: false");
    expect(settingsPanelSource).toContain('v-if="showOnboardingAction"');
    expect(settingsPanelSource).toContain("t('settings.onboarding')");
    expect(settingsPanelSource).toContain("<SettingsOnboardingAction");
    expect(settingsPanelSource).toContain("@open=\"emit('openOnboarding')\"");
    expect(settingsOnboardingActionSource).toContain('t("settings.openOnboarding")');
    expect(settingsOnboardingActionSource).toContain("onboarding-action-button");
  });

  it("adds a lightweight autostart card without unrelated desktop controls", () => {
    const startupSection = settingsPanelSource.slice(
      settingsPanelSource.indexOf("t('settings.startup')"),
      settingsPanelSource.indexOf("settings-inline-error"),
    );

    expect(settingsPanelSource).toContain("t('settings.startup')");
    expect(settingsPanelSource).toContain("t('settings.autostart')");
    expect(settingsPanelSource).toContain("autostartEnabled");
    expect(startupSection).toContain("<SwitchRow");
    expect(startupSection).toContain("title-action");
    expect(startupSection).toContain("t('settings.autostart')");
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

  it("surfaces local settings save failures without relying on console output", () => {
    expect(settingsPanelSource).toContain("settingsSaveError?: string");
    expect(settingsPanelSource).toContain('settingsSaveError: ""');
    expect(settingsPanelSource).toContain("settings-save-error");
    expect(settingsPanelSource).toContain('role="status"');
  });

  it("does not show a persistent warning after automatic settings repair", () => {
    expect(settingsPanelSource).not.toContain("settingsRecoveryNotice");
    expect(settingsPanelSource).not.toContain("settings-recovery-notice");
  });

  it("uses semantic buttons for update retry and install actions", () => {
    expect(settingsAboutFooterSource).toContain("<UpdateActionBadge");
    expect(updateActionBadgeSource).toContain('class="update-badge-button"');
    expect(updateActionBadgeSource).toContain(':aria-label="');
    expect(updateActionBadgeSource).not.toContain('@click.stop="downloadUpdate"');
  });

  it("keeps the update badge visually centered with the version text", () => {
    expect(settingsAboutFooterSource).toContain("about-footer__version-line");
    expect(settingsAboutFooterSource).toContain("display: inline-flex");
    expect(settingsAboutFooterSource).toContain("align-items: center");
    expect(settingsAboutFooterSource).toContain("gap: 3px");
    expect(updateActionBadgeSource).toContain("display: inline-flex");
    expect(updateActionBadgeSource).toContain("vertical-align: middle");
    expect(updateActionBadgeSource).toContain("transform: translateX(-1px)");
    expect(updateActionBadgeSource).toContain("inset-block-start: 0");
    expect(updateActionBadgeSource).toContain("inset-inline-start: -1px");
    expect(updateActionBadgeSource).toContain("margin-left: 0");
    expect(updateActionBadgeSource).not.toContain("translate(-1px, -1px)");
    expect(updateActionBadgeSource).not.toContain("top: 1px");
    expect(updateActionBadgeSource).not.toContain("vertical-align: text-bottom");
    expect(updateActionBadgeSource).not.toContain("place-items: center");
  });

  it("keeps the attribution footer balanced in narrow settings sheets", () => {
    expect(settingsAboutFooterSource).toContain(
      "grid-template-columns: minmax(0, 1fr) auto",
    );
    expect(settingsAboutFooterSource).toContain("min-width: clamp(96px, 20cqw, 112px)");
    expect(settingsAboutFooterSource).toContain("min-width: clamp(92px, 20cqw, 112px)");
    expect(settingsAboutFooterSource).toContain("width: clamp(92px, 20cqw, 108px)");
    expect(settingsAboutFooterSource).toContain(
      "transform: translateX(calc(var(--about-footer-nudge) * -1))",
    );
    expect(settingsAboutFooterSource).toContain(
      "--about-footer-nudge: clamp(3px, 0.9cqw, 5px)",
    );
    expect(settingsAboutFooterSource).toContain(
      "box-shadow: 0 7px 18px rgb(15 23 42 / 0.08)",
    );
    expect(settingsAboutFooterSource).toContain("width: 20px");
    expect(settingsAboutFooterSource).not.toContain("flex-wrap: wrap");
    expect(settingsAboutFooterSource).not.toContain(
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
    expect(settingsAboutFooterSource).toContain(".repository-button");
    expect(settingsAboutFooterSource).toContain(".about-footer__identity span");
    expect(settingsAboutFooterSource).toContain("font-variant-numeric: tabular-nums");
  });
});
