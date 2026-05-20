export type SalaryType = "monthly" | "daily" | "hourly";

export type SalaryStatus =
  | "invalid-config"
  | "rest-day"
  | "before-work"
  | "working"
  | "lunch-break"
  | "after-work";

export type SalaryConfig = {
  salaryType: SalaryType;
  monthlySalary: number;
  dailySalary: number;
  hourlyRate: number;
  workDaysPerMonth: number;
  workdays: number[];
  startTime: string;
  endTime: string;
  lunchStart: string;
  lunchEnd: string;
  enableLunchBreak: boolean;
};

export type SalarySnapshot = {
  earnedToday: number;
  dailySalary: number;
  hourlyRate: number;
  minuteRate: number;
  secondRate: number;
  progress: number;
  isWorking: boolean;
  status: SalaryStatus;
  workMsToday: number;
  elapsedWorkMs: number;
  nextTransitionMs: number;
  isNightWork: boolean;
};

export type SalaryConfigIssue = {
  field: keyof SalaryConfig | "workTime";
  message: string;
};

export const defaultSalaryConfig: SalaryConfig = {
  salaryType: "monthly",
  monthlySalary: 8000,
  dailySalary: 360,
  hourlyRate: 45,
  workDaysPerMonth: 22,
  workdays: [1, 2, 3, 4, 5],
  startTime: "09:30",
  endTime: "18:30",
  lunchStart: "12:00",
  lunchEnd: "13:30",
  enableLunchBreak: false,
};

const emptySnapshot: SalarySnapshot = {
  earnedToday: 0,
  dailySalary: 0,
  hourlyRate: 0,
  minuteRate: 0,
  secondRate: 0,
  progress: 0,
  isWorking: false,
  status: "invalid-config",
  workMsToday: 0,
  elapsedWorkMs: 0,
  nextTransitionMs: 0,
  isNightWork: false,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const nightWorkStartHour = 22;
const nightWorkEndHour = 6;

const parseTimeToMinutes = (time: string) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return Number.NaN;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return Number.NaN;
  }

  return hour * 60 + minute;
};

const normalizeWorkEnd = (start: number, end: number) =>
  end < start ? end + 24 * 60 : end;

const normalizeTimeInsideWorkWindow = (value: number, workStart: number) =>
  value < workStart ? value + 24 * 60 : value;

const normalizeBreakEnd = (breakStart: number, breakEnd: number) => {
  let normalizedEnd = breakEnd;

  while (normalizedEnd <= breakStart) {
    normalizedEnd += 24 * 60;
  }

  return normalizedEnd;
};

const hasPositiveNumber = (value: number) =>
  Number.isFinite(value) && value > 0;

const isValidWorkday = (day: number) =>
  Number.isInteger(day) && day >= 0 && day <= 6;

export function isOvernightWorkConfig(config: SalaryConfig) {
  const start = parseTimeToMinutes(config.startTime);
  const end = parseTimeToMinutes(config.endTime);

  return Number.isFinite(start) && Number.isFinite(end) && end < start;
}

export function validateSalaryConfig(config: SalaryConfig): SalaryConfigIssue[] {
  const issues: SalaryConfigIssue[] = [];
  const start = parseTimeToMinutes(config.startTime);
  const end = parseTimeToMinutes(config.endTime);
  const salaryType = config.salaryType ?? "monthly";

  if (
    salaryType !== "monthly" &&
    salaryType !== "daily" &&
    salaryType !== "hourly"
  ) {
    issues.push({ field: "salaryType", message: "薪资模式错误" });
  }

  if (salaryType === "monthly" && !hasPositiveNumber(config.monthlySalary)) {
    issues.push({ field: "monthlySalary", message: "月薪需大于 0" });
  }

  if (salaryType === "daily" && !hasPositiveNumber(config.dailySalary)) {
    issues.push({ field: "dailySalary", message: "日薪需大于 0" });
  }

  if (salaryType === "hourly" && !hasPositiveNumber(config.hourlyRate)) {
    issues.push({ field: "hourlyRate", message: "时薪需大于 0" });
  }

  if (salaryType === "monthly" && !hasPositiveNumber(config.workDaysPerMonth)) {
    issues.push({ field: "workDaysPerMonth", message: "工作天数需大于 0" });
  }

  if (!Array.isArray(config.workdays) || config.workdays.length <= 0) {
    issues.push({ field: "workdays", message: "至少选 1 天" });
  } else if (!config.workdays.every(isValidWorkday)) {
    issues.push({ field: "workdays", message: "工作日错误" });
  }

  if (!Number.isFinite(start)) {
    issues.push({ field: "startTime", message: "上班时间错误" });
  }

  if (!Number.isFinite(end)) {
    issues.push({ field: "endTime", message: "下班时间错误" });
  }

  if (Number.isFinite(start) && Number.isFinite(end) && start === end) {
    issues.push({ field: "workTime", message: "时间不能相同" });
  }

  if (config.enableLunchBreak) {
    const lunchStart = parseTimeToMinutes(config.lunchStart);
    const lunchEnd = parseTimeToMinutes(config.lunchEnd);

    if (!Number.isFinite(lunchStart)) {
      issues.push({ field: "lunchStart", message: "午休开始错误" });
    }

    if (!Number.isFinite(lunchEnd)) {
      issues.push({ field: "lunchEnd", message: "午休结束错误" });
    }

    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      start !== end &&
      Number.isFinite(lunchStart) &&
      Number.isFinite(lunchEnd)
    ) {
      const workEnd = normalizeWorkEnd(start, end);
      const normalizedLunchStart = normalizeTimeInsideWorkWindow(
        lunchStart,
        start,
      );
      const normalizedLunchEnd = normalizeBreakEnd(
        normalizedLunchStart,
        lunchEnd,
      );

      if (
        !(
          start < normalizedLunchStart &&
          normalizedLunchStart < normalizedLunchEnd &&
          normalizedLunchEnd < workEnd
        )
      ) {
        issues.push({
          field: "workTime",
          message: end < start ? "夜班午休需在工时内" : "午休需在工时内",
        });
      }
    }
  }

  return issues;
}

