<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { ref } from "vue";
import { AlertCircle, ArrowBigUp, Loader } from "@lucide/vue";
import { useI18n } from "../../composables/useI18n";
import { downloadAndInstall, type UpdaterStatus } from "../../platform/updater";

defineProps<{
  updateStatus: UpdaterStatus;
}>();

const { t } = useI18n();
const isDownloading = ref(false);
const updateError = ref("");

const downloadUpdate = async () => {
  if (isDownloading.value) return;
  isDownloading.value = true;
  updateError.value = "";
  try {
    const result = await downloadAndInstall();
    if (result.kind === "error") {
      updateError.value = result.message;
    }
  } finally {
    isDownloading.value = false;
  }
};
</script>

<template>
  <Loader
    v-if="isDownloading"
    class="update-badge update-badge--spinning"
    :size="14"
    :title="t('updater.downloading')"
  />
  <button
    v-else-if="updateError"
    class="update-badge-button update-badge-button--error"
    type="button"
    :aria-label="`${t('updater.failed')}: ${updateError}. ${t('updater.retry')}`"
    :title="`${t('updater.failed')}: ${updateError} — ${t('updater.retry')}`"
    @click="downloadUpdate"
  >
    <AlertCircle aria-hidden="true" :size="14" />
  </button>
  <button
    v-else-if="updateStatus.kind === 'updateAvailable'"
    class="update-badge-button"
    type="button"
    :aria-label="`${t('updater.newVersion')} ${updateStatus.version}. ${t('updater.clickToDownload')}`"
    :title="`${t('updater.newVersion')} ${updateStatus.version} — ${t('updater.clickToDownload')}`"
    @click="downloadUpdate"
  >
    <ArrowBigUp aria-hidden="true" :size="14" />
  </button>
</template>

<style scoped>
.update-badge {
  display: inline;
  margin-left: 4px;
  color: var(--income-accent);
  vertical-align: text-bottom;
}

.update-badge--spinning {
  animation: update-spin 1s linear infinite;
}

.update-badge-button {
  display: inline-grid;
  width: 18px;
  height: 18px;
  margin-left: 4px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  padding: 0;
  color: var(--income-accent);
  cursor: pointer;
  vertical-align: text-bottom;
  transition:
    color 160ms ease,
    transform 160ms ease;
}

.update-badge-button:hover {
  color: var(--income-accent-bright);
  transform: scale(1.15);
}

.update-badge-button--error {
  color: var(--danger, #e74c3c);
}

.update-badge-button--error:hover {
  color: var(--danger-bright, #ff5c4a);
}

@keyframes update-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
