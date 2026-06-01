<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import type { SalaryType } from "../../lib/salary";
import { createSalaryTypeOptions } from "../../lib/settings-form";
import SegmentedControl from "../ui/SegmentedControl.vue";
import { useI18n } from "../../composables/useI18n";

const { t } = useI18n();

defineProps<{
  density: "settings" | "onboarding";
  invalid?: boolean;
  modelValue: SalaryType;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: SalaryType];
}>();

const updateSalaryType = (value: string) => {
  emit("update:modelValue", value as SalaryType);
};
</script>

<template>
  <SegmentedControl
    :columns="3"
    :density="density"
    :invalid="invalid"
    :label="t('salaryMode.label')"
    :model-value="modelValue"
    :options="createSalaryTypeOptions(t)"
    @update:model-value="updateSalaryType"
  />
</template>
