import { computed, type Ref } from "vue";
import {
  validateSalaryConfig,
  type SalaryConfig,
  type SalaryConfigIssue,
  type SalarySnapshot,
} from "../lib/salary";
import type { ValidateT } from "../lib/salary/validation";
import { getStatusText, type TFunc } from "../lib/shift-display";
import { formatDashboardDuration } from "../lib/duration-format";
import { formatYuan } from "../lib/money-format";
import type { Locale } from "./useI18n";

export type DashboardMiddleStat = {
  label: string;
  value: string;
};

export function useDashboardModel(
  config: Ref<SalaryConfig>,
  snapshot: Ref<SalarySnapshot>,
  t: TFunc,
  locale: Ref<Locale>,
) {
  const earnedText = computed(() => formatYuan(snapshot.value.earnedToday, locale.value));
  const dailyEarnText = computed(() =>
    formatYuan(snapshot.value.dailySalary, locale.value),
  );
  const salaryModeLabel = computed(() => {
    if (config.value.salaryType === "daily") return t("salaryMode.dailyLong");
    if (config.value.salaryType === "hourly") return t("salaryMode.hourlyLong");
    return t("salaryMode.monthlyLong");
  });
  const configIssues = computed(() => validateSalaryConfig(config.value, t as ValidateT));
  const firstConfigIssue = computed(() => configIssues.value[0]?.message ?? "");
  const hasConfigIssues = computed(() => configIssues.value.length > 0);
  const statusText = computed(() =>
    getStatusText(
      snapshot.value.status,
      snapshot.value.isNightWork,
      hasConfigIssues.value,
      t,
    ),
  );
  const workedTimeText = computed(() =>
    formatDashboardDuration(snapshot.value.elapsedWorkMs),
  );
  const middleStat = computed<DashboardMiddleStat>(() => {
    if (hasConfigIssues.value) {
      return { label: t("status.invalidConfig"), value: "--" };
    }

    if (snapshot.value.status === "rest-day") {
      return { label: t("status.restDay"), value: "0m" };
    }

    if (snapshot.value.status === "before-work") {
      return {
        label: t("stats.untilWork"),
        value: formatDashboardDuration(snapshot.value.nextTransitionMs),
      };
    }

    if (snapshot.value.status === "lunch-break") {
      return {
        label: t("stats.untilResume"),
        value: formatDashboardDuration(snapshot.value.nextTransitionMs),
      };
    }

    if (snapshot.value.status === "after-work") {
      return { label: t("stats.todayDone"), value: "100%" };
    }

    return {
      label: t("stats.untilOff"),
      value: formatDashboardDuration(snapshot.value.nextTransitionMs),
    };
  });

  const isWorkingStatus = computed(() => snapshot.value.status === "working");

  const hasIssue = (field: SalaryConfigIssue["field"]) =>
    configIssues.value.some((issue) => issue.field === field);

  return {
    dailyEarnText,
    earnedText,
    firstConfigIssue,
    hasConfigIssues,
    hasIssue,
    isWorkingStatus,
    middleStat,
    salaryModeLabel,
    statusText,
    workedTimeText,
  };
}
