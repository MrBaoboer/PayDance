// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import { formatDashboardDuration } from "./duration-format";

describe("dashboard duration format", () => {
  it("uses v0.6.0-style h/m durations for the main dashboard", () => {
    expect(formatDashboardDuration(Number.NaN)).toBe("0m");
    expect(formatDashboardDuration(0)).toBe("0m");
    expect(formatDashboardDuration(5 * 60_000)).toBe("5m");
    expect(formatDashboardDuration(59 * 60_000)).toBe("59m");
    expect(formatDashboardDuration(3 * 60 * 60_000)).toBe("3h");
    expect(formatDashboardDuration(4 * 60 * 60_000 + 12 * 60_000)).toBe("4h 12m");
  });

  it("floors partial minutes so the dashboard never jumps ahead", () => {
    expect(formatDashboardDuration(4 * 60 * 60_000 + 12 * 60_000 + 59_999)).toBe(
      "4h 12m",
    );
  });
});
