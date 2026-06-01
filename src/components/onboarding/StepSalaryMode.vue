<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import type { SalaryConfig, SalaryConfigIssue } from "../../lib/salary";
import SalaryAmountFields from "../settings/SalaryAmountFields.vue";
import SalaryModeControl from "../settings/SalaryModeControl.vue";

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
    <SalaryModeControl
      density="onboarding"
      :model-value="config.salaryType"
      @update:model-value="updateConfig('salaryType', $event)"
    />

    <SalaryAmountFields
      density="onboarding"
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
