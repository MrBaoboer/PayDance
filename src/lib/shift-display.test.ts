import { describe, expect, it } from "vitest";
import { defaultSalaryConfig } from "./salary";
import { getStatusText, isNightShiftDisplayConfig } from "./shift-display";

describe("shift display", () => {
  it("does not label a daytime shift that ends after midnight as night shift", () => {
    const config = {
      ...defaultSalaryConfig,
      startTime: "09:30",
      endTime: "00:30",
    };

    expect(isNightShiftDisplayConfig(config)).toBe(false);
    expect(getStatusText("working", config, false)).toBe("正在上班");
    expect(getStatusText("after-work", config, false)).toBe("已下班");
  });

  it("labels a late evening overnight shift as night shift", () => {
    const config = {
      ...defaultSalaryConfig,
      startTime: "22:00",
      endTime: "06:00",
    };

    expect(isNightShiftDisplayConfig(config)).toBe(true);
    expect(getStatusText("working", config, false)).toBe("正在夜班");
    expect(getStatusText("after-work", config, false)).toBe("夜班已完成");
  });

  it("uses the normal status labels for non-working states", () => {
    const config = {
      ...defaultSalaryConfig,
      startTime: "22:00",
      endTime: "06:00",
    };

    expect(getStatusText("before-work", config, false)).toBe("未到上班");
    expect(getStatusText("lunch-break", config, false)).toBe("午休中");
    expect(getStatusText("rest-day", config, false)).toBe("今日休息");
    expect(getStatusText("invalid-config", config, true)).toBe("配置待修正");
  });
});
