import { describe, expect, it } from "vitest";
import onboardingPanelSource from "./OnboardingPanel.vue?raw";
import stepPreferencesSource from "./onboarding/StepPreferences.vue?raw";
import stepWorkTimeSource from "./onboarding/StepWorkTime.vue?raw";
import lunchBreakFieldsSource from "./settings/LunchBreakFields.vue?raw";
import salaryAmountFieldsSource from "./settings/SalaryAmountFields.vue?raw";

describe("onboarding panel", () => {
  it("renames the final setup step to usage preferences", () => {
    expect(onboardingPanelSource).toContain(
      'const stepTitles = ["薪资模式", "工作时间", "使用偏好"]',
    );
    expect(onboardingPanelSource).not.toContain(
      'const stepTitles = ["薪资模式", "工作时间", "外观风格"]',
    );
  });

  it("lets first-run users choose whether to enable autostart", () => {
    expect(onboardingPanelSource).toContain("autostartEnabled: boolean");
    expect(onboardingPanelSource).toContain(
      '"update:autostartEnabled": [value: boolean]',
    );
    expect(stepPreferencesSource).toContain("开机自动启动");
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
    expect(onboardingPanelSource).toContain("min-height: clamp(228px, 53cqh, 276px)");
    expect(onboardingPanelSource).toContain("padding: clamp(20px, 4.4cqw, 24px)");
    expect(stepWorkTimeSource).toContain("gap: clamp(16px, 3.6cqh, 20px)");
  });

  it("uses the dashboard numeric font for numbers, symbols, and Latin glyphs", () => {
    expect(salaryAmountFieldsSource).toContain("font-family: var(--font-dashboard)");
    expect(salaryAmountFieldsSource).toContain("font-variant-numeric: tabular-nums");
    expect(onboardingPanelSource).not.toContain("font-family: var(--font-mono)");
  });
});
