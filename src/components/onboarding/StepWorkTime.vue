<script setup lang="ts">
import type { SalaryConfig, SalaryConfigIssue } from "../../lib/salary";
import LunchBreakFields from "../settings/LunchBreakFields.vue";
import WorkdayPicker from "../settings/WorkdayPicker.vue";
import WorkTimeFields from "../settings/WorkTimeFields.vue";

const props = defineProps<{
  config: SalaryConfig;
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
  <section class="onboarding-step">
    <WorkdayPicker
      density="onboarding"
      :invalid="hasIssue('workdays')"
      :workdays="config.workdays"
      @update:workdays="updateConfig('workdays', $event)"
    />

    <WorkTimeFields
      density="onboarding"
      :config="config"
      :has-issue="hasIssue"
      @update:config="emit('update:config', $event)"
    />

    <LunchBreakFields
      density="onboarding"
      variant="onboarding"
      :config="config"
      :has-issue="hasIssue"
      @update:config="emit('update:config', $event)"
    />
  </section>
</template>

<style scoped>
.onboarding-step {
  display: grid;
  gap: clamp(16px, 3.6cqh, 20px);
}
</style>
