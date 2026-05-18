import { ref } from "vue";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  resolveWindowPreferences,
  type ThemeMode,
  type WindowSize,
} from "../lib/window-mode";
import { defaultSalaryConfig, type SalaryConfig } from "../lib/salary";
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
  showSettings: boolean;
};

const store = new LazyStore("salary-settings.json");

export function useSalarySettings() {
  const config = ref<SalaryConfig>({ ...defaultSalaryConfig });
  const alwaysOnTop = ref(true);
  const themeMode = ref<ThemeMode>("light");
  const amountMode = ref<AmountMode>("rolling");
  const hasCompletedOnboarding = ref(false);
  const isSettingsReady = ref(false);

  const loadSettings = async () => {
    const savedConfig = await store.get<Partial<SalaryConfig>>("config");
    const savedTop = await store.get<boolean>("alwaysOnTop");
    const savedTheme = await store.get<ThemeMode>("themeMode");
    const savedAmountMode = await store.get<AmountMode>("amountMode");
    const savedIsMiniMode = await store.get<boolean>("isMiniMode");
    const savedFullSize = await store.get<WindowSize>("fullSize");
    const savedMiniSize = await store.get<WindowSize>("miniSize");
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

    const windowPreferences = resolveWindowPreferences({
      savedIsMiniMode,
      savedFullSize,
      savedMiniSize,
      savedSettingsVersion,
    });

    isSettingsReady.value = true;
    return windowPreferences;
  };

  const saveSettings = async ({
    isMiniMode,
    fullSize,
    miniSize,
    showSettings,
  }: PersistedWindowState) => {
    if (!isSettingsReady.value) return;

    await store.set("config", config.value);
    await store.set("alwaysOnTop", alwaysOnTop.value);
    await store.set("fullSize", fullSize);
    await store.set("isMiniMode", isMiniMode);
    await store.set("showSettings", showSettings);
    await store.set("themeMode", themeMode.value);
    await store.set("amountMode", amountMode.value);
    await store.set("miniSize", miniSize);
    await store.set("hasCompletedOnboarding", hasCompletedOnboarding.value);
    await store.set("settingsVersion", settingsSchemaVersion);
    await store.save();
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
