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

export const createSettingsStore = async (
  fileName: string,
): Promise<SettingsStoreAdapter> => {
  const { LazyStore } = await import("@tauri-apps/plugin-store");
  const { invoke } = await import("@tauri-apps/api/core");
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
