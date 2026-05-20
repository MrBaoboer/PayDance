import type { SalaryConfig, SalaryStatus } from "./salary";

const nightShiftStartMinute = 18 * 60;

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

export function isNightShiftDisplayConfig(config: SalaryConfig) {
  const start = parseTimeToMinutes(config.startTime);
  const end = parseTimeToMinutes(config.endTime);

  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    start >= nightShiftStartMinute &&
    end < start
  );
}

export function getStatusText(
  status: SalaryStatus,
  config: SalaryConfig,
  hasConfigIssues: boolean,
) {
  if (hasConfigIssues) return "配置待修正";

  const isNightShift = isNightShiftDisplayConfig(config);
  const statusMap = {
    "after-work": isNightShift ? "夜班已完成" : "已下班",
    "before-work": "未到上班",
    "invalid-config": "配置待修正",
    "lunch-break": "午休中",
    "rest-day": "今日休息",
    working: isNightShift ? "正在夜班" : "正在上班",
  } satisfies Record<SalaryStatus, string>;

  return statusMap[status];
}
