// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

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
  it("does not block language and preference setup with salary issues", () => {
    const config = {
      ...defaultSalaryConfig,
      monthlySalary: 0,
      workDaysPerMonth: 0,
    };

    expect(getOnboardingStepIssues(0, config, validateSalaryConfig(config, vt))).toEqual(
      [],
    );
  });

  it("blocks salary issues on the salary step", () => {
    const config = {
      ...defaultSalaryConfig,
      monthlySalary: 0,
      workDaysPerMonth: 0,
    };

    expect(
      getOnboardingStepIssues(1, config, validateSalaryConfig(config, vt)).map(
        (issue) => issue.field,
      ),
    ).toEqual(["monthlySalary", "workDaysPerMonth"]);
  });

  it("blocks work time issues on the final work time step", () => {
    const config = {
      ...defaultSalaryConfig,
      workdays: [],
      startTime: "18:00",
      endTime: "18:00",
    };

    expect(
      getOnboardingStepIssues(2, config, validateSalaryConfig(config, vt)).map(
        (issue) => issue.field,
      ),
    ).toEqual(["workdays", "workTime"]);
  });

  it("does not carry salary issues onto the final work time step", () => {
    const config = {
      ...defaultSalaryConfig,
      salaryType: "daily" as const,
      dailySalary: 0,
    };

    expect(getOnboardingStepIssues(2, config, validateSalaryConfig(config, vt))).toEqual(
      [],
    );
  });
});
