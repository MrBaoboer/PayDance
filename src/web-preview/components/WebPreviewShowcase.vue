<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { defineAsyncComponent, watch } from "vue";
import { appName } from "../../lib/app-meta";
import AppWindow from "../../components/AppWindow.vue";
import { useWebPreviewState } from "../useWebPreviewState";

const WebPreviewMiniLayer = defineAsyncComponent(
  () => import("./WebPreviewMiniLayer.vue"),
);

const {
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
} = useWebPreviewState();

const emit = defineEmits<{
  shellClassChange: [value: string];
  themeReady: [];
}>();

watch(
  shellClass,
  (value) => {
    if (isSettingsReady.value) emit("shellClassChange", value);
  },
  { flush: "sync", immediate: true },
);
watch(
  isSettingsReady,
  (ready) => {
    if (!ready) return;
    emit("shellClassChange", shellClass.value);
    emit("themeReady");
  },
  { flush: "sync", immediate: true },
);
</script>

<template>
  <div
    id="paydance-preview"
    class="web-preview__showcase"
    :class="{ 'is-mini': activeView === 'mini' }"
  >
    <div
      v-if="activeView !== 'mini'"
      class="app-shell web-preview__frame h-full w-full select-none p-0"
      :class="previewFrameClass"
      @contextmenu.prevent
    >
      <AppWindow
        v-model:always-on-top="alwaysOnTop"
        v-model:amount-mode="amountMode"
        v-model:config="config"
        v-model:show-salary-info="showSalaryInfo"
        v-model:show-settings="showSettings"
        :app-name="appName"
        :autostart-enabled="autostartEnabled"
        :autostart-error="autostartError"
        :currency-symbol="currencySymbol"
        :daily-earn-text="dailyEarnText"
        :earned-text="earnedText"
        :first-config-issue="firstConfigIssue"
        :has-config-issues="hasConfigIssues"
        :has-issue="hasIssue"
        :is-autostart-updating="isAutostartUpdating"
        :is-theme-switching="isThemeSwitching"
        :middle-stat="middleStat"
        :onboarding-dismissible="true"
        :salary-mode-label="salaryModeLabel"
        :salary-rates="salaryRates"
        :should-show-onboarding="shouldShowOnboarding"
        :show-desktop-features="false"
        :show-onboarding-action="true"
        :snapshot="snapshot"
        :status-text="statusText"
        :theme-mode="themeMode"
        :worked-time-text="workedTimeText"
        @close="showSettings = false"
        @close-onboarding="closeOnboarding"
        @complete-onboarding="completeWebOnboarding"
        @drag-start="showWebMiniOpacityPanel = false"
        @minimize="showSettings = false"
        @open-onboarding="openOnboarding"
        @set-mini-mode="setMiniMode"
        @toggle-always-on-top="toggleAlwaysOnTop"
        @toggle-mini-mode="toggleMiniMode"
        @toggle-settings="showSettings = !showSettings"
        @toggle-theme="toggleTheme"
        @update:autostart-enabled="autostartEnabled = $event"
        @update:currency-symbol="updateCurrencySymbol"
        @update:theme-mode="setThemeMode"
      />
    </div>

    <WebPreviewMiniLayer
      v-else
      :amount-mode="amountMode"
      :earned-text="earnedText"
      :mini-layer-style="miniLayerStyle"
      :mini-opacity-percent="miniOpacityPercent"
      :mini-position="miniPosition"
      :mini-size="miniSize"
      :mini-style="miniStyle"
      :shell-class="shellClass"
      :show-web-mini-opacity-panel="showWebMiniOpacityPanel"
      @drag-start="startWebMiniDrag"
      @opacity-menu="showMiniOpacityPanel"
      @restore="setMiniMode(false)"
      @toggle-opacity-panel="toggleMiniOpacityPanel"
      @update-opacity="updateMiniOpacityPercent"
    />
  </div>
</template>
