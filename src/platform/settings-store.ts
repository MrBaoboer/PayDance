// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { invoke } from "@tauri-apps/api/core";
import type { SettingsStoreAdapter } from "./types";

export type { SettingsStoreAdapter };

export const createSettingsStore = async (
  fileName: string,
): Promise<SettingsStoreAdapter> => {
  const { LazyStore } = await import("@tauri-apps/plugin-store");
  let store = new LazyStore(fileName);

  return {
    backupUnreadable: async () => {
      const backupPath = await invoke<string | null>("backup_unreadable_settings", {
        fileName,
      });
      // The old LazyStore keeps its failed load forever; a fresh one reads the new empty file.
      store = new LazyStore(fileName);
      return backupPath ?? undefined;
    },
    delete: async (key: string) => {
      await store.delete(key);
    },
    get: (key) => store.get(key),
    save: () => store.save(),
    set: (key, value) => store.set(key, value),
  };
};
