// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

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

export async function checkForUpdate(): Promise<UpdaterStatus> {
  return { kind: "unavailable", reason: "web" };
}

export async function downloadAndInstall(): Promise<UpdaterStatus> {
  return { kind: "unavailable", reason: "web" };
}
