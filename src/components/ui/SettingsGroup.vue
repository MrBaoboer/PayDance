// SPDX-FileCopyrightText: 2026 Mr.Baoboer // SPDX-License-Identifier: AGPL-3.0-only // //
Additional terms: see /ADDITIONAL_TERMS.md

<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <section class="settings-group">
    <div
      v-if="title || $slots.action"
      class="group-title"
      :class="{ 'group-title--split': $slots.action }"
    >
      <strong v-if="title">{{ title }}</strong>
      <slot name="action" />
    </div>
    <slot />
  </section>
</template>

<style scoped>
.settings-group {
  display: grid;
  gap: clamp(10px, 2.4cqh, 13px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-md, 12px);
  background: var(--panel);
  padding: clamp(12px, 3cqw, 15px);
}

.group-title {
  display: flex;
  min-height: clamp(22px, 5.2cqh, 28px);
  align-items: center;
}

.group-title--split {
  justify-content: space-between;
  gap: var(--ui-gap-sm, 12px);
}

.group-title strong {
  color: var(--text);
  font-size: var(--ui-font-sm, 15px);
  font-weight: 700;
}
</style>
