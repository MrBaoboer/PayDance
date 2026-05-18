import { describe, expect, it } from "vitest";
import { defaultSalaryConfig, validateSalaryConfig } from "./salary";
import { getOnboardingStepIssues } from "./onboarding-validation";

describe("onboarding step validation", () => {
  it("blocks salary step issues before moving to work time", () => {
    const config = {
      ...defaultSalaryConfig,
      monthlySalary: 0,
      workDaysPerMonth: 0,
    };

    expect(
      getOnboardingStepIssues(0, config, validateSalaryConfig(config)).map(
        (issue) => issue.field,
      ),
    ).toEqual(["monthlySalary", "workDaysPerMonth"]);
  });

  it("blocks work time issues on the work time step", () => {
    const config = {
      ...defaultSalaryConfig,
      workdays: [],
      startTime: "19:00",
      endTime: "18:00",
    };

    expect(
      getOnboardingStepIssues(1, config, validateSalaryConfig(config)).map(
        (issue) => issue.field,
      ),
    ).toEqual(["workdays", "workTime"]);
  });

  it("keeps the appearance step as a final guard for any remaining issue", () => {
    const config = {
      ...defaultSalaryConfig,
      salaryType: "daily" as const,
      dailySalary: 0,
    };

    expect(getOnboardingStepIssues(2, config, validateSalaryConfig(config))).toEqual([
      { field: "dailySalary", message: "日薪需要大于 0" },
    ]);
  });
});
