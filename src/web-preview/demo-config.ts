// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

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
): Promise<boolean> {
  const savedConfig = await store.get<Partial<SalaryConfig>>(settingsStoreKeys.config);
  const hasCompletedOnboarding = await store.get<boolean>(
    settingsStoreKeys.hasCompletedOnboarding,
  );
  let changed = false;

  if (savedConfig === undefined) {
    await store.set(settingsStoreKeys.config, createWebPreviewDemoConfig());
    changed = true;
  }
  if (hasCompletedOnboarding !== true) {
    await store.set(settingsStoreKeys.hasCompletedOnboarding, true);
    changed = true;
  }
  if (!changed) return false;

  await store.save();
  return true;
}
