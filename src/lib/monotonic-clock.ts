// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

export type ClockReading = {
  monotonicMs: number;
  wallTimeMs: number;
};

export type ClockReader = () => ClockReading;

export type MonotonicWallClockOptions = {
  rebaseThresholdMs?: number;
  backwardRebaseThresholdMs?: number;
};

export const readBrowserClock: ClockReader = () => ({
  monotonicMs: performance.now(),
  wallTimeMs: Date.now(),
});

// 30s absorbs routine NTP slews while promptly catching short sleeps/hibernations.
const defaultRebaseThresholdMs = 30_000;
// 60s prevents small backward NTP adjustments from making earned amounts tick down,
// while letting large manual or NTP clock rollbacks recover instead of freezing in the future.
const defaultBackwardRebaseThresholdMs = 60_000;

export function createMonotonicWallClock(
  readClock: ClockReader = readBrowserClock,
  options: MonotonicWallClockOptions = {},
) {
  let base = readClock();
  let lastWallTimeMs = base.wallTimeMs;
  const rebaseThresholdMs = options.rebaseThresholdMs ?? defaultRebaseThresholdMs;
  const backwardRebaseThresholdMs =
    options.backwardRebaseThresholdMs ?? defaultBackwardRebaseThresholdMs;

  const rebase = (reading: ClockReading, wallTimeMs: number) => {
    base = {
      monotonicMs: reading.monotonicMs,
      wallTimeMs,
    };
    lastWallTimeMs = wallTimeMs;
    return lastWallTimeMs;
  };

  const nowMs = (reading: ClockReading = readClock()) => {
    const monotonicDeltaMs = reading.monotonicMs - base.monotonicMs;
    const nextWallTimeMs = base.wallTimeMs + monotonicDeltaMs;
    const driftMs = reading.wallTimeMs - nextWallTimeMs;

    if (driftMs > rebaseThresholdMs) {
      return rebase(reading, Math.max(lastWallTimeMs, reading.wallTimeMs));
    }

    if (driftMs < -backwardRebaseThresholdMs) {
      return rebase(reading, reading.wallTimeMs);
    }

    lastWallTimeMs = Math.max(lastWallTimeMs, nextWallTimeMs);
    return lastWallTimeMs;
  };

  return {
    now: (reading?: ClockReading) => new Date(nowMs(reading)),
    nowMs,
  };
}
