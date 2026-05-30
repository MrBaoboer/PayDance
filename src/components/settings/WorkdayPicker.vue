<script setup lang="ts">
import type { SalaryConfig } from "../../lib/salary";
import { createWeekdayOptions, toggleWorkdayValue } from "../../lib/settings-form";
import { useI18n } from "../../composables/useI18n";

const { t } = useI18n();

const props = defineProps<{
  density: "settings" | "onboarding";
  invalid?: boolean;
  workdays: SalaryConfig["workdays"];
}>();

const emit = defineEmits<{
  "update:workdays": [workdays: SalaryConfig["workdays"]];
}>();

const toggleWorkday = (day: number) => {
  emit("update:workdays", toggleWorkdayValue(props.workdays, day));
};
</script>

<template>
  <div
    class="weekday-control"
    :class="[`weekday-control--${density}`, { 'is-invalid': invalid }]"
    role="group"
    :aria-label="t('workdays.label')"
  >
    <button
      v-for="day in createWeekdayOptions(t)"
      :key="day.value"
      :aria-pressed="workdays.includes(day.value)"
      :class="{ 'is-active': workdays.includes(day.value) }"
      type="button"
      @click="toggleWorkday(day.value)"
    >
      {{ day.label }}
    </button>
  </div>
</template>

<style scoped>
.weekday-control {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.weekday-control--settings {
  gap: clamp(4px, 1.1cqw, 6px);
}

.weekday-control--onboarding {
  gap: clamp(5px, 1.3cqw, 8px);
}

.weekday-control button {
  height: clamp(30px, 7cqh, 36px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 9px);
  background: var(--panel-soft);
  color: var(--muted);
  font-size: var(--ui-font-xs, 13px);
  font-weight: 700;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.weekday-control--onboarding button {
  height: clamp(33px, 7.8cqh, 40px);
  font-family: var(--font-dashboard);
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.weekday-control button.is-active {
  border-color: var(--income-accent-ring);
  background: var(--income-accent-glow);
  color: var(--text);
}

.weekday-control button:active {
  transform: scale(0.96);
}

.weekday-control.is-invalid button {
  border-color: rgb(245 158 11 / 0.42);
}
</style>
