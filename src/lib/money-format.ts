// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

const numberFormatters = new Map<string, Intl.NumberFormat>();

export function getMoneyFormatter(locale: string, fractionDigits = 2) {
  const cacheKey = `${locale}:${fractionDigits}`;
  const cachedFormatter = numberFormatters.get(cacheKey);
  if (cachedFormatter) return cachedFormatter;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping: false,
  });
  numberFormatters.set(cacheKey, formatter);
  return formatter;
}

export function getYuanFormatter(locale: string) {
  return getMoneyFormatter(locale, 2);
}

export function formatYuan(value: number, locale = "zh-CN", fractionDigits = 2) {
  return getMoneyFormatter(locale, fractionDigits).format(value);
}
