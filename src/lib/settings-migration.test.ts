import { describe, expect, it } from "vitest";
import {
  migrateSalaryConfig,
  resolveOnboardingState,
  settingsSchemaVersion,
} from "./settings-migration";

describe("settings migration", () => {
  it("migrates v2 salary config into the v0.5 salary model", () => {
    const config = migrateSalaryConfig({
      monthlySalary: 18000,
      workDaysPerMonth: 22,
      startTime: "10:00",
      endTime: "19:00",
      lunchStart: "13:00",
      lunchEnd: "14:00",
      enableLunchBreak: true,
    });

    expect(config).toMatchObject({
      salaryType: "monthly",
      monthlySalary: 18000,
      workDaysPerMonth: 22,
      workdays: [1, 2, 3, 4, 5],
      startTime: "10:00",
      endTime: "19:00",
      lunchStart: "13:00",
      lunchEnd: "14:00",
      enableLunchBreak: true,
    });
    expect(config.dailySalary).toBeGreaterThan(0);
    expect(config.hourlyRate).toBeGreaterThan(0);
  });

  it("preserves v3 salary type and normalizes workdays when they are valid", () => {
    const config = migrateSalaryConfig({
      salaryType: "hourly",
      hourlyRate: 88,
      workdays: [6, 2, 2, 0, 4],
    });

    expect(config.salaryType).toBe("hourly");
    expect(config.hourlyRate).toBe(88);
    expect(config.workdays).toEqual([0, 2, 4, 6]);
  });

  it("uses safe defaults for invalid v3 workdays and salary type", () => {
    const config = migrateSalaryConfig({
      salaryType: "broken",
      workdays: [1, 8],
    } as never);

    expect(config.salaryType).toBe("monthly");
    expect(config.workdays).toEqual([1, 2, 3, 4, 5]);
  });

  it("marks existing users as onboarded when old config exists", () => {
    expect(resolveOnboardingState({ monthlySalary: 15000 }, undefined)).toBe(true);
  });

  it("keeps new users in onboarding when no config has been saved", () => {
    expect(resolveOnboardingState(undefined, undefined)).toBe(false);
  });

  it("honors an explicitly saved onboarding state", () => {
    expect(resolveOnboardingState({ monthlySalary: 15000 }, false)).toBe(false);
    expect(resolveOnboardingState(undefined, true)).toBe(true);
  });

  it("declares the v0.5 settings schema version", () => {
    expect(settingsSchemaVersion).toBe(3);
  });
});
