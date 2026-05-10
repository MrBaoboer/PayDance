import { describe, expect, it } from "vitest";
import {
  calculateSalarySnapshot,
  createWorkSpans,
  defaultSalaryConfig,
  validateSalaryConfig,
  type SalaryConfig,
} from "./salary";

const at = (time: string) => new Date(`2026-05-10T${time}:00`);

const config: SalaryConfig = {
  ...defaultSalaryConfig,
  monthlySalary: 21750,
  workDaysPerMonth: 21.75,
  startTime: "09:00",
  endTime: "18:00",
  lunchStart: "12:00",
  lunchEnd: "13:00",
  enableLunchBreak: true,
};

describe("calculateSalarySnapshot", () => {
  it("calculates rates from monthly salary and effective work hours", () => {
    const snapshot = calculateSalarySnapshot(at("10:00"), config);

    expect(snapshot.dailySalary).toBe(1000);
    expect(snapshot.workMsToday).toBe(8 * 3_600_000);
    expect(snapshot.hourlyRate).toBe(125);
    expect(snapshot.minuteRate).toBeCloseTo(125 / 60);
    expect(snapshot.secondRate).toBeCloseTo(125 / 3600);
  });

  it("keeps earned amount at zero before work starts", () => {
    const snapshot = calculateSalarySnapshot(at("08:59"), config);

    expect(snapshot.earnedToday).toBe(0);
    expect(snapshot.progress).toBe(0);
    expect(snapshot.isWorking).toBe(false);
  });

  it("holds progress during lunch break", () => {
    const beforeLunch = calculateSalarySnapshot(at("12:00"), config);
    const duringLunch = calculateSalarySnapshot(at("12:30"), config);

    expect(beforeLunch.elapsedWorkMs).toBe(3 * 3_600_000);
    expect(duringLunch.elapsedWorkMs).toBe(beforeLunch.elapsedWorkMs);
    expect(duringLunch.isWorking).toBe(false);
  });

  it("returns full daily salary after work ends", () => {
    const snapshot = calculateSalarySnapshot(at("18:01"), config);

    expect(snapshot.earnedToday).toBe(1000);
    expect(snapshot.progress).toBe(1);
    expect(snapshot.isWorking).toBe(false);
  });

  it("ignores invalid lunch fields when lunch break is disabled", () => {
    const snapshot = calculateSalarySnapshot(at("13:30"), {
      ...config,
      enableLunchBreak: false,
      lunchStart: "broken",
      lunchEnd: "also-broken",
    });

    expect(snapshot.workMsToday).toBe(9 * 3_600_000);
    expect(snapshot.earnedToday).toBeCloseTo(500);
  });
});

describe("createWorkSpans", () => {
  it("returns a single span when lunch is disabled", () => {
    const spans = createWorkSpans(at("10:00"), {
      ...config,
      enableLunchBreak: false,
    });

    expect(spans).toHaveLength(1);
    expect(spans[0][0].getHours()).toBe(9);
    expect(spans[0][1].getHours()).toBe(18);
  });

  it("returns no spans when enabled lunch time is invalid", () => {
    const spans = createWorkSpans(at("10:00"), {
      ...config,
      lunchStart: "08:00",
      lunchEnd: "08:30",
    });

    expect(spans).toHaveLength(0);
  });
});

describe("validateSalaryConfig", () => {
  it("accepts the default configuration", () => {
    expect(validateSalaryConfig(defaultSalaryConfig)).toHaveLength(0);
  });

  it("reports invalid salary, work days, and work time", () => {
    const issues = validateSalaryConfig({
      ...config,
      monthlySalary: 0,
      workDaysPerMonth: 0,
      startTime: "19:00",
      endTime: "18:00",
    });

    expect(issues.map((issue) => issue.field)).toEqual([
      "monthlySalary",
      "workDaysPerMonth",
      "workTime",
    ]);
  });

  it("reports lunch break outside work time only when enabled", () => {
    const invalidLunch = {
      ...config,
      lunchStart: "08:00",
      lunchEnd: "08:30",
    };

    expect(validateSalaryConfig(invalidLunch)).toContainEqual({
      field: "workTime",
      message: "午休时间需要完整落在工作时间内",
    });

    expect(
      validateSalaryConfig({ ...invalidLunch, enableLunchBreak: false }),
    ).toHaveLength(0);
  });
});
