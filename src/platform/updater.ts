// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { isWebPreview } from "./runtime";

// ---------------------------------------------------------------------------
// Platform adapter for the Tauri updater plugin.
//
// Desktop: delegates to @tauri-apps/plugin-updater
// Web Preview: returns no-op stubs (no update checking in browser)
// ---------------------------------------------------------------------------

export type UpdaterStatus =
  | { kind: "upToDate" }
  | { kind: "updateAvailable"; version: string; notes?: string }
  | { kind: "downloading" }
  | {
      kind: "error";
      message: string;
      reason?: "manifest-invalid" | "network" | "signature-verification";
    }
  | { kind: "unavailable"; reason?: "dev-config" | "web" }
  | { kind: "ready"; version: string };

const errorMessageFrom = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown update error";

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

  return { kind: "error", message, reason: "network" };
}

export async function checkForUpdate(): Promise<UpdaterStatus> {
  if (isWebPreview) {
    return { kind: "unavailable", reason: "web" };
  }

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

export async function downloadAndInstall(): Promise<UpdaterStatus> {
  if (isWebPreview) {
    return { kind: "unavailable", reason: "web" };
  }

  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");

    const update = await check();
    if (!update) return { kind: "upToDate" };

    await update.downloadAndInstall();
    await relaunch();

    return { kind: "ready", version: update.version };
  } catch (error) {
    console.error("Update download failed:", error);
    return classifyUpdateError(error, import.meta.env.PROD);
  }
}
