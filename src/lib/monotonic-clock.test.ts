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

  it("does not jump when the system wall clock drift stays below the rebase threshold", () => {
    const clock = makeClock({ monotonicMs: 0, wallTimeMs: 1_700_000_000_000 });

    expect(clock.nowMs({ monotonicMs: 2_000, wallTimeMs: 1_700_000_003_000 })).toBe(
      1_700_000_002_000,
    );
  });

  it("rebases to the real wall clock after a large resume or clock correction", () => {
    const clock = makeClock({ monotonicMs: 0, wallTimeMs: 1_700_000_000_000 });

    expect(clock.nowMs({ monotonicMs: 2_000, wallTimeMs: 1_700_007_200_000 })).toBe(
      1_700_007_200_000,
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

  it("continues smoothly after rebasing on sleep resume", () => {
    const clock = makeClock({ monotonicMs: 0, wallTimeMs: 1_700_000_000_000 });

    const resumed = clock.nowMs({
      monotonicMs: 2_000,
      wallTimeMs: 1_700_028_800_000,
    });
    const nextTick = clock.nowMs({
      monotonicMs: 3_500,
      wallTimeMs: 1_700_028_801_500,
    });

    expect(resumed).toBe(1_700_028_800_000);
    expect(nextTick).toBe(1_700_028_801_500);
  });

  it("ignores a large backward wall-clock correction after resume", () => {
    const clock = makeClock({ monotonicMs: 0, wallTimeMs: 1_700_000_000_000 });

    expect(
      clock.nowMs({
        monotonicMs: 10_000,
        wallTimeMs: 1_699_996_400_000,
      }),
    ).toBe(1_700_000_010_000);
  });
});
