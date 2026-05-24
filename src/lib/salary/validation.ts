import type { SalaryConfig, SalaryConfigIssue, SalaryType } from "./config";
import {
  normalizeBreakEnd,
  normalizeTimeInsideWorkWindow,
  normalizeWorkEnd,
  parseTimeToMinutes,
} from "./time";

const salaryTypes: SalaryType[] = ["monthly", "daily", "hourly"];

const hasPositiveNumber = (value: number) => Number.isFinite(value) && value > 0;

const isValidWorkday = (day: number) => Number.isInteger(day) && day >= 0 && day <= 6;

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

  if (!salaryTypes.includes(salaryType)) {
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

  if (!config.enableLunchBreak) {
    return issues;
  }

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
    const normalizedLunchStart = normalizeTimeInsideWorkWindow(lunchStart, start);
    const normalizedLunchEnd = normalizeBreakEnd(normalizedLunchStart, lunchEnd);

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

  return issues;
}
