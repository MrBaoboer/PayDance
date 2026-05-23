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
  let pendingState: PersistedWindowState | null = null;
  let drainSaveQueuePromise: Promise<void> | null = null;

  const readCurrentState = (): PersistedWindowState => ({
    fullSize: fullSize.value,
    isMiniMode: isMiniMode.value,
    miniSize: miniSize.value,
    miniOpacityPercent: miniOpacityPercent.value,
  });

  const drainSaveQueue = async () => {
    while (pendingState) {
      const state = pendingState;
      pendingState = null;

      try {
        await saveSettings(state);
      } catch (error) {
        console.error("Failed to save settings", error);
      }
    }
  };

  const queueSaveState = (state: PersistedWindowState) => {
    pendingState = state;
    drainSaveQueuePromise ??= drainSaveQueue().finally(() => {
      drainSaveQueuePromise = null;
    });

    return drainSaveQueuePromise;
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
      void queueSaveState(readCurrentState());
    }, 220);
  };

  const saveStateNow = async () => {
    window.clearTimeout(saveStateTimer);
    await queueSaveState(readCurrentState());
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
