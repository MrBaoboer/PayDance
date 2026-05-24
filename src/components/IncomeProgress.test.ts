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

  it("keeps flat theme-specific progress variables while preserving the refined dot", () => {
    expect(incomeProgressSource).toContain("--progress-track-bg");
    expect(incomeProgressSource).toContain("--progress-fill-bg");
    expect(incomeProgressSource).toContain("--progress-dot-border");
    expect(incomeProgressSource).toContain("--progress-dot-shadow");
    expect(incomeProgressSource).not.toContain(
      "border: 1px solid var(--progress-track-border",
    );
    expect(incomeProgressSource).not.toContain("inset 0 1px");
  });

  it("keeps the fill cap round while avoiding layout-driven progress animation", () => {
    expect(incomeProgressSource).toContain("--progress-percent");
    expect(incomeProgressSource).toContain("--progress-x");
    expect(incomeProgressSource).toContain(
      "clip-path: inset(0 calc(100% - var(--progress-percent)) 0 0 round 999px)",
    );
    expect(incomeProgressSource).toContain("translate3d(var(--progress-x), -50%, 0)");
    expect(incomeProgressSource).not.toContain("scaleX(var(--progress-scale))");
    expect(incomeProgressSource).not.toContain("transition: width");
    expect(incomeProgressSource).not.toContain("left 260ms ease-out");
  });
});
