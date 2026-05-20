import { describe, expect, it } from "vitest";
import incomeProgressSource from "./IncomeProgress.vue?raw";

describe("income progress", () => {
  it("keeps progress text out of the main surface and exposes it as a hover tooltip", () => {
    expect(incomeProgressSource).toContain("progressTooltip");
    expect(incomeProgressSource).toContain(':title="progressTooltip"');
    expect(incomeProgressSource).toContain(':aria-label="progressTooltip"');
    expect(incomeProgressSource).not.toContain("progress-label");
    expect(incomeProgressSource).not.toContain("progress-value__number");
    expect(incomeProgressSource).not.toContain("progress-value__unit");
  });

  it("lets the progress dot render outside the track instead of clipping it", () => {
    expect(incomeProgressSource).toContain(".progress-track");
    expect(incomeProgressSource).toContain("overflow: visible");
    expect(incomeProgressSource).toContain(".progress-fill");
    expect(incomeProgressSource).toContain("overflow: hidden");
  });
});
