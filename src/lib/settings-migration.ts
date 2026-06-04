// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { defaultSalaryConfig, type SalaryConfig, type SalaryType } from "./salary";

export const settingsSchemaVersion = 4;

type PersistedSalaryConfig = Partial<SalaryConfig> | undefined;
type VersionedSalaryConfigInput = {
  config: unknown;
  schemaVersion: number | undefined;
};

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

const asPartialConfig = (value: unknown): PersistedSalaryConfig =>
  value && typeof value === "object" ? (value as PersistedSalaryConfig) : undefined;

const migrateV1ToV2 = (value: unknown) => asPartialConfig(value);
const migrateV2ToV3 = (value: unknown) => asPartialConfig(value);
const migrateV3ToV4 = (value: unknown) => asPartialConfig(value);

export const settingsMigrations: Record<number, (value: unknown) => unknown> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
};

function normalizeSalaryConfig(savedConfig: PersistedSalaryConfig): SalaryConfig {
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

export function migrateVersionedSalaryConfig({
  config,
  schemaVersion,
}: VersionedSalaryConfigInput): SalaryConfig {
  if (
    typeof schemaVersion === "number" &&
    Number.isFinite(schemaVersion) &&
    schemaVersion > settingsSchemaVersion
  ) {
    return normalizeSalaryConfig(undefined);
  }

  let migratedConfig: unknown = config;
  let currentVersion =
    typeof schemaVersion === "number" && Number.isFinite(schemaVersion)
      ? Math.max(1, Math.floor(schemaVersion))
      : 1;

  while (currentVersion < settingsSchemaVersion) {
    const migrate = settingsMigrations[currentVersion];
    migratedConfig = migrate ? migrate(migratedConfig) : migratedConfig;
    currentVersion += 1;
  }

  return normalizeSalaryConfig(asPartialConfig(migratedConfig));
}

export function migrateSalaryConfig(
  savedConfig: PersistedSalaryConfig,
  savedSettingsVersion?: number,
): SalaryConfig {
  return migrateVersionedSalaryConfig({
    config: savedConfig,
    schemaVersion: savedSettingsVersion,
  });
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
