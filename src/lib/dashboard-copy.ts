import type { SalaryStatus } from "./salary";

type DashboardCopyInput = {
  hasConfigIssues: boolean;
  minuteRate: number;
  secondRate: number;
  status: SalaryStatus;
};

type DashboardCopy = {
  pulse: string;
  title: string;
};

const formatPulseAmount = (value: number, fractionDigits: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return fractionDigits === 4 ? "0.0000" : "0.00";
  }

  return value.toFixed(fractionDigits);
};

export const getDashboardCopy = ({
  hasConfigIssues,
  minuteRate,
  secondRate,
  status,
}: DashboardCopyInput): DashboardCopy => {
  if (hasConfigIssues || status === "invalid-config") {
    return {
      pulse: "修正设置后恢复实时入账",
      title: "配置待修正",
    };
  }

  if (status === "lunch-break") {
    return {
      pulse: "复工后继续跳动",
      title: "午休中，收入暂停",
    };
  }

  if (status === "before-work") {
    return {
      pulse: "上班后开始实时入账",
      title: "等待开工",
    };
  }

  if (status === "after-work") {
    return {
      pulse: "今天的工资已全部入账",
      title: "今日已完成",
    };
  }

  if (status === "rest-day") {
    return {
      pulse: "工作日再开始跳动",
      title: "今日休息",
    };
  }

  return {
    pulse: `每秒 ¥${formatPulseAmount(secondRate, 4)} · 每分钟 ¥${formatPulseAmount(minuteRate, 2)}`,
    title: "今日已入账",
  };
};
