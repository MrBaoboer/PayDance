export type ClockReading = {
  monotonicMs: number;
  wallTimeMs: number;
};

export type ClockReader = () => ClockReading;

export const readBrowserClock: ClockReader = () => ({
  monotonicMs: performance.now(),
  wallTimeMs: Date.now(),
});

export function createMonotonicWallClock(readClock: ClockReader = readBrowserClock) {
  const base = readClock();
  let lastWallTimeMs = base.wallTimeMs;

  const nowMs = (reading: ClockReading = readClock()) => {
    const nextWallTimeMs = base.wallTimeMs + reading.monotonicMs - base.monotonicMs;
    lastWallTimeMs = Math.max(lastWallTimeMs, nextWallTimeMs);
    return lastWallTimeMs;
  };

  return {
    now: (reading?: ClockReading) => new Date(nowMs(reading)),
    nowMs,
  };
}
