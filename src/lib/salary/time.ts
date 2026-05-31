// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const parseTimeToMinutes = (time: string) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return Number.NaN;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return Number.NaN;
  }

  return hour * 60 + minute;
};

export const normalizeWorkEnd = (start: number, end: number) =>
  end < start ? end + 24 * 60 : end;

export const normalizeTimeInsideWorkWindow = (value: number, workStart: number) =>
  value < workStart ? value + 24 * 60 : value;

export const normalizeBreakEnd = (breakStart: number, breakEnd: number) => {
  let normalizedEnd = breakEnd;

  while (normalizedEnd <= breakStart) {
    normalizedEnd += 24 * 60;
  }

  return normalizedEnd;
};

export const dateAtMinutes = (base: Date, minutes: number) => {
  const date = new Date(base);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

export const previousDate = (date: Date) => {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return previous;
};

export const startOfLocalDay = (date: Date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};
