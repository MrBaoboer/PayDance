import { ref } from "vue";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  resolveWindowPreferences,
  type ThemeMode,
  type WindowSize,
} from "../lib/window-mode";
import {
  defaultSalaryConfig,
  validateSalaryConfig,
  type SalaryConfig,
} from "../lib/salary";
import {
  migrateSalaryConfig,
  resolveOnboardingState,
  settingsSchemaVersion,
} from "../lib/settings-migration";
import { settingsStoreFileName, settingsStoreKeys } from "../lib/settings-store";

export type AmountMode = "rolling" | "plain";

export type PersistedWindowState = {
  isMiniMode: boolean;
  fullSize: WindowSize;
  miniSize: WindowSize;
  miniOpacityPercent: number;
};

const store = new LazyStore(settingsStoreFileName);

const serializeSalaryConfig = (config: SalaryConfig) =>
  JSON.stringify({ ...config, workdays: [...config.workdays] });

export function useSalarySettings() {
  const config = ref<SalaryConfig>({ ...defaultSalaryConfig });
  const alwaysOnTop = ref(true);
  const themeMode = ref<ThemeMode>("light");
  const amountMode = ref<AmountMode>("rolling");
  const hasCompletedOnboarding = ref(false);
  const isSettingsReady = ref(false);

  const resetToDefaults = () => {
    config.value = {
      ...defaultSalaryConfig,
      workdays: [...defaultSalaryConfig.workdays],
    };
    alwaysOnTop.value = true;
    themeMode.value = "light";
    amountMode.value = "rolling";
    hasCompletedOnboarding.value = false;
  };

  const loadSettings = async () => {
    try {
      const savedConfig = await store.get<Partial<SalaryConfig>>(
        settingsStoreKeys.config,
      );
      const savedTop = await store.get<boolean>(settingsStoreKeys.alwaysOnTop);
      const savedTheme = await store.get<ThemeMode>(settingsStoreKeys.themeMode);
      const savedAmountMode = await store.get<AmountMode>(settingsStoreKeys.amountMode);
      const savedIsMiniMode = await store.get<boolean>(settingsStoreKeys.isMiniMode);
      const savedFullSize = await store.get<WindowSize>(settingsStoreKeys.fullSize);
      const savedMiniSize = await store.get<WindowSize>(settingsStoreKeys.miniSize);
      const savedMiniOpacityPercent = await store.get<number>(
        settingsStoreKeys.miniOpacityPercent,
      );
      const savedSettingsVersion = await store.get<number>(
        settingsStoreKeys.settingsVersion,
      );
      const savedHasCompletedOnboarding = await store.get<boolean>(
        settingsStoreKeys.hasCompletedOnboarding,
      );

      config.value = migrateSalaryConfig(savedConfig);
      hasCompletedOnboarding.value = resolveOnboardingState(
        savedConfig,
        savedHasCompletedOnboarding,
      );

      if (typeof savedTop === "boolean") {
        alwaysOnTop.value = savedTop;
      }

      if (savedTheme === "dark" || savedTheme === "light") {
        themeMode.value = savedTheme;
      }

      if (savedAmountMode === "plain" || savedAmountMode === "rolling") {
        amountMode.value = savedAmountMode;
      }

      return resolveWindowPreferences({
        savedIsMiniMode,
        savedFullSize,
        savedMiniSize,
        savedMiniOpacityPercent,
        savedSettingsVersion,
      });
    } catch (error) {
      console.error("Failed to load settings, falling back to defaults", error);
      resetToDefaults();
      return resolveWindowPreferences({});
    } finally {
      isSettingsReady.value = true;
    }
  };

  const saveSettings = async ({
    isMiniMode,
    fullSize,
    miniSize,
    miniOpacityPercent,
  }: PersistedWindowState) => {
    if (!isSettingsReady.value) return;

    try {
      const configIssues = validateSalaryConfig(config.value);
      const shouldPersistSalaryConfig = configIssues.length <= 0;
      if (shouldPersistSalaryConfig) {
        await store.set(settingsStoreKeys.config, config.value);
      } else {
        console.error("Skipped saving invalid salary settings", configIssues);
      }

      await store.set(settingsStoreKeys.alwaysOnTop, alwaysOnTop.value);
      await store.set(settingsStoreKeys.fullSize, fullSize);
      await store.set(settingsStoreKeys.isMiniMode, isMiniMode);
      await store.set(settingsStoreKeys.themeMode, themeMode.value);
      await store.set(settingsStoreKeys.amountMode, amountMode.value);
      await store.set(settingsStoreKeys.miniSize, miniSize);
      await store.set(settingsStoreKeys.miniOpacityPercent, miniOpacityPercent);
      await store.set(
        settingsStoreKeys.hasCompletedOnboarding,
        hasCompletedOnboarding.value,
      );
      await store.set(settingsStoreKeys.settingsVersion, settingsSchemaVersion);
      await store.save();

      if (shouldPersistSalaryConfig) {
        const savedConfig = await store.get<Partial<SalaryConfig>>(
          settingsStoreKeys.config,
        );
        const verifiedConfig = migrateSalaryConfig(savedConfig);
        if (
          serializeSalaryConfig(verifiedConfig) !== serializeSalaryConfig(config.value)
        ) {
          console.error("Saved salary settings did not match the in-memory config");
        }
      }
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  };

  return {
    amountMode,
    alwaysOnTop,
    config,
    hasCompletedOnboarding,
    isSettingsReady,
    loadSettings,
    saveSettings,
    themeMode,
  };
}
