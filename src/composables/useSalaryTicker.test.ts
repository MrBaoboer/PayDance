// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { defaultSalaryConfig, emptySnapshot, type SalarySnapshot } from "../lib/salary";

const calculateSalarySnapshotMock = vi.hoisted(() =>
  vi.fn((): SalarySnapshot => ({
    ...emptySnapshot,
    dailySalary: 360,
    earnedToday: 120,
    hourlyRate: 45,
    isWorking: true,
    minuteRate: 0.75,
    nextTransitionMs: 60_000,
    progress: 0.33,
    secondRate: 1,
    status: "working",
    workMsToday: 28_800_000,
  })),
);

vi.mock("../lib/salary", async () => {
  const actual = await vi.importActual<typeof import("../lib/salary")>("../lib/salary");

  return {
    ...actual,
    calculateSalarySnapshot: calculateSalarySnapshotMock,
  };
});

describe("useSalaryTicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    calculateSalarySnapshotMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not run salary business calculation at animation-frame frequency", async () => {
    const requestAnimationFrameMock = vi.fn((callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 16),
    );
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock);

    const { useSalaryTicker } = await import("./useSalaryTicker");
    const { startTicker, stopTicker } = useSalaryTicker(ref(defaultSalaryConfig));
    const initialCallCount = calculateSalarySnapshotMock.mock.calls.length;

    startTicker();
    await vi.advanceTimersByTimeAsync(1_000);
    stopTicker();

    expect(requestAnimationFrameMock).not.toHaveBeenCalled();
    expect(
      calculateSalarySnapshotMock.mock.calls.length - initialCallCount,
    ).toBeLessThanOrEqual(10);
  });

  it("keeps ticking continuously even when the document is hidden to preserve live accuracy", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden" as DocumentVisibilityState,
    });

    const { useSalaryTicker } = await import("./useSalaryTicker");
    const { refreshNow, startTicker, stopTicker } = useSalaryTicker(
      ref(defaultSalaryConfig),
    );
    const countBeforeStart = calculateSalarySnapshotMock.mock.calls.length;

    startTicker();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(calculateSalarySnapshotMock.mock.calls.length).toBeGreaterThan(
      countBeforeStart + 1,
    );

    const countBeforeRefresh = calculateSalarySnapshotMock.mock.calls.length;
    refreshNow();
    expect(calculateSalarySnapshotMock.mock.calls.length).toBe(countBeforeRefresh + 1);

    stopTicker();
  });

  it("re-attaches the config watcher cleanly after stopTicker and startTicker", async () => {
    const { useSalaryTicker } = await import("./useSalaryTicker");
    const config = ref({ ...defaultSalaryConfig });
    const { startTicker, stopTicker } = useSalaryTicker(config);

    startTicker();
    stopTicker();
    startTicker();

    const beforeMutation = calculateSalarySnapshotMock.mock.calls.length;
    config.value.monthlySalary = 12_345;
    await Promise.resolve();

    expect(calculateSalarySnapshotMock.mock.calls.length).toBeGreaterThan(beforeMutation);
    stopTicker();
  });
});
