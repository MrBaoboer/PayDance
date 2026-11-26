<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { onBeforeUnmount, ref } from "vue";
import { AlertCircle } from "@lucide/vue";
import { useI18n } from "../../composables/useI18n";

withDefaults(
  defineProps<{
    isInfo?: boolean;
    isReadOnly?: boolean;
    message: string;
  }>(),
  {
    isInfo: false,
    isReadOnly: false,
  },
);

const { t } = useI18n();
const isConfirmingRebuild = ref(false);
let confirmResetTimer = 0;

const emit = defineEmits<{
  rebuildDefaults: [];
  retryLoad: [];
}>();

const handleRebuildClick = () => {
  if (!isConfirmingRebuild.value) {
    isConfirmingRebuild.value = true;
    window.clearTimeout(confirmResetTimer);
    confirmResetTimer = window.setTimeout(() => {
      isConfirmingRebuild.value = false;
    }, 4000);
    return;
  }

  window.clearTimeout(confirmResetTimer);
  isConfirmingRebuild.value = false;
  emit("rebuildDefaults");
};

onBeforeUnmount(() => {
  window.clearTimeout(confirmResetTimer);
});
</script>

<template>
  <div class="settings-status-banner" :class="{ 'is-info': isInfo }">
    <span class="settings-status-banner__message">
      <AlertCircle aria-hidden="true" :size="14" />
      <span>{{ message }}</span>
    </span>
    <div v-if="isReadOnly" class="readonly-actions">
      <button class="readonly-action-btn" type="button" @click="$emit('retryLoad')">
        {{ t("settings.retryLoad") }}
      </button>
      <button
        class="readonly-action-btn readonly-action-btn--danger"
        :class="{ 'is-confirming': isConfirmingRebuild }"
        type="button"
        @click="handleRebuildClick"
      >
        {{
          isConfirmingRebuild
            ? t("settings.rebuildDefaultsConfirm")
            : t("settings.rebuildDefaults")
        }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-status-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 10px;
  border: 1px solid rgb(239 68 68 / 0.24);
  border-radius: var(--ui-radius-sm, 10px);
  background: rgb(239 68 68 / 0.08);
  padding: 8px var(--ui-pad-sm, 11px);
  color: var(--danger);
  font-size: var(--ui-font-xs, 12px);
  font-weight: 620;
  line-height: 1.4;
  text-align: left;
}

.settings-status-banner.is-info {
  border-color: rgb(245 158 11 / 0.26);
  background: rgb(245 158 11 / 0.1);
  color: var(--text);
}

.settings-status-banner__message {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.settings-status-banner__message :deep(svg) {
  flex: 0 0 auto;
}

.readonly-actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

.readonly-action-btn {
  height: 26px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--panel);
  padding: 0 9px;
  color: var(--text);
  font-size: var(--ui-font-xs, 12px);
  font-weight: 620;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    color 140ms ease;
}

.readonly-action-btn:hover {
  background: var(--subtle);
}

.readonly-action-btn--danger {
  border-color: rgb(239 68 68 / 0.34);
  color: var(--danger);
}

.readonly-action-btn--danger:hover {
  background: rgb(239 68 68 / 0.1);
}

.readonly-action-btn--danger.is-confirming {
  border-color: var(--danger);
  background: var(--danger);
  color: rgb(255 255 255);
}
</style>
