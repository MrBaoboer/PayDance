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
});
