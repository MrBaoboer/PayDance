import { describe, expect, it } from "vitest";
import rollingAmountSource from "./RollingAmount.vue?raw";

describe("rolling amount", () => {
  it("separates integer and fraction so the hero amount can weight decimals more lightly", () => {
    expect(rollingAmountSource).toContain("rolling-amount__integer");
    expect(rollingAmountSource).toContain("rolling-amount__fraction");
    expect(rollingAmountSource).toContain("rolling-amount__separator");
  });
});
