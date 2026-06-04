// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import statsPanelSource from "./StatsPanel.vue?raw";

describe("stats panel", () => {
  it("uses a configurable middle stat label and value", () => {
    expect(statsPanelSource).toContain("middleLabel: string");
    expect(statsPanelSource).toContain("middleValue: string");
    expect(statsPanelSource).toContain("{{ middleLabel }}");
    expect(statsPanelSource).toContain("formatMetricSegments(middleValue)");
    expect(statsPanelSource).not.toContain("{{ remainingTime }}");
  });

  it("uses dashboard metric slots with separate label and value styling", () => {
    expect(statsPanelSource).toContain("stat-item__label");
    expect(statsPanelSource).toContain("stat-item__value");
    expect(statsPanelSource).toContain("stats-panel__grid");
  });

  it("keeps the three metrics flat without nested card borders or backgrounds", () => {
    expect(statsPanelSource).toContain("stats-panel__grid");
    expect(statsPanelSource).not.toContain("stats-panel__frame");
    expect(statsPanelSource).not.toContain("border: 1px solid var(--dashboard-border");
    expect(statsPanelSource).not.toContain("background: var(--dashboard-metric-bg");
    expect(statsPanelSource).not.toContain("border-radius: var(--ui-radius-md");
  });

  it("splits metric numbers from units with premium spacing", () => {
    expect(statsPanelSource).toContain("formatMetricSegments");
    expect(statsPanelSource).toContain("stat-value__number");
    expect(statsPanelSource).toContain("stat-value__unit");
    expect(statsPanelSource).toContain("stat-value__symbol");
    expect(statsPanelSource).toContain("stat-value__separator");
    expect(statsPanelSource).toContain("margin-left: 0.32em");
    expect(statsPanelSource).toContain("margin-right: 0.2em");
    expect(statsPanelSource).toContain("width: 0.44em");
    expect(statsPanelSource).toContain("font-family: var(--font-dashboard)");
  });

  it("keeps metric segments on a shared baseline", () => {
    expect(statsPanelSource).toContain("align-items: baseline");
    expect(statsPanelSource).toContain("line-height: 1");
    expect(statsPanelSource).toContain("min-height: 1.15em");
  });

  it("uses one stable divider thickness for both dashboard separators", () => {
    expect(statsPanelSource).toContain("width: 2px");
    expect(statsPanelSource).not.toContain("width: clamp(1px, 0.18cqw, 2px)");
  });

  it("keeps the expected income currency symbol equal-height with the amount", () => {
    expect(statsPanelSource).toContain("stat-item__value--money");
    expect(statsPanelSource).toContain(".stat-item__value--money .stat-value__symbol");
    expect(statsPanelSource).toContain("font-size: 1.1em");
    expect(statsPanelSource).toContain("color: var(--muted)");
    expect(statsPanelSource).toContain("margin-right: 0.2em");
  });

  it("keeps unit-based duration glyphs readable", () => {
    expect(statsPanelSource).toContain(
      'if (text === ":") return { kind: "separator", text };',
    );
    expect(statsPanelSource).toContain(".stat-value__separator");
    expect(statsPanelSource).toContain("margin-left: 0.32em");
    expect(statsPanelSource).toContain("stat-value__unit");
  });
});
