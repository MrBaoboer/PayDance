// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useAppShell } from "../composables/useAppShell";
import { provideCurrency } from "../composables/useCurrency";
import { useDashboardModel } from "../composables/useDashboardModel";
import { useI18n } from "../composables/useI18n";
import { useSalarySettings } from "../composables/useSalarySettings";
import { useSalaryTicker } from "../composables/useSalaryTicker";
import { useThemeSync } from "../composables/useThemeSync";
import { useWindowPreferenceRefs } from "../composables/useWindowPreferenceRefs";
import { useWindowStatePersistence } from "../composables/useWindowStatePersistence";
import { getDefaultCurrencySymbolForLocale } from "../lib/currency";
import { settingsStoreKeys } from "../lib/settings-store";
import { normalizeMiniOpacityPercent } from "../lib/window-mode";
import {
  createBrowserSettingsStore,
  readBrowserThemeMode,
} from "../platform/settings-store.web";
import { ensureWebPreviewDemoSettings } from "./demo-config";

const miniStagePaddingX = 34;
const miniStageHeight = 188;
const miniStageTop = 52;

const previewWindow = {
  setFocus: async () => {},
  setTheme: async () => {},
  show: async () => {},
};

export function useWebPreviewState() {
  const previewStore = createBrowserSettingsStore();
  const {
    amountMode,
    alwaysOnTop,
    config,
    currencySymbol,
    hasCompletedOnboarding,
    isSettingsReady,
    loadSettings,
    locale: settingsLocale,
    saveSettings,
    themeMode,
  } = useSalarySettings(
    () => Promise.resolve(previewStore),
    () => t.value,
  );
  themeMode.value = readBrowserThemeMode();
  provideCurrency(currencySymbol);

  const { locale, t } = useI18n();
  settingsLocale.value = locale.value;
  currencySymbol.value = getDefaultCurrencySymbolForLocale(locale.value);

  const isCurrencySymbolCustomized = ref(false);
  const {
    applyLoadedWindowPreferences,
    defaultWindowPreferences,
    fullSize,
    isMiniMode,
    mainPosition,
    miniOpacityPercent,
    miniPosition: persistedMiniPosition,
    miniSize,
  } = useWindowPreferenceRefs();
  const autostartEnabled = ref(false);
  const autostartError = ref("");
  const isAutostartUpdating = ref(false);
  const showWebMiniOpacityPanel = ref(false);
  const miniPosition = ref({ x: 0, y: 0 });
  let clearMiniDrag: (() => void) | null = null;

  const getMiniStageWidth = () => miniSize.value.width + miniStagePaddingX * 2;

  const { snapshot, startTicker, stopTicker } = useSalaryTicker(config, t.value);
  const { clearSaveStateTimer, loadWindowPreferences, saveStateNow, scheduleSaveState } =
    useWindowStatePersistence({
      defaultWindowPreferences,
      fullSize,
      isMiniMode,
      isSettingsReady,
      loadSettings,
      mainPosition,
      miniOpacityPercent,
      miniPosition: persistedMiniPosition,
      miniSize,
      saveSettings,
    });
  const { applyThemeMode, isThemeSwitching, setThemeMode, toggleTheme } = useThemeSync(
    previewWindow,
    themeMode,
    saveStateNow,
  );

  const setAlwaysOnTop = async (value: boolean) => {
    alwaysOnTop.value = value;
  };
  const applyWindowMode = async () => {};
  const {
    activeView,
    completeOnboarding: completeAppOnboarding,
    setMiniMode,
    showSalaryInfo,
    showSettings,
    toggleMiniMode,
  } = useAppShell({
    alwaysOnTop,
    appWindow: previewWindow,
    applyThemeMode,
    applyWindowMode,
    fullSize,
    hasCompletedOnboarding,
    isMiniMode,
    isOpacityPanelWindow: false,
    isSettingsReady,
    saveStateNow,
    setAlwaysOnTop,
    themeMode,
  });
  const isOnboardingOpen = ref(false);
  const shouldShowOnboarding = computed(() => isOnboardingOpen.value);

  const openOnboarding = () => {
    showSettings.value = false;
    showSalaryInfo.value = false;
    isOnboardingOpen.value = true;
  };

  const closeOnboarding = () => {
    isOnboardingOpen.value = false;
  };

  const completeWebOnboarding = async () => {
    await completeAppOnboarding();
    isOnboardingOpen.value = false;
  };
  const {
    dailyEarnText,
    earnedText,
    firstConfigIssue,
    hasConfigIssues,
    hasIssue,
    middleStat,
    salaryModeLabel,
    salaryRates,
    statusText,
    workedTimeText,
  } = useDashboardModel(config, snapshot, t.value, locale);

  const shellClass = computed(() =>
    themeMode.value === "dark" ? "theme-dark" : "theme-light",
  );
  const previewFrameClass = computed(() => [
    shellClass.value,
    activeView.value === "mini" ? "is-mini" : "",
    { "is-theme-syncing": isThemeSwitching.value },
  ]);
  const miniStyle = computed(() => ({
    height: `${miniSize.value.height}px`,
    left: `${miniPosition.value.x}px`,
    top: `${miniPosition.value.y}px`,
    width: `${miniSize.value.width}px`,
  }));
  const miniLayerStyle = computed(() => ({
    "--mini-stage-height": `${miniStageHeight}px`,
    "--mini-stage-width": `${getMiniStageWidth()}px`,
  }));

  const updateCurrencySymbol = (symbol: string) => {
    currencySymbol.value = symbol;
    isCurrencySymbolCustomized.value = true;
    void previewStore.set(settingsStoreKeys.currencySymbolCustomized, true);
    scheduleSaveState();
  };

  const updateMiniOpacityPercent = (
    value: number,
    options: { commit?: boolean } = {},
  ) => {
    miniOpacityPercent.value = normalizeMiniOpacityPercent(value);
    if (options.commit) {
      void saveStateNow();
      return;
    }
    scheduleSaveState();
  };

  const toggleAlwaysOnTop = async () => {
    alwaysOnTop.value = !alwaysOnTop.value;
    await saveStateNow();
  };

  const resetMiniPosition = () => {
    const width = miniSize.value.width;
    const previewWidth = getMiniStageWidth();
    miniPosition.value = {
      x: Math.max(16, Math.round((previewWidth - width) / 2)),
      y: miniStageTop,
    };
  };

  const startWebMiniDrag = (event: PointerEvent) => {
    if (event.button !== 0) return;

    showWebMiniOpacityPanel.value = false;
    const startPoint = { x: event.clientX, y: event.clientY };
    const startPosition = { ...miniPosition.value };

    const handleMove = (moveEvent: PointerEvent) => {
      const previewWidth = getMiniStageWidth();
      miniPosition.value = {
        x: Math.max(
          12,
          Math.min(
            previewWidth - miniSize.value.width - 12,
            startPosition.x + moveEvent.clientX - startPoint.x,
          ),
        ),
        y: Math.max(
          18,
          Math.min(
            miniStageHeight - miniSize.value.height - 18,
            startPosition.y + moveEvent.clientY - startPoint.y,
          ),
        ),
      };
    };
    const handleEnd = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
      clearMiniDrag = null;
    };

    clearMiniDrag = handleEnd;
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
  };

  const showMiniOpacityPanel = () => {
    showWebMiniOpacityPanel.value = true;
  };

  const toggleMiniOpacityPanel = () => {
    showWebMiniOpacityPanel.value = !showWebMiniOpacityPanel.value;
  };

  watch(locale, (next) => {
    settingsLocale.value = next;
    if (!isCurrencySymbolCustomized.value) {
      currencySymbol.value = getDefaultCurrencySymbolForLocale(next);
    }
    scheduleSaveState();
  });
  watch(config, scheduleSaveState, { deep: true });
  watch([amountMode, currencySymbol], scheduleSaveState);
  watch(isMiniMode, (value) => {
    if (value) {
      resetMiniPosition();
    } else {
      showWebMiniOpacityPanel.value = false;
    }
  });

  onMounted(async () => {
    await ensureWebPreviewDemoSettings(previewStore, locale.value);
    const [windowPreferences, customized] = await Promise.all([
      loadWindowPreferences(),
      previewStore.get<boolean>(settingsStoreKeys.currencySymbolCustomized),
    ]);
    isCurrencySymbolCustomized.value = customized === true;
    settingsLocale.value = locale.value;
    if (!isCurrencySymbolCustomized.value) {
      currencySymbol.value = getDefaultCurrencySymbolForLocale(locale.value);
    }
    isMiniMode.value = false;
    applyLoadedWindowPreferences(windowPreferences, { restoreMiniMode: false });
    if (isMiniMode.value) resetMiniPosition();
    startTicker();
  });

  onBeforeUnmount(() => {
    stopTicker();
    clearSaveStateTimer();
    clearMiniDrag?.();
  });

  return {
    activeView,
    alwaysOnTop,
    amountMode,
    autostartEnabled,
    autostartError,
    closeOnboarding,
    completeWebOnboarding,
    config,
    currencySymbol,
    dailyEarnText,
    earnedText,
    firstConfigIssue,
    hasConfigIssues,
    hasIssue,
    isAutostartUpdating,
    isSettingsReady,
    isThemeSwitching,
    middleStat,
    miniLayerStyle,
    miniOpacityPercent,
    miniPosition,
    miniSize,
    miniStyle,
    openOnboarding,
    previewFrameClass,
    salaryModeLabel,
    salaryRates,
    setMiniMode,
    setThemeMode,
    shellClass,
    shouldShowOnboarding,
    showMiniOpacityPanel,
    showSalaryInfo,
    showSettings,
    showWebMiniOpacityPanel,
    snapshot,
    startWebMiniDrag,
    statusText,
    themeMode,
    toggleAlwaysOnTop,
    toggleMiniMode,
    toggleMiniOpacityPanel,
    toggleTheme,
    updateCurrencySymbol,
    updateMiniOpacityPercent,
    workedTimeText,
  };
}
