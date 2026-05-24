import type { SalaryConfig } from "./config";
import {
  dateAtMinutes,
  normalizeBreakEnd,
  normalizeTimeInsideWorkWindow,
  normalizeWorkEnd,
  parseTimeToMinutes,
  previousDate,
} from "./time";

export type WorkSpan = readonly [Date, Date];

export function isConfiguredWorkday(date: Date, config: SalaryConfig) {
  if (!Array.isArray(config.workdays) || config.workdays.length <= 0) {
    return false;
  }

  return config.workdays.includes(date.getDay());
}

export function createWorkSpans(date: Date, config: SalaryConfig): readonly WorkSpan[] {
  if (!isConfiguredWorkday(date, config)) {
    return [];
  }

  const start = parseTimeToMinutes(config.startTime);
  const end = parseTimeToMinutes(config.endTime);

  if (![start, end].every(Number.isFinite) || start === end) {
    return [];
  }

  const workEnd = normalizeWorkEnd(start, end);

  if (!config.enableLunchBreak) {
    return [[dateAtMinutes(date, start), dateAtMinutes(date, workEnd)]] as const;
  }

  const lunchStart = parseTimeToMinutes(config.lunchStart);
  const lunchEnd = parseTimeToMinutes(config.lunchEnd);

  if (![lunchStart, lunchEnd].every(Number.isFinite)) {
    return [];
  }

  const normalizedLunchStart = normalizeTimeInsideWorkWindow(lunchStart, start);
  const normalizedLunchEnd = normalizeBreakEnd(normalizedLunchStart, lunchEnd);

  if (
    start < normalizedLunchStart &&
    normalizedLunchStart < normalizedLunchEnd &&
    normalizedLunchEnd < workEnd
  ) {
    return [
      [dateAtMinutes(date, start), dateAtMinutes(date, normalizedLunchStart)],
      [dateAtMinutes(date, normalizedLunchEnd), dateAtMinutes(date, workEnd)],
    ] as const;
  }

  return [];
}

const isWithinSpanBounds = (now: Date, spans: readonly WorkSpan[]) => {
  if (spans.length <= 0) return false;

  const firstStart = spans[0][0].getTime();
  const lastEnd = spans[spans.length - 1][1].getTime();
  const nowMs = now.getTime();

  return nowMs >= firstStart && nowMs <= lastEnd;
};

const didSpanEndToday = (now: Date, spans: readonly WorkSpan[]) => {
  if (spans.length <= 0) return false;

  const lastEnd = spans[spans.length - 1][1];

  return (
    now > lastEnd &&
    now.getFullYear() === lastEnd.getFullYear() &&
    now.getMonth() === lastEnd.getMonth() &&
    now.getDate() === lastEnd.getDate()
  );
};

const hasNotReachedFirstSpan = (now: Date, spans: readonly WorkSpan[]) =>
  spans.length > 0 && now < spans[0][0];

export const resolveWorkSpans = (now: Date, config: SalaryConfig) => {
  const previousSpans = createWorkSpans(previousDate(now), config);

  if (isWithinSpanBounds(now, previousSpans)) {
    return previousSpans;
  }

  const currentSpans = createWorkSpans(now, config);
  if (
    didSpanEndToday(now, previousSpans) &&
    (currentSpans.length <= 0 || hasNotReachedFirstSpan(now, currentSpans))
  ) {
    return previousSpans;
  }

  return currentSpans;
};
