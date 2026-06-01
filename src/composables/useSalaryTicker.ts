// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { ref, type Ref } from "vue";
import {
  calculateSalarySnapshot,
  type SalaryConfig,
  type SalarySnapshot,
} from "../lib/salary";
import type { ValidateT } from "../lib/salary/validation";
import { createMonotonicWallClock } from "../lib/monotonic-clock";

const minTickerIntervalMs = 120;
const maxActiveTickerIntervalMs = 1_000;
const idleTickerIntervalMs = 1_000;
const centPrecision = 0.01;

const clampDelay = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const resolveNextTickDelay = (snapshot: SalarySnapshot) => {
  if (snapshot.status !== "working" || snapshot.secondRate <= 0) {
    if (snapshot.nextTransitionMs > 0) {
      return clampDelay(
        snapshot.nextTransitionMs,
        minTickerIntervalMs,
        idleTickerIntervalMs,
      );
    }

    return idleTickerIntervalMs;
  }

  const nextCentMs = (centPrecision / snapshot.secondRate) * 1_000;
  const activeDelay = clampDelay(
    nextCentMs,
    minTickerIntervalMs,
    maxActiveTickerIntervalMs,
  );

  if (snapshot.nextTransitionMs > 0) {
    return Math.min(
      activeDelay,
      Math.max(minTickerIntervalMs, snapshot.nextTransitionMs),
    );
  }

  return activeDelay;
};

const fallbackValidateT: ValidateT = (key) => key;

export function useSalaryTicker(
  config: Ref<SalaryConfig>,
  t: ValidateT = fallbackValidateT,
) {
  const snapshot = ref<SalarySnapshot>(
    calculateSalarySnapshot(new Date(), config.value, t),
  );

  let timerId = 0;
  let isRunning = false;

  const startTicker = () => {
    if (isRunning) return;

    const clock = createMonotonicWallClock();
    isRunning = true;

    const tick = () => {
      if (!isRunning) return;

      const now = clock.now({
        monotonicMs: performance.now(),
        wallTimeMs: Date.now(),
      });
      snapshot.value = calculateSalarySnapshot(now, config.value, t);
      timerId = window.setTimeout(tick, resolveNextTickDelay(snapshot.value));
    };

    tick();
  };

  const stopTicker = () => {
    isRunning = false;
    window.clearTimeout(timerId);
  };

  return {
    snapshot,
    startTicker,
    stopTicker,
  };
}
