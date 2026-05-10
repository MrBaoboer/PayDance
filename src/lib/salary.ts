export type SalaryConfig = {
  monthlySalary: number;
  workDaysPerMonth: number;
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
  workMsToday: number;
  elapsedWorkMs: number;
};

export const defaultSalaryConfig: SalaryConfig = {
  monthlySalary: 20000,
  workDaysPerMonth: 21.75,
  startTime: "09:30",
  endTime: "18:30",
  lunchStart: "12:00",
  lunchEnd: "13:30",
  enableLunchBreak: true,
};

const emptySnapshot: SalarySnapshot = {
  earnedToday: 0,
  dailySalary: 0,
  hourlyRate: 0,
  minuteRate: 0,
  secondRate: 0,
  progress: 0,
  isWorking: false,
  workMsToday: 0,
  elapsedWorkMs: 0,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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

const dateAtMinutes = (base: Date, minutes: number) => {
  const date = new Date(base);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

export function createWorkSpans(date: Date, config: SalaryConfig) {
  const start = parseTimeToMinutes(config.startTime);
  const end = parseTimeToMinutes(config.endTime);
  const lunchStart = parseTimeToMinutes(config.lunchStart);
  const lunchEnd = parseTimeToMinutes(config.lunchEnd);

  if (![start, end, lunchStart, lunchEnd].every(Number.isFinite) || start >= end) {
    return [];
  }

  if (
    config.enableLunchBreak &&
    start < lunchStart &&
    lunchStart < lunchEnd &&
    lunchEnd < end
  ) {
    return [
      [dateAtMinutes(date, start), dateAtMinutes(date, lunchStart)],
      [dateAtMinutes(date, lunchEnd), dateAtMinutes(date, end)],
    ] as const;
  }

  return [[dateAtMinutes(date, start), dateAtMinutes(date, end)]] as const;
}

export function calculateSalarySnapshot(
  now: Date,
  config: SalaryConfig,
): SalarySnapshot {
  const spans = createWorkSpans(now, config);
  const totalWorkMs = spans.reduce(
    (sum, [start, end]) => sum + Math.max(0, end.getTime() - start.getTime()),
    0,
  );

  if (
    config.monthlySalary <= 0 ||
    config.workDaysPerMonth <= 0 ||
    totalWorkMs <= 0
  ) {
    return emptySnapshot;
  }

  const nowMs = now.getTime();
  const elapsedWorkMs = spans.reduce((sum, [start, end]) => {
    const spanMs = end.getTime() - start.getTime();
    return sum + clamp(nowMs - start.getTime(), 0, spanMs);
  }, 0);

  const dailySalary = config.monthlySalary / config.workDaysPerMonth;
  const workHours = totalWorkMs / 3_600_000;
  const hourlyRate = dailySalary / workHours;
  const minuteRate = hourlyRate / 60;
  const secondRate = minuteRate / 60;
  const progress = clamp(elapsedWorkMs / totalWorkMs, 0, 1);
  const isWorking = spans.some(([start, end]) => now >= start && now <= end);

  return {
    earnedToday: dailySalary * progress,
    dailySalary,
    hourlyRate,
    minuteRate,
    secondRate,
    progress,
    isWorking,
    workMsToday: totalWorkMs,
    elapsedWorkMs,
  };
}
