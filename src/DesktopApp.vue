<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  fromDesktopHostSize,
  normalizeFullSize,
  normalizeMiniOpacityPercent,
} from "./lib/window-mode";
import {
  getDefaultCurrencySymbolForLocale,
  isLocaleDefaultCurrencySymbol,
} from "./lib/currency";
import { appName } from "./lib/app-meta";
import { localeChangedEventName, trayStateChangedEventName } from "./lib/app-events";
import type { ResizeDirection } from "./lib/resize-handles";
import { useAppShell } from "./composables/useAppShell";
import { useAppUpdater } from "./composables/useAppUpdater";
import { useAppWindowLifecycle } from "./composables/useAppWindowLifecycle";
import { useAutostart } from "./composables/useAutostart";
import { provideCurrency } from "./composables/useCurrency";
import { useDashboardModel } from "./composables/useDashboardModel";
import { provideI18n } from "./composables/useI18n";
import { useMiniWindowDrag } from "./composables/useMiniWindowDrag";
import { useMiniOpacityPanel } from "./composables/useMiniOpacityPanel";
import { useSalarySettings } from "./composables/useSalarySettings";
import { useSalaryTicker } from "./composables/useSalaryTicker";
import { useThemeSync } from "./composables/useThemeSync";
import { registerTrayActions } from "./composables/useTrayActions";
import { provideUpdaterContext } from "./composables/useUpdaterContext";
import { useWindowMode } from "./composables/useWindowMode";
import { useWindowPositionRecovery } from "./composables/useWindowPositionRecovery";
import { useWindowPreferenceRefs } from "./composables/useWindowPreferenceRefs";
import { useWindowStatePersistence } from "./composables/useWindowStatePersistence";
import AppWindow from "./components/AppWindow.vue";
import MiniOpacityPanel from "./components/MiniOpacityPanel.vue";
import MiniWindow from "./components/MiniWindow.vue";
import ResizeHandles from "./components/onboarding/ResizeHandles.vue";

const appWindow = getCurrentWindow();
const isOpacityPanelWindow = appWindow.label === "mini-opacity";
const hasCustomCurrencyInOnboarding = ref(false);
const settings = useSalarySettings(undefined, () => t.value);
const { amountMode, alwaysOnTop, config, currencySymbol, locale, themeMode } = settings;
const { t } = provideI18n(locale);
provideCurrency(currencySymbol);

const windowPrefs = useWindowPreferenceRefs();
const { fullSize, isMiniMode, mainPosition, miniOpacityPercent, miniPosition, miniSize } =
  windowPrefs;
const autostart = useAutostart(() => t.value("autostart.error"));
const { refreshNow, snapshot, startTicker, stopTicker } = useSalaryTicker(
  config,
  t.value,
);
const { applyWindowMode, reapplyTaskbarVisibility, setAlwaysOnTop } = useWindowMode(
  appWindow,
  isMiniMode,
  miniSize,
  fullSize,
  alwaysOnTop,
);
const windowPosition = useWindowPositionRecovery({
  appWindow,
  fullSize,
  isMiniMode,
  mainPosition,
  miniPosition,
  miniSize,
});
const { clearSaveStateTimer, loadWindowPreferences, saveStateNow, scheduleSaveState } =
  useWindowStatePersistence({
    defaultWindowPreferences: windowPrefs.defaultWindowPreferences,
    fullSize,
    isMiniMode,
    isSettingsReady: settings.isSettingsReady,
    loadSettings: settings.loadSettings,
    mainPosition,
    miniOpacityPercent,
    miniPosition,
    miniSize,
    saveSettings: settings.saveSettings,
  });
const updater = useAppUpdater({ beforeInstall: saveStateNow });
provideUpdaterContext({
  isCheckingUpdate: updater.isCheckingUpdate,
  onCheckUpdate: updater.runUpdateCheck,
  onInstallUpdate: updater.installUpdate,
  updateStatus: updater.updateStatus,
});
const { applyThemeMode, isThemeSwitching, setThemeMode, toggleTheme } = useThemeSync(
  appWindow,
  themeMode,
  saveStateNow,
);
const { hideMiniOpacityPanel, showMiniOpacityPanel } = useMiniOpacityPanel(
  appWindow,
  miniOpacityPercent,
  themeMode,
  locale,
);
const readCurrentFullSize = () =>
  normalizeFullSize(
    fromDesktopHostSize({ width: window.innerWidth, height: window.innerHeight }, false),
  );
