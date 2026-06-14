// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import { defaultSalaryConfig } from "./salary";
import {
  migrateSalaryConfig,
  migrateVersionedSalaryConfig,
  recoverVersionedSalaryConfig,
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
    expect(settingsSchemaVersion).toBe(4);
  });

  it("migrates saved configs through an explicit versioned chain", () => {
    const config = migrateVersionedSalaryConfig({
      config: {
        monthlySalary: 16_000,
        salaryType: "daily",
        dailySalary: 720,
        workdays: [5, 1, 1, 3],
      },
      schemaVersion: 2,
    });

    expect(config).toMatchObject({
      salaryType: "daily",
      dailySalary: 720,
      monthlySalary: 16_000,
      workdays: [1, 3, 5],
    });
  });

  it("keeps versioned migrations idempotent at the current schema", () => {
    const first = migrateVersionedSalaryConfig({
      config: {
        salaryType: "hourly",
        hourlyRate: 96,
        workdays: [1, 2, 3, 4, 5],
      },
      schemaVersion: settingsSchemaVersion,
    });
    const second = migrateVersionedSalaryConfig({
      config: first,
      schemaVersion: settingsSchemaVersion,
    });

    expect(second).toEqual(first);
  });

  it("keeps recognized valid fields from future schemas and ignores unknown fields", () => {
    const result = recoverVersionedSalaryConfig({
      config: {
        salaryType: "hourly",
        hourlyRate: 999,
        workdays: [0],
        unsupportedField: "ignored",
      },
      schemaVersion: settingsSchemaVersion + 1,
    });

    expect(result.recoveryReason).toBe("future-schema");
    expect(result.config.salaryType).toBe("hourly");
    expect(result.config.hourlyRate).toBe(999);
    expect(result.config.workdays).toEqual([0]);
    expect(result.config).not.toHaveProperty("unsupportedField");
  });

  it("repairs invalid primitive fields without changing unrelated values", () => {
    const result = recoverVersionedSalaryConfig({
      config: {
        ...defaultSalaryConfig,
        monthlySalary: 18_888,
        endTime: "17:30",
        startTime: "25:90",
        enableLunchBreak: "yes",
        unsupportedField: "ignored",
      },
      schemaVersion: settingsSchemaVersion,
    });

    expect(result.recoveryReason).toBe("invalid-values");
    expect(result.config.monthlySalary).toBe(18_888);
    expect(result.config.startTime).toBe(defaultSalaryConfig.startTime);
    expect(result.config.endTime).toBe("17:30");
    expect(result.config.enableLunchBreak).toBe(defaultSalaryConfig.enableLunchBreak);
    expect(result.config).not.toHaveProperty("unsupportedField");
  });

  it("repairs only the linked work-time pair when start and end conflict", () => {
    const result = recoverVersionedSalaryConfig({
      config: {
        ...defaultSalaryConfig,
        startTime: "08:00",
        endTime: "08:00",
        lunchStart: "11:30",
        lunchEnd: "12:15",
        enableLunchBreak: true,
      },
      schemaVersion: settingsSchemaVersion,
    });

    expect(result.config).toMatchObject({
      startTime: defaultSalaryConfig.startTime,
      endTime: defaultSalaryConfig.endTime,
      lunchStart: "11:30",
      lunchEnd: "12:15",
      enableLunchBreak: true,
    });
  });

  it("repairs only the linked lunch group when lunch falls outside work hours", () => {
    const result = recoverVersionedSalaryConfig({
      config: {
        ...defaultSalaryConfig,
        startTime: "08:00",
        endTime: "17:00",
        lunchStart: "18:00",
        lunchEnd: "19:00",
        enableLunchBreak: true,
      },
      schemaVersion: settingsSchemaVersion,
    });

    expect(result.config).toMatchObject({
      startTime: "08:00",
      endTime: "17:00",
      lunchStart: defaultSalaryConfig.lunchStart,
      lunchEnd: defaultSalaryConfig.lunchEnd,
      enableLunchBreak: defaultSalaryConfig.enableLunchBreak,
    });
  });

  it("marks non-object config shapes for replacement", () => {
    const result = recoverVersionedSalaryConfig({
      config: [],
      schemaVersion: settingsSchemaVersion,
    });

    expect(result).toEqual({
      config: defaultSalaryConfig,
      recoveryReason: "invalid-values",
    });
  });
});
