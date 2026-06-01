<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed, useId } from "vue";

const props = defineProps<{
  disabled?: boolean;
  label: string;
  modelValue: boolean;
  panel?: boolean;
  titleAction?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const inputId = `switch-${useId()}`;
const classes = computed(() => ({
  "switch-row--panel": props.panel,
  "switch-row--title-action": props.titleAction,
}));
</script>

<template>
  <label class="switch-row" :class="classes" :for="inputId">
    <input
      :id="inputId"
      :checked="modelValue"
      :disabled="disabled"
      type="checkbox"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span>{{ label }}</span>
  </label>
</template>

<style scoped>
.switch-row {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-xs, 8px);
  color: var(--muted);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 650;
}

.switch-row input {
  width: 16px;
  height: clamp(15px, 3.4cqw, 18px);
  accent-color: var(--accent);
}

.switch-row input:disabled {
  opacity: 0.58;
}

.switch-row--title-action {
  min-width: clamp(104px, 26cqw, 126px);
  justify-content: flex-end;
  gap: var(--ui-gap-xs, 7px);
  font-weight: 600;
}

.switch-row--title-action input {
  flex: 0 0 auto;
}

.switch-row--panel {
  min-height: clamp(41px, 9.8cqh, 48px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: var(--panel-soft);
  padding: 0 var(--ui-pad-sm, 12px);
}
</style>
