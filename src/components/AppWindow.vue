<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
} from "vue";
import { X } from "@lucide/vue";
import type { AmountMode } from "../composables/useSalarySettings";
import type { DashboardMiddleStat } from "../composables/useDashboardModel";
import { useI18n } from "../composables/useI18n";
import { useModalDialog } from "../composables/useModalDialog";
import type {
  SalaryConfig,
  SalaryConfigIssue,
  SalaryRates,
  SalarySnapshot,
} from "../lib/salary";
import type { ThemeMode } from "../lib/window-mode";
import MainDashboard from "./MainDashboard.vue";
import WindowTitlebar from "./WindowTitlebar.vue";

const loadSettingsPanel = () => import("./SettingsPanel.vue");
const loadSalaryInfoSheet = () => import("./SalaryInfoSheet.vue");
const loadOnboardingPanel = () => import("./OnboardingPanel.vue");

const SettingsPanel = defineAsyncComponent(loadSettingsPanel);
const SalaryInfoSheet = defineAsyncComponent(loadSalaryInfoSheet);
const OnboardingPanel = defineAsyncComponent(loadOnboardingPanel);

const { t } = useI18n();
const settingsTitleId = `settings-title-${useId()}`;

const props = withDefaults(
  defineProps<{
    alwaysOnTop: boolean;
    amountMode: AmountMode;
    appName: string;
    autostartEnabled: boolean;
    autostartError: string;
    config: SalaryConfig;
    currencySymbol: string;
    dailyEarnText: string;
    earnedText: string;
    firstConfigIssue: string;
    hasConfigIssues: boolean;
    hasIssue: (field: SalaryConfigIssue["field"]) => boolean;
    isAutostartUpdating: boolean;
    isSettingsReadOnly?: boolean;
    isThemeSwitching: boolean;
    middleStat: DashboardMiddleStat;
    onboardingDismissible?: boolean;
    salaryModeLabel: string;
    salaryRates?: SalaryRates;
    settingsSaveError?: string;
    shouldShowOnboarding: boolean;
    showDesktopFeatures?: boolean;
    showOnboardingAction?: boolean;
    showSalaryInfo: boolean;
    showSettings: boolean;
    snapshot: SalarySnapshot;
    statusText: string;
    themeMode: ThemeMode;
    workedTimeText: string;
  }>(),
  {
    isSettingsReadOnly: false,
    onboardingDismissible: false,
    salaryRates: undefined,
    settingsSaveError: "",
    showDesktopFeatures: true,
    showOnboardingAction: false,
  },
);

const emit = defineEmits<{
  close: [];
  closeOnboarding: [];
  completeOnboarding: [];
  dragStart: [event: MouseEvent];
  minimize: [];
  openOnboarding: [];
  rebuildSettingsDefaults: [];
  retryLoadSettings: [];
  setMiniMode: [value: boolean];
  toggleAlwaysOnTop: [];
  toggleMiniMode: [];
  toggleSettings: [];
  toggleTheme: [];
  "update:alwaysOnTop": [value: boolean];
  "update:amountMode": [value: AmountMode];
  "update:autostartEnabled": [value: boolean];
  "update:config": [config: SalaryConfig];
  "update:currencySymbol": [symbol: string];
  "update:showSalaryInfo": [value: boolean];
  "update:showSettings": [value: boolean];
  "update:themeMode": [mode: ThemeMode];
}>();

const hasActiveModal = computed(
  () => props.showSettings || props.showSalaryInfo || props.shouldShowOnboarding,
);

let prefetchedSettings = false;
let prefetchedSalaryInfo = false;
let idlePrefetchTimer = 0;

const prefetchSettings = () => {
  if (prefetchedSettings) return;
  prefetchedSettings = true;
  void loadSettingsPanel();
  void loadOnboardingPanel();
};

const prefetchSalaryInfo = () => {
  if (prefetchedSalaryInfo) return;
  prefetchedSalaryInfo = true;
  void loadSalaryInfoSheet();
};

// Warm up lazy sheet chunks during browser idle time after first paint so the initial
// critical bundle stays small while opening Settings / Salary Info feels instantaneous.
onMounted(() => {
  idlePrefetchTimer = window.setTimeout(() => {
    prefetchSettings();
    prefetchSalaryInfo();
  }, 350);
});

onBeforeUnmount(() => {
  window.clearTimeout(idlePrefetchTimer);
});

