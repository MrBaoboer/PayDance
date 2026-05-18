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

const hasPositiveNumber = (value: number) =>
  Number.isFinite(value) && value > 0;

const isValidWorkday = (day: number) =>
  Number.isInteger(day) && day >= 0 && day <= 6;

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
    issues.push({ field: "salaryType", message: "薪资模式不正确" });
  }

  if (salaryType === "monthly" && !hasPositiveNumber(config.monthlySalary)) {
    issues.push({ field: "monthlySalary", message: "月薪需要大于 0" });
  }

  if (salaryType === "daily" && !hasPositiveNumber(config.dailySalary)) {
    issues.push({ field: "dailySalary", message: "日薪需要大于 0" });
  }

  if (salaryType === "hourly" && !hasPositiveNumber(config.hourlyRate)) {
    issues.push({ field: "hourlyRate", message: "时薪需要大于 0" });
  }

  if (salaryType === "monthly" && !hasPositiveNumber(config.workDaysPerMonth)) {
    issues.push({ field: "workDaysPerMonth", message: "每月工作天数需要大于 0" });
  }

  if (!Array.isArray(config.workdays) || config.workdays.length <= 0) {
    issues.push({ field: "workdays", message: "至少需要选择 1 个工作日" });
  } else if (!config.workdays.every(isValidWorkday)) {
    issues.push({ field: "workdays", message: "工作日设置不正确" });
  }

  if (!Number.isFinite(start)) {
    issues.push({ field: "startTime", message: "上班时间格式不正确" });
  }

  if (!Number.isFinite(end)) {
    issues.push({ field: "endTime", message: "下班时间格式不正确" });
  }

  if (Number.isFinite(start) && Number.isFinite(end) && start >= end) {
    issues.push({ field: "workTime", message: "下班时间需要晚于上班时间" });
  }

  if (config.enableLunchBreak) {
    const lunchStart = parseTimeToMinutes(config.lunchStart);
    const lunchEnd = parseTimeToMinutes(config.lunchEnd);

    if (!Number.isFinite(lunchStart)) {
      issues.push({ field: "lunchStart", message: "午休开始时间格式不正确" });
    }

    if (!Number.isFinite(lunchEnd)) {
      issues.push({ field: "lunchEnd", message: "午休结束时间格式不正确" });
    }

    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      start < end &&
      Number.isFinite(lunchStart) &&
      Number.isFinite(lunchEnd) &&
      !(start < lunchStart && lunchStart < lunchEnd && lunchEnd < end)
    ) {
      issues.push({ field: "workTime", message: "午休时间需要完整落在工作时间内" });
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

  if (![start, end].every(Number.isFinite) || start >= end) {
    return [];
  }

  if (config.enableLunchBreak) {
    const lunchStart = parseTimeToMinutes(config.lunchStart);
    const lunchEnd = parseTimeToMinutes(config.lunchEnd);

    if (![lunchStart, lunchEnd].every(Number.isFinite)) {
      return [];
    }

    if (
      start < lunchStart &&
      lunchStart < lunchEnd &&
      lunchEnd < end
    ) {
      return [
        [dateAtMinutes(date, start), dateAtMinutes(date, lunchStart)],
        [dateAtMinutes(date, lunchEnd), dateAtMinutes(date, end)],
      ] as const;
    }

    return [];
  }

  return [[dateAtMinutes(date, start), dateAtMinutes(date, end)]] as const;
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

export function calculateSalarySnapshot(
  now: Date,
  config: SalaryConfig,
): SalarySnapshot {
  const issues = validateSalaryConfig(config);
  if (issues.length > 0) {
    return { ...emptySnapshot, status: "invalid-config" };
  }

  if (!isConfiguredWorkday(now, config)) {
    return { ...emptySnapshot, status: "rest-day" };
  }

  const spans = createWorkSpans(now, config);
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
  };
}
