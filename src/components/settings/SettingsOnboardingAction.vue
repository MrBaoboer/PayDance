<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { useI18n } from "../../composables/useI18n";

const { t } = useI18n();

defineEmits<{
  open: [];
}>();
</script>

<template>
  <button class="onboarding-action-button" type="button" @click="$emit('open')">
    {{ t("settings.openOnboarding") }}
  </button>
</template>

<style scoped>
.onboarding-action-button {
  display: inline-flex;
  min-height: clamp(32px, 7.6cqh, 38px);
  align-items: center;
  justify-content: center;
  justify-self: start;
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: color-mix(in srgb, var(--panel) 86%, var(--subtle));
  padding: 0 var(--ui-pad-sm, 12px);
  color: var(--text);
  font-family: var(--font-dashboard);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 700;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.onboarding-action-button:hover {
  border-color: var(--income-accent-ring);
  background: var(--income-accent-glow);
  box-shadow: 0 7px 18px rgb(15 23 42 / 0.08);
}

.onboarding-action-button:active {
  transform: scale(0.97);
}
</style>
