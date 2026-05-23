export const yuanFormatter = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
});

export const formatYuan = (value: number) => yuanFormatter.format(value);
