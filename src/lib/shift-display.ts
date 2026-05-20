import type { SalaryStatus } from "./salary";

export function getStatusText(
  status: SalaryStatus,
  isNightWork: boolean,
  hasConfigIssues: boolean,
) {
  if (hasConfigIssues) return "配置待修正";

  const statusMap = {
    "after-work": isNightWork ? "夜班已完成" : "已下班",
    "before-work": "未到上班",
    "invalid-config": "配置待修正",
    "lunch-break": "午休中",
    "rest-day": "今日休息",
    working: isNightWork ? "正在夜班" : "正在上班",
  } satisfies Record<SalaryStatus, string>;

  return statusMap[status];
}
