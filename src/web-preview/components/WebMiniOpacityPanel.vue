<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { useI18n } from "../../composables/useI18n";
import { maxMiniOpacityPercent, minMiniOpacityPercent } from "../../lib/window-mode";

const { t } = useI18n();
defineProps<{
  left: number;
  miniOpacityPercent: number;
  shellClass: string;
  top: number;
}>();

const emit = defineEmits<{
  restore: [];
  updateOpacity: [value: number, options?: { commit?: boolean }];
}>();

const readRangeValue = (event: Event) => Number((event.target as HTMLInputElement).value);
</script>

<template>
  <section
    class="web-mini-opacity"
    :class="shellClass"
    :style="{ left: `${left}px`, top: `${top}px` }"
    :aria-label="t('web.opacityAriaLabel')"
  >
    <div class="web-mini-opacity__header">
      <span>{{ t("web.opacityLabel") }}</span>
      <strong>{{ miniOpacityPercent }}%</strong>
    </div>
    <label class="web-mini-opacity__slider" for="web-mini-opacity-range">
      <span class="sr-only">{{ t("web.opacityAriaLabel") }}</span>
      <input
        id="web-mini-opacity-range"
        :max="maxMiniOpacityPercent"
        :min="minMiniOpacityPercent"
        :value="miniOpacityPercent"
        type="range"
        @input="emit('updateOpacity', readRangeValue($event))"
        @change="emit('updateOpacity', readRangeValue($event), { commit: true })"
      />
    </label>
    <div class="web-mini-opacity__actions">
      <button class="web-mini-opacity__action" type="button" @click="emit('restore')">
        {{ t("mini.restoreWindow") }}
      </button>
    </div>
  </section>
</template>
