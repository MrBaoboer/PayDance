// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import {
  emptySnapshot,
  type SalaryConfig,
  type SalarySnapshot,
  type SalaryStatus,
} from "./config";
import { isWithinNightWorkWindow, spansTouchNightWorkWindow } from "./night-shift";
import {
  clamp,
  normalizeBreakEnd,
  normalizeTimeInsideWorkWindow,
  normalizeWorkEnd,
  parseTimeToMinutes,
} from "./time";
import { validateSalaryConfig, type ValidateT } from "./validation";
import { resolveWorkSpans, type WorkSpan } from "./work-spans";
import type { Messages } from "../../i18n/types";

export type SalaryRates = {
  dailySalary: number;
  hourlyRate: number;
  minuteRate: number;
  secondRate: number;
  workMsPerDay: number;
};

export const emptySalaryRates: SalaryRates = {
  dailySalary: 0,
  hourlyRate: 0,
  minuteRate: 0,
  secondRate: 0,
  workMsPerDay: 0,
};

function getConfiguredWorkMsPerDay(config: SalaryConfig) {
  const start = parseTimeToMinutes(config.startTime);
  const end = parseTimeToMinutes(config.endTime);

  if (![start, end].every(Number.isFinite) || start === end) {
    return 0;
  }

  const workEnd = normalizeWorkEnd(start, end);
  const totalMinutes = workEnd - start;

  if (!config.enableLunchBreak) {
    return totalMinutes * 60_000;
  }

  const lunchStart = parseTimeToMinutes(config.lunchStart);
  const lunchEnd = parseTimeToMinutes(config.lunchEnd);
  if (![lunchStart, lunchEnd].every(Number.isFinite)) {
    return 0;
  }

  const normalizedLunchStart = normalizeTimeInsideWorkWindow(lunchStart, start);
  const normalizedLunchEnd = normalizeBreakEnd(normalizedLunchStart, lunchEnd);
  if (
    start < normalizedLunchStart &&
    normalizedLunchStart < normalizedLunchEnd &&
    normalizedLunchEnd < workEnd
  ) {
    return (totalMinutes - (normalizedLunchEnd - normalizedLunchStart)) * 60_000;
  }

  return 0;
}

export function calculateSalaryRates(
  config: SalaryConfig,
  t: ValidateT = fallbackT,
): SalaryRates {
  if (validateSalaryConfig(config, t).length > 0) {
    return { ...emptySalaryRates };
  }

  const workMsPerDay = getConfiguredWorkMsPerDay(config);
  if (workMsPerDay <= 0) {
    return { ...emptySalaryRates };
  }

  const dailySalary = getDailySalary(config, workMsPerDay);
  const workHours = workMsPerDay / 3_600_000;
  const hourlyRate = dailySalary / workHours;
  const minuteRate = hourlyRate / 60;
  const secondRate = minuteRate / 60;

  return {
    dailySalary,
    hourlyRate,
    minuteRate,
    secondRate,
    workMsPerDay,
  };
}

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
