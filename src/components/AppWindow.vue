<script setup lang="ts">
import { X } from "@lucide/vue";
import type { AmountMode } from "../composables/useSalarySettings";
import type { DashboardMiddleStat } from "../composables/useDashboardModel";
import type { SalaryConfig, SalaryConfigIssue, SalarySnapshot } from "../lib/salary";
import type { ThemeMode } from "../lib/window-mode";
import MainDashboard from "./MainDashboard.vue";
import OnboardingPanel from "./OnboardingPanel.vue";
import SalaryInfoSheet from "./SalaryInfoSheet.vue";
import SettingsPanel from "./SettingsPanel.vue";
import WindowTitlebar from "./WindowTitlebar.vue";

type ResizeDirection =
  | "East"
  | "North"
  | "NorthEast"
  | "NorthWest"
  | "South"
  | "SouthEast"
  | "SouthWest"
  | "West";

defineProps<{
  alwaysOnTop: boolean;
  amountMode: AmountMode;
  appName: string;
  autostartEnabled: boolean;
  autostartError: string;
  config: SalaryConfig;
  dailyEarnText: string;
  earnedText: string;
  firstConfigIssue: string;
  hasConfigIssues: boolean;
  hasIssue: (field: SalaryConfigIssue["field"]) => boolean;
  isAutostartUpdating: boolean;
  isThemeSwitching: boolean;
  middleStat: DashboardMiddleStat;
  salaryModeLabel: string;
  shouldShowOnboarding: boolean;
  showSalaryInfo: boolean;
  showSettings: boolean;
  snapshot: SalarySnapshot;
  statusText: string;
  themeMode: ThemeMode;
  workedTimeText: string;
}>();

const emit = defineEmits<{
  close: [];
  completeOnboarding: [preferences: { startInMiniMode: boolean }];
  dragStart: [event: MouseEvent];
  minimize: [];
  resizeStart: [direction: ResizeDirection];
  setMiniMode: [value: boolean];
  toggleAlwaysOnTop: [];
  toggleMiniMode: [];
  toggleSettings: [];
  toggleTheme: [];
  "update:alwaysOnTop": [value: boolean];
  "update:amountMode": [value: AmountMode];
  "update:autostartEnabled": [value: boolean];
  "update:config": [config: SalaryConfig];
  "update:showSalaryInfo": [value: boolean];
  "update:showSettings": [value: boolean];
  "update:themeMode": [mode: ThemeMode];
}>();
</script>

<template>
  <div class="app-window" :aria-label="appName">
    <WindowTitlebar
      :always-on-top="alwaysOnTop"
      :has-config-issues="hasConfigIssues"
      :status-text="statusText"
      :theme-mode="themeMode"
      @close="emit('close')"
      @drag-start="emit('dragStart', $event)"
      @minimize="emit('minimize')"
      @toggle-always-on-top="emit('toggleAlwaysOnTop')"
      @toggle-mini-mode="emit('toggleMiniMode')"
      @toggle-settings="emit('toggleSettings')"
      @toggle-theme="emit('toggleTheme')"
    />

    <MainDashboard
      :amount-mode="amountMode"
      :daily-earn-text="dailyEarnText"
      :earned-text="earnedText"
      :middle-stat="middleStat"
      :snapshot="snapshot"
      :suspend-amount-pulse="isThemeSwitching"
      :worked-time-text="workedTimeText"
      @open-salary-info="emit('update:showSalaryInfo', true)"
      @set-mini-mode="emit('setMiniMode', $event)"
    />

    <Transition name="settings-sheet">
      <div
        v-if="showSettings"
        class="settings-overlay settings-overlay--top"
        @click.self="emit('update:showSettings', false)"
        @mousedown.left.self="emit('dragStart', $event)"
      >
        <section class="settings-sheet settings-sheet--top" aria-label="设置中心">
          <header class="settings-sheet__header" @mousedown.left="emit('dragStart', $event)">
            <div>
              <strong>设置</strong>
            </div>
            <button
              class="sheet-close-button"
              title="关闭设置"
              type="button"
              @click="emit('update:showSettings', false)"
              @mousedown.left.stop
            >
              <X :size="16" />
            </button>
          </header>
          <div class="settings-sheet__body">
            <SettingsPanel
              :amount-mode="amountMode"
              :autostart-enabled="autostartEnabled"
              :autostart-error="autostartError"
              :config="config"
              :first-issue="firstConfigIssue"
              :has-issue="hasIssue"
              :is-autostart-updating="isAutostartUpdating"
              @update:amount-mode="emit('update:amountMode', $event)"
              @update:autostart-enabled="emit('update:autostartEnabled', $event)"
              @update:config="emit('update:config', $event)"
            />
          </div>
        </section>
      </div>
    </Transition>

    <Transition name="settings-sheet">
      <div
        v-if="showSalaryInfo"
        class="settings-overlay"
        @click.self="emit('update:showSalaryInfo', false)"
        @mousedown.left.self="emit('dragStart', $event)"
      >
        <SalaryInfoSheet
          :mode-label="salaryModeLabel"
          :snapshot="snapshot"
          @close="emit('update:showSalaryInfo', false)"
          @drag-start="emit('dragStart', $event)"
        />
      </div>
    </Transition>

    <OnboardingPanel
      v-if="shouldShowOnboarding"
      :always-on-top="alwaysOnTop"
      :autostart-enabled="autostartEnabled"
      :config="config"
      :theme-mode="themeMode"
      @complete="emit('completeOnboarding', $event)"
      @drag-start="emit('dragStart', $event)"
      @resize-start="emit('resizeStart', $event)"
      @update:always-on-top="emit('update:alwaysOnTop', $event)"
      @update:autostart-enabled="emit('update:autostartEnabled', $event)"
      @update:config="emit('update:config', $event)"
      @update:theme-mode="emit('update:themeMode', $event)"
    />
  </div>
</template>
