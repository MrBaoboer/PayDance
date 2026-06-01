// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { startOfLocalDay } from "./time";
import type { WorkSpan } from "./work-spans";

const nightWorkStartHour = 22;
const nightWorkEndHour = 6;

const localHourDate = (date: Date, hour: number) => {
  const value = startOfLocalDay(date);
  value.setHours(hour, 0, 0, 0);
  return value;
};

export const isWithinNightWorkWindow = (date: Date) => {
  const hour = date.getHours();
  return hour >= nightWorkStartHour || hour < nightWorkEndHour;
};

const intervalsOverlap = (start: Date, end: Date, windowStart: Date, windowEnd: Date) =>
  start < windowEnd && end > windowStart;

export const spansTouchNightWorkWindow = (spans: readonly WorkSpan[]) => {
  for (const [spanStart, spanEnd] of spans) {
    const firstWindowDay = startOfLocalDay(spanStart);
    firstWindowDay.setDate(firstWindowDay.getDate() - 1);

    for (let dayOffset = 0; dayOffset < 4; dayOffset += 1) {
      const windowDay = new Date(firstWindowDay);
      windowDay.setDate(firstWindowDay.getDate() + dayOffset);
      const windowStart = localHourDate(windowDay, nightWorkStartHour);
      const windowEnd = localHourDate(windowDay, nightWorkEndHour);
      windowEnd.setDate(windowEnd.getDate() + 1);

      if (intervalsOverlap(spanStart, spanEnd, windowStart, windowEnd)) {
        return true;
      }
    }
  }

  return false;
};
