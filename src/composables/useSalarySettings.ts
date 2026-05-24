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

export type AmountMode = "rolling" | "plain";

export type PersistedWindowState = {
  isMiniMode: boolean;
  fullSize: WindowSize;
  miniSize: WindowSize;
  miniOpacityPercent: number;
};

const store = new LazyStore("salary-settings.json");

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
      const savedConfig = await store.get<Partial<SalaryConfig>>("config");
      const savedTop = await store.get<boolean>("alwaysOnTop");
      const savedTheme = await store.get<ThemeMode>("themeMode");
      const savedAmountMode = await store.get<AmountMode>("amountMode");
      const savedIsMiniMode = await store.get<boolean>("isMiniMode");
      const savedFullSize = await store.get<WindowSize>("fullSize");
      const savedMiniSize = await store.get<WindowSize>("miniSize");
      const savedMiniOpacityPercent = await store.get<number>("miniOpacityPercent");
      const savedSettingsVersion = await store.get<number>("settingsVersion");
      const savedHasCompletedOnboarding = await store.get<boolean>(
        "hasCompletedOnboarding",
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
      if (configIssues.length > 0) {
        console.error("Skipped saving invalid salary settings", configIssues);
        return;
      }

      await store.set("config", config.value);
      await store.set("alwaysOnTop", alwaysOnTop.value);
      await store.set("fullSize", fullSize);
      await store.set("isMiniMode", isMiniMode);
      await store.set("themeMode", themeMode.value);
      await store.set("amountMode", amountMode.value);
      await store.set("miniSize", miniSize);
      await store.set("miniOpacityPercent", miniOpacityPercent);
      await store.set("hasCompletedOnboarding", hasCompletedOnboarding.value);
      await store.set("settingsVersion", settingsSchemaVersion);
      await store.save();

      const savedConfig = await store.get<Partial<SalaryConfig>>("config");
      const verifiedConfig = migrateSalaryConfig(savedConfig);
      if (serializeSalaryConfig(verifiedConfig) !== serializeSalaryConfig(config.value)) {
        console.error("Saved salary settings did not match the in-memory config");
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
