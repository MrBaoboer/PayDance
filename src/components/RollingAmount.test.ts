import { describe, expect, it } from "vitest";
import rollingAmountSource from "./RollingAmount.vue?raw";

describe("rolling amount", () => {
  it("separates integer and fraction so the hero amount can weight decimals more lightly", () => {
    expect(rollingAmountSource).toContain("rolling-amount__integer");
    expect(rollingAmountSource).toContain("rolling-amount__fraction");
    expect(rollingAmountSource).toContain("rolling-amount__separator");
  });

  it("does not color the amount fraction with the income accent", () => {
    expect(rollingAmountSource).not.toContain(
      ".rolling-amount--hero .rolling-amount__fraction {\n  color: var(--income-accent);",
    );
  });

  it("keeps the main rolling amount on the original mono font", () => {
    expect(rollingAmountSource).toContain("font-family: var(--font-mono)");
    expect(rollingAmountSource).not.toContain("font-family: var(--font-numeric)");
  });

  it("keeps the 0.7.9 hero pulse as a natural filter transition", () => {
    const heroPulseBlock = rollingAmountSource.slice(
      rollingAmountSource.indexOf(".rolling-amount--hero.is-ticking {"),
      rollingAmountSource.indexOf(
        ".rolling-amount--hero.is-ticking .rolling-amount__currency",
      ),
    );

    expect(rollingAmountSource).toContain(
      "filter: drop-shadow(0 14px 30px var(--income-accent-glow));",
    );
    expect(rollingAmountSource).toContain("}, 220)");
    expect(rollingAmountSource).not.toContain(".rolling-amount--mini.is-ticking");
    expect(rollingAmountSource).not.toContain("--amount-pulse-glow");
    expect(rollingAmountSource).not.toContain("@keyframes hero-amount-pulse");
    expect(rollingAmountSource).not.toContain("animation: hero-amount-pulse");
    expect(rollingAmountSource).not.toContain(
      "drop-shadow(0 0 18px var(--income-accent-ring))",
    );
    expect(rollingAmountSource).not.toContain("}, 320)");
    expect(rollingAmountSource).toContain("filter: none;");
    expect(heroPulseBlock).not.toContain("scale(");
    expect(heroPulseBlock).not.toContain("translate3d(");
    expect(rollingAmountSource).toContain("    transform 220ms ease");
  });
});
