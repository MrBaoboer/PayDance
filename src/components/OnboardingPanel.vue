<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed, ref } from "vue";
import { Check, ChevronLeft, ChevronRight } from "@lucide/vue";
import {
  validateSalaryConfig,
  type SalaryConfig,
  type SalaryConfigIssue,
} from "../lib/salary";
import { getOnboardingStepIssues } from "../lib/onboarding-validation";
import type { ResizeDirection } from "../lib/resize-handles";
import { useI18n } from "../composables/useI18n";
import ResizeHandles from "./onboarding/ResizeHandles.vue";
import StepPreferences from "./onboarding/StepPreferences.vue";
import StepSalaryMode from "./onboarding/StepSalaryMode.vue";
import StepWorkTime from "./onboarding/StepWorkTime.vue";

const props = withDefaults(
  defineProps<{
    autostartEnabled: boolean;
    config: SalaryConfig;
    showDesktopFeatures?: boolean;
    themeMode: "light" | "dark";
  }>(),
  {
    showDesktopFeatures: true,
  },
);

const emit = defineEmits<{
  complete: [];
  dragStart: [event: MouseEvent];
  resizeStart: [direction: ResizeDirection];
  "update:autostartEnabled": [value: boolean];
  "update:config": [config: SalaryConfig];
  "update:themeMode": [mode: "light" | "dark"];
}>();

const { t } = useI18n();

const step = ref(0);

const stepTitles = computed(() => [
  t.value("onboarding.stepSalaryMode"),
  t.value("onboarding.stepWorkTime"),
  t.value("onboarding.stepPreferences"),
]);
const issues = computed(() => validateSalaryConfig(props.config, t.value));
const currentStepIssues = computed(() =>
  getOnboardingStepIssues(step.value, props.config, issues.value),
);
const firstIssue = computed(() => currentStepIssues.value[0]?.message ?? "");
const isLastStep = computed(() => step.value === stepTitles.value.length - 1);
const canContinue = computed(() => currentStepIssues.value.length === 0);

const hasIssue = (field: SalaryConfigIssue["field"]) =>
  issues.value.some((issue) => issue.field === field);

const goNext = () => {
  if (isLastStep.value) {
    emit("complete");
    return;
  }

  step.value += 1;
};

const goBack = () => {
  step.value = Math.max(0, step.value - 1);
};
</script>

<template>
  <!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
  <div class="onboarding-overlay" @mousedown.left.self="emit('dragStart', $event)">
    <ResizeHandles @resize-start="emit('resizeStart', $event)" />
    <section class="onboarding-panel" :aria-label="t('onboarding.ariaLabel')">
      <header class="onboarding-header">
        <div>
          <strong>{{ stepTitles[step] }}</strong>
        </div>
        <div class="step-dots" aria-hidden="true">
          <span
            v-for="(_, index) in stepTitles"
            :key="index"
            :class="{ 'is-active': index === step, 'is-done': index < step }"
          />
        </div>
      </header>

      <div class="onboarding-body">
        <StepSalaryMode
          v-if="step === 0"
          :config="config"
          :has-issue="hasIssue"
          @update:config="emit('update:config', $event)"
        />

        <StepWorkTime
          v-else-if="step === 1"
          :config="config"
          :has-issue="hasIssue"
          @update:config="emit('update:config', $event)"
        />

        <StepPreferences
          v-else
          :autostart-enabled="autostartEnabled"
          :show-desktop-features="showDesktopFeatures"
          :theme-mode="themeMode"
          @update:autostart-enabled="emit('update:autostartEnabled', $event)"
          @update:theme-mode="emit('update:themeMode', $event)"
        />
      </div>

      <div v-if="firstIssue" class="onboarding-alert">
        {{ firstIssue }}
      </div>

      <footer class="onboarding-footer">
        <button
          class="secondary-button"
          :disabled="step === 0"
          type="button"
          @click="goBack"
        >
          <ChevronLeft :size="16" />
          <span>{{ t("onboarding.back") }}</span>
        </button>
        <button
          class="primary-button"
          :disabled="!canContinue"
          type="button"
          @click="goNext"
        >
          <span>{{ isLastStep ? t("onboarding.start") : t("onboarding.next") }}</span>
          <Check v-if="isLastStep" :size="16" />
          <ChevronRight v-else :size="16" />
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.onboarding-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: inherit;
  background: var(--onboarding-overlay, rgb(0 0 0 / 0.22));
  backdrop-filter: blur(12px) saturate(1.12);
  padding: clamp(18px, 4cqw, 24px);
  z-index: 20;
  cursor: move;
}

.onboarding-panel {
  display: grid;
  position: relative;
  width: min(100%, clamp(370px, 88cqw, 440px));
  max-height: 100%;
  overflow: hidden auto;
  border: 1px solid var(--onboarding-border, var(--border));
  border-radius: clamp(16px, 4cqw, 20px);
  background: var(--onboarding-panel, var(--panel));
  box-shadow: var(--shadow);
  color: var(--text);
  backdrop-filter: blur(30px) saturate(1.08);
  cursor: default;
  z-index: 1;
}

.onboarding-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-gap-md, 16px);
  border-bottom: 1px solid var(--line);
  padding: clamp(16px, 3.8cqw, 20px);
}

.onboarding-header div:first-child {
  min-width: 0;
}

.onboarding-header strong {
  display: block;
  overflow: hidden;
  font-size: var(--ui-font-lg, 17px);
  font-weight: 760;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-dots {
  display: flex;
  flex: 0 0 auto;
  gap: var(--ui-gap-xs, 6px);
  align-items: center;
}

.step-dots span {
  width: clamp(6px, 1.5cqw, 8px);
  height: clamp(6px, 1.5cqw, 8px);
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted) 34%, transparent);
}

.step-dots span.is-active,
.step-dots span.is-done {
  background: var(--income-accent);
}

.onboarding-body {
  min-height: clamp(228px, 53cqh, 276px);
  overflow-y: auto;
  padding: clamp(20px, 4.4cqw, 24px);
}

.onboarding-alert {
  margin: 0 18px 10px;
  border: 1px solid rgb(245 158 11 / 0.26);
  border-radius: var(--ui-radius-sm, 10px);
  background: rgb(245 158 11 / 0.12);
  padding: clamp(8px, 2cqh, 11px) var(--ui-pad-sm, 11px);
  color: var(--text);
  font-size: var(--ui-font-xs, 13px);
  font-weight: 650;
}

.onboarding-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-gap-sm, 12px);
  border-top: 1px solid var(--line);
  padding: clamp(13px, 3cqw, 16px);
}

.primary-button,
.secondary-button {
  display: inline-flex;
  height: clamp(32px, 7.6cqh, 38px);
  align-items: center;
  justify-content: center;
  gap: var(--ui-gap-xs, 6px);
  border-radius: var(--ui-radius-sm, 10px);
  padding: 0 var(--ui-pad-sm, 12px);
  font-family: var(--font-dashboard);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.primary-button {
  background: var(--text);
  color: var(--panel);
}

.secondary-button {
  background: var(--panel-soft);
  color: var(--muted);
}

.primary-button:disabled,
.secondary-button:disabled {
  cursor: default;
  opacity: 0.45;
}
</style>
