<script setup lang="ts">
import type { SalaryType } from "../../lib/salary";
import { salaryTypeOptions } from "../../lib/settings-form";
import SegmentedControl from "../ui/SegmentedControl.vue";

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
    label="薪资输入方式"
    :model-value="modelValue"
    :options="salaryTypeOptions"
    @update:model-value="updateSalaryType"
  />
</template>
