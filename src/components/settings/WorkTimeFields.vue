<script setup lang="ts">
import type { SalaryConfig, SalaryConfigIssue } from "../../lib/salary";
import { readInputText } from "../../lib/settings-form";

const props = defineProps<{
  config: SalaryConfig;
  density: "settings" | "onboarding";
  hasIssue: (field: SalaryConfigIssue["field"]) => boolean;
}>();

const emit = defineEmits<{
  "update:config": [config: SalaryConfig];
}>();

const updateConfig = <Key extends keyof SalaryConfig>(
  key: Key,
  value: SalaryConfig[Key],
) => {
  emit("update:config", { ...props.config, [key]: value });
};
</script>

<template>
  <div class="field-grid" :class="`field-grid--${density}`">
    <label class="field" :class="{ 'is-invalid': hasIssue('startTime') || hasIssue('workTime') }">
      <span>上班</span>
      <span class="field-input-wrap field-input-wrap--time">
        <input
          :value="config.startTime"
          type="time"
          @input="updateConfig('startTime', readInputText($event))"
        />
      </span>
    </label>
    <label class="field" :class="{ 'is-invalid': hasIssue('endTime') || hasIssue('workTime') }">
      <span>下班</span>
      <span class="field-input-wrap field-input-wrap--time">
        <input
          :value="config.endTime"
          type="time"
          @input="updateConfig('endTime', readInputText($event))"
        />
      </span>
    </label>
  </div>
</template>

<style scoped>
.field-grid {
  display: grid;
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
  font-variant-numeric: tabular-nums;
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
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgb(127 127 127 / 0.14);
}

.field.is-invalid .field-input-wrap {
  border-color: rgb(245 158 11 / 0.68);
  box-shadow: 0 0 0 3px rgb(245 158 11 / 0.12);
}

@media (max-width: 460px) {
  .field-grid--settings {
    grid-template-columns: 1fr;
  }
}
</style>
