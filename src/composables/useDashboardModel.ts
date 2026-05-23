import { computed, type Ref } from "vue";
import {
  validateSalaryConfig,
  type SalaryConfig,
  type SalaryConfigIssue,
  type SalarySnapshot,
} from "../lib/salary";
import { getStatusText } from "../lib/shift-display";
import { formatDashboardDuration } from "../lib/duration-format";
import { formatYuan } from "../lib/money-format";

export type DashboardMiddleStat = {
  label: string;
  value: string;
};

export function useDashboardModel(
  config: Ref<SalaryConfig>,
  snapshot: Ref<SalarySnapshot>,
) {
  const earnedText = computed(() => formatYuan(snapshot.value.earnedToday));
  const dailyEarnText = computed(() => formatYuan(snapshot.value.dailySalary));
  const salaryModeLabel = computed(() => {
    if (config.value.salaryType === "daily") return "日薪模式";
    if (config.value.salaryType === "hourly") return "时薪模式";
    return "月薪模式";
  });
  const configIssues = computed(() => validateSalaryConfig(config.value));
  const firstConfigIssue = computed(() => configIssues.value[0]?.message ?? "");
  const hasConfigIssues = computed(() => configIssues.value.length > 0);
  const statusText = computed(() =>
    getStatusText(
      snapshot.value.status,
      snapshot.value.isNightWork,
      hasConfigIssues.value,
    ),
  );
  const workedTimeText = computed(() =>
    formatDashboardDuration(snapshot.value.elapsedWorkMs),
  );
  const middleStat = computed<DashboardMiddleStat>(() => {
    if (hasConfigIssues.value) {
      return { label: "配置待修正", value: "--" };
    }

    if (snapshot.value.status === "rest-day") {
      return { label: "今日休息", value: "0m" };
    }

    if (snapshot.value.status === "before-work") {
      return {
        label: "距离上班",
        value: formatDashboardDuration(snapshot.value.nextTransitionMs),
      };
    }

    if (snapshot.value.status === "lunch-break") {
      return {
        label: "距离复工",
        value: formatDashboardDuration(snapshot.value.nextTransitionMs),
      };
    }

    if (snapshot.value.status === "after-work") {
      return { label: "今日完成", value: "100%" };
    }

    return {
      label: "距离下班",
      value: formatDashboardDuration(snapshot.value.nextTransitionMs),
    };
  });

  const hasIssue = (field: SalaryConfigIssue["field"]) =>
    configIssues.value.some((issue) => issue.field === field);

  return {
    dailyEarnText,
    earnedText,
    firstConfigIssue,
    hasConfigIssues,
    hasIssue,
    middleStat,
    salaryModeLabel,
    statusText,
    workedTimeText,
  };
}
