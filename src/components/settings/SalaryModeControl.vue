<script setup lang="ts">
import type { SalaryType } from "../../lib/salary";
import { salaryTypeOptions } from "../../lib/settings-form";

defineProps<{
  density: "settings" | "onboarding";
  invalid?: boolean;
  modelValue: SalaryType;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: SalaryType];
}>();
</script>

<template>
  <div
    class="salary-mode-control"
    :class="[`salary-mode-control--${density}`, { 'is-invalid': invalid }]"
    aria-label="薪资输入方式"
  >
    <button
      v-for="option in salaryTypeOptions"
      :key="option.value"
      :class="{ 'is-active': modelValue === option.value }"
      type="button"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.salary-mode-control {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(3px, 0.9cqw, 5px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: var(--subtle);
  padding: clamp(3px, 0.9cqw, 5px);
}

.salary-mode-control button {
  height: clamp(32px, 7.6cqh, 38px);
  border-radius: clamp(6px, 1.6cqw, 8px);
  color: var(--muted);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 650;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.salary-mode-control--onboarding button {
  height: clamp(34px, 8.2cqh, 40px);
  font-family: var(--font-dashboard);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.salary-mode-control button.is-active {
  background: var(--panel);
  box-shadow: 0 5px 14px rgb(15 23 42 / 0.08);
  color: var(--text);
}

.salary-mode-control.is-invalid {
  border-color: rgb(245 158 11 / 0.68);
  box-shadow: 0 0 0 3px rgb(245 158 11 / 0.12);
}
</style>