const settingsDialogRef = ref<HTMLElement | null>(null);
const salaryInfoDialogRef = ref<HTMLElement | null>(null);
const onboardingDialogRef = ref<HTMLElement | null>(null);

useModalDialog({
  containerRef: settingsDialogRef,
  isOpen: computed(() => props.showSettings && !props.shouldShowOnboarding),
  onEscape: () => emit("update:showSettings", false),
});

useModalDialog({
  containerRef: salaryInfoDialogRef,
  isOpen: computed(
    () => props.showSalaryInfo && !props.shouldShowOnboarding && !props.showSettings,
  ),
  onEscape: () => emit("update:showSalaryInfo", false),
});

useModalDialog({
  containerRef: onboardingDialogRef,
  isOpen: computed(() => props.shouldShowOnboarding),
  onEscape: () => {
    if (props.onboardingDismissible) {
      emit("closeOnboarding");
    }
  },
});
</script>

<template>
  <!-- eslint-disable vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
  <div class="app-window" :aria-label="appName">
    <div class="app-window__base" :inert="hasActiveModal">
      <WindowTitlebar
        :always-on-top="alwaysOnTop"
        :has-config-issues="hasConfigIssues"
        :is-night-work="snapshot.isNightWork"
        :show-desktop-actions="showDesktopFeatures"
        :status="snapshot.status"
        :status-text="statusText"
        :theme-mode="themeMode"
        @close="emit('close')"
        @drag-start="emit('dragStart', $event)"
        @minimize="emit('minimize')"
        @prefetch-settings="prefetchSettings"
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
        @prefetch-salary-info="prefetchSalaryInfo"
        @set-mini-mode="emit('setMiniMode', $event)"
      />
    </div>

    <Transition name="settings-sheet">
      <div
        v-if="showSettings"
        ref="settingsDialogRef"
        class="settings-overlay settings-overlay--top"
        @click.self="emit('update:showSettings', false)"
        @mousedown.left.self="emit('dragStart', $event)"
      >
        <section
          class="settings-sheet settings-sheet--top"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="settingsTitleId"
        >
          <header
            class="settings-sheet__header"
            @mousedown.left="emit('dragStart', $event)"
          >
            <div>
              <h2 :id="settingsTitleId">{{ t("settings.title") }}</h2>
            </div>
            <button
              class="sheet-close-button"
              :aria-label="t('settings.close')"
              :title="t('settings.close')"
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
              :currency-symbol="currencySymbol"
              :first-issue="firstConfigIssue"
              :has-issue="hasIssue"
              :is-autostart-updating="isAutostartUpdating"
              :is-settings-read-only="isSettingsReadOnly"
              :settings-save-error="settingsSaveError"
              :show-desktop-features="showDesktopFeatures"
              :show-onboarding-action="showOnboardingAction"
              @open-onboarding="emit('openOnboarding')"
              @rebuild-settings-defaults="emit('rebuildSettingsDefaults')"
              @retry-load-settings="emit('retryLoadSettings')"
              @update:amount-mode="emit('update:amountMode', $event)"
              @update:autostart-enabled="emit('update:autostartEnabled', $event)"
              @update:config="emit('update:config', $event)"
              @update:currency-symbol="emit('update:currencySymbol', $event)"
            />
          </div>
        </section>
      </div>
    </Transition>

    <Transition name="settings-sheet">
      <div
        v-if="showSalaryInfo"
        ref="salaryInfoDialogRef"
        class="settings-overlay"
        @click.self="emit('update:showSalaryInfo', false)"
        @mousedown.left.self="emit('dragStart', $event)"
      >
        <SalaryInfoSheet
          :mode-label="salaryModeLabel"
          :rates="salaryRates"
          :snapshot="snapshot"
          @close="emit('update:showSalaryInfo', false)"
          @drag-start="emit('dragStart', $event)"
        />
      </div>
    </Transition>

    <div v-if="shouldShowOnboarding" ref="onboardingDialogRef">
      <OnboardingPanel
        :config="config"
        :currency-symbol="currencySymbol"
        :dismissible="onboardingDismissible"
        :theme-mode="themeMode"
        @close="emit('closeOnboarding')"
        @complete="emit('completeOnboarding')"
        @drag-start="emit('dragStart', $event)"
        @update:config="emit('update:config', $event)"
        @update:currency-symbol="emit('update:currencySymbol', $event)"
        @update:theme-mode="emit('update:themeMode', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.app-window__base {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}
</style>
