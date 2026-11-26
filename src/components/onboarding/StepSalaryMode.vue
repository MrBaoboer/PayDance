<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import type { SalaryConfig, SalaryConfigIssue } from "../../lib/salary";
import { useI18n } from "../../composables/useI18n";
import CurrencySymbolField from "../settings/CurrencySymbolField.vue";
import SalaryAmountFields from "../settings/SalaryAmountFields.vue";
import SalaryModeControl from "../settings/SalaryModeControl.vue";

const { t } = useI18n();

const props = defineProps<{
  config: SalaryConfig;
  currencySymbol?: string;
  hasIssue: (field: SalaryConfigIssue["field"]) => boolean;
}>();

const emit = defineEmits<{
  "update:config": [config: SalaryConfig];
  "update:currencySymbol": [symbol: string];
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

    <div v-if="currencySymbol !== undefined" class="onboarding-currency">
      <strong class="onboarding-currency__label">{{ t("settings.currency") }}</strong>
      <CurrencySymbolField
        :model-value="currencySymbol"
        @update:model-value="emit('update:currencySymbol', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.onboarding-step {
  display: grid;
  gap: clamp(16px, 3.6cqh, 20px);
}

.onboarding-currency {
  display: grid;
  gap: clamp(6px, 1.5cqh, 8px);
}

.onboarding-currency__label {
  color: var(--muted);
  font-size: var(--ui-font-xs, 13px);
  font-weight: 650;
  text-align: left;
}
</style>
