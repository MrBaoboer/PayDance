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
});