const dateAtMinutes = (base: Date, minutes: number) => {
  const date = new Date(base);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

export function isConfiguredWorkday(date: Date, config: SalaryConfig) {
  if (!Array.isArray(config.workdays) || config.workdays.length <= 0) {
    return false;
  }

  return config.workdays.includes(date.getDay());
}

export function createWorkSpans(date: Date, config: SalaryConfig) {
  if (!isConfiguredWorkday(date, config)) {
    return [];
  }

  const start = parseTimeToMinutes(config.startTime);
  const end = parseTimeToMinutes(config.endTime);

  if (![start, end].every(Number.isFinite) || start === end) {
    return [];
  }

  const workEnd = normalizeWorkEnd(start, end);

  if (config.enableLunchBreak) {
    const lunchStart = parseTimeToMinutes(config.lunchStart);
    const lunchEnd = parseTimeToMinutes(config.lunchEnd);

    if (![lunchStart, lunchEnd].every(Number.isFinite)) {
      return [];
    }

    const normalizedLunchStart = normalizeTimeInsideWorkWindow(
      lunchStart,
      start,
    );
    const normalizedLunchEnd = normalizeBreakEnd(
      normalizedLunchStart,
      lunchEnd,
    );

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

  return [[dateAtMinutes(date, start), dateAtMinutes(date, workEnd)]] as const;
}

const previousDate = (date: Date) => {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return previous;
};

const startOfLocalDay = (date: Date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

const localHourDate = (date: Date, hour: number) => {
  const value = startOfLocalDay(date);
  value.setHours(hour, 0, 0, 0);
  return value;
};

const isWithinNightWorkWindow = (date: Date) => {
  const hour = date.getHours();
  return hour >= nightWorkStartHour || hour < nightWorkEndHour;
};

const intervalsOverlap = (
  start: Date,
  end: Date,
  windowStart: Date,
  windowEnd: Date,
) => start < windowEnd && end > windowStart;

const spansTouchNightWorkWindow = (
  spans: readonly (readonly [Date, Date])[],
) => {
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

const isWithinSpanBounds = (
  now: Date,
  spans: readonly (readonly [Date, Date])[],
) => {
  if (spans.length <= 0) return false;

  const firstStart = spans[0][0].getTime();
  const lastEnd = spans[spans.length - 1][1].getTime();
  const nowMs = now.getTime();

  return nowMs >= firstStart && nowMs <= lastEnd;
};

const didSpanEndToday = (
  now: Date,
  spans: readonly (readonly [Date, Date])[],
) => {
  if (spans.length <= 0) return false;

  const lastEnd = spans[spans.length - 1][1];

  return (
    now > lastEnd &&
    now.getFullYear() === lastEnd.getFullYear() &&
    now.getMonth() === lastEnd.getMonth() &&
    now.getDate() === lastEnd.getDate()
  );
};

const hasNotReachedFirstSpan = (
  now: Date,
  spans: readonly (readonly [Date, Date])[],
) => spans.length > 0 && now < spans[0][0];

const resolveWorkSpans = (now: Date, config: SalaryConfig) => {
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

  if (currentSpans.length > 0) {
    return currentSpans;
  }

  return currentSpans;
};

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
  spans: readonly (readonly [Date, Date])[],
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
  spans: readonly (readonly [Date, Date])[],
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

export function calculateSalarySnapshot(
  now: Date,
  config: SalaryConfig,
): SalarySnapshot {
  const issues = validateSalaryConfig(config);
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
