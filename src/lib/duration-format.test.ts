import { describe, expect, it } from "vitest";
import { formatDashboardDuration } from "./duration-format";

describe("dashboard duration format", () => {
  it("uses compact H:MM clock-style durations for the main dashboard", () => {
    expect(formatDashboardDuration(Number.NaN)).toBe("0:00");
    expect(formatDashboardDuration(0)).toBe("0:00");
    expect(formatDashboardDuration(5 * 60_000)).toBe("0:05");
    expect(formatDashboardDuration(59 * 60_000)).toBe("0:59");
    expect(formatDashboardDuration(3 * 60 * 60_000)).toBe("3:00");
    expect(formatDashboardDuration(4 * 60 * 60_000 + 12 * 60_000)).toBe("4:12");
  });

  it("floors partial minutes so the dashboard never jumps ahead", () => {
    expect(formatDashboardDuration(4 * 60 * 60_000 + 12 * 60_000 + 59_999)).toBe("4:12");
  });
});
