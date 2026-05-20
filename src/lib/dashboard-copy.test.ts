import { describe, expect, it } from "vitest";
import { getDashboardCopy } from "./dashboard-copy";

describe("dashboard copy", () => {
  it("shows live earning pulse while working", () => {
    expect(
      getDashboardCopy({
        hasConfigIssues: false,
        minuteRate: 0.75,
        secondRate: 0.0125,
        status: "working",
      }),
    ).toEqual({
      pulse: "每秒 ¥0.0125 · 每分钟 ¥0.75",
      title: "今日已入账",
    });
  });

  it("uses state-aware copy when earnings are paused or complete", () => {
    expect(
      getDashboardCopy({
        hasConfigIssues: false,
        minuteRate: 0.75,
        secondRate: 0.0125,
        status: "lunch-break",
      }),
    ).toEqual({
      pulse: "复工后继续跳动",
      title: "午休中，收入暂停",
    });

    expect(
      getDashboardCopy({
        hasConfigIssues: false,
        minuteRate: 0.75,
        secondRate: 0.0125,
        status: "after-work",
      }),
    ).toEqual({
      pulse: "今天的工资已全部入账",
      title: "今日已完成",
    });
  });

  it("uses clear non-working states before work, on rest days, and for invalid settings", () => {
    expect(
      getDashboardCopy({
        hasConfigIssues: false,
        minuteRate: 0.75,
        secondRate: 0.0125,
        status: "before-work",
      }).title,
    ).toBe("等待开工");

    expect(
      getDashboardCopy({
        hasConfigIssues: false,
        minuteRate: 0.75,
        secondRate: 0.0125,
        status: "rest-day",
      }).title,
    ).toBe("今日休息");

    expect(
      getDashboardCopy({
        hasConfigIssues: true,
        minuteRate: 0.75,
        secondRate: 0.0125,
        status: "invalid-config",
      }),
    ).toEqual({
      pulse: "修正设置后恢复实时入账",
      title: "配置待修正",
    });
  });
});
