// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { ref } from "vue";
import {
  resolveWindowPreferences,
  type ThemeMode,
  type WindowPosition,
  type WindowSize,
} from "../lib/window-mode";
import {
  defaultSalaryConfig,
  validateSalaryConfig,
  type SalaryConfig,
} from "../lib/salary";
import {
  defaultCurrencySymbol,
  getDefaultCurrencySymbolForLocale,
  normalizeCurrencySymbol,
} from "../lib/currency";
import {
  migrateSalaryConfig,
  recoverVersionedSalaryConfig,
  resolveOnboardingState,
  settingsSchemaVersion,
} from "../lib/settings-migration";
import { settingsStoreFileName, settingsStoreKeys } from "../lib/settings-store";
import {
  purgeUnusableWindowPositions,
  readPersistedSettingsRecord,
  writePersistedSettingsPayload,
} from "../lib/settings-store-io";
import { createSettingsStore, type SettingsStoreAdapter } from "#settings-store";
import type { Messages } from "../i18n/types";
import { detectLocale, type Locale } from "./useI18n";

export type AmountMode = "rolling" | "plain";

export type PersistedWindowState = {
  isMiniMode: boolean;
  fullSize: WindowSize;
  miniSize: WindowSize;
  miniOpacityPercent: number;
  mainPosition?: WindowPosition;
  miniPosition?: WindowPosition;
};

const serializeSalaryConfig = (config: SalaryConfig) =>
  JSON.stringify({ ...config, workdays: [...config.workdays] });

type TFunc = (key: keyof Messages, params?: Record<string, string | number>) => string;

const fallbackT: TFunc = (key) => key;

