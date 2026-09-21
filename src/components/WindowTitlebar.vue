<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed } from "vue";
import { Minus, Moon, Pin, Settings2, Shrink, Sun, X } from "@lucide/vue";
import { useI18n } from "../composables/useI18n";
import type { SalaryStatus } from "../lib/salary";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    alwaysOnTop: boolean;
    hasConfigIssues: boolean;
    isNightWork?: boolean;
    showDesktopActions?: boolean;
    status?: SalaryStatus;
    statusText: string;
    themeMode: "light" | "dark";
  }>(),
  {
    isNightWork: false,
    showDesktopActions: true,
    status: "rest-day",
  },
);

// One colour per status so the dot alone tells the state; orange stays reserved for income.
const statusDotClass = computed(() => {
  if (props.hasConfigIssues || props.status === "invalid-config") {
    return "status-dot--invalid";
  }
  if (props.status === "working") {
    return props.isNightWork ? "status-dot--night" : "status-dot--working";
  }
  if (props.status === "lunch-break") return "status-dot--break";
  if (props.status === "before-work") return "status-dot--waiting";
  if (props.status === "after-work") return "status-dot--done";
  return "status-dot--idle";
});

defineEmits<{
  close: [];
  dragStart: [event: MouseEvent];
  minimize: [];
  toggleAlwaysOnTop: [];
  toggleMiniMode: [];
  toggleSettings: [];
  toggleTheme: [];
}>();
</script>

<template>
  <!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
  <header class="titlebar" @mousedown.left="$emit('dragStart', $event)">
    <div class="status-chip">
      <span class="status-dot" :class="statusDotClass" />
      <span>{{ statusText }}</span>
    </div>

    <div class="window-actions">
      <button
        class="icon-button"
        :aria-label="t('titlebar.openSettings')"
        :title="t('titlebar.settings')"
        type="button"
        @click="$emit('toggleSettings')"
      >
        <Settings2 :size="16" />
      </button>
      <button
        class="icon-button"
        :aria-label="t('titlebar.toggleMini')"
        :title="t('titlebar.miniMode')"
        type="button"
        @click="$emit('toggleMiniMode')"
      >
        <Shrink :size="16" />
      </button>
      <button
        class="icon-button"
        :aria-label="
          themeMode === 'dark' ? t('titlebar.switchToLight') : t('titlebar.switchToDark')
        "
        :title="themeMode === 'dark' ? t('titlebar.lightMode') : t('titlebar.darkMode')"
        type="button"
        @click="$emit('toggleTheme')"
      >
        <Sun v-if="themeMode === 'dark'" :size="16" />
        <Moon v-else :size="16" />
      </button>
      <button
        v-if="showDesktopActions"
        class="icon-button"
        :aria-label="alwaysOnTop ? t('titlebar.cancelTop') : t('titlebar.alwaysOnTop')"
        :title="
          alwaysOnTop ? t('titlebar.cancelTopTitle') : t('titlebar.alwaysOnTopTitle')
        "
        type="button"
        @click="$emit('toggleAlwaysOnTop')"
      >
        <Pin :class="{ 'pin-icon--filled': alwaysOnTop }" :size="16" />
      </button>
      <button
        v-if="showDesktopActions"
        class="icon-button"
        :aria-label="t('titlebar.minimize')"
        :title="t('titlebar.minimizeTitle')"
        type="button"
        @click="$emit('minimize')"
      >
        <Minus :size="16" />
      </button>
      <button
        v-if="showDesktopActions"
        class="icon-button danger"
        :aria-label="t('titlebar.closeToTray')"
        :title="t('titlebar.closeToTray')"
        type="button"
        @click="$emit('close')"
      >
        <X :size="16" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  display: flex;
  height: clamp(62px, 14cqh, 74px);
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  padding: clamp(14px, 3.2cqh, 18px) clamp(22px, 5.2cqw, 32px) 0;
}

.status-chip {
  display: flex;
  height: clamp(30px, 7.2cqw, 36px);
  align-items: center;
  gap: clamp(10px, 2.6cqw, 13px);
  padding: 0 clamp(3px, 1cqw, 6px);
  color: var(--muted);
  font-size: var(--ui-font-md, 16px);
  font-weight: 500;
  line-height: 1;
}

.status-dot {
  flex: 0 0 auto;
  width: clamp(7px, 1.7cqw, 9px);
  height: clamp(7px, 1.7cqw, 9px);
  border-radius: 999px;
}

.status-chip span:last-child {
  display: inline-flex;
  height: 100%;
  align-items: center;
  line-height: 1;
  white-space: nowrap;
}

.status-dot--working {
  background: var(--status-working);
  box-shadow: 0 0 0 3px var(--status-working-ring);
}

.status-dot--night {
  background: var(--status-night);
  box-shadow: 0 0 0 3px var(--status-night-ring);
}

.status-dot--break {
  background: var(--status-break);
}

.status-dot--waiting {
  background: var(--status-waiting);
}

.status-dot--done {
  background: var(--status-done);
}

.status-dot--invalid {
  background: var(--danger);
}

.status-dot--idle {
  background: color-mix(in srgb, var(--muted) 48%, transparent);
}

.window-actions {
  display: flex;
  align-items: center;
  gap: clamp(3px, 0.9cqw, 5px);
}

.icon-button {
  display: grid;
  width: clamp(30px, 7.2cqw, 36px);
  height: clamp(30px, 7.2cqw, 36px);
  place-items: center;
  border-radius: var(--ui-radius-sm, 9px);
  color: var(--muted);
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.icon-button:hover {
  background: var(--subtle);
  color: var(--text);
}

.icon-button:active {
  transform: scale(0.96);
}

.icon-button.danger:hover {
  background: rgb(239 68 68 / 0.12);
  color: var(--danger);
}

.pin-icon--filled {
  fill: currentColor;
}
</style>
