import type { SalaryConfig, SalaryType } from "./salary";

export const salaryTypeOptions: Array<{ value: SalaryType; label: string }> = [
  { value: "monthly", label: "月薪" },
  { value: "daily", label: "日薪" },
  { value: "hourly", label: "时薪" },
];

export const weekdayOptions = [
  { value: 1, label: "一" },
  { value: 2, label: "二" },
  { value: 3, label: "三" },
  { value: 4, label: "四" },
  { value: 5, label: "五" },
  { value: 6, label: "六" },
  { value: 0, label: "日" },
];

export const getSalaryAmountLabel = (salaryType: SalaryType) => {
  if (salaryType === "daily") return "日薪";
  if (salaryType === "hourly") return "时薪";
  return "月薪";
};

export const toggleWorkdayValue = (
  workdays: SalaryConfig["workdays"],
  day: number,
) =>
  (workdays.includes(day)
    ? workdays.filter((item) => item !== day)
    : [...workdays, day]
  ).sort((a, b) => a - b);

export const readInputText = (event: Event) =>
  (event.target as HTMLInputElement).value;

export const readInputChecked = (event: Event) =>
  (event.target as HTMLInputElement).checked;
