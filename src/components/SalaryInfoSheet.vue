<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed, useId } from "vue";
import { Banknote, CircleDollarSign, Clock3, TimerReset, X } from "@lucide/vue";
import type { SalarySnapshot } from "../lib/salary";
import { formatYuan } from "../lib/money-format";
import { useCurrency } from "../composables/useCurrency";
import { useI18n } from "../composables/useI18n";

const { locale, t } = useI18n();
const { currencySymbol } = useCurrency();
const titleId = `salary-info-title-${useId()}`;

const props = defineProps<{
  modeLabel: string;
  rates?: Pick<
    SalarySnapshot,
    "dailySalary" | "hourlyRate" | "minuteRate" | "secondRate"
  >;
  snapshot: Pick<
    SalarySnapshot,
    "dailySalary" | "hourlyRate" | "minuteRate" | "secondRate"
  >;
}>();

defineEmits<{
  close: [];
  dragStart: [event: MouseEvent];
}>();

const effectiveRates = computed(() => props.rates ?? props.snapshot);

const resolveMoneyScale = (value: string) => {
  const totalChars = [...currencySymbol.value].length + [...value].length;
  return Math.max(0.72, Math.min(1, 11 / Math.max(11, totalChars))).toFixed(4);
};

const salaryItems = computed(() => {
  const items = [
    {
      icon: CircleDollarSign,
      label: t.value("salaryInfo.dailyRate"),
      value: formatYuan(effectiveRates.value.dailySalary, locale.value, 2),
    },
    {
      icon: Banknote,
      label: t.value("salaryInfo.hourlyRate"),
      value: formatYuan(effectiveRates.value.hourlyRate, locale.value, 2),
    },
    {
      icon: Clock3,
      label: t.value("salaryInfo.minuteRate"),
      value: formatYuan(effectiveRates.value.minuteRate, locale.value, 2),
    },
    {
      icon: TimerReset,
      label: t.value("salaryInfo.secondRate"),
      value: formatYuan(effectiveRates.value.secondRate, locale.value, 4),
    },
  ];
  return items.map((item) => ({
    ...item,
    style: { "--salary-info-scale": resolveMoneyScale(item.value) },
  }));
});
</script>

<template>
  <!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
  <section
    class="settings-sheet salary-info-sheet"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
  >
    <header
      class="salary-info-sheet__header"
      @mousedown.left="$emit('dragStart', $event)"
    >
      <div>
        <h2 :id="titleId">{{ t("salaryInfo.title") }}</h2>
        <span>{{ modeLabel }}{{ t("salaryInfo.subtitleSuffix") }}</span>
      </div>
      <button
        class="sheet-close-button"
        :aria-label="t('salaryInfo.close')"
        :title="t('salaryInfo.close')"
        type="button"
        @click="$emit('close')"
        @mousedown.left.stop
      >
        <X :size="16" />
      </button>
    </header>
    <div class="salary-info-grid">
      <article v-for="item in salaryItems" :key="item.label" class="salary-info-card">
        <component :is="item.icon" :size="24" />
        <span class="salary-info-card__label">{{ item.label }}</span>
        <strong class="salary-info-money" :style="item.style">
          <span
            v-if="currencySymbol"
            class="salary-info-money__symbol"
            v-text="currencySymbol"
          />
          <span class="salary-info-money__value">{{ item.value }}</span>
        </strong>
      </article>
    </div>
  </section>
</template>

<style scoped>
.salary-info-sheet {
  display: flex;
  width: 100%;
  max-height: calc(100% - clamp(28px, 7cqh, 38px));
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--border);
  border-radius: 18px 18px 20px 20px;
  background: var(--panel);
  box-shadow: 0 -18px 48px rgb(15 23 42 / 0.18);
}

.salary-info-sheet__header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-gap-md);
  border-bottom: 1px solid var(--line);
  padding: var(--ui-pad-md);
  cursor: move;
}

.salary-info-sheet__header div {
  display: grid;
  min-width: 0;
  text-align: left;
}

.salary-info-sheet__header h2,
.salary-info-sheet__header strong {
  margin: 0;
  color: var(--text);
  font-size: var(--ui-font-lg);
  font-weight: 750;
}

.salary-info-sheet__header span {
  color: var(--muted);
  font-size: var(--ui-font-sm);
  font-weight: 500;
}

.salary-info-grid {
  display: grid;
  cursor: default;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ui-gap-sm);
  padding: var(--ui-pad-md);
}

.salary-info-card {
  display: grid;
  min-width: 0;
  place-items: center;
  gap: var(--ui-gap-xs);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-md);
  background: var(--panel-soft);
  padding: var(--ui-pad-md) var(--ui-pad-sm);
  text-align: center;
}

.salary-info-card svg,
.salary-info-card__label {
  color: var(--muted);
}

.salary-info-card__label {
  font-size: var(--ui-font-sm);
  font-weight: 650;
}

.salary-info-money {
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
  align-items: baseline;
  color: var(--text);
  font-family: var(--font-dashboard);
  font-size: calc(var(--ui-font-md) * var(--salary-info-scale, 1));
  font-weight: 780;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.salary-info-money span {
  color: inherit;
}

.salary-info-money__symbol {
  margin-right: 0.1em;
}

.salary-info-money__value {
  min-width: 0;
}

.sheet-close-button {
  display: grid;
  width: clamp(30px, 7.2cqw, 36px);
  height: clamp(30px, 7.2cqw, 36px);
  flex: 0 0 auto;
  place-items: center;
  border-radius: var(--ui-radius-sm);
  color: var(--muted);
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.sheet-close-button:hover {
  background: var(--subtle);
  color: var(--text);
}

.sheet-close-button:active {
  transform: scale(0.96);
}

@container (max-height: 430px) {
  .salary-info-sheet__header {
    padding: clamp(11px, 2.6cqh, 14px) var(--ui-pad-md);
  }

  .salary-info-grid {
    gap: clamp(7px, 1.8cqh, 10px);
    padding: clamp(10px, 2.5cqh, 14px) var(--ui-pad-md);
  }

  .salary-info-card {
    gap: clamp(4px, 1.2cqh, 6px);
    padding: clamp(10px, 2.5cqh, 14px) var(--ui-pad-sm);
  }

  .salary-info-card svg {
    width: 20px;
    height: 20px;
  }
}
</style>
