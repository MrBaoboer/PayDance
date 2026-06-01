// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import { getStatusText } from "./shift-display";

const t = (key: string) => {
  const map: Record<string, string> = {
    "status.working": "正在上班",
    "status.nightWork": "正在夜班",
    "status.afterWork": "已下班",
    "status.nightWorkDone": "夜班已完成",
    "status.beforeWork": "未到上班",
    "status.lunchBreak": "午休中",
    "status.restDay": "今日休息",
    "status.invalidConfig": "配置待修正",
  };
  return map[key] ?? key;
};

describe("shift display", () => {
  it("uses normal working labels before a shift enters the night work segment", () => {
    expect(getStatusText("working", false, false, t)).toBe("正在上班");
    expect(getStatusText("after-work", false, false, t)).toBe("已下班");
  });

  it("uses night labels after the current shift reaches the 22:00 work segment", () => {
    expect(getStatusText("working", true, false, t)).toBe("正在夜班");
    expect(getStatusText("after-work", true, false, t)).toBe("夜班已完成");
  });

  it("uses the normal status labels for non-working states", () => {
    expect(getStatusText("before-work", true, false, t)).toBe("未到上班");
    expect(getStatusText("lunch-break", true, false, t)).toBe("午休中");
    expect(getStatusText("rest-day", true, false, t)).toBe("今日休息");
    expect(getStatusText("invalid-config", true, true, t)).toBe("配置待修正");
  });
});
