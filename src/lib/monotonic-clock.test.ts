import { describe, expect, it } from "vitest";
import { createMonotonicWallClock, type ClockReading } from "./monotonic-clock";

const makeClock = (base: ClockReading) => createMonotonicWallClock(() => base);

describe("monotonic wall clock", () => {
  it("advances from the initial wall time by monotonic elapsed time", () => {
    const clock = makeClock({ monotonicMs: 500, wallTimeMs: 1_700_000_000_000 });

    expect(clock.nowMs({ monotonicMs: 1_500, wallTimeMs: 1_700_000_100_000 })).toBe(
      1_700_000_001_000,
    );
  });

  it("does not jump when the system wall clock moves forward", () => {
    const clock = makeClock({ monotonicMs: 0, wallTimeMs: 1_700_000_000_000 });

    expect(clock.nowMs({ monotonicMs: 2_000, wallTimeMs: 1_700_003_600_000 })).toBe(
      1_700_000_002_000,
    );
  });

  it("does not go backwards when the monotonic reading regresses", () => {
    const clock = makeClock({ monotonicMs: 0, wallTimeMs: 1_700_000_000_000 });

    expect(clock.nowMs({ monotonicMs: 5_000, wallTimeMs: 1_699_999_000_000 })).toBe(
      1_700_000_005_000,
    );
    expect(clock.nowMs({ monotonicMs: 4_000, wallTimeMs: 1_699_999_000_000 })).toBe(
      1_700_000_005_000,
    );
  });
});
