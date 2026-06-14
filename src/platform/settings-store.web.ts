// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

export type SettingsStoreAdapter = {
  get: <Value>(key: string) => Promise<Value | undefined>;
  save: () => Promise<void>;
  set: (key: string, value: unknown) => Promise<void>;
};

const readBrowserState = (storageKey: string) => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch (error) {
    console.error("Failed to read browser preview settings", error);
    return {};
  }
};

export const createBrowserSettingsStore = (
  storageKey = "paydance-web-preview-settings",
): SettingsStoreAdapter => {
  let state = readBrowserState(storageKey);

  return {
    async get<Value>(key: string) {
      return state[key] as Value | undefined;
    },
    async save() {
      if (typeof window === "undefined") return;

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save browser preview settings", error);
      }
    },
    async set(key: string, value: unknown) {
      state = { ...state, [key]: value };
    },
  };
};

export const createSettingsStore = async (): Promise<SettingsStoreAdapter> =>
  createBrowserSettingsStore();
