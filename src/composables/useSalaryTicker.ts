import { ref, type Ref } from "vue";
import {
  calculateSalarySnapshot,
  type SalaryConfig,
  type SalarySnapshot,
} from "../lib/salary";
import { createMonotonicWallClock } from "../lib/monotonic-clock";

export function useSalaryTicker(config: Ref<SalaryConfig>) {
  const snapshot = ref<SalarySnapshot>(
    calculateSalarySnapshot(new Date(), config.value),
  );

  let rafId = 0;

  const startTicker = () => {
    const clock = createMonotonicWallClock();

    const tick = (perfTime: number) => {
      const now = clock.now({
        monotonicMs: perfTime,
        wallTimeMs: Date.now(),
      });
      snapshot.value = calculateSalarySnapshot(now, config.value);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  };

  const stopTicker = () => {
    cancelAnimationFrame(rafId);
  };

  return {
    snapshot,
    startTicker,
    stopTicker,
  };
}
