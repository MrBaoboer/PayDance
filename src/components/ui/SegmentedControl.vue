<script setup lang="ts">
type SegmentOption = {
  label: string;
  value: string;
};

defineProps<{
  columns?: 2 | 3;
  density?: "settings" | "onboarding";
  invalid?: boolean;
  label: string;
  modelValue: string;
  options: readonly SegmentOption[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div
    class="segmented-control"
    :class="[
      `segmented-control--${density ?? 'settings'}`,
      `segmented-control--${columns ?? options.length}`,
      { 'is-invalid': invalid },
    ]"
    role="radiogroup"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="option.value"
      :aria-checked="modelValue === option.value"
      :class="{ 'is-active': modelValue === option.value }"
      role="radio"
      type="button"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented-control {
  display: grid;
  gap: clamp(3px, 0.9cqw, 5px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: var(--subtle);
  padding: clamp(3px, 0.9cqw, 5px);
}

.segmented-control--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.segmented-control--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.segmented-control button {
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

.segmented-control--onboarding button {
  height: clamp(34px, 8.2cqh, 40px);
  font-family: var(--font-dashboard);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.segmented-control button.is-active {
  background: var(--panel);
  box-shadow: 0 5px 14px rgb(15 23 42 / 0.08);
  color: var(--text);
}

.segmented-control.is-invalid {
  border-color: rgb(245 158 11 / 0.68);
  box-shadow: 0 0 0 3px rgb(245 158 11 / 0.12);
}
</style>
