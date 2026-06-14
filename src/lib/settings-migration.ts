// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import {
  defaultSalaryConfig,
  validateSalaryConfig,
  type SalaryConfig,
  type SalaryType,
} from "./salary";
import { parseTimeToMinutes } from "./salary/time";

export const settingsSchemaVersion = 4;

type PersistedSalaryConfig = Partial<SalaryConfig> | undefined;
export type VersionedSalaryConfigInput = {
  config: unknown;
  schemaVersion: number | undefined;
};
export type SettingsRecoveryReason = "future-schema" | "invalid-values";
export type RecoveredSalaryConfig = {
  config: SalaryConfig;
  recoveryReason?: SettingsRecoveryReason;
};

const defaultWorkdays = defaultSalaryConfig.workdays;
const salaryTypes: SalaryType[] = ["monthly", "daily", "hourly"];

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isSalaryType = (value: unknown): value is SalaryType =>
  typeof value === "string" && salaryTypes.includes(value as SalaryType);

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const isValidTime = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(parseTimeToMinutes(value));

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
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as PersistedSalaryConfig)
    : undefined;

const hasOwn = (value: PersistedSalaryConfig, key: keyof SalaryConfig) =>
  Boolean(value && Object.prototype.hasOwnProperty.call(value, key));

const migrateV1ToV2 = (value: unknown) => asPartialConfig(value);
const migrateV2ToV3 = (value: unknown) => asPartialConfig(value);
const migrateV3ToV4 = (value: unknown) => asPartialConfig(value);

export const settingsMigrations: Record<number, (value: unknown) => unknown> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
};

function normalizeSalaryConfig(
  savedConfig: PersistedSalaryConfig,
  invalidShape = false,
): RecoveredSalaryConfig {
  const salaryType = isSalaryType(savedConfig?.salaryType)
    ? savedConfig.salaryType
    : defaultSalaryConfig.salaryType;

  const config: SalaryConfig = {
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
    startTime: isValidTime(savedConfig?.startTime)
      ? savedConfig.startTime
      : defaultSalaryConfig.startTime,
    endTime: isValidTime(savedConfig?.endTime)
      ? savedConfig.endTime
      : defaultSalaryConfig.endTime,
    lunchStart: isValidTime(savedConfig?.lunchStart)
      ? savedConfig.lunchStart
      : defaultSalaryConfig.lunchStart,
    lunchEnd: isValidTime(savedConfig?.lunchEnd)
      ? savedConfig.lunchEnd
      : defaultSalaryConfig.lunchEnd,
    enableLunchBreak: isBoolean(savedConfig?.enableLunchBreak)
      ? savedConfig.enableLunchBreak
      : defaultSalaryConfig.enableLunchBreak,
  };

  const fields: Array<[keyof SalaryConfig, (value: unknown) => boolean]> = [
    ["salaryType", isSalaryType],
    ["monthlySalary", isPositiveNumber],
    ["dailySalary", isPositiveNumber],
    ["hourlyRate", isPositiveNumber],
    ["workDaysPerMonth", isPositiveNumber],
    [
      "workdays",
      (value) => Array.isArray(value) && value.length > 0 && value.every(isWorkday),
    ],
    ["startTime", isValidTime],
    ["endTime", isValidTime],
    ["lunchStart", isValidTime],
    ["lunchEnd", isValidTime],
    ["enableLunchBreak", isBoolean],
  ];
  let recovered =
    invalidShape ||
    fields.some(
      ([key, validate]) => hasOwn(savedConfig, key) && !validate(savedConfig?.[key]),
    );

  const hasConflictingWorkTimes =
    parseTimeToMinutes(config.startTime) === parseTimeToMinutes(config.endTime);
  if (hasConflictingWorkTimes) {
    config.startTime = defaultSalaryConfig.startTime;
    config.endTime = defaultSalaryConfig.endTime;
    recovered = true;
  }

  const hasInvalidLunchWindow = validateSalaryConfig(config, (key) => key).some(
    (issue) => issue.field === "workTime",
  );
  if (hasInvalidLunchWindow) {
    config.lunchStart = defaultSalaryConfig.lunchStart;
    config.lunchEnd = defaultSalaryConfig.lunchEnd;
    config.enableLunchBreak = defaultSalaryConfig.enableLunchBreak;
    recovered = true;
  }

  return {
    config,
    ...(recovered ? { recoveryReason: "invalid-values" as const } : {}),
  };
}

export function recoverVersionedSalaryConfig({
  config,
  schemaVersion,
}: VersionedSalaryConfigInput): RecoveredSalaryConfig {
  const savedConfig = asPartialConfig(config);

  if (
    typeof schemaVersion === "number" &&
    Number.isFinite(schemaVersion) &&
    schemaVersion > settingsSchemaVersion
  ) {
    const normalized = normalizeSalaryConfig(
      savedConfig,
      config !== undefined && !savedConfig,
    );
    return {
      config: normalized.config,
      recoveryReason: "future-schema",
    };
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

  return normalizeSalaryConfig(
    asPartialConfig(migratedConfig),
    config !== undefined && !savedConfig,
  );
}

export function migrateVersionedSalaryConfig(
  input: VersionedSalaryConfigInput,
): SalaryConfig {
  return recoverVersionedSalaryConfig(input).config;
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
