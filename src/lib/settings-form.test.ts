import { describe, expect, it } from "vitest";
import {
  getSalaryAmountLabel,
  salaryTypeOptions,
  toggleWorkdayValue,
  weekdayOptions,
} from "./settings-form";

describe("settings form helpers", () => {
  it("shares salary mode labels between settings and onboarding", () => {
    expect(salaryTypeOptions.map((option) => option.label)).toEqual([
      "月薪",
      "日薪",
      "时薪",
    ]);
    expect(getSalaryAmountLabel("monthly")).toBe("月薪");
    expect(getSalaryAmountLabel("daily")).toBe("日薪");
    expect(getSalaryAmountLabel("hourly")).toBe("时薪");
  });

  it("shares the same weekday order and toggle semantics", () => {
    expect(weekdayOptions.map((option) => option.value)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(toggleWorkdayValue([1, 3, 5], 2)).toEqual([1, 2, 3, 5]);
    expect(toggleWorkdayValue([1, 2, 3, 5], 2)).toEqual([1, 3, 5]);
  });
});
