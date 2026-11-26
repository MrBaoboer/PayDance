// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import type { Locale } from "../composables/useI18n";
import {
  getDefaultCurrencySymbolForLocale,
  isLocaleDefaultCurrencySymbol,
} from "../lib/currency";
import { defaultSalaryConfig, type SalaryConfig } from "../lib/salary";
import { settingsStoreKeys } from "../lib/settings-store";
import type { SettingsStoreAdapter } from "../platform/settings-store.web";

export const createWebPreviewDemoConfig = (): SalaryConfig => ({
  ...defaultSalaryConfig,
  salaryType: "monthly",
  monthlySalary: 20000,
  workdays: [0, 1, 2, 3, 4, 5, 6],
  // 00:00–23:59 keeps the demo ticking whenever someone visits; 24:00 is not a valid time,
  // so the last minute of the day reads as "done" instead.
  startTime: "00:00",
  endTime: "23:59",
});

export async function ensureWebPreviewDemoSettings(
  store: SettingsStoreAdapter,
  locale?: Locale,
): Promise<boolean> {
  const [
    savedConfig,
    savedCurrencySymbol,
    savedCurrencyCustomized,
    hasCompletedOnboarding,
  ] = await Promise.all([
    store.get<Partial<SalaryConfig>>(settingsStoreKeys.config),
    store.get<string>(settingsStoreKeys.currencySymbol),
    store.get<boolean>(settingsStoreKeys.currencySymbolCustomized),
    store.get<boolean>(settingsStoreKeys.hasCompletedOnboarding),
  ]);
  let changed = false;

  if (savedConfig === undefined) {
    await store.set(settingsStoreKeys.config, createWebPreviewDemoConfig());
    changed = true;
  }

  // Keep the demo currency symbol synced with the active page locale (zh-CN -> ¥, en -> $)
  // unless the visitor explicitly customized it. Preserves existing non-default custom symbols
  // saved before the customized flag existed.
  if (locale && savedCurrencyCustomized !== true) {
    const localeDefault = getDefaultCurrencySymbolForLocale(locale);
    if (
      savedCurrencySymbol === undefined ||
      isLocaleDefaultCurrencySymbol(savedCurrencySymbol)
    ) {
      if (savedCurrencySymbol !== localeDefault) {
        await store.set(settingsStoreKeys.currencySymbol, localeDefault);
        changed = true;
      }
    } else {
      await store.set(settingsStoreKeys.currencySymbolCustomized, true);
      changed = true;
    }
  }

  if (hasCompletedOnboarding !== true) {
    await store.set(settingsStoreKeys.hasCompletedOnboarding, true);
    changed = true;
  }
  if (!changed) return false;

  await store.save();
  return true;
}
