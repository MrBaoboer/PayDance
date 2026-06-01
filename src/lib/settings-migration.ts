// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { defaultSalaryConfig, type SalaryConfig, type SalaryType } from "./salary";

export const settingsSchemaVersion = 3;

type PersistedSalaryConfig = Partial<SalaryConfig> | undefined;

const defaultWorkdays = defaultSalaryConfig.workdays;
const salaryTypes: SalaryType[] = ["monthly", "daily", "hourly"];

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isSalaryType = (value: unknown): value is SalaryType =>
  typeof value === "string" && salaryTypes.includes(value as SalaryType);

const isWorkday = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6;

const normalizeWorkdays = (workdays: unknown) => {
  if (!Array.isArray(workdays)) return [...defaultWorkdays];

  const uniqueWorkdays = [...new Set(workdays)];
  if (uniqueWorkdays.length <= 0 || !uniqueWorkdays.every(isWorkday)) {
    return [...defaultWorkdays];
  }

  return uniqueWorkdays.sort((a, b) => a - b);
};

export function migrateSalaryConfig(savedConfig: PersistedSalaryConfig): SalaryConfig {
  const salaryType = isSalaryType(savedConfig?.salaryType)
    ? savedConfig.salaryType
    : defaultSalaryConfig.salaryType;

  return {
    ...defaultSalaryConfig,
    ...savedConfig,
    salaryType,
    monthlySalary: isPositiveNumber(savedConfig?.monthlySalary)
      ? savedConfig.monthlySalary
      : defaultSalaryConfig.monthlySalary,
    dailySalary: isPositiveNumber(savedConfig?.dailySalary)
      ? savedConfig.dailySalary
      : defaultSalaryConfig.dailySalary,
    hourlyRate: isPositiveNumber(savedConfig?.hourlyRate)
      ? savedConfig.hourlyRate
      : defaultSalaryConfig.hourlyRate,
    workDaysPerMonth: isPositiveNumber(savedConfig?.workDaysPerMonth)
      ? savedConfig.workDaysPerMonth
      : defaultSalaryConfig.workDaysPerMonth,
    workdays: normalizeWorkdays(savedConfig?.workdays),
  };
}

export function resolveOnboardingState(
  savedConfig: PersistedSalaryConfig,
  savedHasCompletedOnboarding: boolean | undefined,
) {
  if (typeof savedHasCompletedOnboarding === "boolean") {
    return savedHasCompletedOnboarding;
  }

  return Boolean(savedConfig);
}
