// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import type { UpdateDownloadProgress, UpdaterStatus } from "./types";

export type { UpdateDownloadProgress, UpdaterStatus };

export async function checkForUpdate(): Promise<UpdaterStatus> {
  return { kind: "unavailable", reason: "web" };
}

export async function downloadAndInstall(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _onProgress?: (progress: UpdateDownloadProgress) => void,
): Promise<UpdaterStatus> {
  return { kind: "unavailable", reason: "web" };
}
