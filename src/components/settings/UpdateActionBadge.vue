<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed, onBeforeUnmount, ref } from "vue";
import { AlertCircle, ArrowBigUp, Check, Loader, RefreshCw } from "@lucide/vue";
import { useI18n } from "../../composables/useI18n";
import { useUpdaterContext } from "../../composables/useUpdaterContext";
import { downloadAndInstall, type UpdaterStatus } from "#updater";

const props = defineProps<{
  isCheckingUpdate?: boolean;
  onCheckUpdate?: () => Promise<UpdaterStatus> | void;
  onInstallUpdate?: () => Promise<UpdaterStatus> | void;
  updateStatus?: UpdaterStatus;
}>();

const { t } = useI18n();
const updaterContext = useUpdaterContext();
const localDownloading = ref(false);
const localError = ref<Extract<UpdaterStatus, { kind: "error" }> | null>(null);
const localPercent = ref<number | null>(null);
const manualUpToDate = ref(false);
let upToDateTimer = 0;

const resolvedUpdateStatus = computed<UpdaterStatus>(
  () => props.updateStatus ?? updaterContext.updateStatus.value,
);
const resolvedIsChecking = computed(
  () => props.isCheckingUpdate ?? updaterContext.isCheckingUpdate.value,
);
const resolvedCheckUpdate = computed(
  () => props.onCheckUpdate ?? updaterContext.onCheckUpdate,
);
const resolvedInstallUpdate = computed(
  () => props.onInstallUpdate ?? updaterContext.onInstallUpdate,
);

const isDownloading = computed(
  () => localDownloading.value || resolvedUpdateStatus.value.kind === "downloading",
);

const downloadPercent = computed(() => {
  if (resolvedUpdateStatus.value.kind === "downloading") {
    return resolvedUpdateStatus.value.percent ?? null;
  }
  return localPercent.value;
});

const downloadingLabel = computed(() =>
  typeof downloadPercent.value === "number"
    ? t.value("updater.downloadingPercent", { percent: downloadPercent.value })
    : t.value("updater.downloading"),
);

// Keep silent startup network failures unobtrusive, while surfacing signature, manifest,
// permission, install-prep, manual check, and user-initiated download failures on the icon.
const visibleError = computed<Extract<UpdaterStatus, { kind: "error" }> | null>(() => {
  if (localError.value) return localError.value;
  if (
    resolvedUpdateStatus.value.kind === "error" &&
    resolvedUpdateStatus.value.reason !== "network"
  ) {
    return resolvedUpdateStatus.value;
  }
  return null;
});

const errorSummary = computed(() => {
  const err = visibleError.value;
  if (!err) return "";
  if (err.reason === "signature-verification") return t.value("updater.signatureFailed");
  if (err.reason === "manifest-invalid") return t.value("updater.manifestFailed");
  if (err.reason === "permission") return t.value("updater.permissionFailed");
  if (err.reason === "install-failed") return t.value("updater.installFailed");
  if (err.reason === "network") return t.value("updater.networkFailed");
  return t.value("updater.failed");
});

const errorTooltip = computed(() =>
  errorSummary.value
    ? `${errorSummary.value}${t.value("updater.retrySeparator")}${t.value("updater.retry")}`
    : "",
);

const updateAvailableTooltip = computed(() => {
  if (resolvedUpdateStatus.value.kind !== "updateAvailable") return "";
  return `${t.value("updater.newVersion")} ${resolvedUpdateStatus.value.version}${t.value("updater.retrySeparator")}${t.value("updater.clickToDownload")}`;
});

const downloadUpdate = async () => {
  if (isDownloading.value) return;
  localError.value = null;
  manualUpToDate.value = false;
  window.clearTimeout(upToDateTimer);

  if (resolvedInstallUpdate.value) {
    const result = await resolvedInstallUpdate.value();
    if (result?.kind === "error") {
      localError.value = result;
    }
    return;
  }

  localDownloading.value = true;
  localPercent.value = null;
  try {
    const result = await downloadAndInstall((progress) => {
      localPercent.value = progress.percent;
    });
    if (result.kind === "error") {
      localError.value = result;
    }
  } finally {
    localDownloading.value = false;
  }
};

