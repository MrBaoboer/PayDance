<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed } from "vue";
import { useI18n } from "../../composables/useI18n";
import { calculateSalarySnapshot, type SalaryConfig } from "../../lib/salary";
import { formatYuan } from "../../lib/money-format";

const props = defineProps<{
  config: SalaryConfig;
}>();

const { locale, t } = useI18n();
const previewSnapshot = computed(() =>
  calculateSalarySnapshot(new Date(), props.config, t.value),
);
const todayAmount = computed(() =>
  formatYuan(previewSnapshot.value.dailySalary, locale.value),
);
const minuteAmount = computed(() =>
  formatYuan(previewSnapshot.value.minuteRate, locale.value),
);
</script>

<template>
  <aside class="onboarding-preview" aria-live="polite">
    <span>
      <strong>{{ t("onboardingPreview.today") }}</strong>
      {{ todayAmount }}
    </span>
    <span>
      <strong>{{ t("onboardingPreview.perMinute") }}</strong>
      {{ minuteAmount }}
    </span>
    <span v-if="config.enableLunchBreak">
      {{ t("onboardingPreview.lunchPaused") }}
    </span>
  </aside>
</template>

<style scoped>
.onboarding-preview {
  display: grid;
  gap: 6px;
  margin: 0 18px 10px;
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: color-mix(in srgb, var(--panel) 76%, transparent);
  padding: clamp(9px, 2.2cqh, 12px) var(--ui-pad-sm, 11px);
  color: var(--muted);
  font-family: var(--font-dashboard);
  font-size: var(--ui-font-xs, 12px);
  font-weight: 600;
  line-height: 1.35;
  text-align: left;
}

.onboarding-preview span {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.onboarding-preview strong {
  color: var(--text);
  font-weight: 760;
}
</style>
