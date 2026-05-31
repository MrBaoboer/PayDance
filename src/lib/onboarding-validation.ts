// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import type { SalaryConfig, SalaryConfigIssue } from "./salary";

const salaryIssueFieldsByType = {
  daily: new Set<SalaryConfigIssue["field"]>(["dailySalary", "salaryType"]),
  hourly: new Set<SalaryConfigIssue["field"]>(["hourlyRate", "salaryType"]),
  monthly: new Set<SalaryConfigIssue["field"]>([
    "monthlySalary",
    "salaryType",
    "workDaysPerMonth",
  ]),
};

const workTimeIssueFields = new Set<SalaryConfigIssue["field"]>([
  "endTime",
  "lunchEnd",
  "lunchStart",
  "startTime",
  "workdays",
  "workTime",
]);

export function getOnboardingStepIssues(
  step: number,
  config: SalaryConfig,
  issues: SalaryConfigIssue[],
) {
  if (step === 0) {
    const salaryIssueFields =
      salaryIssueFieldsByType[config.salaryType] ?? salaryIssueFieldsByType.monthly;
    return issues.filter((issue) => salaryIssueFields.has(issue.field));
  }

  if (step === 1) {
    return issues.filter((issue) => workTimeIssueFields.has(issue.field));
  }

  return issues;
}
