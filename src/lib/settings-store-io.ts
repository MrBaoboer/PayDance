// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import type { Locale } from "../composables/useI18n";
import type { AmountMode, PersistedWindowState } from "../composables/useSalarySettings";
import type { SettingsStoreAdapter } from "../platform/types";
import { normalizeCurrencySymbol } from "./currency";
import type { SalaryConfig } from "./salary";
import { settingsSchemaVersion } from "./settings-migration";
import { settingsStoreKeys } from "./settings-store";
import {
  sanitizeWindowPosition,
  type ThemeMode,
  type WindowPosition,
  type WindowSize,
} from "./window-mode";

export type PersistedSettingsRecord = {
  savedAmountMode: AmountMode | undefined;
  savedConfig: Partial<SalaryConfig> | undefined;
  savedCurrencySymbol: string | undefined;
  savedFullSize: WindowSize | undefined;
  savedHasCompletedOnboarding: boolean | undefined;
  savedIsMiniMode: boolean | undefined;
  savedLocale: string | undefined;
  savedMainPosition: WindowPosition | undefined;
  savedMiniOpacityPercent: number | undefined;
  savedMiniPosition: WindowPosition | undefined;
  savedMiniSize: WindowSize | undefined;
  savedSettingsVersion: number | undefined;
  savedTheme: ThemeMode | undefined;
  savedTop: boolean | undefined;
};

export type WritableSettingsPayload = {
  alwaysOnTop: boolean;
  amountMode: AmountMode;
  config?: SalaryConfig;
  currencySymbol: string;
  hasCompletedOnboarding: boolean;
  locale: Locale;
  themeMode: ThemeMode;
  windowState: PersistedWindowState;
};

// Fail fast on the primary config read if the file is locked or unreadable, then batch
// the remaining 13 independent reads concurrently instead of 14 serial IPC round-trips.
export async function readPersistedSettingsRecord(
  store: SettingsStoreAdapter,
): Promise<PersistedSettingsRecord> {
  const savedConfig = await store.get<Partial<SalaryConfig>>(settingsStoreKeys.config);
  const [
    savedCurrencySymbol,
    savedTop,
    savedTheme,
    savedAmountMode,
    savedIsMiniMode,
    savedFullSize,
    savedMiniSize,
    savedMiniOpacityPercent,
    savedMainPosition,
    savedMiniPosition,
    savedSettingsVersion,
    savedHasCompletedOnboarding,
    savedLocale,
  ] = await Promise.all([
    store.get<string>(settingsStoreKeys.currencySymbol),
    store.get<boolean>(settingsStoreKeys.alwaysOnTop),
    store.get<ThemeMode>(settingsStoreKeys.themeMode),
    store.get<AmountMode>(settingsStoreKeys.amountMode),
    store.get<boolean>(settingsStoreKeys.isMiniMode),
    store.get<WindowSize>(settingsStoreKeys.fullSize),
    store.get<WindowSize>(settingsStoreKeys.miniSize),
    store.get<number>(settingsStoreKeys.miniOpacityPercent),
    store.get<WindowPosition>(settingsStoreKeys.mainPosition),
    store.get<WindowPosition>(settingsStoreKeys.miniPosition),
    store.get<number>(settingsStoreKeys.settingsVersion),
    store.get<boolean>(settingsStoreKeys.hasCompletedOnboarding),
    store.get<string>(settingsStoreKeys.locale),
  ]);

  return {
    savedAmountMode,
    savedConfig,
    savedCurrencySymbol,
    savedFullSize,
    savedHasCompletedOnboarding,
    savedIsMiniMode,
    savedLocale,
    savedMainPosition,
    savedMiniOpacityPercent,
    savedMiniPosition,
    savedMiniSize,
    savedSettingsVersion,
    savedTheme,
    savedTop,
  };
}

export async function persistWindowPosition(
  store: SettingsStoreAdapter,
  key: string,
  position: WindowPosition | undefined,
) {
  const usablePosition = sanitizeWindowPosition(position);
  if (usablePosition) {
    await store.set(key, usablePosition);
    return;
  }

  // Nothing worth keeping: also clears a value an older build poisoned with the
  // minimize sentinel, so the settings file stops advertising a lost window.
  await store.delete?.(key);
}

// Clears a stored position an older build poisoned with the Windows minimize sentinel.
// Doing it at load makes the repair deterministic: waiting for the next save would leave
// the bad value visible in salary-settings.json until the user happened to move the window.
export async function purgeUnusableWindowPositions(
  store: SettingsStoreAdapter,
  savedMainPosition: unknown,
  savedMiniPosition: unknown,
) {
  const purge = async (key: string, savedPosition: unknown) => {
    if (savedPosition === undefined || sanitizeWindowPosition(savedPosition)) {
      return false;
    }
    await store.delete?.(key);
    return true;
  };

  const results = await Promise.all([
    purge(settingsStoreKeys.mainPosition, savedMainPosition),
    purge(settingsStoreKeys.miniPosition, savedMiniPosition),
  ]);

  return results.some(Boolean);
}

// Batch independent IPC writes concurrently before flushing to disk with a single store.save().
export async function writePersistedSettingsPayload(
  store: SettingsStoreAdapter,
  payload: WritableSettingsPayload,
) {
  const { windowState } = payload;
  const writes: Array<Promise<unknown>> = [
    store.set(
      settingsStoreKeys.currencySymbol,
      normalizeCurrencySymbol(payload.currencySymbol),
    ),
    store.set(settingsStoreKeys.alwaysOnTop, payload.alwaysOnTop),
    store.set(settingsStoreKeys.fullSize, windowState.fullSize),
    store.set(settingsStoreKeys.isMiniMode, windowState.isMiniMode),
    store.set(settingsStoreKeys.themeMode, payload.themeMode),
    store.set(settingsStoreKeys.amountMode, payload.amountMode),
    store.set(settingsStoreKeys.locale, payload.locale),
    store.set(settingsStoreKeys.miniSize, windowState.miniSize),
    store.set(settingsStoreKeys.miniOpacityPercent, windowState.miniOpacityPercent),
    persistWindowPosition(
      store,
      settingsStoreKeys.mainPosition,
      windowState.mainPosition,
    ),
    persistWindowPosition(
      store,
      settingsStoreKeys.miniPosition,
      windowState.miniPosition,
    ),
    store.set(settingsStoreKeys.hasCompletedOnboarding, payload.hasCompletedOnboarding),
    store.set(settingsStoreKeys.settingsVersion, settingsSchemaVersion),
  ];

  if (payload.config) {
    writes.unshift(store.set(settingsStoreKeys.config, payload.config));
  }

  await Promise.all(writes);
  await store.save();
}
