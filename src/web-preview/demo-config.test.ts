// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it, vi } from "vitest";
import { defaultSalaryConfig, type SalaryConfig } from "../lib/salary";
import { settingsStoreKeys } from "../lib/settings-store";
import type { SettingsStoreAdapter } from "../platform/settings-store.web";
import { createWebPreviewDemoConfig, ensureWebPreviewDemoSettings } from "./demo-config";

const createMemoryStore = (initial: Record<string, unknown> = {}) => {
  const state = { ...initial };
  const save = vi.fn(async () => {});
  const store: SettingsStoreAdapter = {
    async get<Value>(key: string) {
      return state[key] as Value | undefined;
    },
    save,
    async set(key: string, value: unknown) {
      state[key] = value;
    },
  };

  return { save, state, store };
};

describe("Web Preview demo config", () => {
  it("selects every weekday without mutating the shared desktop defaults", () => {
    const config = createWebPreviewDemoConfig();

    expect(config).toEqual({
      ...defaultSalaryConfig,
      workdays: [0, 1, 2, 3, 4, 5, 6],
    });
    expect(config.workdays).not.toBe(defaultSalaryConfig.workdays);
    expect(defaultSalaryConfig.workdays).toEqual([1, 2, 3, 4, 5]);
  });

  it("seeds a first browser visit and skips the automatic onboarding", async () => {
    const { save, state, store } = createMemoryStore();

    await expect(ensureWebPreviewDemoSettings(store)).resolves.toBe(true);

    expect(state[settingsStoreKeys.config]).toEqual(createWebPreviewDemoConfig());
    expect(state[settingsStoreKeys.hasCompletedOnboarding]).toBe(true);
    expect(save).toHaveBeenCalledOnce();
  });

  it("preserves an existing browser salary config while disabling automatic onboarding", async () => {
    const existingConfig: SalaryConfig = {
      ...defaultSalaryConfig,
      monthlySalary: 12000,
      workdays: [1, 3, 5],
    };
    const { save, state, store } = createMemoryStore({
      [settingsStoreKeys.config]: existingConfig,
      [settingsStoreKeys.hasCompletedOnboarding]: false,
    });

    await expect(ensureWebPreviewDemoSettings(store)).resolves.toBe(true);

    expect(state[settingsStoreKeys.config]).toEqual(existingConfig);
    expect(state[settingsStoreKeys.hasCompletedOnboarding]).toBe(true);
    expect(save).toHaveBeenCalledOnce();
  });

  it("does not rewrite an existing browser config that already skips onboarding", async () => {
    const existingConfig: SalaryConfig = {
      ...defaultSalaryConfig,
      workdays: [2, 4, 6],
    };
    const { save, state, store } = createMemoryStore({
      [settingsStoreKeys.config]: existingConfig,
      [settingsStoreKeys.hasCompletedOnboarding]: true,
    });

    await expect(ensureWebPreviewDemoSettings(store)).resolves.toBe(false);

    expect(state[settingsStoreKeys.config]).toEqual(existingConfig);
    expect(state[settingsStoreKeys.hasCompletedOnboarding]).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });
});
