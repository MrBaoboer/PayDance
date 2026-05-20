import { describe, expect, it } from "vitest";
import { getStatusText } from "./shift-display";

describe("shift display", () => {
  it("uses normal working labels before a shift enters the night work segment", () => {
    expect(getStatusText("working", false, false)).toBe("正在上班");
    expect(getStatusText("after-work", false, false)).toBe("已下班");
  });

  it("uses night labels after the current shift reaches the 22:00 work segment", () => {
    expect(getStatusText("working", true, false)).toBe("正在夜班");
    expect(getStatusText("after-work", true, false)).toBe("夜班已完成");
  });

  it("uses the normal status labels for non-working states", () => {
    expect(getStatusText("before-work", true, false)).toBe("未到上班");
    expect(getStatusText("lunch-break", true, false)).toBe("午休中");
    expect(getStatusText("rest-day", true, false)).toBe("今日休息");
    expect(getStatusText("invalid-config", true, true)).toBe("配置待修正");
  });
});
