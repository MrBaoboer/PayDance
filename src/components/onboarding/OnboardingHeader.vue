<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { X } from "@lucide/vue";
import { useI18n } from "../../composables/useI18n";

defineProps<{
  dismissible?: boolean;
  step: number;
  stepCount: number;
  title: string;
}>();

const emit = defineEmits<{
  close: [];
  dragStart: [event: MouseEvent];
}>();

const { t } = useI18n();
</script>

<template>
  <!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
  <header class="onboarding-header" @mousedown.left="emit('dragStart', $event)">
    <div>
      <strong>{{ title }}</strong>
    </div>
    <div class="onboarding-header__actions">
      <div class="step-dots" aria-hidden="true">
        <span
          v-for="index in stepCount"
          :key="index"
          :class="{ 'is-active': index - 1 === step, 'is-done': index - 1 < step }"
        />
      </div>
      <button
        v-if="dismissible"
        class="onboarding-close-button"
        :aria-label="t('onboarding.close')"
        :title="t('onboarding.close')"
        type="button"
        @click="emit('close')"
        @mousedown.left.stop
      >
        <X :size="15" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.onboarding-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-gap-md, 16px);
  border-bottom: 1px solid var(--line);
  padding: clamp(16px, 3.8cqw, 20px);
  cursor: move;
}

.onboarding-header__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--ui-gap-sm, 10px);
}

.onboarding-close-button {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    transform 120ms ease;
}

.onboarding-close-button:hover {
  background: var(--subtle);
  color: var(--text);
}

.onboarding-close-button:active {
  transform: scale(0.94);
}

.onboarding-header div:first-child {
  min-width: 0;
}

.onboarding-header strong {
  display: block;
  overflow: hidden;
  font-size: var(--ui-font-lg, 17px);
  font-weight: 760;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-dots {
  display: flex;
  flex: 0 0 auto;
  gap: var(--ui-gap-xs, 6px);
  align-items: center;
}

.step-dots span {
  width: clamp(6px, 1.5cqw, 8px);
  height: clamp(6px, 1.5cqw, 8px);
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted) 32%, transparent);
  transition:
    width 200ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 160ms ease;
}

.step-dots span.is-active {
  width: clamp(16px, 4cqw, 20px);
  background: var(--income-accent);
}

.step-dots span.is-done {
  background: color-mix(in srgb, var(--income-accent) 72%, transparent);
}
</style>
