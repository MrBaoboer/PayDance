import { describe, expect, it } from "vitest";
import onboardingPanelSource from "./components/OnboardingPanel.vue?raw";
import settingsPanelSource from "./components/SettingsPanel.vue?raw";
import salarySource from "./lib/salary.ts?raw";

const lineCount = (source: string) => source.split(/\r?\n/).length;

describe("architecture size boundaries", () => {
  it("keeps large UI and salary entry files below the maintenance limit", () => {
    expect(lineCount(onboardingPanelSource)).toBeLessThanOrEqual(350);
    expect(lineCount(settingsPanelSource)).toBeLessThanOrEqual(450);
    expect(lineCount(salarySource)).toBeLessThanOrEqual(80);
  });
});