const shell = useAppShell({
  alwaysOnTop,
  appWindow,
  applyThemeMode,
  applyWindowMode,
  captureWindowPosition: windowPosition.captureWindowPosition,
  fullSize,
  hasCompletedOnboarding: settings.hasCompletedOnboarding,
  hideMiniOpacityPanel,
  isMiniMode,
  isOpacityPanelWindow,
  isSettingsReady: settings.isSettingsReady,
  readCurrentFullSize,
  readWindowPosition: windowPosition.readWindowPosition,
  restoreWindowPosition: windowPosition.restoreWindowPosition,
  saveStateNow,
  setAlwaysOnTop,
  themeMode,
});
const { clearMiniDrag, startMiniDrag } = useMiniWindowDrag(appWindow);
const dashboard = useDashboardModel(config, snapshot, t.value, locale);
const shellClass = computed(() =>
  themeMode.value === "dark" ? "theme-dark" : "theme-light",
);
const handleRetryLoadSettings = async () => {
  const preferences = await settings.retryLoadSettings();
  if (!preferences) return;
  windowPrefs.applyLoadedWindowPreferences(preferences);
  await applyThemeMode(themeMode.value, { persist: false });
  await applyWindowMode().catch(() => undefined);
  await windowPosition.restoreWindowPosition().catch(() => undefined);
};
const handleRebuildSettingsDefaults = async () => {
  const rebuilt = await settings.rebuildSettingsWithDefaults();
  if (!rebuilt) return;
  hasCustomCurrencyInOnboarding.value = false;
  windowPrefs.applyLoadedWindowPreferences(windowPrefs.defaultWindowPreferences);
  await applyThemeMode(themeMode.value, { persist: false });
  await applyWindowMode().catch(() => undefined);
  await setAlwaysOnTop(alwaysOnTop.value).catch(() => undefined);
};
const updateCurrencySymbol = (symbol: string) => {
  hasCustomCurrencyInOnboarding.value = true;
  currencySymbol.value = symbol;
};
const updateMiniOpacityPercent = (value: number, options: { commit?: boolean } = {}) => {
  miniOpacityPercent.value = normalizeMiniOpacityPercent(value);
  if (options.commit) {
    void saveStateNow();
    return;
  }
  scheduleSaveState();
};
const toggleAlwaysOnTop = async () => {
  await setAlwaysOnTop(!alwaysOnTop.value);
  await saveStateNow();
};
const startDrag = async (event: MouseEvent) => {
  if (event.button !== 0) return;
  const target = event.target as HTMLElement;
  if (target.closest("button, input, label, a, select, textarea")) return;
  await appWindow.startDragging();
};
const startResize = async (direction: ResizeDirection) => {
  await appWindow.startResizeDragging(direction);
};
const { clearWindowLifecycleTimers, registerWindowLifecycle } = useAppWindowLifecycle(
  appWindow,
  {
    ensureWindowOnScreen: windowPosition.ensureWindowOnScreen,
    fullSize,
    hideMiniOpacityPanel,
    isMiniMode,
    isSettingsReady: settings.isSettingsReady,
    miniSize,
    onRestoreFromMini: () => shell.setMiniMode(false),
    onWindowShown: refreshNow,
    reapplyTaskbarVisibility,
    saveStateNow,
    updateMiniOpacityPercent,
  },
);

watch(locale, (next) => {
  if (isOpacityPanelWindow) return;
  if (
    shell.shouldShowOnboarding.value &&
    !hasCustomCurrencyInOnboarding.value &&
    isLocaleDefaultCurrencySymbol(currencySymbol.value)
  ) {
    currencySymbol.value = getDefaultCurrencySymbolForLocale(next);
  }
  void appWindow.emit(localeChangedEventName, next);
});
watch([isMiniMode, alwaysOnTop], ([mini, top]) => {
  if (isOpacityPanelWindow) return;
  void appWindow.emit(trayStateChangedEventName, { isMiniMode: mini, alwaysOnTop: top });
});
watch(config, scheduleSaveState, { deep: true });
watch([amountMode, currencySymbol, locale], scheduleSaveState);
const unlisteners: Array<() => void> = [];

