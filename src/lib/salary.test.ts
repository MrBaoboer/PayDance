import { describe, expect, it } from "vitest";
import {
  calculateSalarySnapshot,
  createWorkSpans,
  defaultSalaryConfig,
  validateSalaryConfig,
  type SalaryConfig,
} from "./salary";

const at = (time: string) => new Date(`2026-05-11T${time}:00`);

const config: SalaryConfig = {
  ...defaultSalaryConfig,
  salaryType: "monthly",
  monthlySalary: 21750,
  dailySalary: 1000,
  hourlyRate: 125,
  workDaysPerMonth: 21.75,
  workdays: [1, 2, 3, 4, 5],
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
    expect(snapshot.status).toBe("working");
  });

  it("calculates rates from daily salary mode", () => {
    const snapshot = calculateSalarySnapshot(at("10:00"), {
      ...config,
      salaryType: "daily",
      monthlySalary: 1,
      dailySalary: 800,
    });

    expect(snapshot.dailySalary).toBe(800);
    expect(snapshot.hourlyRate).toBe(100);
    expect(snapshot.earnedToday).toBeCloseTo(100);
  });

  it("calculates rates from hourly salary mode", () => {
    const snapshot = calculateSalarySnapshot(at("10:00"), {
      ...config,
      salaryType: "hourly",
      monthlySalary: 1,
      hourlyRate: 90,
    });

    expect(snapshot.dailySalary).toBe(720);
    expect(snapshot.hourlyRate).toBe(90);
    expect(snapshot.earnedToday).toBeCloseTo(90);
  });

  it("returns rest day status and zero earnings outside configured workdays", () => {
    const snapshot = calculateSalarySnapshot(new Date("2026-05-10T10:00:00"), config);

    expect(snapshot.status).toBe("rest-day");
    expect(snapshot.earnedToday).toBe(0);
    expect(snapshot.workMsToday).toBe(0);
  });

  it("keeps earned amount at zero before work starts", () => {
    const snapshot = calculateSalarySnapshot(at("08:59"), config);

    expect(snapshot.earnedToday).toBe(0);
    expect(snapshot.progress).toBe(0);
    expect(snapshot.isWorking).toBe(false);
    expect(snapshot.status).toBe("before-work");
  });

  it("holds progress during lunch break", () => {
    const beforeLunch = calculateSalarySnapshot(at("12:00"), config);
    const duringLunch = calculateSalarySnapshot(at("12:30"), config);

    expect(beforeLunch.elapsedWorkMs).toBe(3 * 3_600_000);
    expect(duringLunch.elapsedWorkMs).toBe(beforeLunch.elapsedWorkMs);
    expect(duringLunch.isWorking).toBe(false);
    expect(duringLunch.status).toBe("lunch-break");
  });

  it("returns full daily salary after work ends", () => {
    const snapshot = calculateSalarySnapshot(at("18:01"), config);

    expect(snapshot.earnedToday).toBe(1000);
    expect(snapshot.progress).toBe(1);
    expect(snapshot.isWorking).toBe(false);
    expect(snapshot.status).toBe("after-work");
  });

  it("returns after-work exactly at the configured end time", () => {
    const snapshot = calculateSalarySnapshot(at("18:00"), config);

    expect(snapshot.earnedToday).toBe(1000);
    expect(snapshot.progress).toBe(1);
    expect(snapshot.isWorking).toBe(false);
    expect(snapshot.status).toBe("after-work");
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

  it("returns invalid config status for invalid active salary amount", () => {
    const snapshot = calculateSalarySnapshot(at("10:00"), {
      ...config,
      salaryType: "daily",
      dailySalary: 0,
    });

    expect(snapshot.status).toBe("invalid-config");
    expect(snapshot.earnedToday).toBe(0);
  });

  it("calculates earnings for overnight shifts after midnight", () => {
    const snapshot = calculateSalarySnapshot(new Date("2026-05-12T02:00:00"), {
      ...config,
      salaryType: "daily",
      dailySalary: 800,
      workdays: [1],
      startTime: "22:00",
      endTime: "06:00",
      enableLunchBreak: false,
    });

    expect(snapshot.status).toBe("working");
    expect(snapshot.workMsToday).toBe(8 * 3_600_000);
    expect(snapshot.elapsedWorkMs).toBe(4 * 3_600_000);
    expect(snapshot.earnedToday).toBe(400);
    expect(snapshot.progress).toBe(0.5);
  });

  it("keeps overnight shifts in after-work status after the next-day end time", () => {
    const snapshot = calculateSalarySnapshot(new Date("2026-05-12T06:01:00"), {
      ...config,
      salaryType: "daily",
      dailySalary: 800,
      workdays: [1],
      startTime: "22:00",
      endTime: "06:00",
      enableLunchBreak: false,
    });

    expect(snapshot.status).toBe("after-work");
    expect(snapshot.earnedToday).toBe(800);
    expect(snapshot.progress).toBe(1);
  });

  it("prefers the completed previous overnight shift before the next overnight shift starts", () => {
    const snapshot = calculateSalarySnapshot(new Date("2026-05-12T06:01:00"), {
      ...config,
      salaryType: "daily",
      dailySalary: 800,
      workdays: [1, 2, 3, 4, 5],
      startTime: "22:00",
      endTime: "06:00",
      enableLunchBreak: false,
    });

    expect(snapshot.status).toBe("after-work");
    expect(snapshot.earnedToday).toBe(800);
    expect(snapshot.progress).toBe(1);
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

  it("returns an overnight span that ends the next day", () => {
    const spans = createWorkSpans(new Date("2026-05-11T23:00:00"), {
      ...config,
      workdays: [1],
      startTime: "22:00",
      endTime: "06:00",
      enableLunchBreak: false,
    });

    expect(spans).toHaveLength(1);
    expect(spans[0][0].getDate()).toBe(11);
    expect(spans[0][0].getHours()).toBe(22);
    expect(spans[0][1].getDate()).toBe(12);
    expect(spans[0][1].getHours()).toBe(6);
  });
});

describe("validateSalaryConfig", () => {
  it("uses the v0.5 first-launch defaults", () => {
    expect(defaultSalaryConfig).toMatchObject({
      salaryType: "monthly",
      monthlySalary: 8000,
      dailySalary: 360,
      hourlyRate: 45,
      workDaysPerMonth: 22,
      enableLunchBreak: false,
    });
  });

  it("accepts the default configuration", () => {
    expect(validateSalaryConfig(defaultSalaryConfig)).toHaveLength(0);
  });

  it("reports invalid monthly salary, work days, and work time", () => {
    const issues = validateSalaryConfig({
      ...config,
      salaryType: "monthly",
      monthlySalary: 0,
      workDaysPerMonth: 0,
      startTime: "18:00",
      endTime: "18:00",
    });

    expect(issues.map((issue) => issue.field)).toEqual([
      "monthlySalary",
      "workDaysPerMonth",
      "workTime",
    ]);
  });

  it("accepts overnight work time and lunch inside the overnight shift", () => {
    expect(
      validateSalaryConfig({
        ...config,
        startTime: "22:00",
        endTime: "06:00",
        lunchStart: "01:00",
        lunchEnd: "02:00",
        enableLunchBreak: true,
      }),
    ).toHaveLength(0);
  });

  it("reports invalid daily salary only in daily mode", () => {
    expect(
      validateSalaryConfig({
        ...config,
        salaryType: "daily",
        dailySalary: 0,
        monthlySalary: 1000,
      }),
    ).toContainEqual({
      field: "dailySalary",
      message: "日薪需要大于 0",
    });

    expect(
      validateSalaryConfig({
        ...config,
        salaryType: "monthly",
        dailySalary: 0,
        monthlySalary: 1000,
      }),
    ).not.toContainEqual({
      field: "dailySalary",
      message: "日薪需要大于 0",
    });
  });

  it("reports invalid hourly salary only in hourly mode", () => {
    expect(
      validateSalaryConfig({
        ...config,
        salaryType: "hourly",
        hourlyRate: 0,
        monthlySalary: 1000,
      }),
    ).toContainEqual({
      field: "hourlyRate",
      message: "时薪需要大于 0",
    });
  });

  it("reports missing workdays", () => {
    expect(validateSalaryConfig({ ...config, workdays: [] })).toContainEqual({
      field: "workdays",
      message: "至少需要选择 1 个工作日",
    });
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
