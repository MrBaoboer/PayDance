import { ref } from "vue";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  currentSettingsSchemaVersion,
  resolveWindowPreferences,
  type ThemeMode,
  type WindowSize,
} from "../lib/window-mode";
import { defaultSalaryConfig, type SalaryConfig } from "../lib/salary";

export type AmountMode = "rolling" | "plain";

export type PersistedWindowState = {
  isMiniMode: boolean;
  miniSize: WindowSize;
  showSettings: boolean;
};

const store = new LazyStore("salary-settings.json");

export function useSalarySettings() {
  const config = ref<SalaryConfig>({ ...defaultSalaryConfig });
  const alwaysOnTop = ref(false);
  const themeMode = ref<ThemeMode>("light");
  const amountMode = ref<AmountMode>("rolling");
  const isSettingsReady = ref(false);

  const loadSettings = async () => {
    const savedConfig = await store.get<SalaryConfig>("config");
    const savedTop = await store.get<boolean>("alwaysOnTop");
    const savedTheme = await store.get<ThemeMode>("themeMode");
    const savedAmountMode = await store.get<AmountMode>("amountMode");
    const savedIsMiniMode = await store.get<boolean>("isMiniMode");
    const savedMiniSize = await store.get<WindowSize>("miniSize");
    const savedSettingsVersion = await store.get<number>("settingsVersion");

    if (savedConfig) {
      config.value = { ...defaultSalaryConfig, ...savedConfig };
    }

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
      savedMiniSize,
      savedSettingsVersion,
    });

    isSettingsReady.value = true;
    return windowPreferences;
  };

  const saveSettings = async ({
    isMiniMode,
    miniSize,
    showSettings,
  }: PersistedWindowState) => {
    if (!isSettingsReady.value) return;

    await store.set("config", config.value);
    await store.set("alwaysOnTop", alwaysOnTop.value);
    await store.set("isMiniMode", isMiniMode);
    await store.set("showSettings", showSettings);
    await store.set("themeMode", themeMode.value);
    await store.set("amountMode", amountMode.value);
    await store.set("miniSize", miniSize);
    await store.set("settingsVersion", currentSettingsSchemaVersion);
    await store.save();
  };

  return {
    amountMode,
    alwaysOnTop,
    config,
    isSettingsReady,
    loadSettings,
    saveSettings,
    themeMode,
  };
}
