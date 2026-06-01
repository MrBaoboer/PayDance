<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { useId } from "vue";
import type { SalaryConfig, SalaryConfigIssue } from "../../lib/salary";
import { readInputText } from "../../lib/settings-form";
import { useI18n } from "../../composables/useI18n";
import SwitchRow from "../ui/SwitchRow.vue";

const { t } = useI18n();

const props = defineProps<{
  config: SalaryConfig;
  density: "settings" | "onboarding";
  hasIssue: (field: SalaryConfigIssue["field"]) => boolean;
  variant: "settings" | "onboarding";
}>();

const emit = defineEmits<{
  "update:config": [config: SalaryConfig];
}>();

const idPrefix = useId();

const updateConfig = <Key extends keyof SalaryConfig>(
  key: Key,
  value: SalaryConfig[Key],
) => {
  emit("update:config", { ...props.config, [key]: value });
};
</script>

<template>
  <div class="lunch-break-fields" :class="`lunch-break-fields--${variant}`">
    <template v-if="variant === 'settings'">
      <div class="group-title group-title--split">
        <strong>{{ t("lunchBreak.heading") }}</strong>
        <SwitchRow
          :label="t('lunchBreak.toggle')"
          title-action
          :model-value="config.enableLunchBreak"
          @update:model-value="updateConfig('enableLunchBreak', $event)"
        />
      </div>
      <div class="field-grid" :class="`field-grid--${density}`">
        <label
          class="field"
          :for="`${idPrefix}-settings-lunch-start`"
          :class="{ 'is-invalid': hasIssue('lunchStart') || hasIssue('workTime') }"
        >
          <span>{{ t("lunchBreak.start") }}</span>
          <span class="field-input-wrap field-input-wrap--time">
            <input
              :id="`${idPrefix}-settings-lunch-start`"
              :disabled="!config.enableLunchBreak"
              :value="config.lunchStart"
              type="time"
              @input="updateConfig('lunchStart', readInputText($event))"
            />
          </span>
        </label>
        <label
          class="field"
          :for="`${idPrefix}-settings-lunch-end`"
          :class="{ 'is-invalid': hasIssue('lunchEnd') || hasIssue('workTime') }"
        >
          <span>{{ t("lunchBreak.end") }}</span>
          <span class="field-input-wrap field-input-wrap--time">
            <input
              :id="`${idPrefix}-settings-lunch-end`"
              :disabled="!config.enableLunchBreak"
              :value="config.lunchEnd"
              type="time"
              @input="updateConfig('lunchEnd', readInputText($event))"
            />
          </span>
        </label>
      </div>
    </template>

    <template v-else>
      <SwitchRow
        :label="t('lunchBreak.toggleOnboarding')"
        :model-value="config.enableLunchBreak"
        @update:model-value="updateConfig('enableLunchBreak', $event)"
      />

      <div
        v-if="config.enableLunchBreak"
        class="field-grid"
        :class="`field-grid--${density}`"
      >
        <label
          class="field"
          :for="`${idPrefix}-onboarding-lunch-start`"
          :class="{ 'is-invalid': hasIssue('lunchStart') || hasIssue('workTime') }"
        >
          <span>{{ t("lunchBreak.start") }}</span>
          <span class="field-input-wrap field-input-wrap--time">
            <input
              :id="`${idPrefix}-onboarding-lunch-start`"
              :value="config.lunchStart"
              type="time"
              @input="updateConfig('lunchStart', readInputText($event))"
            />
          </span>
        </label>
        <label
          class="field"
          :for="`${idPrefix}-onboarding-lunch-end`"
          :class="{ 'is-invalid': hasIssue('lunchEnd') || hasIssue('workTime') }"
        >
          <span>{{ t("lunchBreak.end") }}</span>
          <span class="field-input-wrap field-input-wrap--time">
            <input
              :id="`${idPrefix}-onboarding-lunch-end`"
              :value="config.lunchEnd"
              type="time"
              @input="updateConfig('lunchEnd', readInputText($event))"
            />
          </span>
        </label>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lunch-break-fields {
  display: grid;
  gap: clamp(9px, 2.1cqh, 12px);
}

.lunch-break-fields--onboarding {
  gap: clamp(14px, 3.2cqh, 18px);
}

.group-title {
  display: flex;
  min-height: clamp(22px, 5.2cqh, 28px);
  align-items: center;
}

.group-title--split {
  justify-content: space-between;
  gap: var(--ui-gap-sm, 12px);
}

.group-title strong {
  color: var(--text);
  font-size: var(--ui-font-sm, 15px);
  font-weight: 700;
}

.field-grid {
  display: grid;
  --field-value-weight: 600;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-grid--settings {
  gap: var(--ui-gap-sm, 10px);
}

.field-grid--onboarding {
  gap: clamp(12px, 2.7cqh, 15px);
}

.field {
  display: grid;
  gap: var(--ui-gap-xs, 6px);
}

.field-grid--onboarding .field {
  gap: clamp(7px, 1.8cqh, 9px);
}

.field > span {
  color: var(--muted);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 500;
}

.field-grid--onboarding .field > span {
  font-size: var(--ui-font-xs, 13px);
  font-weight: 650;
}

.field-input-wrap {
  display: grid;
  height: clamp(34px, 8.2cqh, 40px);
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: var(--panel);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

.field-grid--onboarding .field-input-wrap {
  height: clamp(38px, 9cqh, 44px);
}

.field input {
  width: 100%;
  height: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-dashboard);
  font-size: var(--ui-font-sm, 14px);
  font-weight: var(--field-value-weight);
  font-variant-numeric: tabular-nums;
  caret-color: var(--text);
  outline: none;
  padding: 0 clamp(9px, 2.2cqw, 13px);
}

.field input[type="time"] {
  padding-left: clamp(28px, 6.4cqw, 38px);
  padding-right: clamp(5px, 1.2cqw, 8px);
  text-align: center;
}

.field input[type="time"]::-webkit-calendar-picker-indicator {
  margin-right: -2px;
}

.field-input-wrap:focus-within {
  border-color: var(--field-focus-border);
  box-shadow: 0 0 0 3px var(--field-focus-ring);
}

.field.is-invalid .field-input-wrap {
  border-color: rgb(245 158 11 / 0.68);
  box-shadow: 0 0 0 3px rgb(245 158 11 / 0.12);
}

.field-input-wrap:has(input:disabled) {
  background: var(--subtle);
}

.field input:disabled {
  color: var(--muted);
}
</style>
