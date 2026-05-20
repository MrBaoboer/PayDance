import { describe, expect, it } from "vitest";
import statsPanelSource from "./StatsPanel.vue?raw";

describe("stats panel", () => {
  it("uses a configurable middle stat label and value", () => {
    expect(statsPanelSource).toContain("middleLabel: string");
    expect(statsPanelSource).toContain("middleValue: string");
    expect(statsPanelSource).toContain("{{ middleLabel }}");
    expect(statsPanelSource).toContain("formatMetricSegments(middleValue)");
    expect(statsPanelSource).not.toContain("<span>距离下班</span>");
    expect(statsPanelSource).not.toContain("{{ remainingTime }}");
  });

  it("uses dashboard metric slots with separate label and value styling", () => {
    expect(statsPanelSource).toContain("stat-item__label");
    expect(statsPanelSource).toContain("stat-item__value");
    expect(statsPanelSource).toContain("stats-panel__frame");
  });

  it("splits metric numbers from units for subtler symbols", () => {
    expect(statsPanelSource).toContain("formatMetricSegments");
    expect(statsPanelSource).toContain("stat-value__number");
    expect(statsPanelSource).toContain("stat-value__unit");
    expect(statsPanelSource).toContain("stat-value__symbol");
    expect(statsPanelSource).toContain("stat-value__separator");
    expect(statsPanelSource).toContain("margin-left: 0.12em");
    expect(statsPanelSource).toContain("margin-right: 0.14em");
    expect(statsPanelSource).toContain("width: 0.22em");
    expect(statsPanelSource).toContain("font-family: var(--font-dashboard)");
  });

  it("keeps metric segments on a shared baseline", () => {
    expect(statsPanelSource).toContain("align-items: baseline");
    expect(statsPanelSource).toContain("line-height: 1");
    expect(statsPanelSource).toContain("min-height: 1.15em");
  });

  it("keeps the expected income currency symbol subtle like duration units", () => {
    expect(statsPanelSource).toContain("stat-item__value--money");
    expect(statsPanelSource).toContain(".stat-item__value--money .stat-value__symbol");
    expect(statsPanelSource).toContain("font-size: 0.88em");
    expect(statsPanelSource).toContain("color: var(--muted)");
  });

  it("keeps unit-based duration glyphs readable", () => {
    expect(statsPanelSource).toContain('if (text === ":") return { kind: "separator", text };');
    expect(statsPanelSource).toContain(".stat-value__separator");
    expect(statsPanelSource).toContain("margin-left: 0.12em");
    expect(statsPanelSource).toContain("stat-value__unit");
  });
});