const recheckUpdate = async () => {
  if (resolvedIsChecking.value || !resolvedCheckUpdate.value) return;
  localError.value = null;
  manualUpToDate.value = false;
  window.clearTimeout(upToDateTimer);

  const result = await resolvedCheckUpdate.value();
  if (result?.kind === "error") {
    localError.value = result;
    return;
  }
  if (result?.kind === "upToDate") {
    manualUpToDate.value = true;
    upToDateTimer = window.setTimeout(() => {
      manualUpToDate.value = false;
    }, 5000);
  }
};

onBeforeUnmount(() => {
  window.clearTimeout(upToDateTimer);
});
</script>

<template>
  <span
    v-if="isDownloading"
    class="update-progress"
    role="status"
    :aria-label="downloadingLabel"
    :title="downloadingLabel"
  >
    <Loader class="update-badge update-badge--spinning" aria-hidden="true" :size="14" />
    <span v-if="typeof downloadPercent === 'number'" class="update-progress__percent">
      {{ downloadPercent }}%
    </span>
  </span>
  <button
    v-else-if="visibleError"
    class="update-badge-button update-badge-button--error"
    type="button"
    :aria-label="errorTooltip"
    :title="errorTooltip"
    @click="
      visibleError.reason === 'signature-verification' ||
      visibleError.reason === 'manifest-invalid' ||
      visibleError.reason === 'network'
        ? recheckUpdate()
        : downloadUpdate()
    "
  >
    <AlertCircle aria-hidden="true" :size="14" />
  </button>
  <button
    v-else-if="resolvedUpdateStatus.kind === 'updateAvailable'"
    class="update-badge-button"
    type="button"
    :aria-label="updateAvailableTooltip"
    :title="updateAvailableTooltip"
    @click="downloadUpdate"
  >
    <ArrowBigUp aria-hidden="true" :size="14" />
  </button>
  <span
    v-else-if="manualUpToDate"
    class="update-badge update-badge--ok"
    role="status"
    :aria-label="t('updater.upToDate')"
    :title="t('updater.upToDate')"
  >
    <Check aria-hidden="true" :size="13" />
  </span>
  <button
    v-else-if="resolvedCheckUpdate && resolvedUpdateStatus.kind !== 'unavailable'"
    class="update-badge-button update-badge-button--quiet"
    :disabled="resolvedIsChecking"
    type="button"
    :aria-label="resolvedIsChecking ? t('updater.checking') : t('updater.checkNow')"
    :title="resolvedIsChecking ? t('updater.checking') : t('updater.checkNow')"
    @click="recheckUpdate"
  >
    <RefreshCw
      aria-hidden="true"
      :class="{ 'update-badge--spinning': resolvedIsChecking }"
      :size="12"
    />
  </button>
</template>

<style scoped>
.update-progress {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--income-accent);
}

.update-progress__percent {
  color: var(--income-accent);
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.update-badge {
  position: relative;
  inset-block-start: 0;
  inset-inline-start: -1px;
  display: inline-block;
  margin-left: 0;
  color: var(--income-accent);
  vertical-align: middle;
}

.update-badge--spinning {
  animation: update-spin 1s linear infinite;
}

.update-badge.update-badge--ok {
  display: inline-flex;
  width: 24px;
  height: 24px;
  margin: -3px 0;
  align-items: center;
  justify-content: center;
  color: var(--status-working);
  cursor: default;
}

.update-badge-button {
  display: inline-flex;
  width: 24px;
  height: 24px;
  margin: -3px 0;
  align-items: center;
  justify-content: center;
  margin-left: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  padding: 0;
  color: var(--income-accent);
  cursor: pointer;
  vertical-align: middle;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 120ms ease;
}

.update-badge-button:hover {
  background: color-mix(in srgb, var(--income-accent) 10%, transparent);
  color: var(--income-accent-bright);
  transform: scale(1.08);
}

.update-badge-button--quiet {
  color: var(--muted);
  opacity: 0.72;
}

.update-badge-button--quiet:hover {
  background: var(--subtle);
  color: var(--text);
  opacity: 1;
}

.update-badge-button--quiet:disabled {
  cursor: default;
  transform: none;
}

.update-badge-button :deep(svg) {
  transform: translateX(-1px);
}

.update-badge-button--error {
  color: var(--danger, #e74c3c);
}

.update-badge-button--error:hover {
  background: rgb(239 68 68 / 0.12);
  color: var(--danger-bright, #ff5c4a);
}

@keyframes update-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