export function useSalarySettings(
  storeLoader = () => createSettingsStore(settingsStoreFileName),
  getT: () => TFunc = () => fallbackT,
  options: { retryDelayMs?: number } = {},
) {
  const config = ref<SalaryConfig>({ ...defaultSalaryConfig });
  const currencySymbol = ref(defaultCurrencySymbol);
  const alwaysOnTop = ref(true);
  const themeMode = ref<ThemeMode>("light");
  const amountMode = ref<AmountMode>("rolling");
  const locale = ref<Locale>("zh-CN");
  const hasCompletedOnboarding = ref(false);
  const isSettingsReady = ref(false);
  const isSettingsReadOnly = ref(false);
  const settingsSaveError = ref("");
  const retryDelayMs = options.retryDelayMs ?? 250;
  let storePromise: Promise<SettingsStoreAdapter> | null = null;

  const getStore = () => {
    // A rejected loader is not kept: caching it would make every later save inherit a failure
    // that was only a transient lock or I/O error.
    storePromise ??= storeLoader().catch((error) => {
      storePromise = null;
      throw error;
    });
    return storePromise;
  };

  const resetToDefaults = () => {
    const detectedLocale = detectLocale(undefined);
    config.value = {
      ...defaultSalaryConfig,
      workdays: [...defaultSalaryConfig.workdays],
    };
    locale.value = detectedLocale;
    currencySymbol.value = getDefaultCurrencySymbolForLocale(detectedLocale);
    alwaysOnTop.value = true;
    themeMode.value = "light";
    amountMode.value = "rolling";
    hasCompletedOnboarding.value = false;
  };

  const persistRecoveredConfig = async (
    store: SettingsStoreAdapter,
    recoveredConfig: SalaryConfig,
  ) => {
    try {
      await Promise.all([
        store.set(settingsStoreKeys.config, recoveredConfig),
        store.set(settingsStoreKeys.settingsVersion, settingsSchemaVersion),
      ]);
      await store.save();
    } catch (error) {
      console.error("Failed to persist repaired settings", error);
      settingsSaveError.value = "settings.saveFailed";
    }
  };

  const persistDefaultSettings = async () => {
    try {
      const store = await getStore();
      await writePersistedSettingsPayload(store, {
        alwaysOnTop: alwaysOnTop.value,
        amountMode: amountMode.value,
        config: config.value,
        currencySymbol: currencySymbol.value,
        hasCompletedOnboarding: hasCompletedOnboarding.value,
        locale: locale.value,
        themeMode: themeMode.value,
        windowState: resolveWindowPreferences({}),
      });
      return true;
    } catch (error) {
      console.error("Failed to replace unreadable settings with defaults", error);
      return false;
    }
  };

  // The unreadable file is moved to a .bak first, so rebuilding the store with defaults never
  // destroys what the user had. Without a backup the file is left untouched.
  const recoverUnreadableStore = async () => {
    try {
      const store = await getStore();
      const backupPath = await store.backupUnreadable?.();
      if (!backupPath) return false;

      return await persistDefaultSettings();
    } catch (error) {
      console.error("Failed to back up unreadable settings", error);
      return false;
    }
  };

  const readSettings = async () => {
    const store = await getStore();
    const record = await readPersistedSettingsRecord(store);

    const recoveredConfig = recoverVersionedSalaryConfig({
      config: record.savedConfig,
      schemaVersion: record.savedSettingsVersion,
    });
    config.value = recoveredConfig.config;
    hasCompletedOnboarding.value = resolveOnboardingState(
      record.savedConfig,
      record.savedHasCompletedOnboarding,
    );
    if (recoveredConfig.recoveryReason) {
      await persistRecoveredConfig(store, recoveredConfig.config);
    }

    locale.value = detectLocale(record.savedLocale);

    // Existing installs without a stored currencySymbol keep ¥ so upgrades never silently
    // change their currency; brand-new installs match the detected UI locale (zh-CN -> ¥, en -> $).
    const isFreshInstall =
      record.savedConfig === undefined &&
      record.savedCurrencySymbol === undefined &&
      record.savedHasCompletedOnboarding === undefined;
    currencySymbol.value = isFreshInstall
      ? getDefaultCurrencySymbolForLocale(locale.value)
      : normalizeCurrencySymbol(record.savedCurrencySymbol);

    if (typeof record.savedTop === "boolean") {
      alwaysOnTop.value = record.savedTop;
    }

    if (record.savedTheme === "dark" || record.savedTheme === "light") {
      themeMode.value = record.savedTheme;
    }

    if (record.savedAmountMode === "plain" || record.savedAmountMode === "rolling") {
      amountMode.value = record.savedAmountMode;
    }

    try {
      const purged = await purgeUnusableWindowPositions(
        store,
        record.savedMainPosition,
        record.savedMiniPosition,
      );
      if (purged) await store.save();
    } catch (error) {
      // A failed cleanup must not cost the user their settings; the value is inert anyway.
      console.error("Failed to clear an unusable stored window position", error);
    }

    return resolveWindowPreferences({
      savedFullSize: record.savedFullSize,
      savedIsMiniMode: record.savedIsMiniMode,
      savedMainPosition: record.savedMainPosition,
      savedMiniOpacityPercent: record.savedMiniOpacityPercent,
      savedMiniPosition: record.savedMiniPosition,
      savedMiniSize: record.savedMiniSize,
      savedSettingsVersion: record.savedSettingsVersion,
    });
  };

  const loadSettings = async () => {
    try {
      const preferences = await readSettings();
      isSettingsReadOnly.value = false;
      return preferences;
    } catch (firstError) {
      // Antivirus scans and sync clients lock the file for a moment; one retry absorbs that
      // instead of treating a transient lock as a corrupt store.
      console.error("Failed to load settings, retrying once", firstError);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));

      try {
        const preferences = await readSettings();
        isSettingsReadOnly.value = false;
        return preferences;
      } catch (error) {
        console.error("Failed to load settings, falling back to defaults", error);
        resetToDefaults();
        const recovered = await recoverUnreadableStore();
        // Not recovered means the original file is still on disk: skip onboarding and block
        // automatic saves so moving/resizing/quitting never overwrites a locked or unreadable file.
        hasCompletedOnboarding.value = !recovered;
        isSettingsReadOnly.value = !recovered;
        settingsSaveError.value = recovered
          ? "settings.loadRecovered"
          : "settings.loadFailed";
        return resolveWindowPreferences({});
      }
    } finally {
      isSettingsReady.value = true;
    }
  };

  const retryLoadSettings = async () => {
    // Drop the cached store handle so a fresh Tauri LazyStore re-reads from disk.
    storePromise = null;
    try {
      const preferences = await readSettings();
      isSettingsReadOnly.value = false;
      settingsSaveError.value = "";
      return preferences;
    } catch (error) {
      console.error("Retry reading settings failed", error);
      settingsSaveError.value = "settings.loadFailed";
      return undefined;
    }
  };

  const rebuildSettingsWithDefaults = async () => {
    // Refuse to overwrite an existing unreadable file if backing it up fails.
    try {
      const existingStore = await getStore();
      await existingStore.backupUnreadable?.();
    } catch (error) {
      console.error("Failed to back up unreadable settings before rebuild", error);
      settingsSaveError.value = "settings.backupFailed";
      return false;
    }

    storePromise = null;
    resetToDefaults();
    const persisted = await persistDefaultSettings();
    if (!persisted) {
      settingsSaveError.value = "settings.saveFailed";
      return false;
    }

    isSettingsReadOnly.value = false;
    settingsSaveError.value = "";
    return true;
  };

  const saveSettings = async (windowState: PersistedWindowState) => {
    if (!isSettingsReady.value || isSettingsReadOnly.value) return;

    try {
      const store = await getStore();
      const configSnapshot: SalaryConfig = {
        ...config.value,
        workdays: [...config.value.workdays],
      };
      const configIssues = validateSalaryConfig(configSnapshot, getT());
      const shouldPersistSalaryConfig = configIssues.length <= 0;
      if (!shouldPersistSalaryConfig) {
        console.error("Skipped saving invalid salary settings", configIssues);
      }

      await writePersistedSettingsPayload(store, {
        alwaysOnTop: alwaysOnTop.value,
        amountMode: amountMode.value,
        config: shouldPersistSalaryConfig ? configSnapshot : undefined,
        currencySymbol: currencySymbol.value,
        hasCompletedOnboarding: hasCompletedOnboarding.value,
        locale: locale.value,
        themeMode: themeMode.value,
        windowState,
      });

      // Preserve one-time recovery notices (e.g. .bak created) until the user dismisses or restarts.
      if (settingsSaveError.value === "settings.saveFailed") {
        settingsSaveError.value = "";
      }

      if (shouldPersistSalaryConfig) {
        const savedConfig = await store.get<Partial<SalaryConfig>>(
          settingsStoreKeys.config,
        );
        const verifiedConfig = migrateSalaryConfig(savedConfig);
        if (
          serializeSalaryConfig(verifiedConfig) !== serializeSalaryConfig(configSnapshot)
        ) {
          console.error("Saved salary settings did not match the persisted snapshot");
        }
      }
    } catch (error) {
      console.error("Failed to save settings", error);
      settingsSaveError.value = "settings.saveFailed";
    }
  };

  return {
    amountMode,
    alwaysOnTop,
    config,
    currencySymbol,
    hasCompletedOnboarding,
    isSettingsReadOnly,
    isSettingsReady,
    loadSettings,
    locale,
    rebuildSettingsWithDefaults,
    retryLoadSettings,
    saveSettings,
    settingsSaveError,
    themeMode,
  };
}
