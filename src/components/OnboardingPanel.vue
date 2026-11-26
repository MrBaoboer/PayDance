<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed, nextTick, ref, watch } from "vue";
import { Check, ChevronLeft, ChevronRight } from "@lucide/vue";
import {
  validateSalaryConfig,
  type SalaryConfig,
  type SalaryConfigIssue,
} from "../lib/salary";
import { getOnboardingStepIssues } from "../lib/onboarding-validation";
import { useI18n } from "../composables/useI18n";
import OnboardingHeader from "./onboarding/OnboardingHeader.vue";
import StepPreferences from "./onboarding/StepPreferences.vue";
import StepSalaryMode from "./onboarding/StepSalaryMode.vue";
import StepWorkTime from "./onboarding/StepWorkTime.vue";

const props = withDefaults(
  defineProps<{
    config: SalaryConfig;
    currencySymbol?: string;
    dismissible?: boolean;
    themeMode: "light" | "dark";
  }>(),
  {
    currencySymbol: undefined,
    dismissible: false,
  },
);

const emit = defineEmits<{
  close: [];
  complete: [];
  dragStart: [event: MouseEvent];
  "update:config": [config: SalaryConfig];
  "update:currencySymbol": [symbol: string];
  "update:themeMode": [mode: "light" | "dark"];
}>();

const { t } = useI18n();
const step = ref(0);
const bodyRef = ref<HTMLElement | null>(null);

const stepTitles = computed(() => [
  t.value("onboarding.stepPreferences"),
  t.value("onboarding.stepSalaryMode"),
  t.value("onboarding.stepWorkTime"),
]);
const issues = computed(() => validateSalaryConfig(props.config, t.value));
const currentStepIssues = computed(() =>
  getOnboardingStepIssues(step.value, props.config, issues.value),
);
const firstIssue = computed(() => currentStepIssues.value[0]?.message ?? "");
const isLastStep = computed(() => step.value === stepTitles.value.length - 1);
const canContinue = computed(() => currentStepIssues.value.length === 0);

watch(
  () => props.config.enableLunchBreak,
  (enabled) => {
    if (!enabled || !isLastStep.value) {
      return;
    }

    void nextTick(() => {
      const body = bodyRef.value;
      if (body && typeof body.scrollTo === "function") {
        const prefersReducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        body.scrollTo({
          top: body.scrollHeight,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }
    });
  },
);

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
    <section
      class="onboarding-panel"
      role="dialog"
      aria-modal="true"
      :aria-label="t('onboarding.ariaLabel')"
    >
      <OnboardingHeader
        :dismissible="dismissible"
        :step="step"
        :step-count="stepTitles.length"
        :title="stepTitles[step]"
        @close="emit('close')"
        @drag-start="emit('dragStart', $event)"
      />

      <div ref="bodyRef" class="onboarding-body">
        <StepPreferences
          v-if="step === 0"
          :theme-mode="themeMode"
          @update:theme-mode="emit('update:themeMode', $event)"
        />

        <StepSalaryMode
          v-else-if="step === 1"
          :config="config"
          :currency-symbol="currencySymbol"
          :has-issue="hasIssue"
          @update:config="emit('update:config', $event)"
          @update:currency-symbol="emit('update:currencySymbol', $event)"
        />

        <StepWorkTime
          v-else
          :config="config"
          :has-issue="hasIssue"
          @update:config="emit('update:config', $event)"
        />
      </div>

      <div v-if="firstIssue" class="onboarding-alert" role="status">
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
  backdrop-filter: blur(10px) saturate(1.08);
  padding: clamp(14px, 3.4cqw, 20px);
  z-index: 20;
  cursor: move;
}

.onboarding-panel {
  display: grid;
  position: relative;
  width: min(100%, clamp(370px, 88cqw, 440px));
  height: min(100%, clamp(348px, 80cqh, 376px));
  max-height: 100%;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  overflow: hidden;
  border: 1px solid var(--onboarding-border, var(--border));
  border-radius: clamp(16px, 4cqw, 20px);
  background: var(--onboarding-panel, var(--panel));
  box-shadow: var(--shadow);
  color: var(--text);
  cursor: default;
  z-index: 1;
}

.onboarding-body {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
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
  transition:
    opacity 140ms ease,
    background-color 140ms ease,
    transform 120ms ease;
}

.primary-button {
  background: var(--text);
  color: var(--panel);
}

.primary-button:hover:not(:disabled) {
  opacity: 0.9;
}

.secondary-button {
  background: var(--panel-soft);
  color: var(--muted);
}

.secondary-button:hover:not(:disabled) {
  background: var(--subtle);
  color: var(--text);
}

.primary-button:active:not(:disabled),
.secondary-button:active:not(:disabled) {
  transform: scale(0.97);
}

.primary-button:disabled,
.secondary-button:disabled {
  cursor: default;
  opacity: 0.45;
}
</style>
