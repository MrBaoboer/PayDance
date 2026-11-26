// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

export type SettingsStoreAdapter = {
  // Moves an unreadable settings file aside and starts over with an empty store.
  // Resolves the backup path, or undefined when there was nothing to back up.
  backupUnreadable?: () => Promise<string | undefined>;
  delete?: (key: string) => Promise<void>;
  get: <Value>(key: string) => Promise<Value | undefined>;
  save: () => Promise<void>;
  set: (key: string, value: unknown) => Promise<void>;
};

export type UpdateDownloadProgress = {
  downloaded: number;
  total: number | null;
  percent: number | null;
};

export type UpdateErrorReason =
  | "install-failed"
  | "manifest-invalid"
  | "network"
  | "permission"
  | "signature-verification";

export type UpdaterStatus =
  | { kind: "upToDate" }
  | { kind: "updateAvailable"; version: string; notes?: string }
  | { kind: "downloading"; percent?: number | null }
  | {
      kind: "error";
      message: string;
      reason?: UpdateErrorReason;
    }
  | { kind: "unavailable"; reason?: "dev-config" | "web" }
  | { kind: "ready"; version: string };
