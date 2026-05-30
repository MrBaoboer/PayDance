import type { SalaryConfig, SalaryType } from "./salary";
import type { Messages } from "../i18n/types";

export type SettingsFormT = (
  key: keyof Messages,
  params?: Record<string, string | number>,
) => string;

export function createSalaryTypeOptions(t: SettingsFormT) {
  return [
    { value: "monthly" as SalaryType, label: t("salaryMode.monthly") },
    { value: "daily" as SalaryType, label: t("salaryMode.daily") },
    { value: "hourly" as SalaryType, label: t("salaryMode.hourly") },
  ];
}

export function createWeekdayOptions(t: SettingsFormT) {
  return [
    { value: 1, label: t("workdays.mon") },
    { value: 2, label: t("workdays.tue") },
    { value: 3, label: t("workdays.wed") },
    { value: 4, label: t("workdays.thu") },
    { value: 5, label: t("workdays.fri") },
    { value: 6, label: t("workdays.sat") },
    { value: 0, label: t("workdays.sun") },
  ];
}

export function createGetSalaryAmountLabel(t: SettingsFormT) {
  return (salaryType: SalaryType) => {
    if (salaryType === "daily") return t("salaryAmount.dailySalary");
    if (salaryType === "hourly") return t("salaryAmount.hourlyRate");
    return t("salaryAmount.monthlySalary");
  };
}

export const toggleWorkdayValue = (workdays: SalaryConfig["workdays"], day: number) =>
  (workdays.includes(day)
    ? workdays.filter((item) => item !== day)
    : [...workdays, day]
  ).sort((a, b) => a - b);

export const readInputText = (event: Event) => (event.target as HTMLInputElement).value;

export const readInputChecked = (event: Event) =>
  (event.target as HTMLInputElement).checked;
