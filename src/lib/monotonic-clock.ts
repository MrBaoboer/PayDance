export type ClockReading = {
  monotonicMs: number;
  wallTimeMs: number;
};

export type ClockReader = () => ClockReading;

export type MonotonicWallClockOptions = {
  rebaseThresholdMs?: number;
};

export const readBrowserClock: ClockReader = () => ({
  monotonicMs: performance.now(),
  wallTimeMs: Date.now(),
});

const defaultRebaseThresholdMs = 300_000;

export function createMonotonicWallClock(
  readClock: ClockReader = readBrowserClock,
  options: MonotonicWallClockOptions = {},
) {
  let base = readClock();
  let lastWallTimeMs = base.wallTimeMs;
  const rebaseThresholdMs = options.rebaseThresholdMs ?? defaultRebaseThresholdMs;

  const nowMs = (reading: ClockReading = readClock()) => {
    const nextWallTimeMs = base.wallTimeMs + reading.monotonicMs - base.monotonicMs;
    const driftMs = reading.wallTimeMs - nextWallTimeMs;

    if (driftMs > rebaseThresholdMs) {
      const rebasedWallTimeMs = Math.max(lastWallTimeMs, reading.wallTimeMs);
      base = {
        monotonicMs: reading.monotonicMs,
        wallTimeMs: rebasedWallTimeMs,
      };
      lastWallTimeMs = rebasedWallTimeMs;
      return lastWallTimeMs;
    }

    lastWallTimeMs = Math.max(lastWallTimeMs, nextWallTimeMs);
    return lastWallTimeMs;
  };

  return {
    now: (reading?: ClockReading) => new Date(nowMs(reading)),
    nowMs,
  };
}
