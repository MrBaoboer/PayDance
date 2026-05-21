import { describe, expect, it } from "vitest";
import onboardingPanelSource from "./OnboardingPanel.vue?raw";

describe("onboarding panel", () => {
  it("renames the final setup step to usage preferences", () => {
    expect(onboardingPanelSource).toContain('const stepTitles = ["薪资模式", "工作时间", "使用偏好"]');
    expect(onboardingPanelSource).not.toContain('const stepTitles = ["薪资模式", "工作时间", "外观风格"]');
  });

  it("lets first-run users choose whether to enable autostart", () => {
    expect(onboardingPanelSource).toContain("autostartEnabled: boolean");
    expect(onboardingPanelSource).toContain('"update:autostartEnabled": [value: boolean]');
    expect(onboardingPanelSource).toContain("开机自动启动");
    expect(onboardingPanelSource).toContain(":checked=\"autostartEnabled\"");
  });

  it("keeps the work-time step airy by hiding lunch inputs until enabled", () => {
    expect(onboardingPanelSource).toContain('v-if="config.enableLunchBreak" class="field-grid"');
    expect(onboardingPanelSource).not.toContain(':disabled="!config.enableLunchBreak"');
  });

  it("uses a more spacious first-run layout", () => {
    expect(onboardingPanelSource).toContain("clamp(370px, 88cqw, 440px)");
    expect(onboardingPanelSource).toContain("min-height: clamp(228px, 53cqh, 276px)");
    expect(onboardingPanelSource).toContain("gap: clamp(14px, 3.2cqh, 18px)");
  });

  it("uses the dashboard numeric font for numbers, symbols, and Latin glyphs", () => {
    expect(onboardingPanelSource).toContain("font-family: var(--font-dashboard)");
    expect(onboardingPanelSource).toContain("font-variant-numeric: tabular-nums");
    expect(onboardingPanelSource).not.toContain("font-family: var(--font-mono)");
  });
});
