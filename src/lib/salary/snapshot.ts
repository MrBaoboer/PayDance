import {
  emptySnapshot,
  type SalaryConfig,
  type SalarySnapshot,
  type SalaryStatus,
} from "./config";
import { isWithinNightWorkWindow, spansTouchNightWorkWindow } from "./night-shift";
import { clamp } from "./time";
import { validateSalaryConfig, type ValidateT } from "./validation";
import { resolveWorkSpans, type WorkSpan } from "./work-spans";
import type { Messages } from "../../i18n/types";

function getDailySalary(config: SalaryConfig, totalWorkMs: number) {
  const workHours = totalWorkMs / 3_600_000;

  if (config.salaryType === "daily") {
    return config.dailySalary;
  }

  if (config.salaryType === "hourly") {
    return config.hourlyRate * workHours;
  }

  return config.monthlySalary / config.workDaysPerMonth;
}

function getSnapshotStatus(
  now: Date,
  spans: readonly WorkSpan[],
  elapsedWorkMs: number,
  totalWorkMs: number,
): SalaryStatus {
  if (spans.some(([start, end]) => now >= start && now < end)) {
    return "working";
  }

  if (elapsedWorkMs <= 0) {
    return "before-work";
  }

  if (elapsedWorkMs >= totalWorkMs) {
    return "after-work";
  }

  return "lunch-break";
}

function getNextTransitionMs(
  now: Date,
  spans: readonly WorkSpan[],
  status: SalaryStatus,
) {
  const nowMs = now.getTime();

  if (status === "before-work") {
    return Math.max(0, spans[0][0].getTime() - nowMs);
  }

  if (status === "lunch-break") {
    const nextSpan = spans.find(([start]) => start.getTime() > nowMs);
    return nextSpan ? Math.max(0, nextSpan[0].getTime() - nowMs) : 0;
  }

  if (status === "working") {
    return Math.max(0, spans[spans.length - 1][1].getTime() - nowMs);
  }

  return 0;
}

const fallbackT: ValidateT = (key: keyof Messages) => key;

export function calculateSalarySnapshot(
  now: Date,
  config: SalaryConfig,
  t: ValidateT = fallbackT,
): SalarySnapshot {
  const issues = validateSalaryConfig(config, t);
  if (issues.length > 0) {
    return { ...emptySnapshot, status: "invalid-config" };
  }

  const spans = resolveWorkSpans(now, config);
  if (spans.length <= 0) {
    return { ...emptySnapshot, status: "rest-day" };
  }

  const totalWorkMs = spans.reduce(
    (sum, [start, end]) => sum + Math.max(0, end.getTime() - start.getTime()),
    0,
  );

  if (totalWorkMs <= 0) {
    return { ...emptySnapshot, status: "invalid-config" };
  }

  const nowMs = now.getTime();
  const elapsedWorkMs = spans.reduce((sum, [start, end]) => {
    const spanMs = end.getTime() - start.getTime();
    return sum + clamp(nowMs - start.getTime(), 0, spanMs);
  }, 0);

  const dailySalary = getDailySalary(config, totalWorkMs);
  const workHours = totalWorkMs / 3_600_000;
  const hourlyRate = dailySalary / workHours;
  const minuteRate = hourlyRate / 60;
  const secondRate = minuteRate / 60;
  const progress = clamp(elapsedWorkMs / totalWorkMs, 0, 1);
  const status = getSnapshotStatus(now, spans, elapsedWorkMs, totalWorkMs);
  const isWorking = status === "working";
  const nextTransitionMs = getNextTransitionMs(now, spans, status);
  const isNightWork =
    (status === "working" && isWithinNightWorkWindow(now)) ||
    (status === "after-work" && spansTouchNightWorkWindow(spans));

  return {
    earnedToday: dailySalary * progress,
    dailySalary,
    hourlyRate,
    minuteRate,
    secondRate,
    progress,
    isWorking,
    status,
    workMsToday: totalWorkMs,
    elapsedWorkMs,
    nextTransitionMs,
    isNightWork,
  };
}
