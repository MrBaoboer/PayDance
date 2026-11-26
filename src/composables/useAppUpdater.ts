// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { ref } from "vue";
import {
  checkForUpdate,
  downloadAndInstall,
  type UpdateDownloadProgress,
  type UpdaterStatus,
} from "#updater";

const periodicCheckIntervalMs = 6 * 60 * 60 * 1_000;

export function useAppUpdater(
  options: {
    beforeInstall?: () => Promise<void>;
    checkIntervalMs?: number;
  } = {},
) {
  const updateStatus = ref<UpdaterStatus>({ kind: "upToDate" });
  const isCheckingUpdate = ref(false);
  const downloadPercent = ref<number | null>(null);
  let periodicTimer = 0;

  const isDownloadingNow = () => updateStatus.value.kind === "downloading";

  const runUpdateCheck = async () => {
    if (isCheckingUpdate.value || isDownloadingNow()) {
      return updateStatus.value;
    }

    isCheckingUpdate.value = true;
    try {
      const nextStatus = await checkForUpdate();
      if (!isDownloadingNow()) {
        updateStatus.value = nextStatus;
      }
      return updateStatus.value;
    } finally {
      isCheckingUpdate.value = false;
    }
  };

  const installUpdate = async () => {
    if (updateStatus.value.kind === "downloading") return updateStatus.value;

    downloadPercent.value = null;
    updateStatus.value = { kind: "downloading", percent: null };

    try {
      await options.beforeInstall?.();
    } catch (error) {
      console.error("Failed to flush settings before update", error);
    }

    const result = await downloadAndInstall((progress: UpdateDownloadProgress) => {
      downloadPercent.value = progress.percent;
      if (updateStatus.value.kind === "downloading") {
        updateStatus.value = { kind: "downloading", percent: progress.percent };
      }
    });

    updateStatus.value = result;
    return result;
  };

  const startUpdateMonitor = () => {
    void runUpdateCheck();

    const intervalMs = options.checkIntervalMs ?? periodicCheckIntervalMs;
    if (intervalMs > 0) {
      window.clearInterval(periodicTimer);
      periodicTimer = window.setInterval(() => {
        void runUpdateCheck();
      }, intervalMs);
    }
  };

  const stopUpdateMonitor = () => {
    window.clearInterval(periodicTimer);
    periodicTimer = 0;
  };

  return {
    downloadPercent,
    installUpdate,
    isCheckingUpdate,
    runUpdateCheck,
    startUpdateMonitor,
    stopUpdateMonitor,
    updateStatus,
  };
}
