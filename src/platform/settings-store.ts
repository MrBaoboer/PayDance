// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

export type SettingsStoreAdapter = {
  get: <Value>(key: string) => Promise<Value | undefined>;
  save: () => Promise<void>;
  set: (key: string, value: unknown) => Promise<void>;
};

export const createSettingsStore = async (
  fileName: string,
): Promise<SettingsStoreAdapter> => {
  const { LazyStore } = await import("@tauri-apps/plugin-store");
  return new LazyStore(fileName);
};
