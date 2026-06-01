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
  | { kind: "error"; message: string }
  | { kind: "unavailable" }
  | { kind: "ready"; version: string };

export async function checkForUpdate(): Promise<UpdaterStatus> {
  if (isWebPreview) {
    return { kind: "unavailable" };
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
    const message = error instanceof Error ? error.message : "Unknown update error";
    // When the updater plugin is not configured (missing pubkey, missing manifest),
    // treat it as "unavailable" rather than a hard error.
    if (
      message.includes("pubkey") ||
      message.includes("public key") ||
      message.includes("signature") ||
      message.includes("manifest") ||
      message.includes("endpoint")
    ) {
      console.warn("Updater not configured:", message);
      return { kind: "unavailable" };
    }

    console.error("Update check failed:", error);
    return { kind: "error", message };
  }
}

export async function downloadAndInstall(): Promise<UpdaterStatus> {
  if (isWebPreview) {
    return { kind: "unavailable" };
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
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Update download failed",
    };
  }
}
