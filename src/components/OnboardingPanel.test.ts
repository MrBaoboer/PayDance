// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import onboardingPanelSource from "./OnboardingPanel.vue?raw";
import stepPreferencesSource from "./onboarding/StepPreferences.vue?raw";
import stepWorkTimeSource from "./onboarding/StepWorkTime.vue?raw";
import lunchBreakFieldsSource from "./settings/LunchBreakFields.vue?raw";
import salaryAmountFieldsSource from "./settings/SalaryAmountFields.vue?raw";
import workTimeFieldsSource from "./settings/WorkTimeFields.vue?raw";

describe("onboarding panel", () => {
  it("renames the final setup step to usage preferences", () => {
    expect(onboardingPanelSource).toContain('t.value("onboarding.stepSalaryMode")');
    expect(onboardingPanelSource).toContain('t.value("onboarding.stepPreferences")');
    expect(onboardingPanelSource).not.toContain(
      'const stepTitles = ["薪资模式", "工作时间", "外观风格"]',
    );
  });

  it("lets first-run users choose whether to enable autostart", () => {
    expect(onboardingPanelSource).toContain("autostartEnabled: boolean");
    expect(onboardingPanelSource).toContain(
      '"update:autostartEnabled": [value: boolean]',
    );
    expect(stepPreferencesSource).toContain("t('preferences.autostart')");
    expect(stepPreferencesSource).toContain(':model-value="autostartEnabled"');
  });

  it("keeps the work-time step airy by hiding lunch inputs until enabled", () => {
    expect(stepWorkTimeSource).toContain("<LunchBreakFields");
    expect(stepWorkTimeSource).toContain('variant="onboarding"');
    expect(lunchBreakFieldsSource).toContain('v-if="config.enableLunchBreak"');
    expect(lunchBreakFieldsSource).toContain("variant === 'settings'");
  });

  it("uses a more spacious first-run layout", () => {
    expect(onboardingPanelSource).toContain("clamp(370px, 88cqw, 440px)");
    expect(onboardingPanelSource).toContain("padding: clamp(20px, 4.4cqw, 24px)");
    expect(stepWorkTimeSource).toContain("gap: clamp(16px, 3.6cqh, 20px)");
  });

  it("keeps the action footer visible in short mobile preview frames", () => {
    expect(onboardingPanelSource).toContain(
      "grid-template-rows: auto minmax(0, 1fr) auto auto",
    );
    expect(onboardingPanelSource).toContain("overflow: hidden");
    expect(onboardingPanelSource).toContain(".onboarding-body {\n  min-height: 0");
    expect(onboardingPanelSource).not.toContain("overflow: hidden auto");
  });

  it("does not show a persistent warning after automatic settings repair", () => {
    expect(onboardingPanelSource).not.toContain("settingsRecoveryNotice");
    expect(onboardingPanelSource).not.toContain("recoveryNoticeText");
  });

  it("uses the dashboard numeric font for numbers, symbols, and Latin glyphs", () => {
    expect(salaryAmountFieldsSource).toContain("font-family: var(--font-dashboard)");
    expect(salaryAmountFieldsSource).toContain("font-variant-numeric: tabular-nums");
    expect(onboardingPanelSource).not.toContain("font-family: var(--font-mono)");
  });

  it("keeps first-run input digits at the same weight as settings inputs", () => {
    [salaryAmountFieldsSource, workTimeFieldsSource, lunchBreakFieldsSource].forEach(
      (source) => {
        expect(source).toContain("font-weight: var(--field-value-weight)");
      },
    );
  });
});
