import { describe, expect, it } from "vitest";
import {
  createGetSalaryAmountLabel,
  createSalaryTypeOptions,
  createWeekdayOptions,
  toggleWorkdayValue,
} from "./settings-form";

const t = (key: string) => {
  const map: Record<string, string> = {
    "salaryMode.monthly": "月薪",
    "salaryMode.daily": "日薪",
    "salaryMode.hourly": "时薪",
    "salaryAmount.monthlySalary": "月薪",
    "salaryAmount.dailySalary": "日薪",
    "salaryAmount.hourlyRate": "时薪",
    "workdays.mon": "一",
    "workdays.tue": "二",
    "workdays.wed": "三",
    "workdays.thu": "四",
    "workdays.fri": "五",
    "workdays.sat": "六",
    "workdays.sun": "日",
  };
  return map[key] ?? key;
};

describe("settings form helpers", () => {
  it("shares salary mode labels between settings and onboarding", () => {
    expect(createSalaryTypeOptions(t).map((option) => option.label)).toEqual([
      "月薪",
      "日薪",
      "时薪",
    ]);
    expect(createGetSalaryAmountLabel(t)("monthly")).toBe("月薪");
    expect(createGetSalaryAmountLabel(t)("daily")).toBe("日薪");
    expect(createGetSalaryAmountLabel(t)("hourly")).toBe("时薪");
  });

  it("shares the same weekday order and toggle semantics", () => {
    expect(createWeekdayOptions(t).map((option) => option.value)).toEqual([
      1, 2, 3, 4, 5, 6, 0,
    ]);
    expect(toggleWorkdayValue([1, 3, 5], 2)).toEqual([1, 2, 3, 5]);
    expect(toggleWorkdayValue([1, 2, 3, 5], 2)).toEqual([1, 3, 5]);
  });
});
