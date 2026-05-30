const yuanFormatters = new Map<string, Intl.NumberFormat>();

export function getYuanFormatter(locale: string) {
  const cachedFormatter = yuanFormatters.get(locale);
  if (cachedFormatter) return cachedFormatter;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
  yuanFormatters.set(locale, formatter);
  return formatter;
}

export function formatYuan(value: number, locale = "zh-CN") {
  return getYuanFormatter(locale).format(value);
}
