import { describe, expect, it } from "vitest";
import statsPanelSource from "./StatsPanel.vue?raw";

describe("stats panel", () => {
  it("uses a configurable middle stat label and value", () => {
    expect(statsPanelSource).toContain("middleLabel: string");
    expect(statsPanelSource).toContain("middleValue: string");
    expect(statsPanelSource).toContain("{{ middleLabel }}");
    expect(statsPanelSource).toContain("{{ middleValue }}");
    expect(statsPanelSource).not.toContain("<span>距离下班</span>");
    expect(statsPanelSource).not.toContain("{{ remainingTime }}");
  });

  it("uses dashboard metric slots with separate label and value styling", () => {
    expect(statsPanelSource).toContain("stat-item__label");
    expect(statsPanelSource).toContain("stat-item__value");
    expect(statsPanelSource).toContain("stats-panel__frame");
  });
});
