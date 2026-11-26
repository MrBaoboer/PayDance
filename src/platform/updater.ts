// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// ---------------------------------------------------------------------------
// Platform adapter for the Tauri updater plugin.
//
// Desktop: delegates to @tauri-apps/plugin-updater
// Web Preview: returns no-op stubs (no update checking in browser)
// ---------------------------------------------------------------------------

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { UpdateDownloadProgress, UpdaterStatus } from "./types";

export type { UpdateDownloadProgress, UpdaterStatus };

const errorMessageFrom = (error: unknown) => {
  // Tauri command rejections arrive as plain strings rather than Error instances.
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message.trim()
  ) {
    return (error as { message: string }).message.trim();
  }
  return "Unknown update error";
};

type PortableUpdateResult = { kind: "upToDate" } | { kind: "ready"; version: string };

export function classifyUpdateError(
  error: unknown,
  isProductionBuild: boolean,
): UpdaterStatus {
  const message = errorMessageFrom(error);
  const normalizedMessage = message.toLowerCase();
  const isConfigOrTrustError =
    normalizedMessage.includes("pubkey") ||
    normalizedMessage.includes("public key") ||
    normalizedMessage.includes("signature") ||
    normalizedMessage.includes("manifest") ||
    normalizedMessage.includes("endpoint");

  if (!isProductionBuild && isConfigOrTrustError) {
    return { kind: "unavailable", reason: "dev-config" };
  }

  if (
    normalizedMessage.includes("signature") ||
    normalizedMessage.includes("pubkey") ||
    normalizedMessage.includes("public key")
  ) {
    return {
      kind: "error",
      message: "Update signature verification failed",
      reason: "signature-verification",
    };
  }

  if (normalizedMessage.includes("manifest") || normalizedMessage.includes("endpoint")) {
    return {
      kind: "error",
      message: "Update manifest is invalid",
      reason: "manifest-invalid",
    };
  }

  if (
    normalizedMessage.includes("not writable") ||
    normalizedMessage.includes("update probe") ||
    normalizedMessage.includes("access is denied") ||
    normalizedMessage.includes("permission")
  ) {
    return {
      kind: "error",
      message,
      reason: "permission",
    };
  }

  if (
    normalizedMessage.includes("not a windows executable") ||
    normalizedMessage.includes("stage update") ||
    normalizedMessage.includes("update helper") ||
    normalizedMessage.includes("powershell") ||
    normalizedMessage.includes("already in progress") ||
    normalizedMessage.includes("locate app")
  ) {
    return {
      kind: "error",
      message,
      reason: "install-failed",
    };
  }

  return { kind: "error", message, reason: "network" };
}

export async function checkForUpdate(): Promise<UpdaterStatus> {
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (!update) return { kind: "upToDate" };

    return {
      kind: "updateAvailable",
      version: update.version,
      notes: update.body ?? undefined,
    };
  } catch (error) {
    console.error("Update check failed:", error);
    return classifyUpdateError(error, import.meta.env.PROD);
  }
}

export async function downloadAndInstall(
  onProgress?: (progress: UpdateDownloadProgress) => void,
): Promise<UpdaterStatus> {
  let unlistenProgress: (() => void) | undefined;

  try {
    if (onProgress) {
      try {
        unlistenProgress = await getCurrentWindow().listen<UpdateDownloadProgress>(
          "portable-update-progress",
          (event) => {
            onProgress(event.payload);
          },
        );
      } catch {
        // Progress reporting is optional; never block the update itself.
      }
    }
    return await invoke<PortableUpdateResult>("install_portable_update");
  } catch (error) {
    console.error("Update download failed:", error);
    return classifyUpdateError(error, import.meta.env.PROD);
  } finally {
    unlistenProgress?.();
  }
}
