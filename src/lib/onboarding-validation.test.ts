import { describe, expect, it } from "vitest";
import { defaultSalaryConfig, validateSalaryConfig } from "./salary";
import { getOnboardingStepIssues } from "./onboarding-validation";

const vt = (key: string) => {
  const map: Record<string, string> = {
    "validation.monthlyPositive": "月薪需大于 0",
    "validation.workDaysPositive": "工作天数需大于 0",
    "validation.workdaysMinOne": "至少选 1 天",
    "validation.timeSameError": "时间不能相同",
    "validation.dailyPositive": "日薪需大于 0",
  };
  return map[key] ?? key;
};

describe("onboarding step validation", () => {
  it("blocks salary step issues before moving to work time", () => {
    const config = {
      ...defaultSalaryConfig,
      monthlySalary: 0,
      workDaysPerMonth: 0,
    };

    expect(
      getOnboardingStepIssues(0, config, validateSalaryConfig(config, vt)).map(
        (issue) => issue.field,
      ),
    ).toEqual(["monthlySalary", "workDaysPerMonth"]);
  });

  it("blocks work time issues on the work time step", () => {
    const config = {
      ...defaultSalaryConfig,
      workdays: [],
      startTime: "18:00",
      endTime: "18:00",
    };

    expect(
      getOnboardingStepIssues(1, config, validateSalaryConfig(config, vt)).map(
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

    expect(getOnboardingStepIssues(2, config, validateSalaryConfig(config, vt))).toEqual([
      { field: "dailySalary", message: "日薪需大于 0" },
    ]);
  });
});