onMounted(async () => {
  if (isOpacityPanelWindow) return;

  unlisteners.push(...(await registerWindowLifecycle()));
  windowPrefs.applyLoadedWindowPreferences(await loadWindowPreferences());
  await autostart.refreshAutostart();
  await applyThemeMode(themeMode.value, { persist: false });
  await applyWindowMode().catch(() => undefined);
  await windowPosition.restoreWindowPosition().catch(() => undefined);
  void appWindow.emit(trayStateChangedEventName, {
    isMiniMode: isMiniMode.value,
    alwaysOnTop: alwaysOnTop.value,
  });

  unlisteners.push(
    await appWindow.listen("before-app-exit", async () => {
      try {
        await saveStateNow();
      } finally {
        const { exit } = await import("@tauri-apps/plugin-process");
        await exit(0);
      }
    }),
    await appWindow.onMoved(({ payload: position }) => {
      if (!windowPosition.recordWindowPosition(position)) return;
      scheduleSaveState();
    }),
    ...(await registerTrayActions(appWindow, {
      openSettings: shell.openSettings,
      toggleAlwaysOnTop,
      toggleMiniMode: shell.toggleMiniMode,
    })),
  );

  startTicker();
  updater.startUpdateMonitor();
});

onBeforeUnmount(() => {
  stopTicker();
  updater.stopUpdateMonitor();
  clearSaveStateTimer();
  clearWindowLifecycleTimers();
  clearMiniDrag();
  for (const unlisten of unlisteners) {
    unlisten();
  }
});
</script>

<template>
  <MiniOpacityPanel v-if="shell.activeView.value === 'mini-opacity'" />

  <div
    v-else
    class="desktop-stage"
    :class="{ 'is-mini': shell.activeView.value === 'mini' }"
    @contextmenu.prevent
  >
    <main
      class="app-shell h-full w-full select-none p-0"
      :class="[
        shellClass,
        shell.activeView.value === 'mini' ? 'is-mini' : '',
        { 'is-theme-syncing': isThemeSwitching },
      ]"
    >
      <ResizeHandles
        v-if="shell.activeView.value !== 'mini'"
        @resize-start="startResize"
      />
      <MiniWindow
        v-if="shell.activeView.value === 'mini'"
        :amount="dashboard.earnedText.value"
        :amount-mode="amountMode"
        :opacity-percent="miniOpacityPercent"
        :resizable="true"
        @drag-start="startMiniDrag"
        @opacity-menu="showMiniOpacityPanel"
        @resize-start="startResize"
        @restore="shell.setMiniMode(false)"
      />

      <AppWindow
        v-else
        v-model:always-on-top="alwaysOnTop"
        v-model:amount-mode="amountMode"
        v-model:config="config"
        v-model:show-salary-info="shell.showSalaryInfo.value"
        v-model:show-settings="shell.showSettings.value"
        :app-name="appName"
        :autostart-enabled="autostart.autostartEnabled.value"
        :autostart-error="autostart.autostartError.value"
        :currency-symbol="currencySymbol"
        :daily-earn-text="dashboard.dailyEarnText.value"
        :earned-text="dashboard.earnedText.value"
        :first-config-issue="dashboard.firstConfigIssue.value"
        :has-config-issues="dashboard.hasConfigIssues.value"
        :has-issue="dashboard.hasIssue"
        :is-autostart-updating="autostart.isAutostartUpdating.value"
        :is-settings-read-only="settings.isSettingsReadOnly.value"
        :is-theme-switching="isThemeSwitching"
        :middle-stat="dashboard.middleStat.value"
        :salary-mode-label="dashboard.salaryModeLabel.value"
        :salary-rates="dashboard.salaryRates.value"
        :settings-save-error="settings.settingsSaveError.value"
        :should-show-onboarding="shell.shouldShowOnboarding.value"
        :show-desktop-features="true"
        :snapshot="snapshot"
        :status-text="dashboard.statusText.value"
        :theme-mode="themeMode"
        :worked-time-text="dashboard.workedTimeText.value"
        @close="appWindow.hide()"
        @complete-onboarding="shell.completeOnboarding"
        @drag-start="startDrag"
        @minimize="appWindow.minimize()"
        @rebuild-settings-defaults="handleRebuildSettingsDefaults"
        @retry-load-settings="handleRetryLoadSettings"
        @set-mini-mode="shell.setMiniMode"
        @toggle-always-on-top="toggleAlwaysOnTop"
        @toggle-mini-mode="shell.toggleMiniMode"
        @toggle-settings="shell.showSettings.value = !shell.showSettings.value"
        @toggle-theme="toggleTheme"
        @update:autostart-enabled="autostart.updateAutostartEnabled"
        @update:currency-symbol="updateCurrencySymbol"
        @update:theme-mode="setThemeMode"
      />
    </main>
  </div>
</template>
