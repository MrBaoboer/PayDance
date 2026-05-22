import type { Ref } from "vue";
import type { PersistedWindowState } from "./useSalarySettings";
import type { WindowSize } from "../lib/window-mode";

type WindowPreferences = PersistedWindowState;

export function useWindowStatePersistence({
  defaultWindowPreferences,
  fullSize,
  isMiniMode,
  isSettingsReady,
  loadSettings,
  miniOpacityPercent,
  miniSize,
  saveSettings,
}: {
  defaultWindowPreferences: WindowPreferences;
  fullSize: Ref<WindowSize>;
  isMiniMode: Ref<boolean>;
  isSettingsReady: Ref<boolean>;
  loadSettings: () => Promise<WindowPreferences>;
  miniOpacityPercent: Ref<number>;
  miniSize: Ref<WindowSize>;
  saveSettings: (state: PersistedWindowState) => Promise<void>;
}) {
  let saveStateTimer = 0;

  const saveState = async () => {
    try {
      await saveSettings({
        fullSize: fullSize.value,
        isMiniMode: isMiniMode.value,
        miniSize: miniSize.value,
        miniOpacityPercent: miniOpacityPercent.value,
      });
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  };

  const loadWindowPreferences = async () => {
    try {
      return await loadSettings();
    } catch (error) {
      console.error("Failed to initialize settings, using defaults", error);
      return defaultWindowPreferences;
    }
  };

  const scheduleSaveState = () => {
    if (!isSettingsReady.value) return;

    window.clearTimeout(saveStateTimer);
    saveStateTimer = window.setTimeout(() => {
      void saveState();
    }, 220);
  };

  const saveStateNow = async () => {
    window.clearTimeout(saveStateTimer);
    await saveState();
  };

  const clearSaveStateTimer = () => {
    window.clearTimeout(saveStateTimer);
  };

  return {
    clearSaveStateTimer,
    loadWindowPreferences,
    saveStateNow,
    scheduleSaveState,
  };
}
