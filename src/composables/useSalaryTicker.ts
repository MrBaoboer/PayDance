import { ref, type Ref } from "vue";
import {
  calculateSalarySnapshot,
  type SalaryConfig,
  type SalarySnapshot,
} from "../lib/salary";

export function useSalaryTicker(config: Ref<SalaryConfig>) {
  const snapshot = ref<SalarySnapshot>(
    calculateSalarySnapshot(new Date(), config.value),
  );

  let rafId = 0;

  const startTicker = () => {
    const baseWallTime = Date.now();
    const basePerfTime = performance.now();

    const tick = (perfTime: number) => {
      const now = new Date(baseWallTime + perfTime - basePerfTime);
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
